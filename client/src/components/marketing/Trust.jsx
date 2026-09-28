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
    <section id="confianca" className="trust-section">
      <div className="container section">
        <div className="text-center" style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 className="section-eyebrow">Conformidade</h2>
          <p className="section-title">Construída para o rigor regulatório de 2026</p>
          <p className="section-lead">
            Inovação com delegação informal está fora de questão. A Lumina foi desenhada dentro
            dos limites claros impostos pelo Banco Central, pela CVM e pela futura Lei de IA.
          </p>
        </div>
        <div className="grid-cards" style={{ marginTop: 56 }}>
          {items.map((item) => (
            <div key={item.title} className="trust-card" style={{ flexBasis: "45%" }}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
