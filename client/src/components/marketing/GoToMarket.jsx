const channels = [
  {
    title: "Escritórios de Contabilidade & BPO Financeiro",
    description:
      "Canal indireto (B2B2B): contadores enfrentam dificuldade para gerir manualmente os impactos do Split Payment no fluxo de caixa dos clientes e tornam-se promotores da Lumina junto às carteiras de PMEs.",
  },
  {
    title: "Ecossistema Cubo Itaú",
    description:
      "Presença ativa nos polos de inovação de São Paulo (Cubo Fintech) para validação com scale-ups e conexão direta com fundos de Venture Capital sediados na região.",
  },
  {
    title: "Conectores nativos com ERPs legados",
    description:
      "Integrações certificadas via API e Webhooks com TOTVS, SAP e Senior Sistemas — a Lumina atua como camada inteligente sobre o legado, reduzindo o atrito de implantação.",
  },
];

export function GoToMarket() {
  return (
    <section className="section container">
      <div className="text-center" style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 className="section-eyebrow">Go-to-Market</h2>
        <p className="section-title">Distribuição por canais, não por anúncio genérico</p>
      </div>
      <div className="grid-2col" style={{ marginTop: 56 }}>
        {channels.map((c, i) => (
          <div key={c.title} className="module-card" style={{ flexBasis: "30%" }}>
            <span
              className="flex items-center justify-center"
              style={{
                height: 32,
                width: 32,
                borderRadius: "50%",
                background: "var(--brand-dark)",
                color: "#fff",
                fontSize: "0.85rem",
                fontWeight: 700,
              }}
            >
              {i + 1}
            </span>
            <h3>{c.title}</h3>
            <p>{c.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
