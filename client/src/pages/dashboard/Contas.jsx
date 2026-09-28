import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatCents, formatDate } from "../../utils/money";
import { Badge } from "../../components/dashboard/Badge";
import { StatCard } from "../../components/dashboard/StatCard";

const CONSENT_TONE = { ATIVO: "emerald", EXPIRADO: "amber", REVOGADO: "red" };
const CONSENT_LABEL = {
  ATIVO: "Consentimento ativo",
  EXPIRADO: "Consentimento expirado",
  REVOGADO: "Consentimento revogado",
};

export default function Contas() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api.get("/accounts");
    setAccounts(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleConnect() {
    setBusy(true);
    try {
      await api.post("/accounts");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleRenew(id) {
    setBusy(true);
    try {
      await api.patch(`/accounts/${id}/renew`);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>A carregar…</p>;

  const totalBalance = accounts.reduce((acc, a) => acc + a.balanceCents, 0);
  const activeConsents = accounts.filter((a) => a.consentStatus === "ATIVO").length;
  const now = new Date();

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="page-header">
          <h1>Agregação Patrimonial</h1>
          <p>Contas conectadas via Open Finance (Pluggy / Klavi), sob consentimento granular LGPD.</p>
        </div>
        <button onClick={handleConnect} disabled={busy} className="btn btn-primary">
          + Conectar nova conta
        </button>
      </div>

      <div className="grid-cards">
        <StatCard label="Saldo consolidado" value={formatCents(totalBalance)} />
        <StatCard label="Contas conectadas" value={`${accounts.length}`} />
        <StatCard
          label="Consentimentos ativos"
          value={`${activeConsents}/${accounts.length}`}
          tone={activeConsents === accounts.length ? "positive" : "warning"}
        />
      </div>

      <div className="grid-2col">
        {accounts.map((account) => {
          const daysLeft = Math.ceil((new Date(account.consentExpires) - now) / (1000 * 60 * 60 * 24));
          return (
            <div key={account.id} className="account-card">
              <div className="flex items-start justify-between">
                <div>
                  <p style={{ fontWeight: 600 }}>{account.institution}</p>
                  <p className="hint">{account.accountType}</p>
                </div>
                <Badge tone={CONSENT_TONE[account.consentStatus]}>{CONSENT_LABEL[account.consentStatus]}</Badge>
              </div>

              <p className="balance">{formatCents(account.balanceCents)}</p>
              <p className="hint">
                {account.consentStatus === "ATIVO"
                  ? daysLeft <= 15
                    ? `Consentimento expira em ${daysLeft} dias`
                    : `Sincronizado em ${formatDate(account.lastSyncedAt)}`
                  : "Requer renovação de consentimento para continuar sincronizando"}
              </p>

              {(account.consentStatus !== "ATIVO" || daysLeft <= 15) && (
                <button onClick={() => handleRenew(account.id)} disabled={busy} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
                  Renovar consentimento
                </button>
              )}

              <div className="tx-list">
                <p className="tx-title">Movimentações recentes</p>
                {account.transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className={`tx-row ${tx.isCredit ? "credit" : "debit"}`}>
                    <span>{tx.description}</span>
                    <span>{tx.isCredit ? "+" : "−"} {formatCents(tx.amountCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
