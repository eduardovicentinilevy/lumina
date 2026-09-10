import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { simulateSplitPayment } from "../src/lib/tax";
import { computeCreditScore } from "../src/lib/credit";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("Limpando base de dados...");
  await prisma.creditOffer.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log("Criando empresa de demonstração...");
  const company = await prisma.company.create({
    data: {
      name: "Padaria Alvorada Ltda",
      cnpj: "12.345.678/0001-90",
      taxRegime: "SIMPLES_NACIONAL",
      sector: "Alimentação & Panificação",
      plan: "PRO",
    },
  });

  const passwordHash = await bcrypt.hash("lumina123", 10);
  await prisma.user.create({
    data: {
      name: "Marina Souza",
      email: "demo@lumina.com.br",
      passwordHash,
      role: "ADMIN",
      companyId: company.id,
    },
  });

  await prisma.subscription.create({
    data: {
      companyId: company.id,
      plan: "PRO",
      pricePerMonthCents: 189000,
      currentPeriodEnd: addDays(new Date(), 21),
      active: true,
    },
  });

  console.log("Agregando contas bancárias (Open Finance)...");
  const accountsData = [
    {
      institution: "Banco Inter",
      accountType: "Conta Corrente PJ",
      balanceCents: 4_821_530,
      consentStatus: "ATIVO" as const,
      consentExpires: addDays(new Date(), 47),
    },
    {
      institution: "Itaú Unibanco",
      accountType: "Conta Corrente PJ",
      balanceCents: 1_204_870,
      consentStatus: "ATIVO" as const,
      consentExpires: addDays(new Date(), 12),
    },
    {
      institution: "Nubank PJ",
      accountType: "Conta de Pagamento",
      balanceCents: 356_940,
      consentStatus: "EXPIRADO" as const,
      consentExpires: addDays(new Date(), -6),
    },
  ];

  const accounts = [];
  for (const data of accountsData) {
    const account = await prisma.bankAccount.create({
      data: { ...data, companyId: company.id },
    });
    accounts.push(account);

    const categories = [
      { label: "Fornecedores de insumos", isCredit: false },
      { label: "Folha de pagamento", isCredit: false },
      { label: "Recebimento Pix de clientes", isCredit: true },
      { label: "Aluguel do ponto comercial", isCredit: false },
      { label: "Recebimento cartão de crédito", isCredit: true },
      { label: "Energia elétrica", isCredit: false },
    ];

    for (let i = 0; i < 24; i++) {
      const cat = categories[i % categories.length];
      const amount = cat.isCredit
        ? 80_000 + Math.round(Math.random() * 320_000)
        : 15_000 + Math.round(Math.random() * 180_000);
      await prisma.transaction.create({
        data: {
          bankAccountId: account.id,
          description: cat.label,
          amountCents: amount,
          isCredit: cat.isCredit,
          category: cat.label,
          occurredAt: addDays(new Date(), -(i * 3) - Math.round(Math.random() * 2)),
        },
      });
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

  let invoiceCount = 0;
  // Histórico dos últimos 5 meses (para consistência de faturamento)
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const invoicesThisMonth = 4 + Math.round(Math.random() * 3);
    for (let i = 0; i < invoicesThisMonth; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const grossAmountCents = 180_000 + Math.round(Math.random() * 920_000);
      const split = simulateSplitPayment(grossAmountCents, company.taxRegime);
      const issuedAt = addDays(new Date(), -(monthOffset * 30) - Math.round(Math.random() * 25));
      const dueDate = addDays(issuedAt, 15);
      const recurring = Math.random() > 0.45;

      const roll = Math.random();
      let status: "PAGA" | "ATRASADA" | "FALHOU" | "PENDENTE";
      let paidAt: Date | null = null;
      let failureReason: string | null = null;

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
        paidAt = onTimeRoll < 0.75 ? addDays(dueDate, -Math.round(Math.random() * 3)) : addDays(dueDate, Math.round(Math.random() * 5) + 1);
      }

      await prisma.invoice.create({
        data: {
          companyId: company.id,
          customerName: customer,
          customerDocument: `${Math.floor(10 + Math.random() * 89)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}/0001-${Math.floor(10 + Math.random() * 89)}`,
          grossAmountCents: split.grossAmountCents,
          ibsAmountCents: split.ibsAmountCents,
          cbsAmountCents: split.cbsAmountCents,
          netAmountCents: split.netAmountCents,
          status,
          paymentMethod: recurring ? "PIX_AUTOMATICO" : (["PIX_MANUAL", "BOLETO", "CARTAO"] as const)[Math.floor(Math.random() * 3)],
          recurring,
          pixMandateActive: status !== "FALHOU",
          issuedAt,
          dueDate,
          paidAt,
          failureReason,
        },
      });
      invoiceCount++;
    }
  }

  // Algumas cobranças futuras (próximos 20 dias) para o radar de liquidez
  for (let i = 0; i < 6; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const grossAmountCents = 220_000 + Math.round(Math.random() * 780_000);
    const split = simulateSplitPayment(grossAmountCents, company.taxRegime);
    const issuedAt = new Date();
    const dueDate = addDays(issuedAt, 3 + i * 3);

    await prisma.invoice.create({
      data: {
        companyId: company.id,
        customerName: customer,
        customerDocument: "45.678.912/0001-33",
        grossAmountCents: split.grossAmountCents,
        ibsAmountCents: split.ibsAmountCents,
        cbsAmountCents: split.cbsAmountCents,
        netAmountCents: split.netAmountCents,
        status: "PENDENTE",
        paymentMethod: "PIX_AUTOMATICO",
        recurring: i % 2 === 0,
        pixMandateActive: true,
        issuedAt,
        dueDate,
        paidAt: null,
        failureReason: null,
      },
    });
    invoiceCount++;
  }

  console.log(`  -> ${invoiceCount} notas/cobranças criadas`);

  console.log("Calculando score de crédito contextual...");
  const allInvoices = await prisma.invoice.findMany({ where: { companyId: company.id } });
  const scoreResult = computeCreditScore(
    allInvoices.map((i) => ({
      netAmountCents: i.netAmountCents,
      status: i.status,
      recurring: i.recurring,
      dueDate: i.dueDate,
      paidAt: i.paidAt,
      issuedAt: i.issuedAt,
    }))
  );

  if (scoreResult.approvedAmountCents > 0) {
    await prisma.creditOffer.create({
      data: {
        companyId: company.id,
        amountCents: scoreResult.approvedAmountCents,
        scoreValue: scoreResult.score,
        scoreFactors: JSON.stringify(scoreResult.factors),
        status: "OFERTADO",
        baasPartner: "Celcoin Instituição de Pagamento S.A.",
        decisionReason: scoreResult.decisionReason,
        expiresAt: addDays(new Date(), 15),
      },
    });
  }

  console.log("\nSeed concluído.");
  console.log(`Empresa: ${company.name} (${company.cnpj})`);
  console.log("Login: demo@lumina.com.br / senha: lumina123");
  console.log(`Score de crédito calculado: ${scoreResult.score} (faixa ${scoreResult.tier})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
