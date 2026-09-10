"use client";

import { useMemo, useState } from "react";
import { simulateSplitPayment, REGIME_LABELS } from "@/lib/tax";
import { formatCents, formatPercent } from "@/lib/money";
import type { TaxRegime } from "@/generated/prisma/enums";

export function LiquiditySimulator({ defaultRegime }: { defaultRegime: TaxRegime }) {
  const [amount, setAmount] = useState(10000);
  const [regime, setRegime] = useState<TaxRegime>(defaultRegime);

  const result = useMemo(() => simulateSplitPayment(amount * 100, regime), [amount, regime]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="text-sm font-semibold text-foreground">Simulador de nota fiscal</h3>
      <p className="mt-1 text-xs text-foreground/50">
        Estime quanto vai cair líquido na conta antes de emitir a cobrança.
      </p>

      <div className="mt-4">
        <label className="text-xs font-medium text-foreground/60">Valor bruto (R$)</label>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      <div className="mt-3">
        <label className="text-xs font-medium text-foreground/60">Regime tributário</label>
        <select
          value={regime}
          onChange={(e) => setRegime(e.target.value as TaxRegime)}
          className="mt-1.5 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          {(Object.keys(REGIME_LABELS) as TaxRegime[]).map((r) => (
            <option key={r} value={r}>
              {REGIME_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 space-y-2 rounded-xl bg-background p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground/60">IBS</span>
          <span className="font-medium text-foreground">− {formatCents(result.ibsAmountCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground/60">CBS</span>
          <span className="font-medium text-foreground">− {formatCents(result.cbsAmountCents)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2">
          <span className="font-semibold text-foreground">Líquido (D+0)</span>
          <span className="font-bold text-brand-dark">{formatCents(result.netAmountCents)}</span>
        </div>
        <p className="pt-1 text-xs text-foreground/40">
          Retenção efetiva: {formatPercent(result.effectiveRate)}
        </p>
      </div>
    </div>
  );
}
