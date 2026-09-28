import { Link } from "react-router-dom";

const links = [
  { href: "#modulos", label: "Módulos" },
  { href: "#split-payment", label: "Split Payment" },
  { href: "#precos", label: "Preços" },
  { href: "#confianca", label: "Segurança" },
];

export function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand-mark">
          <span className="brand-dot" />
          Lumina
        </Link>
        <nav className="navbar-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn btn-ghost btn-sm">
            Entrar
          </Link>
          <Link to="/registro" className="btn btn-primary btn-sm">
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
