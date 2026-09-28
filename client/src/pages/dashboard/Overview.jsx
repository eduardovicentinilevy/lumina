import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { StatCard } from "../../components/dashboard/StatCard";
import { Badge } from "../../components/dashboard/Badge";
import { formatCents, formatDate } from "../../utils/money";

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/invoices"), api.get("/accounts"), api.get("/credit/offers")])
      .then(([inv, acc, off]) => {
        setInvoices(inv);
        setAccounts(acc);
        setOffers(off);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>A carregar…</p>;

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const totalBalance = accounts
    .filter((a) => a.consentStatus === "ATIVO")
    .reduce((acc, a) => acc + a.balanceCents, 0);

  const upcoming = invoices
    .filter((i) => i.status === "PENDENTE" && new Date(i.dueDate) <= in30Days)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const projectedNet = upcoming.reduce((acc, i) => acc + i.netAmountCents, 0);
  const projectedTax = upcoming.reduce((acc, i) => acc + i.ibsAmountCents + i.cbsAmountCents, 0);

  const overdue = invoices.filter((i) => i.status === "ATRASADA");
  const failed = invoices.filter((i) => i.status === "FALHOU");

  const expiringAccounts = accounts.filter((a) => {
    const daysLeft = (new Date(a.consentExpires) - now) / (1000 * 60 * 60 * 24);
    return a.consentStatus !== "REVOGADO" && daysLeft <= 15;
  });

  const latestOffer = offers[0];

  return (
    <>
      <div className="page-header">
        <h1>Visão geral da tesouraria</h1>
        <p>Radar de liquidez consolidado</p>
      </div>

      <div className="grid-cards">
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

      {(expiringAccounts.length > 0 || failed.length > 0 || (latestOffer && latestOffer.status === "OFERTADO")) && (
        <div className="flex-col gap-2">
          {latestOffer && latestOffer.status === "OFERTADO" && (
            <div className="notice-row notice-accent">
              <div>
                <p style={{ fontWeight: 600 }}>
                  Linha de antecipação pré-aprovada: {formatCents(latestOffer.amountCents)}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  Score {latestOffer.scoreValue}/1000 via {latestOffer.baasPartner}
                </p>
              </div>
              <Link to="/dashboard/credito" style={{ fontWeight: 500, color: "var(--brand)" }}>
                Ver oferta →
              </Link>
            </div>
          )}
          {failed.length > 0 && (
            <div className="notice-row notice-red">
              <p style={{ fontWeight: 500 }}>
                {failed.length} cobrança(s) falharam por inadimplência técnica — risco de churn involuntário.
              </p>
              <Link to="/dashboard/cobranca" style={{ fontWeight: 500, color: "var(--red)" }}>
                Resolver agora →
              </Link>
            </div>
          )}
          {expiringAccounts.length > 0 && (
            <div className="notice-row notice-amber">
              <p style={{ fontWeight: 500 }}>
                {expiringAccounts.length} consentimento(s) de Open Finance expirando em breve.
              </p>
              <Link to="/dashboard/contas" style={{ fontWeight: 500, color: "var(--amber)" }}>
                Renovar consentimento →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <h2>Radar de liquidez — próximos 30 dias</h2>
          <Link to="/dashboard/fluxo-caixa" style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--brand)" }}>
            Ver simulador completo →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="panel-empty">Nenhuma cobrança pendente nos próximos 30 dias.</p>
        ) : (
          upcoming.slice(0, 6).map((inv) => {
            const daysLeft = Math.ceil((new Date(inv.dueDate) - now) / (1000 * 60 * 60 * 24));
            return (
              <div key={inv.id} className="list-row">
                <div>
                  <p className="primary">{inv.customerName}</p>
                  <p className="secondary">
                    Vence em {formatDate(inv.dueDate)} ({daysLeft <= 0 ? "hoje" : `${daysLeft} dias`})
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="primary">{formatCents(inv.netAmountCents)}</p>
                  <p className="secondary">bruto {formatCents(inv.grossAmountCents)}</p>
                </div>
                <Badge tone={daysLeft <= 3 ? "amber" : "slate"}>
                  {daysLeft <= 3 ? "Vence em breve" : "Programada"}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
