export function groupPendingInvoicesByWeek(invoices, weeks = 6) {
  const now = new Date();
  const buckets = Array.from({ length: weeks }, (_, i) => ({
    key: `w${i}`,
    label: i === 0 ? "Esta semana" : `Sem. +${i}`,
    grossCents: 0,
    netCents: 0,
  }));

  for (const inv of invoices) {
    if (inv.status !== "PENDENTE") continue;
    const diffDays = Math.floor((new Date(inv.dueDate) - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) continue;
    const weekIndex = Math.floor(diffDays / 7);
    if (weekIndex >= weeks) continue;
    buckets[weekIndex].grossCents += inv.grossAmountCents;
    buckets[weekIndex].netCents += inv.netAmountCents;
  }

  return buckets;
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function labelMonthlyBuckets(rows, months = 6) {
  const map = new Map(rows.map((r) => [r.key, r]));
  const now = new Date();
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const found = map.get(key);
    out.push({
      key,
      label: MONTH_LABELS[d.getMonth()],
      grossCents: found?.grossCents ?? 0,
      netCents: found?.netCents ?? 0,
    });
  }
  return out;
}
