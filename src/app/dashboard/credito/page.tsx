import { getCurrentCompany } from "@/lib/session";
import { getInvoices, getCreditOffers } from "@/lib/queries";
import { computeCreditScore } from "@/lib/credit";
import { formatCents, formatDate } from "@/lib/money";
import { Badge } from "@/components/dashboard/Badge";
import { requestNewAnalysis, respondToOffer } from "./actions";

const TIER_TONE = { A: "emerald", B: "brand", C: "amber", D: "red" } as const;

const OFFER_TONE = {
  OFERTADO: "brand",
  ACEITO: "emerald",
  RECUSADO: "slate",
  EXPIRADO: "red",
} as const;

const OFFER_LABEL = {
  OFERTADO: "Aguardando decisão",
  ACEITO: "Aceita",
  RECUSADO: "Recusada",
  EXPIRADO: "Expirada",
};

export default async function CreditoPage() {
  const session = await getCurrentCompany();
  if (!session) return null;

  const [invoices, offers] = await Promise.all([
    getInvoices(session.company.id),
    getCreditOffers(session.company.id),
  ]);

  const scoreResult = computeCreditScore(
    invoices.map((i) => ({
      netAmountCents: i.netAmountCents,
      status: i.status,
      recurring: i.recurring,
      dueDate: i.dueDate,
      paidAt: i.paidAt,
      issuedAt: i.issuedAt,
    }))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Crédito Contextual</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Score explicável calculado a partir do seu fluxo de caixa real via Open Finance.
          </p>
        </div>
        <form action={requestNewAnalysis}>
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Solicitar nova análise
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Score atual
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">{scoreResult.score}</span>
            <span className="text-sm text-foreground/40">/ 1000</span>
          </div>
          <div className="mt-3">
            <Badge tone={TIER_TONE[scoreResult.tier]}>Faixa {scoreResult.tier}</Badge>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${(scoreResult.score / 1000) * 100}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/60">
            {scoreResult.decisionReason}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Fatores explicáveis (PL 2338/2023)
          </p>
          <div className="mt-4 space-y-4">
            {scoreResult.factors.map((factor) => (
              <div key={factor.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{factor.label}</span>
                  <span className={factor.positive ? "text-emerald-600" : "text-amber-600"}>
                    {factor.points} / {factor.maxPoints} pts
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-background">
                  <div
                    className={`h-full rounded-full ${factor.positive ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, (factor.points / factor.maxPoints) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-foreground/50">{factor.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 text-sm text-foreground/60">
        <strong className="text-foreground">Responsabilidade regulatória:</strong> a Lumina atua
        exclusivamente como Entidade Tomadora de serviços de BaaS. A decisão final de crédito, o
        KYC e a análise de PLD/FT são de responsabilidade da Instituição Prestadora licenciada
        pelo Banco Central (Celcoin Instituição de Pagamento S.A.), nos termos da Resolução
        Conjunta BCB/CMN nº 16/2025.
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Ofertas de antecipação de recebíveis</h2>
        </div>
        {offers.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-foreground/50">
            Nenhuma oferta gerada ainda. Solicite uma nova análise.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {offers.map((offer) => (
              <div key={offer.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCents(offer.amountCents)}
                  </p>
                  <p className="text-xs text-foreground/50">
                    Score {offer.scoreValue} &middot; {offer.baasPartner} &middot; gerada em{" "}
                    {formatDate(offer.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={OFFER_TONE[offer.status]}>{OFFER_LABEL[offer.status]}</Badge>
                  {offer.status === "OFERTADO" && (
                    <>
                      <form action={respondToOffer.bind(null, offer.id, true)}>
                        <button
                          type="submit"
                          className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                        >
                          Aceitar
                        </button>
                      </form>
                      <form action={respondToOffer.bind(null, offer.id, false)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground/60 transition hover:border-red-300 hover:text-red-600"
                        >
                          Recusar
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
