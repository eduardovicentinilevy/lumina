const items = [
  {
    title: "FAPI 2.0 + DPoP",
    description:
      "Autenticação de API de nível financeiro com prova de posse criptográfica por chave — sem depender de bearer tokens vulneráveis a replay attacks.",
  },
  {
    title: "Resolução Conjunta BCB/CMN nº 16/2025",
    description:
      "A Lumina atua estritamente como Entidade Tomadora de BaaS. KYC, PLD/FT e gestão de risco de crédito são de responsabilidade exclusiva da Instituição Prestadora licenciada.",
  },
  {
    title: "LGPD & Open Finance",
    description:
      "Consentimento granular, revogável a qualquer momento, com criptografia em repouso e em trânsito para todos os dados agregados.",
  },
  {
    title: "PL 2338/2023 — Marco Legal da IA",
    description:
      "O motor de crédito é explicável por desenho: cada score vem acompanhado dos fatores que o determinaram, com supervisão humana no ciclo de decisão.",
  },
];

export function Trust() {
  return (
    <section id="confianca" className="border-y border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">Conformidade</h2>
          <p className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
            Construída para o rigor regulatório de 2026
          </p>
          <p className="mt-4 text-foreground/60">
            Inovação com delegação informal está fora de questão. A Lumina foi desenhada dentro
            dos limites claros impostos pelo Banco Central, pela CVM e pela futura Lei de IA.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.title} className="rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
