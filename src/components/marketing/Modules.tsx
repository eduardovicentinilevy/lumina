const modules = [
  {
    tag: "Módulo 1",
    title: "Agregação Patrimonial",
    description:
      "Consolida saldos, extratos e passivos de centenas de instituições via Open Finance, com consentimento granular e criptografia FAPI 2.0 / DPoP — sem a Lumina guardar suas credenciais bancárias.",
    points: ["Leitura via parceiros licenciados (Pluggy, Klavi)", "Consentimento LGPD auditável", "Padronização em JSON"],
  },
  {
    tag: "Módulo 2",
    title: "Previsibilidade de Liquidez",
    description:
      "Lê as notas fiscais eletrónicas em tempo real, simula a extração de IBS/CBS na fonte e projeta o caixa estritamente livre — o radar dos buracos de liquidez antes que eles aconteçam.",
    points: ["Simulador de Split Payment por regime tributário", "Alertas profiláticos de descasamento", "Projeção diária de caixa livre"],
  },
  {
    tag: "Módulo 3",
    title: "Crédito Contextual",
    description:
      "Score de crédito explicável, calculado a partir do fluxo de caixa real da empresa, para antecipação de recebíveis. A decisão final e o KYC/PLD-FT ficam sempre com a Instituição Prestadora de BaaS licenciada.",
    points: ["Score com fatores auditáveis (PL 2338/2023)", "Parceria transparente com instituições licenciadas", "Sem acesso direto ao SCR do Bacen"],
  },
  {
    tag: "Módulo 4",
    title: "Cobrança B2B & Pix Automático",
    description:
      "Estrutura assinaturas e cobranças recorrentes com mandatos de débito Pix, liquidação D+0 e taxas muito menores que cartão — reduzindo o churn involuntário por falha de cobrança.",
    points: ["Mandatos de débito recorrente autorizado", "Liquidação instantânea D+0", "Alertas automáticos de falha de cobrança"],
  },
];

export function Modules() {
  return (
    <section id="modulos" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">A plataforma</h2>
        <p className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          Quatro módulos, uma única camada de tesouraria
        </p>
        <p className="mt-4 text-foreground/60">
          A Lumina não é um ERP. É a camada autónoma de Embedded Finance que fica entre a sua
          conta bancária, a Receita e o seu cliente.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {modules.map((m) => (
          <div
            key={m.title}
            className="rounded-2xl border border-border bg-surface p-7 transition hover:border-brand/40 hover:shadow-md"
          >
            <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {m.tag}
            </span>
            <h3 className="mt-4 text-xl font-semibold text-foreground">{m.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/60">{m.description}</p>
            <ul className="mt-4 space-y-1.5">
              {m.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-foreground/70">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
