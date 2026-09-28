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
    <section id="modulos" className="section container">
      <div className="text-center" style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 className="section-eyebrow">A plataforma</h2>
        <p className="section-title">Quatro módulos, uma única camada de tesouraria</p>
        <p className="section-lead">
          A Lumina não é um ERP. É a camada autónoma de Embedded Finance que fica entre a sua
          conta bancária, a Receita e o seu cliente.
        </p>
      </div>

      <div className="grid-2col" style={{ marginTop: 56 }}>
        {modules.map((m) => (
          <div key={m.title} className="module-card">
            <span className="badge badge-brand">{m.tag}</span>
            <h3>{m.title}</h3>
            <p>{m.description}</p>
            <ul>
              {m.points.map((p) => (
                <li key={p}>
                  <span className="dot" />
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
