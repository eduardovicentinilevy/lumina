import { LogoutButton } from "./LogoutButton";
import { PLAN_DETAILS } from "@/lib/plans";
import type { Plan } from "@/generated/prisma/enums";

export function Topbar({
  companyName,
  userName,
  plan,
}: {
  companyName: string;
  userName: string;
  plan: Plan;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{companyName}</p>
        <p className="text-xs text-foreground/50">
          Plano {PLAN_DETAILS[plan].name} &middot; Olá, {userName.split(" ")[0]}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent sm:inline-block">
          Parceiro BaaS: Celcoin
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
