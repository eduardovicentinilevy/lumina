const express = require("express");
const db = require("../db");
const { generateId } = require("../utils/id");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const INSTITUTION_POOL = [
  "Banco Inter",
  "Itaú Unibanco",
  "Nubank PJ",
  "Banco do Brasil",
  "Santander PJ",
  "C6 Bank Empresas",
  "Sicoob",
  "Banco Safra",
  "Stone Conta PJ",
];

function mapAccount(row) {
  return {
    id: row.id,
    institution: row.institution,
    accountType: row.account_type,
    balanceCents: row.balance_cents,
    consentStatus: row.consent_status,
    consentExpires: row.consent_expires,
    lastSyncedAt: row.last_synced_at,
    transactionCount: row.transaction_count ?? 0,
  };
}

function mapTransaction(row) {
  return {
    id: row.id,
    description: row.description,
    amountCents: row.amount_cents,
    isCredit: !!row.is_credit,
    category: row.category,
    occurredAt: row.occurred_at,
  };
}

// GET /api/accounts — lista contas agregadas (JOIN + GROUP BY) e as
// últimas movimentações de cada uma (segunda query em lote, evitando N+1).
router.get("/", (req, res) => {
  const accounts = db
    .prepare(
      `SELECT ba.*, COUNT(t.id) AS transaction_count
       FROM bank_accounts ba
       LEFT JOIN account_transactions t ON t.bank_account_id = ba.id
       WHERE ba.company_id = ?
       GROUP BY ba.id
       ORDER BY ba.balance_cents DESC`
    )
    .all(req.user.companyId);

  if (accounts.length === 0) return res.json([]);

  const placeholders = accounts.map(() => "?").join(",");
  const allTx = db
    .prepare(
      `SELECT * FROM account_transactions
       WHERE bank_account_id IN (${placeholders})
       ORDER BY occurred_at DESC`
    )
    .all(...accounts.map((a) => a.id));

  const txByAccount = new Map();
  for (const tx of allTx) {
    const list = txByAccount.get(tx.bank_account_id) ?? [];
    if (list.length < 5) list.push(mapTransaction(tx));
    txByAccount.set(tx.bank_account_id, list);
  }

  res.json(
    accounts.map((a) => ({ ...mapAccount(a), transactions: txByAccount.get(a.id) ?? [] }))
  );
});

// POST /api/accounts — conecta uma nova conta simulada (Open Finance) e
// já semeia algumas transações, tudo numa única transação SQL atómica.
router.post("/", (req, res) => {
  const used = db
    .prepare("SELECT institution FROM bank_accounts WHERE company_id = ?")
    .all(req.user.companyId)
    .map((r) => r.institution);
  const available = INSTITUTION_POOL.filter((name) => !used.includes(name));
  const institution = available[Math.floor(Math.random() * available.length)] ?? "Nova Instituição Financeira";

  const accountId = generateId("acc");
  const now = new Date();
  const consentExpires = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const categories = [
    { label: "Recebimento Pix de clientes", isCredit: 1 },
    { label: "Fornecedores", isCredit: 0 },
    { label: "Tarifas bancárias", isCredit: 0 },
  ];

  const connectAccount = db.transaction(() => {
    db.prepare(
      `INSERT INTO bank_accounts (id, company_id, institution, account_type, balance_cents, consent_status, consent_expires, last_synced_at)
       VALUES (?, ?, ?, 'Conta Corrente PJ', ?, 'ATIVO', ?, ?)`
    ).run(
      accountId,
      req.user.companyId,
      institution,
      50_000 + Math.round(Math.random() * 900_000),
      consentExpires,
      now.toISOString()
    );

    const insertTx = db.prepare(
      `INSERT INTO account_transactions (id, bank_account_id, description, amount_cents, is_credit, category, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (let i = 0; i < 6; i++) {
      const cat = categories[i % categories.length];
      insertTx.run(
        generateId("tx"),
        accountId,
        cat.label,
        20_000 + Math.round(Math.random() * 200_000),
        cat.isCredit,
        cat.label,
        new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000).toISOString()
      );
    }
  });
  connectAccount();

  res.status(201).json({ ok: true, accountId });
});

// PATCH /api/accounts/:id/renew — renova o consentimento Open Finance
router.patch("/:id/renew", (req, res) => {
  const consentExpires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const result = db
    .prepare(
      `UPDATE bank_accounts
       SET consent_status = 'ATIVO', consent_expires = ?, last_synced_at = ?
       WHERE id = ? AND company_id = ?`
    )
    .run(consentExpires, new Date().toISOString(), req.params.id, req.user.companyId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Conta não encontrada." });
  }
  res.json({ ok: true });
});

// DELETE /api/accounts/:id — desconecta a conta (DELETE). A exclusão
// é propagada às transações associadas via ON DELETE CASCADE no schema.
router.delete("/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM bank_accounts WHERE id = ? AND company_id = ?")
    .run(req.params.id, req.user.companyId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Conta não encontrada." });
  }
  res.json({ ok: true });
});

module.exports = router;
