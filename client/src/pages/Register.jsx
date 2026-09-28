import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { REGIME_LABELS, REGIME_ORDER } from "../utils/regimes";

const initialForm = {
  companyName: "",
  cnpj: "",
  taxRegime: "SIMPLES_NACIONAL",
  sector: "",
  name: "",
  email: "",
  password: "",
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: "48px 16px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div className="text-center" style={{ marginBottom: 32 }}>
          <Link to="/" className="brand-mark" style={{ justifyContent: "center" }}>
            <span className="brand-dot" />
            Lumina
          </Link>
          <h1 style={{ marginTop: 16, fontSize: "1.5rem", fontWeight: 600 }}>
            Crie a conta da sua empresa
          </h1>
          <p style={{ marginTop: 4, fontSize: "0.85rem", color: "var(--muted)" }}>
            14 dias grátis no plano Starter. Sem cartão de crédito.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="flex-col gap-3">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="field-row">
              <div className="field">
                <label>Razão social</label>
                <input required value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Sua Empresa Ltda" />
              </div>
              <div className="field">
                <label>CNPJ</label>
                <input required value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Regime tributário</label>
                <select value={form.taxRegime} onChange={(e) => update("taxRegime", e.target.value)}>
                  {REGIME_ORDER.map((r) => (
                    <option key={r} value={r}>
                      {REGIME_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Setor de atuação</label>
                <input required value={form.sector} onChange={(e) => update("sector", e.target.value)} placeholder="Ex: Varejo, Alimentação, Serviços" />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Seu nome</label>
                <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div className="field">
                <label>E-mail corporativo</label>
                <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Senha</label>
              <input required type="password" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Mínimo 8 caracteres" />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-block">
              {loading ? "Criando conta..." : "Criar conta grátis por 14 dias"}
            </button>
          </form>
        </div>

        <p className="text-center" style={{ marginTop: 24, fontSize: "0.85rem", color: "var(--muted)" }}>
          Já tem uma conta?{" "}
          <Link to="/login" style={{ fontWeight: 500, color: "var(--brand)" }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
