import type { TaxRegime } from "../generated/prisma/enums";

/**
 * Simulação do Split Payment do IVA Dual (IBS + CBS).
 *
 * As alíquotas de referência da Reforma Tributária ainda dependem de
 * regulamentação complementar; os percentuais abaixo são ilustrativos,
 * usados apenas para fins de simulação de fluxo de caixa dentro da
 * plataforma (não constituem aconselhamento fiscal). O Simples Nacional
 * mantém, por ora, recolhimento unificado via DAS — por isso aplicamos uma
 * fração de referência bem menor para representar o efeito de transição.
 */
const REGIME_SPLIT_RATE: Record<TaxRegime, { ibs: number; cbs: number }> = {
  SIMPLES_NACIONAL: { ibs: 0.052, cbs: 0.021 },
  LUCRO_PRESUMIDO: { ibs: 0.177, cbs: 0.088 },
  LUCRO_REAL: { ibs: 0.177, cbs: 0.088 },
};

export interface SplitPaymentResult {
  grossAmountCents: number;
  ibsAmountCents: number;
  cbsAmountCents: number;
  totalTaxCents: number;
  netAmountCents: number;
  effectiveRate: number;
}

export function simulateSplitPayment(
  grossAmountCents: number,
  regime: TaxRegime
): SplitPaymentResult {
  const rates = REGIME_SPLIT_RATE[regime];
  const ibsAmountCents = Math.round(grossAmountCents * rates.ibs);
  const cbsAmountCents = Math.round(grossAmountCents * rates.cbs);
  const totalTaxCents = ibsAmountCents + cbsAmountCents;
  const netAmountCents = grossAmountCents - totalTaxCents;

  return {
    grossAmountCents,
    ibsAmountCents,
    cbsAmountCents,
    totalTaxCents,
    netAmountCents,
    effectiveRate: (totalTaxCents / grossAmountCents) * 100,
  };
}

export const REGIME_LABELS: Record<TaxRegime, string> = {
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL: "Lucro Real",
};
