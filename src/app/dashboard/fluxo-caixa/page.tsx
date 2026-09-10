import { getCurrentCompany } from "@/lib/session";
import { getInvoices } from "@/lib/queries";
import { groupPaidInvoicesByMonth, groupPendingInvoicesByWeek } from "@/lib/analytics";
import { formatCents, formatDate, formatPercent } from "@/lib/money";
import { REGIME_LABELS } from "@/lib/tax";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/dashboard/Badge";
import { DualBarChart } from "@/components/dashboard/DualBarChart";
import { LiquiditySimulator } from "@/components/dashboard/LiquiditySimulator";

export default async function FluxoCaixaPage() {
  const session = await getCurrentCompany();
  if (!session) return null;
  const { company } = session;

  const invoices = await getInvoices(company.id);

  const monthly = groupPaidInvoicesByMonth(invoices, 6);
  const weekly = groupPendingInvoicesByWeek(invoices, 6);

  const pending = invoices.filter((i) => i.status === "PENDENTE");
  const totalGrossPending = pending.reduce((a, i) => a + i.grossAmountCents, 0);
  const totalNetPending = pending.reduce((a, i) => a + i.netAmountCents, 0);
  const totalTaxPending = totalGrossPending - totalNetPending;
  const effectiveRate = totalGrossPending > 0 ? (totalTaxPending / totalGrossPending) * 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Previsibilidade de Liquidez</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Projeção de caixa livre considerando a segregação automática de IBS e CBS na fonte —
          regime de {REGIME_LABELS[company.taxRegime]}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Bruto pendente" value={formatCents(totalGrossPending)} />
        <StatCard label="Líquido projetado" value={formatCents(totalNetPending)} tone="positive" />
        <StatCard label="Retido em impostos" value={formatCents(totalTaxPending)} tone="warning" />
        <StatCard label="Alíquota efetiva média" value={formatPercent(effectiveRate)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-sm font-semibold text-foreground">
              Histórico mensal — bruto faturado vs. líquido recebido
            </h2>
            <div className="mt-6">
              <DualBarChart data={monthly} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-sm font-semibold text-foreground">
              Radar de liquidez — cobranças pendentes por semana
            </h2>
            <div className="mt-6">
              <DualBarChart data={weekly} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">Cobranças pendentes detalhadas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/40">
                    <th className="px-6 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Vencimento</th>
                    <th className="px-4 py-3 font-medium text-right">Bruto</th>
                    <th className="px-4 py-3 font-medium text-right">IBS+CBS</th>
                    <th className="px-4 py-3 font-medium text-right">Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pending
                    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
                    .slice(0, 12)
                    .map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-6 py-3 font-medium text-foreground">{inv.customerName}</td>
                        <td className="px-4 py-3 text-foreground/60">{formatDate(inv.dueDate)}</td>
                        <td className="px-4 py-3 text-right text-foreground/60">
                          {formatCents(inv.grossAmountCents)}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-600">
                          − {formatCents(inv.ibsAmountCents + inv.cbsAmountCents)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {formatCents(inv.netAmountCents)}
                        </td>
                      </tr>
                    ))}
                  {pending.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-foreground/50">
                        Nenhuma cobrança pendente no momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <LiquiditySimulator defaultRegime={company.taxRegime} />
          <div className="rounded-2xl border border-border bg-surface p-6">
            <Badge tone="brand">Como funciona</Badge>
            <p className="mt-3 text-sm leading-relaxed text-foreground/60">
              A plataforma pública do Split Payment identifica a liquidação da transação em
              tempo real e segrega o IBS e a CBS diretamente na origem. A Lumina lê a
              documentação fiscal eletrónica (XML) e projeta o impacto antes mesmo do
              recebimento, para que o financeiro nunca seja pego de surpresa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
