export function StatCard({ label, value, hint, tone = "default" }) {
  const toneClass = tone !== "default" ? ` tone-${tone}` : "";
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value${toneClass}`}>{value}</p>
      {hint && <p className="stat-hint">{hint}</p>}
    </div>
  );
}
