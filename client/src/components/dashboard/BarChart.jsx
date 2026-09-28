import { formatCompactCents } from "../../utils/money";

export function BarChart({ data, grossLabel = "Bruto", netLabel = "Líquido" }) {
  const max = Math.max(1, ...data.map((d) => d.grossCents));
  const chartHeight = 150;

  return (
    <div>
      <div className="bar-chart" style={{ height: chartHeight + 24 }}>
        {data.map((bucket) => (
          <div key={bucket.key} className="bar-col">
            <div className="bar-pair" style={{ height: chartHeight }}>
              <div
                className="bar gross"
                style={{ height: Math.max(2, (bucket.grossCents / max) * chartHeight) }}
                title={`${grossLabel}: ${formatCompactCents(bucket.grossCents)}`}
              />
              <div
                className="bar net"
                style={{ height: Math.max(2, (bucket.netCents / max) * chartHeight) }}
                title={`${netLabel}: ${formatCompactCents(bucket.netCents)}`}
              />
            </div>
            <span className="bar-label">{bucket.label}</span>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span><span className="swatch gross" />{grossLabel}</span>
        <span><span className="swatch net" />{netLabel}</span>
      </div>
    </div>
  );
}
