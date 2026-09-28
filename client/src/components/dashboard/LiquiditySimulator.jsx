import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatCents, formatPercent } from "../../utils/money";
import { REGIME_LABELS, REGIME_ORDER } from "../../utils/regimes";

export function LiquiditySimulator({ defaultRegime }) {
  const [amount, setAmount] = useState(10000);
  const [regime, setRegime] = useState(defaultRegime);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api
      .get(`/tax/simulate?amount=${amount}&regime=${regime}`)
      .then(setResult)
      .catch(() => {});
  }, [amount, regime]);

  return (
    <div className="card">
      <h3 style={{ fontSize: "0.9rem", fontWeight: 600 }}>Simulador de nota fiscal</h3>
      <p style={{ marginTop: 4, fontSize: "0.75rem", color: "var(--muted-light)" }}>
        Estime quanto vai cair líquido na conta antes de emitir a cobrança.
      </p>

      <div className="field" style={{ marginTop: 16 }}>
        <label>Valor bruto (R$)</label>
        <input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
      </div>

      <div className="field" style={{ marginTop: 12 }}>
        <label>Regime tributário</label>
        <select value={regime} onChange={(e) => setRegime(e.target.value)}>
          {REGIME_ORDER.map((r) => (
            <option key={r} value={r}>
              {REGIME_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {result && (
        <div style={{ marginTop: 20, borderRadius: 12, background: "var(--background)", padding: 16, fontSize: "0.85rem" }}>
          <div className="flex justify-between">
            <span style={{ color: "var(--muted)" }}>IBS</span>
            <span style={{ fontWeight: 500 }}>− {formatCents(result.ibsAmountCents)}</span>
          </div>
          <div className="flex justify-between" style={{ marginTop: 6 }}>
            <span style={{ color: "var(--muted)" }}>CBS</span>
            <span style={{ fontWeight: 500 }}>− {formatCents(result.cbsAmountCents)}</span>
          </div>
          <div className="flex justify-between" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
            <span style={{ fontWeight: 600 }}>Líquido (D+0)</span>
            <span style={{ fontWeight: 700, color: "var(--brand-dark)" }}>{formatCents(result.netAmountCents)}</span>
          </div>
          <p style={{ marginTop: 8, fontSize: "0.72rem", color: "var(--muted-light)" }}>
            Retenção efetiva: {formatPercent(result.effectiveRate)}
          </p>
        </div>
      )}
    </div>
  );
}
