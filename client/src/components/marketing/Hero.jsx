import { Link } from "react-router-dom";

const stats = [
  { label: "PMEs no SAM paulista", value: "~380 mil" },
  { label: "Churn evitável (falhas de cobrança)", value: "20–40%" },
  { label: "Alíquota estimada IBS+CBS", value: "~26,5%" },
  { label: "Meta de NRR da Lumina", value: "> 110%" },
];

export function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <span className="hero-badge">Reforma Tributária · Split Payment chega em 2026</span>
        <h1>
          O radar de liquidez para a sua empresa sobreviver ao <span>Split Payment</span>
        </h1>
        <p className="lead">
          A Lumina consolida suas contas via Open Finance, projeta o fluxo de caixa realmente
          disponível após a segregação automática de IBS e CBS, e orquestra crédito e cobrança
          B2B com Pix Automático — antes que o buraco de caixa aconteça.
        </p>
        <div className="hero-actions">
          <Link to="/registro" className="btn btn-accent">
            Testar 14 dias grátis
          </Link>
          <a href="#split-payment" className="btn btn-outline" style={{ borderColor: "rgba(255,255,255,0.25)", color: "#fff" }}>
            Ver simulador de Split Payment
          </a>
        </div>
        <p className="hero-note">
          Sem necessidade de cartão. Dados protegidos sob FAPI 2.0 / DPoP e LGPD.
        </p>
      </div>

      <dl className="hero-stats container">
        {stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
