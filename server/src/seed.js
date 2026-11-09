require("dotenv/config");
const bcrypt = require("bcryptjs");
const fs = require("node:fs");
const path = require("node:path");
const db = require("./db");
const { generateId } = require("./utils/id");
const { simulateSplitPayment } = require("./services/tax.service");
const { computeCreditScore } = require("./services/credit.service");
const { PLAN_DETAILS } = require("./services/plans");

db.exec(fs.readFileSync(path.join(__dirname, "db", "schema.sql"), "utf8"));

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
const iso = (d) => d.toISOString();

function seed() {
  console.log("Limpando base de dados...");
  db.exec(`
    DELETE FROM credit_offers;
    DELETE FROM invoices;
    DELETE FROM account_transactions;
    DELETE FROM bank_accounts;
    DELETE FROM subscriptions;
    DELETE FROM users;
    DELETE FROM companies;
  `);

  console.log("Criando empresa de demonstração...");
  const companyId = generateId("cmp");
  const now = new Date();

  db.prepare(
    `INSERT INTO companies (id, name, cnpj, tax_regime, sector, plan)
     VALUES (?, 'Padaria Alvorada Ltda', '12.345.678/0001-95', 'SIMPLES_NACIONAL', 'Alimentação & Panificação', 'PRO')`
  ).run(companyId);

  const passwordHash = bcrypt.hashSync("lumina123", 10);
  db.prepare(
    `INSERT INTO users (id, company_id, name, email, password_hash, role)
     VALUES (?, ?, 'Marina Souza', 'demo@lumina.com.br', ?, 'ADMIN')`
  ).run(generateId("usr"), companyId, passwordHash);

  db.prepare(
    `INSERT INTO subscriptions (id, company_id, plan, price_per_month_cents, current_period_end, active)
     VALUES (?, ?, 'PRO', ?, ?, 1)`
  ).run(generateId("sub"), companyId, PLAN_DETAILS.PRO.priceCents, iso(addDays(now, 21)));

  console.log("Agregando contas bancárias (Open Finance)...");
  const accountsData = [
    { institution: "Banco Inter", balanceCents: 4_821_530, consentStatus: "ATIVO", consentExpires: addDays(now, 47) },
    { institution: "Itaú Unibanco", balanceCents: 1_204_870, consentStatus: "ATIVO", consentExpires: addDays(now, 12) },
    { institution: "Nubank PJ", balanceCents: 356_940, consentStatus: "EXPIRADO", consentExpires: addDays(now, -6) },
  ];

  const categories = [
    { label: "Fornecedores de insumos", isCredit: 0 },
    { label: "Folha de pagamento", isCredit: 0 },
    { label: "Recebimento Pix de clientes", isCredit: 1 },
    { label: "Aluguel do ponto comercial", isCredit: 0 },
    { label: "Recebimento cartão de crédito", isCredit: 1 },
    { label: "Energia elétrica", isCredit: 0 },
  ];

  for (const acc of accountsData) {
    const accountId = generateId("acc");
    db.prepare(
      `INSERT INTO bank_accounts (id, company_id, institution, account_type, balance_cents, consent_status, consent_expires, last_synced_at)
       VALUES (?, ?, ?, 'Conta Corrente PJ', ?, ?, ?, ?)`
    ).run(accountId, companyId, acc.institution, acc.balanceCents, acc.consentStatus, iso(acc.consentExpires), iso(now));

    const insertTx = db.prepare(
      `INSERT INTO account_transactions (id, bank_account_id, description, amount_cents, is_credit, category, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (let i = 0; i < 24; i++) {
      const cat = categories[i % categories.length];
      const amount = cat.isCredit
        ? 80_000 + Math.round(Math.random() * 320_000)
        : 15_000 + Math.round(Math.random() * 180_000);
      insertTx.run(
        generateId("tx"),
        accountId,
        cat.label,
        amount,
        cat.isCredit,
        cat.label,
        iso(addDays(now, -(i * 3) - Math.round(Math.random() * 2)))
      );
    }
  }

  console.log("Gerando notas e cobranças B2B (com simulação de Split Payment)...");
  const customers = [
    "Distribuidora São Jorge Alimentos",
    "Mercado Bom Preço Ltda",
    "Cafeteria Grão Nobre",
    "Rede Doce Vida Confeitarias",
    "Hotel Vila Madalena",
    "Restaurante Sabor Paulista",
  ];
  const failureReasons = [
    "Cartão de crédito cadastrado expirado",
    "Limite recusado pela adquirente",
    "Mandato de débito automático cancelado pelo pagador",
  ];
  const paymentMethods = ["PIX_MANUAL", "BOLETO", "CARTAO"];

  const insertInvoice = db.prepare(
    `INSERT INTO invoices
       (id, company_id, customer_name, customer_document, gross_amount_cents, ibs_amount_cents,
        cbs_amount_cents, net_amount_cents, status, payment_method, recurring, pix_mandate_active,
        issued_at, due_date, paid_at, failure_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let invoiceCount = 0;
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const invoicesThisMonth = 4 + Math.round(Math.random() * 3);
    for (let i = 0; i < invoicesThisMonth; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const grossAmountCents = 180_000 + Math.round(Math.random() * 920_000);
      const split = simulateSplitPayment(grossAmountCents, "SIMPLES_NACIONAL");
      const issuedAt = addDays(now, -(monthOffset * 30) - Math.round(Math.random() * 25));
      const dueDate = addDays(issuedAt, 15);
      const recurring = Math.random() > 0.45 ? 1 : 0;

      const roll = Math.random();
      let status, paidAt = null, failureReason = null;

      if (monthOffset === 0) {
        status = roll < 0.55 ? "PAGA" : "PENDENTE";
      } else if (roll < 0.78) {
        status = "PAGA";
      } else if (roll < 0.92) {
        status = "ATRASADA";
      } else {
        status = "FALHOU";
        failureReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
      }

      if (status === "PAGA") {
        const onTimeRoll = Math.random();
        paidAt = iso(
          onTimeRoll < 0.75
            ? addDays(dueDate, -Math.round(Math.random() * 3))
            : addDays(dueDate, Math.round(Math.random() * 5) + 1)
        );
      }

      insertInvoice.run(
        generateId("inv"),
        companyId,
        customer,
        `${Math.floor(10 + Math.random() * 89)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}/0001-${Math.floor(10 + Math.random() * 89)}`,
        split.grossAmountCents,
        split.ibsAmountCents,
        split.cbsAmountCents,
        split.netAmountCents,
        status,
        recurring ? "PIX_AUTOMATICO" : paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        recurring,
        status !== "FALHOU" ? 1 : 0,
        iso(issuedAt),
        iso(dueDate),
        paidAt,
        failureReason
      );
      invoiceCount++;
    }
  }

  // Cobranças futuras (próximos 20 dias) para o radar de liquidez
  for (let i = 0; i < 6; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const grossAmountCents = 220_000 + Math.round(Math.random() * 780_000);
    const split = simulateSplitPayment(grossAmountCents, "SIMPLES_NACIONAL");
    const dueDate = addDays(now, 3 + i * 3);

    insertInvoice.run(
      generateId("inv"),
      companyId,
      customer,
      "45.678.912/0001-33",
      split.grossAmountCents,
      split.ibsAmountCents,
      split.cbsAmountCents,
      split.netAmountCents,
      "PENDENTE",
      "PIX_AUTOMATICO",
      i % 2 === 0 ? 1 : 0,
      1,
      iso(now),
      iso(dueDate),
      null,
      null
    );
    invoiceCount++;
  }
  console.log(`  -> ${invoiceCount} notas/cobranças criadas`);

  console.log("Calculando score de crédito contextual...");
  const invoicesForScoring = db
    .prepare(
      `SELECT net_amount_cents AS netAmountCents, status, recurring, due_date AS dueDate,
              paid_at AS paidAt, issued_at AS issuedAt
       FROM invoices WHERE company_id = ?`
    )
    .all(companyId);
  const scoreResult = computeCreditScore(invoicesForScoring);

  if (scoreResult.approvedAmountCents > 0) {
    db.prepare(
      `INSERT INTO credit_offers
         (id, company_id, amount_cents, score_value, score_factors, status, baas_partner, decision_reason, expires_at)
       VALUES (?, ?, ?, ?, ?, 'OFERTADO', 'Celcoin Instituição de Pagamento S.A.', ?, ?)`
    ).run(
      generateId("cro"),
      companyId,
      scoreResult.approvedAmountCents,
      scoreResult.score,
      JSON.stringify(scoreResult.factors),
      scoreResult.decisionReason,
      iso(addDays(now, 15))
    );
  }

  console.log("\nSeed concluído.");
  console.log("Empresa: Padaria Alvorada Ltda (12.345.678/0001-95)");
  console.log("Login: demo@lumina.com.br / senha: lumina123");
  console.log(`Score de crédito calculado: ${scoreResult.score} (faixa ${scoreResult.tier})`);
}

seed();
