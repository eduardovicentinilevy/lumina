import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { formatCents, formatDate } from "../../utils/money";
import { StatCard } from "../../components/dashboard/StatCard";
import { Badge } from "../../components/dashboard/Badge";

const STATUS_TONE = { PENDENTE: "slate", PAGA: "emerald", ATRASADA: "amber", FALHOU: "red" };
const STATUS_LABEL = { PENDENTE: "Pendente", PAGA: "Paga", ATRASADA: "Atrasada", FALHOU: "Falhou" };
const METHOD_LABEL = {
  PIX_AUTOMATICO: "Pix Automático",
  PIX_MANUAL: "Pix manual",
  BOLETO: "Boleto",
  CARTAO: "Cartão",
};

const emptyForm = { customerName: "", customerDocument: "", grossAmount: "", dueInDays: 7, recurring: false };

export default function Cobranca() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const data = await api.get("/invoices");
    setInvoices(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.customerName || Number(form.grossAmount) <= 0) return;
    setBusy(true);
    try {
      await api.post("/invoices", form);
      setForm(emptyForm);
      setFormOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkPaid(id) {
    setBusy(true);
    try {
      await api.patch(`/invoices/${id}`, { action: "markAsPaid" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function handleRetry(id) {
    setBusy(true);
    try {
      await api.patch(`/invoices/${id}`, { action: "retry" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>A carregar…</p>;

  const settled = invoices.filter((i) => ["PAGA", "ATRASADA", "FALHOU"].includes(i.status));
  const paid = invoices.filter((i) => i.status === "PAGA");
  const failed = invoices.filter((i) => i.status === "FALHOU");
  const recurring = invoices.filter((i) => i.recurring);

  const successRate = settled.length > 0 ? (paid.length / settled.length) * 100 : 0;
  const involuntaryChurnRate = settled.length > 0 ? (failed.length / settled.length) * 100 : 0;
  const recurringNet = recurring.filter((i) => i.status === "PAGA").reduce((a, i) => a + i.netAmountCents, 0);

  const sorted = invoices.slice().sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="page-header">
          <h1>Cobrança B2B & Pix Automático</h1>
          <p>Mandatos de débito recorrente com liquidação D+0, reduzindo custos de MDR e churn involuntário.</p>
        </div>
        <div className="popover-wrap">
          <button onClick={() => setFormOpen((v) => !v)} className="btn btn-primary">
            + Nova cobrança
          </button>
          {formOpen && (
            <div className="popover">
              <form onSubmit={handleCreate} className="flex-col gap-2">
                <div className="field">
                  <label>Cliente</label>
                  <input required value={form.customerName} onChange={(e) => update("customerName", e.target.value)} placeholder="Razão social do cliente" />
                </div>
                <div className="field">
                  <label>CNPJ (opcional)</label>
                  <input value={form.customerDocument} onChange={(e) => update("customerDocument", e.target.value)} placeholder="00.000.000/0001-00" />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Valor bruto (R$)</label>
                    <input required type="number" min={1} step="0.01" value={form.grossAmount} onChange={(e) => update("grossAmount", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Vence em (dias)</label>
                    <input type="number" min={1} value={form.dueInDays} onChange={(e) => update("dueInDays", Number(e.target.value))} />
                  </div>
                </div>
                <label className="field-checkbox">
                  <input type="checkbox" checked={form.recurring} onChange={(e) => update("recurring", e.target.checked)} />
                  Assinatura recorrente (mandato Pix Automático)
                </label>
                <button type="submit" disabled={busy} className="btn btn-primary btn-block">
                  Criar cobrança
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="grid-cards">
        <StatCard label="Taxa de sucesso de cobrança" value={`${successRate.toFixed(0)}%`} tone={successRate >= 80 ? "positive" : "warning"} />
        <StatCard
          label="Churn involuntário"
          value={`${involuntaryChurnRate.toFixed(0)}%`}
          tone={involuntaryChurnRate > 15 ? "negative" : "default"}
          hint="Falhas de cobrança sobre o total liquidado"
        />
        <StatCard label="Receita recorrente líquida" value={formatCents(recurringNet)} hint={`${recurring.length} assinaturas Pix Automático`} />
        <StatCard label="Cobranças com falha" value={`${failed.length}`} tone={failed.length > 0 ? "negative" : "default"} />
      </div>

      {failed.length > 0 && (
        <div className="notice-row notice-red">
          <p>
            {failed.length} cobrança(s) falharam por inadimplência técnica (cartão expirado, mandato cancelado ou limite recusado).
            Reenvie abaixo para reduzir o churn involuntário.
          </p>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <h2>Todas as cobranças</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Método</th>
                <th>Vencimento</th>
                <th className="num">Líquido</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 20).map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <p style={{ fontWeight: 500 }}>{inv.customerName}</p>
                    {inv.recurring && <p style={{ fontSize: "0.72rem", color: "var(--muted-light)" }}>Assinatura recorrente</p>}
                  </td>
                  <td style={{ color: "var(--muted)" }}>{METHOD_LABEL[inv.paymentMethod]}</td>
                  <td style={{ color: "var(--muted)" }}>{formatDate(inv.dueDate)}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{formatCents(inv.netAmountCents)}</td>
                  <td>
                    <Badge tone={STATUS_TONE[inv.status]}>{STATUS_LABEL[inv.status]}</Badge>
                    {inv.failureReason && <p style={{ marginTop: 4, fontSize: "0.72rem", color: "var(--red)" }}>{inv.failureReason}</p>}
                  </td>
                  <td>
                    {inv.status === "FALHOU" && (
                      <button onClick={() => handleRetry(inv.id)} disabled={busy} className="btn btn-outline btn-sm">
                        Reenviar
                      </button>
                    )}
                    {(inv.status === "PENDENTE" || inv.status === "ATRASADA") && (
                      <button onClick={() => handleMarkPaid(inv.id)} disabled={busy} className="btn btn-outline btn-sm">
                        Marcar paga
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
