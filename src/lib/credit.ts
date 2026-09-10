/**
 * Motor de score de crédito contextual (explicável).
 *
 * Em produção este motor alimentaria a decisão de uma Instituição
 * Prestadora de BaaS licenciada (ex.: Celcoin, QI Tech) — a Lumina, como
 * Entidade Tomadora, nunca decide o crédito sozinha nem acessa o SCR do
 * Banco Central diretamente (Resolução Conjunta BCB/CMN nº 16/2025). Aqui
 * geramos apenas a pontuação e a pré-visualização que é enviada ao parceiro,
 * e guardamos os fatores para cumprir a exigência de explicabilidade do
 * PL 2338/2023 (Marco Legal da IA) para sistemas de alto risco.
 */

export interface CreditInvoiceInput {
  netAmountCents: number;
  status: "PENDENTE" | "PAGA" | "ATRASADA" | "FALHOU";
  recurring: boolean;
  dueDate: Date;
  paidAt: Date | null;
  issuedAt: Date;
}

export interface ScoreFactor {
  label: string;
  points: number;
  maxPoints: number;
  detail: string;
  positive: boolean;
}

export interface CreditScoreResult {
  score: number;
  tier: "A" | "B" | "C" | "D";
  factors: ScoreFactor[];
  approvedAmountCents: number;
  decisionReason: string;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export function computeCreditScore(invoices: CreditInvoiceInput[]): CreditScoreResult {
  const settled = invoices.filter((i) => i.status === "PAGA" || i.status === "ATRASADA" || i.status === "FALHOU");
  const paid = invoices.filter((i) => i.status === "PAGA");
  const failed = invoices.filter((i) => i.status === "FALHOU");

  const factors: ScoreFactor[] = [];

  // 1. Pontualidade de pagamento
  const onTime = paid.filter((i) => i.paidAt && i.paidAt.getTime() <= i.dueDate.getTime());
  const punctualityRate = settled.length > 0 ? onTime.length / settled.length : 0.5;
  const punctualityPoints = Math.round(punctualityRate * 350);
  factors.push({
    label: "Pontualidade de recebimentos",
    points: punctualityPoints,
    maxPoints: 350,
    detail: `${onTime.length} de ${settled.length} cobranças liquidadas em dia (${Math.round(punctualityRate * 100)}%)`,
    positive: punctualityRate >= 0.7,
  });

  // 2. Receita recorrente
  const recurringShare =
    invoices.length > 0 ? invoices.filter((i) => i.recurring).length / invoices.length : 0;
  const recurringPoints = Math.round(recurringShare * 200);
  factors.push({
    label: "Participação de receita recorrente (Pix Automático)",
    points: recurringPoints,
    maxPoints: 200,
    detail: `${Math.round(recurringShare * 100)}% das cobranças são assinaturas recorrentes`,
    positive: recurringShare >= 0.4,
  });

  // 3. Consistência mensal de faturamento
  const byMonth = new Map<string, number>();
  for (const inv of paid) {
    const key = monthKey(inv.issuedAt);
    byMonth.set(key, (byMonth.get(key) ?? 0) + inv.netAmountCents);
  }
  const monthlyValues = Array.from(byMonth.values());
  let consistencyPoints = 100;
  let consistencyDetail = "Histórico insuficiente para medir consistência";
  if (monthlyValues.length >= 2) {
    const avg = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
    const variance =
      monthlyValues.reduce((acc, v) => acc + (v - avg) ** 2, 0) / monthlyValues.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avg > 0 ? stdDev / avg : 1;
    const stability = Math.max(0, 1 - coefficientOfVariation);
    consistencyPoints = Math.round(stability * 200);
    consistencyDetail = `Variação de receita mensal de ${Math.round(coefficientOfVariation * 100)}% entre os últimos ${monthlyValues.length} meses`;
  }
  factors.push({
    label: "Estabilidade de faturamento mensal",
    points: consistencyPoints,
    maxPoints: 200,
    detail: consistencyDetail,
    positive: consistencyPoints >= 120,
  });

  // 4. Churn involuntário (falhas de cobrança)
  const failureRate = settled.length > 0 ? failed.length / settled.length : 0;
  const failurePenalty = Math.round(failureRate * 150);
  factors.push({
    label: "Falhas de cobrança (churn involuntário)",
    points: 150 - failurePenalty,
    maxPoints: 150,
    detail:
      failed.length > 0
        ? `${failed.length} cobrança(s) falharam por inadimplência técnica ou método expirado`
        : "Nenhuma falha de cobrança registada no período",
    positive: failureRate <= 0.1,
  });

  // 5. Volume operacional
  const totalNet = paid.reduce((acc, i) => acc + i.netAmountCents, 0);
  const monthsActive = Math.max(1, monthlyValues.length);
  const avgMonthlyNet = totalNet / monthsActive;
  const volumePoints = Math.min(100, Math.round(Math.log10(Math.max(1, avgMonthlyNet / 1000)) * 25));
  factors.push({
    label: "Volume médio de recebíveis líquidos",
    points: Math.max(0, volumePoints),
    maxPoints: 100,
    detail: `Média líquida mensal aproximada de R$ ${(avgMonthlyNet / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
    positive: avgMonthlyNet > 500000,
  });

  const score = Math.max(
    0,
    Math.min(1000, factors.reduce((acc, f) => acc + f.points, 0))
  );

  let tier: CreditScoreResult["tier"] = "D";
  if (score >= 800) tier = "A";
  else if (score >= 600) tier = "B";
  else if (score >= 400) tier = "C";

  const approvalMultiplier = { A: 0.35, B: 0.25, C: 0.15, D: 0 }[tier];
  const approvedAmountCents = Math.round(avgMonthlyNet * approvalMultiplier);

  const decisionReason =
    tier === "D"
      ? "Histórico de recebíveis ainda insuficiente ou volátil para pré-aprovação automática. A decisão final e a análise de PLD/FT cabem exclusivamente à instituição parceira licenciada."
      : `Pré-visualização de score gerada a partir do fluxo de caixa real via Open Finance. Faixa ${tier} sugere linha de antecipação de recebíveis de até ${approvalMultiplier * 100}% da média mensal líquida. A decisão de crédito final, incluindo KYC e PLD/FT, é de responsabilidade exclusiva da Instituição Prestadora de BaaS.`;

  return { score, tier, factors, approvedAmountCents, decisionReason };
}
