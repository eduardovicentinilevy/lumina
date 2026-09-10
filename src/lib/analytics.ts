export interface InvoiceLike {
  grossAmountCents: number;
  netAmountCents: number;
  ibsAmountCents: number;
  cbsAmountCents: number;
  status: "PENDENTE" | "PAGA" | "ATRASADA" | "FALHOU";
  issuedAt: Date;
  dueDate: Date;
}

export interface PeriodBucket {
  key: string;
  label: string;
  grossCents: number;
  netCents: number;
  taxCents: number;
  count: number;
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function groupPaidInvoicesByMonth(invoices: InvoiceLike[], months = 6): PeriodBucket[] {
  const buckets = new Map<string, PeriodBucket>();
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets.set(key, {
      key,
      label: MONTH_LABELS[d.getMonth()],
      grossCents: 0,
      netCents: 0,
      taxCents: 0,
      count: 0,
    });
  }

  for (const inv of invoices) {
    if (inv.status !== "PAGA") continue;
    const key = `${inv.issuedAt.getFullYear()}-${inv.issuedAt.getMonth()}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.grossCents += inv.grossAmountCents;
    bucket.netCents += inv.netAmountCents;
    bucket.taxCents += inv.ibsAmountCents + inv.cbsAmountCents;
    bucket.count += 1;
  }

  return Array.from(buckets.values());
}

export function groupPendingInvoicesByWeek(invoices: InvoiceLike[], weeks = 6): PeriodBucket[] {
  const now = new Date();
  const buckets: PeriodBucket[] = Array.from({ length: weeks }, (_, i) => ({
    key: `w${i}`,
    label: i === 0 ? "Esta semana" : `Sem. +${i}`,
    grossCents: 0,
    netCents: 0,
    taxCents: 0,
    count: 0,
  }));

  for (const inv of invoices) {
    if (inv.status !== "PENDENTE") continue;
    const diffDays = Math.floor((inv.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) continue;
    const weekIndex = Math.floor(diffDays / 7);
    if (weekIndex >= weeks) continue;
    buckets[weekIndex].grossCents += inv.grossAmountCents;
    buckets[weekIndex].netCents += inv.netAmountCents;
    buckets[weekIndex].taxCents += inv.ibsAmountCents + inv.cbsAmountCents;
    buckets[weekIndex].count += 1;
  }

  return buckets;
}
