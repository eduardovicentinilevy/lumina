import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatCents, formatDate } from "../../utils/money";
import { Badge } from "../../components/dashboard/Badge";

const TIER_TONE = { A: "emerald", B: "brand", C: "amber", D: "red" };
const OFFER_TONE = { OFERTADO: "brand", ACEITO: "emerald", RECUSADO: "slate", EXPIRADO: "red" };
const OFFER_LABEL = { OFERTADO: "Aguardando decisão", ACEITO: "Aceita", RECUSADO: "Recusada", EXPIRADO: "Expirada" };

export default function Credito() {
  const [score, setScore] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [s, o] = await Promise.all([api.get("/credit/score"), api.get("/credit/offers")]);
    setScore(s);
    setOffers(o);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRequestAnalysis() {
    setBusy(true);
    try {
      await api.post("/credit/offers");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleRespond(id, accept) {
    setBusy(true);
    try {
      await api.patch(`/credit/offers/${id}`, { accept });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading || !score) return <p>A carregar…</p>;

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="page-header">
          <h1>Crédito Contextual</h1>
          <p>Score explicável calculado a partir do seu fluxo de caixa real via Open Finance.</p>
        </div>
        <button onClick={handleRequestAnalysis} disabled={busy} className="btn btn-primary">
          Solicitar nova análise
        </button>
      </div>

      <div className="grid-2col">
        <div className="card" style={{ flex: "1 1 280px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--muted-light)" }}>
            Score atual
          </p>
          <div className="flex items-center gap-1" style={{ marginTop: 8, alignItems: "baseline" }}>
            <span className="mono" style={{ fontSize: "2.2rem", fontWeight: 700 }}>{score.score}</span>
            <span className="mono" style={{ fontSize: "0.85rem", color: "var(--muted-light)" }}>/ 1000</span>
          </div>
          <div style={{ marginTop: 10 }}>
            <Badge tone={TIER_TONE[score.tier]}>Faixa {score.tier}</Badge>
          </div>
          <div className="score-ring">
            <div style={{ width: `${(score.score / 1000) * 100}%` }} />
          </div>
          <p style={{ marginTop: 16, fontSize: "0.85rem", lineHeight: 1.55, color: "var(--muted)" }}>
            {score.decisionReason}
          </p>
        </div>

        <div className="card" style={{ flex: "2 1 480px" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--muted-light)" }}>
            Fatores explicáveis (PL 2338/2023)
          </p>
          <div style={{ marginTop: 16 }}>
            {score.factors.map((factor) => (
              <div key={factor.label} className="factor-row">
                <div className="flex items-center justify-between" style={{ fontSize: "0.85rem" }}>
                  <span style={{ fontWeight: 500 }}>{factor.label}</span>
                  <span className="mono" style={{ color: factor.positive ? "var(--emerald)" : "var(--amber)" }}>
                    {factor.points} / {factor.maxPoints} pts
                  </span>
                </div>
                <div className="factor-bar">
                  <div
                    className={factor.positive ? "positive" : "negative"}
                    style={{ width: `${Math.min(100, (factor.points / factor.maxPoints) * 100)}%` }}
                  />
                </div>
                <p style={{ marginTop: 4, fontSize: "0.75rem", color: "var(--muted-light)" }}>{factor.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="info-callout">
        <strong>Responsabilidade regulatória:</strong> a Lumina atua exclusivamente como Entidade
        Tomadora de serviços de BaaS. A decisão final de crédito, o KYC e a análise de PLD/FT são
        de responsabilidade da Instituição Prestadora licenciada pelo Banco Central (Celcoin
        Instituição de Pagamento S.A.), nos termos da Resolução Conjunta BCB/CMN nº 16/2025.
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Ofertas de antecipação de recebíveis</h2>
        </div>
        {offers.length === 0 ? (
          <p className="panel-empty">Nenhuma oferta gerada ainda. Solicite uma nova análise.</p>
        ) : (
          offers.map((offer) => (
            <div key={offer.id} className="list-row">
              <div>
                <p className="primary">{formatCents(offer.amountCents)}</p>
                <p className="secondary">
                  Score {offer.scoreValue} · {offer.baasPartner} · gerada em {formatDate(offer.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={OFFER_TONE[offer.status]}>{OFFER_LABEL[offer.status]}</Badge>
                {offer.status === "OFERTADO" && (
                  <>
                    <button onClick={() => handleRespond(offer.id, true)} disabled={busy} className="btn btn-primary btn-sm">
                      Aceitar
                    </button>
                    <button onClick={() => handleRespond(offer.id, false)} disabled={busy} className="btn btn-ghost btn-sm">
                      Recusar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
