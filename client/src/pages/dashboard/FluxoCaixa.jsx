import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatCents, formatDate, formatPercent } from "../../utils/money";
import { REGIME_LABELS } from "../../utils/regimes";
import { groupPendingInvoicesByWeek, labelMonthlyBuckets } from "../../utils/analytics";
import { StatCard } from "../../components/dashboard/StatCard";
import { Badge } from "../../components/dashboard/Badge";
import { BarChart } from "../../components/dashboard/BarChart";
import { LiquiditySimulator } from "../../components/dashboard/LiquiditySimulator";

export default function FluxoCaixa() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [monthlyRaw, setMonthlyRaw] = useState([]);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/invoices"), api.get("/invoices/monthly"), api.get("/auth/me")])
      .then(([inv, monthly, me]) => {
        setInvoices(inv);
        setMonthlyRaw(monthly);
        setCompany(me.company);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !company) return <p>A carregar…</p>;

  const monthly = labelMonthlyBuckets(monthlyRaw, 6);
  const weekly = groupPendingInvoicesByWeek(invoices, 6);

  const pending = invoices.filter((i) => i.status === "PENDENTE");
  const totalGrossPending = pending.reduce((a, i) => a + i.grossAmountCents, 0);
  const totalNetPending = pending.reduce((a, i) => a + i.netAmountCents, 0);
  const totalTaxPending = totalGrossPending - totalNetPending;
  const effectiveRate = totalGrossPending > 0 ? (totalTaxPending / totalGrossPending) * 100 : 0;

  return (
    <>
      <div className="page-header">
        <h1>Previsibilidade de Liquidez</h1>
        <p>
          Projeção de caixa livre considerando a segregação automática de IBS e CBS na fonte —
          regime de {REGIME_LABELS[company.taxRegime]}.
        </p>
      </div>

      <div className="grid-cards">
        <StatCard label="Bruto pendente" value={formatCents(totalGrossPending)} />
        <StatCard label="Líquido projetado" value={formatCents(totalNetPending)} tone="positive" />
        <StatCard label="Retido em impostos" value={formatCents(totalTaxPending)} tone="warning" />
        <StatCard label="Alíquota efetiva média" value={formatPercent(effectiveRate)} />
      </div>

      <div className="grid-2col" style={{ alignItems: "flex-start" }}>
        <div className="flex-col gap-3" style={{ flex: "2 1 620px" }}>
          <div className="card">
            <h2 style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Histórico mensal — bruto faturado vs. líquido recebido
            </h2>
            <div style={{ marginTop: 24 }}>
              <BarChart data={monthly} />
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Radar de liquidez — cobranças pendentes por semana
            </h2>
            <div style={{ marginTop: 24 }}>
              <BarChart data={weekly} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Cobranças pendentes detalhadas</h2>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Vencimento</th>
                    <th className="num">Bruto</th>
                    <th className="num">IBS+CBS</th>
                    <th className="num">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {pending
                    .slice()
                    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                    .slice(0, 12)
                    .map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 500 }}>{inv.customerName}</td>
                        <td style={{ color: "var(--muted)" }}>{formatDate(inv.dueDate)}</td>
                        <td className="num" style={{ color: "var(--muted)" }}>{formatCents(inv.grossAmountCents)}</td>
                        <td className="num" style={{ color: "var(--amber)" }}>
                          − {formatCents(inv.ibsAmountCents + inv.cbsAmountCents)}
                        </td>
                        <td className="num" style={{ fontWeight: 600 }}>{formatCents(inv.netAmountCents)}</td>
                      </tr>
                    ))}
                  {pending.length === 0 && (
                    <tr>
                      <td colSpan={5} className="panel-empty">Nenhuma cobrança pendente no momento.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex-col gap-3" style={{ flex: "1 1 280px" }}>
          <LiquiditySimulator defaultRegime={company.taxRegime} />
          <div className="info-callout">
            <Badge tone="brand">Como funciona</Badge>
            <p style={{ marginTop: 12 }}>
              A plataforma pública do Split Payment identifica a liquidação da transação em
              tempo real e segrega o IBS e a CBS diretamente na origem. A Lumina lê a
              documentação fiscal eletrónica (XML) e projeta o impacto antes mesmo do
              recebimento, para que o financeiro nunca seja pego de surpresa.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
