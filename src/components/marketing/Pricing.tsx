import Link from "next/link";
import { PLAN_DETAILS, PLAN_ORDER } from "@/lib/plans";

export function Pricing() {
  return (
    <section id="precos" className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">Preços</h2>
          <p className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Planos que crescem com a sua tesouraria
          </p>
          <p className="mt-4 text-foreground/60">
            Assinatura fixa mensal, mais uma margem fracionária sobre os volumes transacionados
            e antecipados via parceiros de BaaS.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const plan = PLAN_DETAILS[planId];
            const highlighted = planId === "PRO";
            return (
              <div
                key={planId}
                className={`flex flex-col rounded-2xl border p-8 ${
                  highlighted
                    ? "border-brand bg-brand-dark text-white shadow-xl"
                    : "border-border bg-background"
                }`}
              >
                <h3 className={`text-lg font-semibold ${highlighted ? "text-white" : "text-foreground"}`}>
                  {plan.name}
                </h3>
                <p className={`mt-1 text-sm ${highlighted ? "text-white/60" : "text-foreground/60"}`}>
                  {plan.tagline}
                </p>
                <p className={`mt-6 text-3xl font-bold ${highlighted ? "text-white" : "text-foreground"}`}>
                  {plan.priceLabel}
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 text-sm ${
                        highlighted ? "text-white/80" : "text-foreground/70"
                      }`}
                    >
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${highlighted ? "bg-accent" : "bg-brand"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro"
                  className={`mt-8 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
                    highlighted
                      ? "bg-accent text-brand-dark hover:brightness-110"
                      : "bg-brand text-white hover:bg-brand-dark"
                  }`}
                >
                  {planId === "ENTERPRISE" ? "Falar com vendas" : "Começar agora"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
