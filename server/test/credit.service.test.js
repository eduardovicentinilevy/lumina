const test = require("node:test");
const assert = require("node:assert/strict");
const { computeCreditScore } = require("../src/services/credit.service");

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFromNow(n) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

test("computeCreditScore: sem histórico, não há volume para aprovar crédito", () => {
  // Sem faturas, os fatores de pontualidade/churn assumem valores neutros
  // (benefício da dúvida para uma empresa nova), mas o volume médio de
  // recebíveis é zero — por isso nenhum valor é pré-aprovado.
  const result = computeCreditScore([]);
  assert.equal(result.approvedAmountCents, 0);
  assert.ok(["C", "D"].includes(result.tier));
});

test("computeCreditScore: os pesos dos fatores somam exatamente 1000 pontos", () => {
  const result = computeCreditScore([]);
  const totalMaxPoints = result.factors.reduce((acc, f) => acc + f.maxPoints, 0);
  assert.equal(totalMaxPoints, 1000);
});

test("computeCreditScore: histórico exemplar gera faixa alta e oferta de crédito", () => {
  const invoices = [];
  for (let month = 5; month >= 0; month--) {
    const issuedAt = daysAgo(month * 30 + 5);
    const dueDate = daysAgo(month * 30 - 10);
    invoices.push({
      netAmountCents: 1_000_000,
      status: "PAGA",
      recurring: true,
      issuedAt,
      dueDate,
      paidAt: daysAgo(month * 30 - 11), // pago antes do vencimento
    });
  }
  const result = computeCreditScore(invoices);
  assert.ok(result.score >= 600, `esperava score alto, veio ${result.score}`);
  assert.ok(["A", "B"].includes(result.tier));
  assert.ok(result.approvedAmountCents > 0);
});

test("computeCreditScore: muitas falhas de cobrança penalizam o fator de churn", () => {
  const invoices = Array.from({ length: 10 }, (_, i) => ({
    netAmountCents: 500_000,
    status: "FALHOU",
    recurring: false,
    issuedAt: daysAgo(i * 10),
    dueDate: daysAgo(i * 10 - 5),
    paidAt: null,
  }));
  const result = computeCreditScore(invoices);
  const churnFactor = result.factors.find((f) => f.label.includes("churn involuntário"));
  assert.equal(churnFactor.points, 0);
  assert.equal(churnFactor.positive, false);
});

test("computeCreditScore: cobranças pendentes futuras não contam como liquidadas", () => {
  const invoices = [
    { netAmountCents: 100_000, status: "PENDENTE", recurring: false, issuedAt: new Date(), dueDate: daysFromNow(10), paidAt: null },
  ];
  const result = computeCreditScore(invoices);
  const punctuality = result.factors.find((f) => f.label.includes("Pontualidade"));
  assert.match(punctuality.detail, /0 de 0/);
});
