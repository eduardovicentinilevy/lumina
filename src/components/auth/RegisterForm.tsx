"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TAX_REGIMES = [
  { value: "SIMPLES_NACIONAL", label: "Simples Nacional" },
  { value: "LUCRO_PRESUMIDO", label: "Lucro Presumido" },
  { value: "LUCRO_REAL", label: "Lucro Real" },
];

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    cnpj: "",
    taxRegime: "SIMPLES_NACIONAL",
    sector: "",
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Não foi possível criar a conta. Tente novamente.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
  const labelClass = "block text-sm font-medium text-foreground/80 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Razão social</label>
          <input
            required
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            className={inputClass}
            placeholder="Sua Empresa Ltda"
          />
        </div>
        <div>
          <label className={labelClass}>CNPJ</label>
          <input
            required
            value={form.cnpj}
            onChange={(e) => update("cnpj", e.target.value)}
            className={inputClass}
            placeholder="00.000.000/0001-00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Regime tributário</label>
          <select
            value={form.taxRegime}
            onChange={(e) => update("taxRegime", e.target.value)}
            className={inputClass}
          >
            {TAX_REGIMES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Setor de atuação</label>
          <input
            required
            value={form.sector}
            onChange={(e) => update("sector", e.target.value)}
            className={inputClass}
            placeholder="Ex: Varejo, Alimentação, Serviços"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Seu nome</label>
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>E-mail corporativo</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Senha</label>
        <input
          required
          type="password"
          minLength={8}
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          className={inputClass}
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? "Criando conta..." : "Criar conta grátis por 14 dias"}
      </button>
    </form>
  );
}
