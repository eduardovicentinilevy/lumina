import { getCurrentCompany } from "@/lib/session";
import { getBankAccounts, getTotalBalanceCents } from "@/lib/queries";
import { formatCents, formatDate } from "@/lib/money";
import { Badge } from "@/components/dashboard/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { connectAccount, renewConsent } from "./actions";

const CONSENT_TONE = {
  ATIVO: "emerald",
  EXPIRADO: "amber",
  REVOGADO: "red",
} as const;

export default async function ContasPage() {
  const session = await getCurrentCompany();
  if (!session) return null;

  const [accounts, totalBalance] = await Promise.all([
    getBankAccounts(session.company.id),
    getTotalBalanceCents(session.company.id),
  ]);

  const activeConsents = accounts.filter((a) => a.consentStatus === "ATIVO").length;
  const now = new Date();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agregação Patrimonial</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Contas conectadas via Open Finance (Pluggy / Klavi), sob consentimento granular LGPD.
          </p>
        </div>
        <form action={connectAccount}>
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            + Conectar nova conta
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Saldo consolidado" value={formatCents(totalBalance)} />
        <StatCard label="Contas conectadas" value={`${accounts.length}`} />
        <StatCard
          label="Consentimentos ativos"
          value={`${activeConsents}/${accounts.length}`}
          tone={activeConsents === accounts.length ? "positive" : "warning"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {accounts.map((account) => {
          const daysLeft = Math.ceil(
            (account.consentExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return (
            <div key={account.id} className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{account.institution}</p>
                  <p className="text-xs text-foreground/50">{account.accountType}</p>
                </div>
                <Badge tone={CONSENT_TONE[account.consentStatus]}>
                  {account.consentStatus === "ATIVO"
                    ? "Consentimento ativo"
                    : account.consentStatus === "EXPIRADO"
                    ? "Consentimento expirado"
                    : "Consentimento revogado"}
                </Badge>
              </div>

              <p className="mt-4 text-2xl font-bold text-foreground">
                {formatCents(account.balanceCents)}
              </p>
              <p className="mt-1 text-xs text-foreground/50">
                {account.consentStatus === "ATIVO"
                  ? daysLeft <= 15
                    ? `Consentimento expira em ${daysLeft} dias`
                    : `Sincronizado em ${formatDate(account.lastSyncedAt)}`
                  : "Requer renovação de consentimento para continuar sincronizando"}
              </p>

              {account.consentStatus !== "ATIVO" || daysLeft <= 15 ? (
                <form action={renewConsent.bind(null, account.id)} className="mt-3">
                  <button
                    type="submit"
                    className="rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                  >
                    Renovar consentimento
                  </button>
                </form>
              ) : null}

              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                  Movimentações recentes
                </p>
                <ul className="mt-2 space-y-2">
                  {account.transactions.slice(0, 5).map((tx) => (
                    <li key={tx.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground/70">{tx.description}</span>
                      <span className={tx.isCredit ? "text-emerald-600" : "text-foreground/60"}>
                        {tx.isCredit ? "+" : "−"} {formatCents(tx.amountCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
