const PLAN_ORDER = ["STARTER", "PRO", "ENTERPRISE"];

const PLAN_DETAILS = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceCents: 24900,
    priceLabel: "R$ 249/mês",
    tagline: "Consolidação de uma entidade e leitura de dados simples.",
    features: [
      "1 CNPJ conectado via Open Finance",
      "Leitura de saldos e extratos consolidados",
      "Radar de liquidez com alertas de Split Payment",
      "Até 50 cobranças B2B por mês",
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceCents: 159000,
    priceLabel: "R$ 1.590/mês",
    tagline: "Modelação preditiva do Split Payment e crédito contextual.",
    features: [
      "Até 5 CNPJs / conciliação multi-entidade",
      "Simulador completo de Split Payment (IBS + CBS)",
      "Crédito contextual com score explicável",
      "Cobrança B2B ilimitada com Pix Automático",
      "Conectores nativos com TOTVS, SAP e Senior",
    ],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceCents: null,
    priceLabel: "Sob consulta",
    tagline: "Estruturas complexas, múltiplas entidades e APIs sem limite.",
    features: [
      "CNPJs e entidades ilimitadas",
      "APIs proprietárias sem limites rigorosos de acesso",
      "Onboarding dedicado e Customer Success sénior",
      "SLA contratual e acordo de responsabilidades com parceiros BaaS",
    ],
  },
};

module.exports = { PLAN_ORDER, PLAN_DETAILS };
