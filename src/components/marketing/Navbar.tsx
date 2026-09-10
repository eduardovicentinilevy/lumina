import Link from "next/link";

const links = [
  { href: "#modulos", label: "Módulos" },
  { href: "#split-payment", label: "Split Payment" },
  { href: "#precos", label: "Preços" },
  { href: "#confianca", label: "Segurança" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-dark">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
          Lumina
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/70 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-brand">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-foreground/70 transition hover:text-brand sm:block"
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
