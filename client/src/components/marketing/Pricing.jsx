import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";

export function Pricing() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api.get("/plans").then(setPlans).catch(() => {});
  }, []);

  return (
    <section id="precos" className="trust-section">
      <div className="container section">
        <div className="text-center" style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 className="section-eyebrow">Preços</h2>
          <p className="section-title">Planos que crescem com a sua tesouraria</p>
          <p className="section-lead">
            Assinatura fixa mensal, mais uma margem fracionária sobre os volumes transacionados
            e antecipados via parceiros de BaaS.
          </p>
        </div>

        <div className="grid-2col" style={{ marginTop: 56 }}>
          {plans.map((plan) => {
            const highlighted = plan.id === "PRO";
            return (
              <div
                key={plan.id}
                className={`pricing-card${highlighted ? " featured" : ""}`}
                style={{ flexBasis: "30%" }}
              >
                <h3>{plan.name}</h3>
                <p className="tagline">{plan.tagline}</p>
                <p className="price">{plan.priceLabel}</p>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="dot" style={{ background: highlighted ? "var(--accent)" : "var(--brand)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/registro"
                  className={`btn ${highlighted ? "btn-accent" : "btn-primary"}`}
                >
                  {plan.id === "ENTERPRISE" ? "Falar com vendas" : "Começar agora"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
