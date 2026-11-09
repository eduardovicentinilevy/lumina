const test = require("node:test");
const assert = require("node:assert/strict");
const { simulateSplitPayment } = require("../src/services/tax.service");

test("simulateSplitPayment: líquido + impostos sempre somam o bruto", () => {
  for (const regime of ["SIMPLES_NACIONAL", "LUCRO_PRESUMIDO", "LUCRO_REAL"]) {
    const result = simulateSplitPayment(100_000, regime);
    assert.equal(
      result.netAmountCents + result.ibsAmountCents + result.cbsAmountCents,
      result.grossAmountCents
    );
  }
});

test("simulateSplitPayment: Lucro Presumido retém mais que Simples Nacional", () => {
  const simples = simulateSplitPayment(100_000, "SIMPLES_NACIONAL");
  const presumido = simulateSplitPayment(100_000, "LUCRO_PRESUMIDO");
  assert.ok(presumido.totalTaxCents > simples.totalTaxCents);
});

test("simulateSplitPayment: alíquota efetiva é consistente com o total retido", () => {
  const result = simulateSplitPayment(200_000, "LUCRO_REAL");
  const expectedRate = (result.totalTaxCents / result.grossAmountCents) * 100;
  assert.ok(Math.abs(result.effectiveRate - expectedRate) < 0.0001);
});

test("simulateSplitPayment: valor bruto zero não gera divisão por zero", () => {
  const result = simulateSplitPayment(0, "SIMPLES_NACIONAL");
  assert.equal(result.netAmountCents, 0);
  assert.equal(result.effectiveRate, 0);
});

test("simulateSplitPayment: regime desconhecido usa o fallback Simples Nacional", () => {
  const fallback = simulateSplitPayment(50_000, "REGIME_INEXISTENTE");
  const simples = simulateSplitPayment(50_000, "SIMPLES_NACIONAL");
  assert.deepEqual(fallback, simples);
});
