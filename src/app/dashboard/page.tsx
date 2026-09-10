import Link from "next/link";
import { getCurrentCompany } from "@/lib/session";
import { getBankAccounts, getInvoices, getCreditOffers } from "@/lib/queries";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/dashboard/Badge";
import { formatCents, formatDate } from "@/lib/money";

export default async function DashboardOverviewPage() {
  const session = await getCurrentCompany();
  if (!session) return null;
  const { company } = session;

  const [accounts, invoices, creditOffers] = await Promise.all([
    getBankAccounts(company.id),
    getInvoices(company.id),
    getCreditOffers(company.id),
  ]);

  const totalBalance = accounts
    .filter((a) => a.consentStatus === "ATIVO")
    .reduce((acc, a) => acc + a.balanceCents, 0);

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcoming = invoices
    .filter((i) => i.status === "PENDENTE" && i.dueDate <= in30Days)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const projectedNet = upcoming.reduce((acc, i) => acc + i.netAmountCents, 0);
  const projectedTax = upcoming.reduce((acc, i) => acc + i.ibsAmountCents + i.cbsAmountCents, 0);

  const overdue = invoices.filter((i) => i.status === "ATRASADA");
  const failed = invoices.filter((i) => i.status === "FALHOU");

  const expiringAccounts = accounts.filter((a) => {
    const daysLeft = (a.consentExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return a.consentStatus !== "REVOGADO" && daysLeft <= 15;
  });

  const latestOffer = creditOffers[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visão geral da tesouraria</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Radar de liquidez consolidado — {company.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Saldo consolidado" value={formatCents(totalBalance)} hint={`${accounts.length} contas agregadas`} />
        <StatCard
          label="Líquido a receber (30 dias)"
          value={formatCents(projectedNet)}
          hint={`${upcoming.length} cobranças pendentes`}
          tone="positive"
        />
        <StatCard
          label="Retido em impostos (IBS+CBS)"
          value={formatCents(projectedTax)}
          hint="Segregado automaticamente pelo Split Payment"
          tone="warning"
        />
        <StatCard
          label="Cobranças em risco"
          value={`${overdue.length + failed.length}`}
          hint={`${overdue.length} atrasadas · ${failed.length} falharam`}
          tone={overdue.length + failed.length > 0 ? "negative" : "default"}
        />
      </div>

      {(expiringAccounts.length > 0 || failed.length > 0 || latestOffer) && (
        <div className="space-y-3">
          {latestOffer && latestOffer.status === "OFERTADO" && (
            <div className="flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Linha de antecipação pré-aprovada: {formatCents(latestOffer.amountCents)}
                </p>
                <p className="text-xs text-foreground/60">
                  Score {latestOffer.scoreValue}/1000 via {latestOffer.baasPartner}
                </p>
              </div>
              <Link href="/dashboard/credito" className="text-sm font-medium text-brand hover:text-brand-dark">
                Ver oferta →
              </Link>
            </div>
          )}
          {failed.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <p className="text-sm font-medium text-red-700">
                {failed.length} cobrança(s) falharam por inadimplência técnica — risco de churn involuntário.
              </p>
              <Link href="/dashboard/cobranca" className="text-sm font-medium text-red-700 hover:underline">
                Resolver agora →
              </Link>
            </div>
          )}
          {expiringAccounts.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-medium text-amber-700">
                {expiringAccounts.length} consentimento(s) de Open Finance expirando em breve.
              </p>
              <Link href="/dashboard/contas" className="text-sm font-medium text-amber-700 hover:underline">
                Renovar consentimento →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Radar de liquidez — próximos 30 dias
          </h2>
          <Link href="/dashboard/fluxo-caixa" className="text-xs font-medium text-brand hover:text-brand-dark">
            Ver simulador completo →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-foreground/50">
            Nenhuma cobrança pendente nos próximos 30 dias.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {upcoming.slice(0, 6).map((inv) => {
              const daysLeft = Math.ceil((inv.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={inv.id} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.customerName}</p>
                    <p className="text-xs text-foreground/50">
                      Vence em {formatDate(inv.dueDate)} ({daysLeft <= 0 ? "hoje" : `${daysLeft} dias`})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCents(inv.netAmountCents)}</p>
                    <p className="text-xs text-foreground/40">
                      bruto {formatCents(inv.grossAmountCents)}
                    </p>
                  </div>
                  <Badge tone={daysLeft <= 3 ? "amber" : "slate"}>
                    {daysLeft <= 3 ? "Vence em breve" : "Programada"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
