const express = require("express");
const db = require("../db");
const { generateId } = require("../utils/id");
const { requireAuth } = require("../middleware/auth");
const { simulateSplitPayment } = require("../services/tax.service");

const router = express.Router();
router.use(requireAuth);

function mapInvoice(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerDocument: row.customer_document,
    grossAmountCents: row.gross_amount_cents,
    ibsAmountCents: row.ibs_amount_cents,
    cbsAmountCents: row.cbs_amount_cents,
    netAmountCents: row.net_amount_cents,
    status: row.status,
    paymentMethod: row.payment_method,
    recurring: !!row.recurring,
    pixMandateActive: !!row.pix_mandate_active,
    issuedAt: row.issued_at,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    failureReason: row.failure_reason,
  };
}

// GET /api/invoices?status=PENDENTE — lista cobranças da empresa (READ)
router.get("/", (req, res) => {
  const { status } = req.query;
  let rows;
  if (status) {
    rows = db
      .prepare("SELECT * FROM invoices WHERE company_id = ? AND status = ? ORDER BY due_date ASC")
      .all(req.user.companyId, status);
  } else {
    rows = db
      .prepare("SELECT * FROM invoices WHERE company_id = ? ORDER BY issued_at DESC")
      .all(req.user.companyId);
  }
  res.json(rows.map(mapInvoice));
});

// GET /api/invoices/summary — KPIs agregados a partir da VIEW SQL
// v_company_invoice_metrics (usada na visão geral e no fluxo de caixa).
router.get("/summary", (req, res) => {
  const metrics = db
    .prepare("SELECT * FROM v_company_invoice_metrics WHERE company_id = ?")
    .get(req.user.companyId);

  const totalBalance = db
    .prepare(
      `SELECT COALESCE(SUM(balance_cents), 0) AS total
       FROM bank_accounts WHERE company_id = ? AND consent_status = 'ATIVO'`
    )
    .get(req.user.companyId).total;

  res.json({
    totalBalanceCents: totalBalance,
    pendingNetCents: metrics?.pending_net_cents ?? 0,
    pendingTaxCents: metrics?.pending_tax_cents ?? 0,
    paidNetCents: metrics?.paid_net_cents ?? 0,
    pendingCount: metrics?.pending_count ?? 0,
    overdueCount: metrics?.overdue_count ?? 0,
    failedCount: metrics?.failed_count ?? 0,
    paidCount: metrics?.paid_count ?? 0,
    totalInvoices: metrics?.total_invoices ?? 0,
  });
});

// GET /api/invoices/monthly — receita bruta vs. líquida por mês (paga),
// agregada em SQL com strftime, para o gráfico do módulo de fluxo de caixa.
router.get("/monthly", (req, res) => {
  const rows = db
    .prepare(
      `SELECT strftime('%Y-%m', issued_at) AS month_key,
              SUM(gross_amount_cents) AS gross_cents,
              SUM(net_amount_cents) AS net_cents
       FROM invoices
       WHERE company_id = ? AND status = 'PAGA'
       GROUP BY month_key
       ORDER BY month_key ASC`
    )
    .all(req.user.companyId);

  res.json(
    rows.map((r) => ({ key: r.month_key, grossCents: r.gross_cents, netCents: r.net_cents }))
  );
});

// POST /api/invoices — cria uma nova cobrança B2B (CREATE), calculando o
// Split Payment (IBS/CBS) a partir do regime tributário da empresa.
router.post("/", (req, res) => {
  const { customerName, customerDocument, grossAmount, dueInDays, recurring } = req.body ?? {};

  if (!customerName || !grossAmount || Number(grossAmount) <= 0) {
    return res.status(400).json({ error: "Informe o cliente e um valor bruto válido." });
  }

  const company = db
    .prepare("SELECT tax_regime FROM companies WHERE id = ?")
    .get(req.user.companyId);
  const split = simulateSplitPayment(Math.round(Number(grossAmount) * 100), company.tax_regime);

  const id = generateId("inv");
  const dueDate = new Date(Date.now() + (Number(dueInDays) || 7) * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO invoices
       (id, company_id, customer_name, customer_document, gross_amount_cents, ibs_amount_cents,
        cbs_amount_cents, net_amount_cents, status, payment_method, recurring, pix_mandate_active, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', 'PIX_AUTOMATICO', ?, 1, ?)`
  ).run(
    id,
    req.user.companyId,
    customerName,
    customerDocument || "N/A",
    split.grossAmountCents,
    split.ibsAmountCents,
    split.cbsAmountCents,
    split.netAmountCents,
    recurring ? 1 : 0,
    dueDate
  );

  res.status(201).json({ ok: true, id });
});

// PATCH /api/invoices/:id — atualiza o status de uma cobrança (UPDATE):
// marcar como paga ou reenviar uma cobrança que falhou.
router.patch("/:id", (req, res) => {
  const { action } = req.body ?? {};
  let result;

  if (action === "markAsPaid") {
    result = db
      .prepare(
        `UPDATE invoices SET status = 'PAGA', paid_at = ?, failure_reason = NULL
         WHERE id = ? AND company_id = ?`
      )
      .run(new Date().toISOString(), req.params.id, req.user.companyId);
  } else if (action === "retry") {
    result = db
      .prepare(
        `UPDATE invoices SET status = 'PENDENTE', failure_reason = NULL, pix_mandate_active = 1
         WHERE id = ? AND company_id = ?`
      )
      .run(req.params.id, req.user.companyId);
  } else {
    return res.status(400).json({ error: "Ação inválida." });
  }

  if (result.changes === 0) {
    return res.status(404).json({ error: "Cobrança não encontrada." });
  }
  res.json({ ok: true });
});

module.exports = router;
