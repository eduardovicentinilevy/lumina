import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatCents, formatPercent } from "../../utils/money";
import { REGIME_LABELS, REGIME_ORDER } from "../../utils/regimes";

export function SplitPaymentSimulator() {
  const [amount, setAmount] = useState(50000);
  const [regime, setRegime] = useState("LUCRO_PRESUMIDO");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get(`/tax/simulate?amount=${amount}&regime=${regime}`)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [amount, regime]);

  return (
    <div className="simulator-card">
      <div className="grid-2col">
        <div>
          <label className="field-label" style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--muted)" }}>
            Valor bruto da fatura (R$)
          </label>
          <input
            type="range"
            min={1000}
            max={200000}
            step={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="simulator-slider"
          />
          <div className="simulator-amount">
            {amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
          </div>

          <label style={{ marginTop: 24, display: "block", fontSize: "0.85rem", fontWeight: 500, color: "var(--muted)" }}>
            Regime tributário
          </label>
          <div className="simulator-regimes">
            {REGIME_ORDER.map((r) => (
              <button
                key={r}
                type="button"
                className={regime === r ? "active" : ""}
                onClick={() => setRegime(r)}
              >
                {REGIME_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="simulator-result">
          <p style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "rgba(255,255,255,0.6)" }}>
            Simulação de liquidação com Split Payment
          </p>
          {result && (
            <>
              <div className="row">
                <span>Valor bruto faturado</span>
                <strong>{formatCents(result.grossAmountCents)}</strong>
              </div>
              <div className="row negative">
                <span>− IBS (segregado na fonte)</span>
                <strong>− {formatCents(result.ibsAmountCents)}</strong>
              </div>
              <div className="row negative">
                <span>− CBS (segregado na fonte)</span>
                <strong>− {formatCents(result.cbsAmountCents)}</strong>
              </div>
              <div className="row total">
                <span>Cai na sua conta (líquido, D+0)</span>
                <span className="value">{formatCents(result.netAmountCents)}</span>
              </div>
              <p className="fine-print">
                Retenção efetiva simulada: {formatPercent(result.effectiveRate)}. Alíquotas
                ilustrativas — dependem de regulamentação complementar da Reforma Tributária.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
