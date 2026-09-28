import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section className="container section">
      <div className="cta-banner" style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2>O Split Payment não vai esperar. A sua tesouraria também não deveria.</h2>
        <p>
          Conecte suas contas, simule o impacto da Reforma Tributária e comece a orquestrar
          crédito e cobrança B2B em poucos minutos.
        </p>
        <Link to="/registro" className="btn btn-accent">
          Criar minha conta grátis
        </Link>
      </div>
    </section>
  );
}
