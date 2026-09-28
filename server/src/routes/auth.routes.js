const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { generateId } = require("../utils/id");
const {
  signSession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
} = require("../middleware/auth");
const { PLAN_DETAILS } = require("../services/plans");

const router = express.Router();

const TAX_REGIMES = ["SIMPLES_NACIONAL", "LUCRO_PRESUMIDO", "LUCRO_REAL"];

// POST /api/auth/register — cria empresa + primeiro utilizador (CREATE)
router.post("/register", (req, res) => {
  const { companyName, cnpj, taxRegime, sector, name, email, password } = req.body ?? {};

  if (!companyName || !cnpj || !name || !email || !password) {
    return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "A senha deve ter ao menos 8 caracteres." });
  }
  if (!TAX_REGIMES.includes(taxRegime)) {
    return res.status(400).json({ error: "Regime tributário inválido." });
  }

  const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existingUser) {
    return res.status(409).json({ error: "Já existe uma conta com este e-mail." });
  }
  const existingCompany = db.prepare("SELECT id FROM companies WHERE cnpj = ?").get(cnpj);
  if (existingCompany) {
    return res.status(409).json({ error: "Já existe uma empresa cadastrada com este CNPJ." });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const companyId = generateId("cmp");
  const userId = generateId("usr");
  const subscriptionId = generateId("sub");
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

  // Transação: criar empresa, utilizador e assinatura de forma atómica.
  const createAccount = db.transaction(() => {
    db.prepare(
      `INSERT INTO companies (id, name, cnpj, tax_regime, sector, plan)
       VALUES (?, ?, ?, ?, ?, 'STARTER')`
    ).run(companyId, companyName, cnpj, taxRegime, sector || "Serviços");

    db.prepare(
      `INSERT INTO users (id, company_id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?, 'ADMIN')`
    ).run(userId, companyId, name, email, passwordHash);

    db.prepare(
      `INSERT INTO subscriptions (id, company_id, plan, price_per_month_cents, current_period_end, active)
       VALUES (?, ?, 'STARTER', ?, ?, 1)`
    ).run(subscriptionId, companyId, PLAN_DETAILS.STARTER.priceCents, trialEnd);
  });
  createAccount();

  const token = signSession({ userId, companyId, email, name });
  setSessionCookie(res, token);
  res.status(201).json({ ok: true });
});

// POST /api/auth/login — autentica e devolve cookie de sessão
router.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const token = signSession({
    userId: user.id,
    companyId: user.company_id,
    email: user.email,
    name: user.name,
  });
  setSessionCookie(res, token);
  res.json({ ok: true });
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me — dados da sessão atual (empresa + utilizador)
router.get("/me", requireAuth, (req, res) => {
  const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(req.user.companyId);
  if (!company) return res.status(404).json({ error: "Empresa não encontrada." });

  res.json({
    user: { name: req.user.name, email: req.user.email },
    company: {
      id: company.id,
      name: company.name,
      cnpj: company.cnpj,
      taxRegime: company.tax_regime,
      sector: company.sector,
      plan: company.plan,
    },
  });
});

module.exports = router;
