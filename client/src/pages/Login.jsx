import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/dashboard";

  const [email, setEmail] = useState("demo@lumina.com.br");
  const [password, setPassword] = useState("lumina123");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: "48px 16px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <Link to="/" className="brand-mark" style={{ justifyContent: "center" }}>
            <span className="brand-dot" />
            Lumina
          </Link>
          <h1 style={{ marginTop: 16, fontSize: "1.5rem", fontWeight: 600 }}>
            Entrar na plataforma
          </h1>
          <p style={{ marginTop: 4, fontSize: "0.85rem", color: "var(--muted)" }}>
            Acesse a tesouraria inteligente da sua empresa.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="flex-col gap-3">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="field">
              <label htmlFor="email">E-mail corporativo</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">Senha</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-block">
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <p className="text-center" style={{ fontSize: "0.72rem", color: "var(--muted-light)" }}>
              Conta de demonstração pré-preenchida — é só clicar em Entrar.
            </p>
          </form>
        </div>

        <p className="text-center" style={{ marginTop: 24, fontSize: "0.85rem", color: "var(--muted)" }}>
          Ainda não tem conta?{" "}
          <Link to="/registro" style={{ fontWeight: 500, color: "var(--brand)" }}>
            Comece grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
