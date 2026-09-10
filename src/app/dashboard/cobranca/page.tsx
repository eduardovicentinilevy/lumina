import { getCurrentCompany } from "@/lib/session";
import { getInvoices } from "@/lib/queries";
import { formatCents, formatDate } from "@/lib/money";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/dashboard/Badge";
import { createInvoice, markAsPaid, retryCharge } from "./actions";

const STATUS_TONE = {
  PENDENTE: "slate",
  PAGA: "emerald",
  ATRASADA: "amber",
  FALHOU: "red",
} as const;

const STATUS_LABEL = {
  PENDENTE: "Pendente",
  PAGA: "Paga",
  ATRASADA: "Atrasada",
  FALHOU: "Falhou",
};

const METHOD_LABEL = {
  PIX_AUTOMATICO: "Pix Automático",
  PIX_MANUAL: "Pix manual",
  BOLETO: "Boleto",
  CARTAO: "Cartão",
};

export default async function CobrancaPage() {
  const session = await getCurrentCompany();
  if (!session) return null;

  const invoices = await getInvoices(session.company.id);
  const settled = invoices.filter((i) => i.status === "PAGA" || i.status === "ATRASADA" || i.status === "FALHOU");
  const paid = invoices.filter((i) => i.status === "PAGA");
  const failed = invoices.filter((i) => i.status === "FALHOU");
  const recurring = invoices.filter((i) => i.recurring);

  const successRate = settled.length > 0 ? (paid.length / settled.length) * 100 : 0;
  const involuntaryChurnRate = settled.length > 0 ? (failed.length / settled.length) * 100 : 0;
  const recurringNet = recurring
    .filter((i) => i.status === "PAGA")
    .reduce((a, i) => a + i.netAmountCents, 0);

  const sorted = [...invoices].sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cobrança B2B & Pix Automático</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Mandatos de débito recorrente com liquidação D+0, reduzindo custos de MDR e churn involuntário.
          </p>
        </div>
        <details className="group relative">
          <summary className="cursor-pointer list-none rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark">
            + Nova cobrança
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-80 rounded-2xl border border-border bg-surface p-5 shadow-lg">
            <form action={createInvoice} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground/60">Cliente</label>
                <input
                  name="customerName"
                  required
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="Razão social do cliente"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/60">CNPJ (opcional)</label>
                <input
                  name="customerDocument"
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground/60">Valor bruto (R$)</label>
                  <input
                    name="grossAmount"
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/60">Vence em (dias)</label>
                  <input
                    name="dueInDays"
                    type="number"
                    min={1}
                    defaultValue={7}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-foreground/60">
                <input type="checkbox" name="recurring" className="rounded border-border" />
                Assinatura recorrente (mandato Pix Automático)
              </label>
              <button
                type="submit"
                className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Criar cobrança
              </button>
            </form>
          </div>
        </details>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Taxa de sucesso de cobrança" value={`${successRate.toFixed(0)}%`} tone={successRate >= 80 ? "positive" : "warning"} />
        <StatCard
          label="Churn involuntário"
          value={`${involuntaryChurnRate.toFixed(0)}%`}
          tone={involuntaryChurnRate > 15 ? "negative" : "default"}
          hint="Falhas de cobrança sobre o total liquidado"
        />
        <StatCard label="Receita recorrente líquida" value={formatCents(recurringNet)} hint={`${recurring.length} assinaturas Pix Automático`} />
        <StatCard label="Cobranças com falha" value={`${failed.length}`} tone={failed.length > 0 ? "negative" : "default"} />
      </div>

      {failed.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-medium text-red-700">
            {failed.length} cobrança(s) falharam por inadimplência técnica (cartão expirado, mandato cancelado ou limite recusado). Reenvie abaixo para reduzir o churn involuntário.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Todas as cobranças</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground/40">
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Método</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium text-right">Líquido</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.slice(0, 20).map((inv) => (
                <tr key={inv.id}>
                  <td className="px-6 py-3">
                    <p className="font-medium text-foreground">{inv.customerName}</p>
                    {inv.recurring && <p className="text-xs text-foreground/40">Assinatura recorrente</p>}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{METHOD_LABEL[inv.paymentMethod]}</td>
                  <td className="px-4 py-3 text-foreground/60">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatCents(inv.netAmountCents)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[inv.status]}>{STATUS_LABEL[inv.status]}</Badge>
                    {inv.failureReason && (
                      <p className="mt-1 text-xs text-red-600">{inv.failureReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === "FALHOU" && (
                      <form action={retryCharge.bind(null, inv.id)}>
                        <button className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground/60 transition hover:border-brand hover:text-brand">
                          Reenviar
                        </button>
                      </form>
                    )}
                    {(inv.status === "PENDENTE" || inv.status === "ATRASADA") && (
                      <form action={markAsPaid.bind(null, inv.id)}>
                        <button className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground/60 transition hover:border-emerald-400 hover:text-emerald-600">
                          Marcar paga
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
