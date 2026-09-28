const express = require("express");
const db = require("../db");
const { generateId } = require("../utils/id");
const { requireAuth } = require("../middleware/auth");
const { computeCreditScore } = require("../services/credit.service");

const router = express.Router();
router.use(requireAuth);

function mapOffer(row) {
  return {
    id: row.id,
    amountCents: row.amount_cents,
    scoreValue: row.score_value,
    factors: JSON.parse(row.score_factors),
    status: row.status,
    baasPartner: row.baas_partner,
    decisionReason: row.decision_reason,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function loadInvoicesForScoring(companyId) {
  return db
    .prepare(
      `SELECT net_amount_cents AS netAmountCents, status, recurring, due_date AS dueDate,
              paid_at AS paidAt, issued_at AS issuedAt
       FROM invoices WHERE company_id = ?`
    )
    .all(companyId);
}

// GET /api/credit/score — score explicável calculado em tempo real (READ)
router.get("/score", (req, res) => {
  const invoices = loadInvoicesForScoring(req.user.companyId);
  res.json(computeCreditScore(invoices));
});

// GET /api/credit/offers — histórico de ofertas de antecipação
router.get("/offers", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM credit_offers WHERE company_id = ? ORDER BY created_at DESC")
    .all(req.user.companyId);
  res.json(rows.map(mapOffer));
});

// POST /api/credit/offers — solicita nova análise: expira ofertas antigas
// em aberto e cria a nova, tudo dentro de uma única transação SQL.
router.post("/offers", (req, res) => {
  const invoices = loadInvoicesForScoring(req.user.companyId);
  const result = computeCreditScore(invoices);

  if (result.approvedAmountCents <= 0) {
    return res.json({ ok: true, created: false, ...result });
  }

  const id = generateId("cro");
  const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const createOffer = db.transaction(() => {
    db.prepare(
      `UPDATE credit_offers SET status = 'EXPIRADO'
       WHERE company_id = ? AND status = 'OFERTADO'`
    ).run(req.user.companyId);

    db.prepare(
      `INSERT INTO credit_offers
         (id, company_id, amount_cents, score_value, score_factors, status, baas_partner, decision_reason, expires_at)
       VALUES (?, ?, ?, ?, ?, 'OFERTADO', 'Celcoin Instituição de Pagamento S.A.', ?, ?)`
    ).run(
      id,
      req.user.companyId,
      result.approvedAmountCents,
      result.score,
      JSON.stringify(result.factors),
      result.decisionReason,
      expiresAt
    );
  });
  createOffer();

  res.status(201).json({ ok: true, created: true, id });
});

// PATCH /api/credit/offers/:id — aceitar ou recusar uma oferta (UPDATE)
router.patch("/offers/:id", (req, res) => {
  const { accept } = req.body ?? {};
  const status = accept ? "ACEITO" : "RECUSADO";

  const result = db
    .prepare(
      `UPDATE credit_offers SET status = ?
       WHERE id = ? AND company_id = ? AND status = 'OFERTADO'`
    )
    .run(status, req.params.id, req.user.companyId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Oferta não encontrada ou já respondida." });
  }
  res.json({ ok: true });
});

module.exports = router;
