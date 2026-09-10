"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Visão geral", icon: "◎", exact: true },
  { href: "/dashboard/contas", label: "Contas & Open Finance", icon: "🏦" },
  { href: "/dashboard/fluxo-caixa", label: "Fluxo de caixa & Split Payment", icon: "📈" },
  { href: "/dashboard/credito", label: "Crédito contextual", icon: "💳" },
  { href: "/dashboard/cobranca", label: "Cobrança B2B & Pix", icon: "🧾" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex items-center gap-2 px-6 py-5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
        <Link href="/dashboard" className="text-lg font-bold text-brand-dark">
          Lumina
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand/10 text-brand-dark"
                  : "text-foreground/60 hover:bg-background hover:text-foreground"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-4 text-xs text-foreground/40">
        Dados protegidos sob FAPI 2.0 / DPoP &middot; LGPD
      </div>
    </aside>
  );
}
