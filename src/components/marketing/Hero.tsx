import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-dark via-brand-dark to-background">
      <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(109,94,247,0.35),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(20,184,166,0.25),transparent_40%)]" />
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80">
            Reforma Tributária &middot; Split Payment chega em 2026
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            O radar de liquidez para a sua empresa sobreviver ao{" "}
            <span className="text-accent">Split Payment</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/70">
            A Lumina consolida suas contas via Open Finance, projeta o fluxo de caixa
            realmente disponível após a segregação automática de IBS e CBS, e orquestra
            crédito e cobrança B2B com Pix Automático — antes que o buraco de caixa
            aconteça.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/registro"
              className="w-full rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-brand-dark shadow-lg shadow-accent/20 transition hover:brightness-110 sm:w-auto"
            >
              Testar 14 dias grátis
            </Link>
            <a
              href="#split-payment"
              className="w-full rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              Ver simulador de Split Payment
            </a>
          </div>
          <p className="mt-6 text-xs text-white/50">
            Sem necessidade de cartão. Dados protegidos sob FAPI 2.0 / DPoP e LGPD.
          </p>
        </div>

        <dl className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { label: "PMEs no SAM paulista", value: "~380 mil" },
            { label: "Churn evitável (falhas de cobrança)", value: "20–40%" },
            { label: "Alíquota estimada IBS+CBS", value: "~26,5%" },
            { label: "Meta de NRR da Lumina", value: "> 110%" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <dt className="text-xs text-white/60">{stat.label}</dt>
              <dd className="mt-1 text-xl font-bold text-white">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
