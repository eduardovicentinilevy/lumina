import { SplitPaymentSimulator } from "./SplitPaymentSimulator";

export function SplitPaymentSection() {
  return (
    <section id="split-payment" className="section container">
      <div className="grid-2col" style={{ alignItems: "center" }}>
        <div>
          <h2 className="section-eyebrow">O choque de liquidez de 2026</h2>
          <p className="section-title">O &ldquo;float tributário&rdquo; está a desaparecer</p>
          <p style={{ marginTop: 16, color: "var(--muted)", lineHeight: 1.6 }}>
            Com o Split Payment do IBS e da CBS, a plataforma pública governamental identifica a
            transação no instante da liquidação e segrega automaticamente os impostos direto na
            fonte. Apenas o valor líquido cai na sua conta — o capital de giro informal que
            financiava despesas correntes desaparece do dia para a noite.
          </p>
          <p style={{ marginTop: 16, color: "var(--muted)", lineHeight: 1.6 }}>
            Simule ao lado o efeito real sobre uma fatura da sua empresa, de acordo com o seu
            regime tributário.
          </p>
        </div>
        <SplitPaymentSimulator />
      </div>
    </section>
  );
}
