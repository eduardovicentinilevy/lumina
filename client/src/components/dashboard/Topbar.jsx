import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

const PLAN_NAMES = { STARTER: "Starter", PRO: "Pro", ENTERPRISE: "Enterprise" };

export function Topbar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await logout();
    navigate("/");
  }

  if (!session) return null;
  const { user, company } = session;

  return (
    <header className="topbar">
      <div>
        <p className="company-name">{company.name}</p>
        <p className="company-meta">
          Plano {PLAN_NAMES[company.plan]} · Olá, {user.name.split(" ")[0]}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="badge badge-brand" style={{ background: "rgba(20,184,166,0.1)", color: "#0f766e", borderColor: "rgba(20,184,166,0.2)" }}>
          Parceiro BaaS: Celcoin
        </span>
        <button onClick={handleLogout} disabled={loading} className="btn btn-ghost btn-sm">
          {loading ? "Saindo..." : "Sair"}
        </button>
      </div>
    </header>
  );
}
