"use client";

import { useMemo, useState } from "react";
import { simulateSplitPayment, REGIME_LABELS } from "@/lib/tax";
import { formatCents, formatPercent } from "@/lib/money";
import type { TaxRegime } from "@/generated/prisma/enums";

export function SplitPaymentSimulator() {
  const [amount, setAmount] = useState(50000);
  const [regime, setRegime] = useState<TaxRegime>("LUCRO_PRESUMIDO");

  const result = useMemo(() => simulateSplitPayment(amount * 100, regime), [amount, regime]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground/70">
            Valor bruto da fatura (R$)
          </label>
          <input
            type="range"
            min={1000}
            max={200000}
            step={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-3 w-full accent-brand"
          />
          <div className="mt-1 text-2xl font-bold text-foreground">
            {amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
          </div>

          <label className="mt-6 block text-sm font-medium text-foreground/70">
            Regime tributário
          </label>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(Object.keys(REGIME_LABELS) as TaxRegime[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegime(r)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                  regime === r
                    ? "border-brand bg-brand/10 text-brand-dark"
                    : "border-border text-foreground/60 hover:border-brand/40"
                }`}
              >
                {REGIME_LABELS[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-brand-dark p-6 text-white">
          <p className="text-xs uppercase tracking-wide text-white/60">
            Simulação de liquidação com Split Payment
          </p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-sm text-white/70">Valor bruto faturado</span>
            <span className="font-semibold">{formatCents(result.grossAmountCents)}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between text-red-300">
            <span className="text-sm">− IBS (segregado na fonte)</span>
            <span className="font-semibold">− {formatCents(result.ibsAmountCents)}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between text-red-300">
            <span className="text-sm">− CBS (segregado na fonte)</span>
            <span className="font-semibold">− {formatCents(result.cbsAmountCents)}</span>
          </div>
          <div className="mt-4 border-t border-white/15 pt-4 flex items-baseline justify-between">
            <span className="text-sm text-white/70">Cai na sua conta (líquido, D+0)</span>
            <span className="text-xl font-bold text-accent">{formatCents(result.netAmountCents)}</span>
          </div>
          <p className="mt-4 text-xs text-white/50">
            Retenção efetiva simulada: {formatPercent(result.effectiveRate)}. Alíquotas
            ilustrativas — dependem de regulamentação complementar da Reforma Tributária.
          </p>
        </div>
      </div>
    </div>
  );
}
