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
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">Go-to-Market</h2>
        <p className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          Distribuição por canais, não por anúncio genérico
        </p>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {channels.map((c, i) => (
          <div key={c.title} className="rounded-2xl border border-border bg-surface p-6">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
              {i + 1}
            </span>
            <h3 className="mt-4 font-semibold text-foreground">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/60">{c.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
