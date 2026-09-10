import { SplitPaymentSimulator } from "./SplitPaymentSimulator";

export function SplitPaymentSection() {
  return (
    <section id="split-payment" className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
            O choque de liquidez de 2026
          </h2>
          <p className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            O &ldquo;float tributário&rdquo; está a desaparecer
          </p>
          <p className="mt-4 text-foreground/60">
            Com o Split Payment do IBS e da CBS, a plataforma pública governamental identifica a
            transação no instante da liquidação e segrega automaticamente os impostos direto na
            fonte. Apenas o valor líquido cai na sua conta — o capital de giro informal que
            financiava despesas correntes desaparece do dia para a noite.
          </p>
          <p className="mt-4 text-foreground/60">
            Simule ao lado o efeito real sobre uma fatura da sua empresa, de acordo com o seu
            regime tributário.
          </p>
        </div>
        <SplitPaymentSimulator />
      </div>
    </section>
  );
}
