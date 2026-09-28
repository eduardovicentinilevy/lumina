import { NavLink } from "react-router-dom";

const nav = [
  { to: "/dashboard", label: "Visão geral", icon: "◎", end: true },
  { to: "/dashboard/contas", label: "Contas & Open Finance", icon: "🏦" },
  { to: "/dashboard/fluxo-caixa", label: "Fluxo de caixa & Split Payment", icon: "📈" },
  { to: "/dashboard/credito", label: "Crédito contextual", icon: "💳" },
  { to: "/dashboard/cobranca", label: "Cobrança B2B & Pix", icon: "🧾" },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-dot" />
        Lumina
      </div>
      <nav className="sidebar-nav">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">Dados protegidos sob FAPI 2.0 / DPoP · LGPD</div>
    </aside>
  );
}
