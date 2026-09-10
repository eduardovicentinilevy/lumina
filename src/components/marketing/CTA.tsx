import Link from "next/link";

export function CTA() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="rounded-3xl bg-brand-dark px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          O Split Payment não vai esperar. A sua tesouraria também não deveria.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Conecte suas contas, simule o impacto da Reforma Tributária e comece a orquestrar
          crédito e cobrança B2B em poucos minutos.
        </p>
        <Link
          href="/registro"
          className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-brand-dark shadow-lg shadow-accent/20 transition hover:brightness-110"
        >
          Criar minha conta grátis
        </Link>
      </div>
    </section>
  );
}
