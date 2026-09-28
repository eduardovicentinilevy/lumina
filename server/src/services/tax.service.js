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
const REGIME_SPLIT_RATE = {
  SIMPLES_NACIONAL: { ibs: 0.052, cbs: 0.021 },
  LUCRO_PRESUMIDO: { ibs: 0.177, cbs: 0.088 },
  LUCRO_REAL: { ibs: 0.177, cbs: 0.088 },
};

const REGIME_LABELS = {
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL: "Lucro Real",
};

function simulateSplitPayment(grossAmountCents, regime) {
  const rates = REGIME_SPLIT_RATE[regime] ?? REGIME_SPLIT_RATE.SIMPLES_NACIONAL;
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
    effectiveRate: grossAmountCents > 0 ? (totalTaxCents / grossAmountCents) * 100 : 0,
  };
}

module.exports = { simulateSplitPayment, REGIME_LABELS, REGIME_SPLIT_RATE };
