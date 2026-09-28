-- Esquema SQL da Lumina (SQLite)
-- Valores monetários são guardados em centavos (INTEGER) para evitar erros
-- de ponto flutuante. Datas são guardadas como texto ISO-8601.

CREATE TABLE IF NOT EXISTS companies (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  cnpj          TEXT NOT NULL UNIQUE,
  tax_regime    TEXT NOT NULL DEFAULT 'SIMPLES_NACIONAL'
                  CHECK (tax_regime IN ('SIMPLES_NACIONAL','LUCRO_PRESUMIDO','LUCRO_REAL')),
  sector        TEXT NOT NULL DEFAULT 'Serviços',
  plan          TEXT NOT NULL DEFAULT 'STARTER'
                  CHECK (plan IN ('STARTER','PRO','ENTERPRISE')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  company_id     TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'ADMIN'
                   CHECK (role IN ('ADMIN','FINANCEIRO','VISUALIZADOR')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id               TEXT PRIMARY KEY,
  company_id       TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  institution      TEXT NOT NULL,
  account_type     TEXT NOT NULL DEFAULT 'Conta Corrente',
  balance_cents    INTEGER NOT NULL DEFAULT 0,
  consent_status   TEXT NOT NULL DEFAULT 'ATIVO'
                     CHECK (consent_status IN ('ATIVO','EXPIRADO','REVOGADO')),
  consent_expires  TEXT NOT NULL,
  last_synced_at   TEXT NOT NULL DEFAULT (datetime('now')),
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_accounts_company ON bank_accounts(company_id);

CREATE TABLE IF NOT EXISTS account_transactions (
  id              TEXT PRIMARY KEY,
  bank_account_id TEXT NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  amount_cents    INTEGER NOT NULL,
  is_credit       INTEGER NOT NULL DEFAULT 0,
  category        TEXT NOT NULL DEFAULT 'Outros',
  occurred_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tx_account ON account_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_tx_occurred ON account_transactions(occurred_at);

CREATE TABLE IF NOT EXISTS invoices (
  id                  TEXT PRIMARY KEY,
  company_id          TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_name       TEXT NOT NULL,
  customer_document   TEXT NOT NULL,
  gross_amount_cents  INTEGER NOT NULL,
  ibs_amount_cents    INTEGER NOT NULL,
  cbs_amount_cents    INTEGER NOT NULL,
  net_amount_cents    INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'PENDENTE'
                        CHECK (status IN ('PENDENTE','PAGA','ATRASADA','FALHOU')),
  payment_method      TEXT NOT NULL DEFAULT 'PIX_AUTOMATICO'
                        CHECK (payment_method IN ('PIX_AUTOMATICO','PIX_MANUAL','BOLETO','CARTAO')),
  recurring           INTEGER NOT NULL DEFAULT 0,
  pix_mandate_active  INTEGER NOT NULL DEFAULT 1,
  issued_at           TEXT NOT NULL DEFAULT (datetime('now')),
  due_date            TEXT NOT NULL,
  paid_at             TEXT,
  failure_reason      TEXT
);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

CREATE TABLE IF NOT EXISTS credit_offers (
  id               TEXT PRIMARY KEY,
  company_id       TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount_cents     INTEGER NOT NULL,
  score_value      INTEGER NOT NULL,
  score_factors    TEXT NOT NULL, -- JSON serializado
  status           TEXT NOT NULL DEFAULT 'OFERTADO'
                     CHECK (status IN ('OFERTADO','ACEITO','RECUSADO','EXPIRADO')),
  baas_partner     TEXT NOT NULL DEFAULT 'Celcoin Instituição de Pagamento S.A.',
  decision_reason  TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_offers_company ON credit_offers(company_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                     TEXT PRIMARY KEY,
  company_id             TEXT NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  plan                   TEXT NOT NULL DEFAULT 'STARTER',
  price_per_month_cents  INTEGER NOT NULL,
  current_period_end     TEXT NOT NULL,
  active                 INTEGER NOT NULL DEFAULT 1
);

-- VIEW: métricas de cobrança por empresa, usada no módulo de Crédito
-- Contextual e no painel de Cobrança B2B (demonstra agregação com JOIN).
CREATE VIEW IF NOT EXISTS v_company_invoice_metrics AS
SELECT
  c.id AS company_id,
  COUNT(i.id) AS total_invoices,
  SUM(CASE WHEN i.status = 'PAGA' THEN 1 ELSE 0 END) AS paid_count,
  SUM(CASE WHEN i.status = 'ATRASADA' THEN 1 ELSE 0 END) AS overdue_count,
  SUM(CASE WHEN i.status = 'FALHOU' THEN 1 ELSE 0 END) AS failed_count,
  SUM(CASE WHEN i.status = 'PENDENTE' THEN 1 ELSE 0 END) AS pending_count,
  COALESCE(SUM(CASE WHEN i.status = 'PAGA' THEN i.net_amount_cents ELSE 0 END), 0) AS paid_net_cents,
  COALESCE(SUM(CASE WHEN i.status = 'PENDENTE' THEN i.net_amount_cents ELSE 0 END), 0) AS pending_net_cents,
  COALESCE(SUM(CASE WHEN i.status = 'PENDENTE' THEN i.ibs_amount_cents + i.cbs_amount_cents ELSE 0 END), 0) AS pending_tax_cents
FROM companies c
LEFT JOIN invoices i ON i.company_id = c.id
GROUP BY c.id;
