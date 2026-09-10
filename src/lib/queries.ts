import "server-only";
import { prisma } from "./prisma";

export async function getBankAccounts(companyId: string) {
  return prisma.bankAccount.findMany({
    where: { companyId },
    orderBy: { balanceCents: "desc" },
    include: { transactions: { orderBy: { occurredAt: "desc" }, take: 8 } },
  });
}

export async function getInvoices(companyId: string) {
  return prisma.invoice.findMany({
    where: { companyId },
    orderBy: { dueDate: "asc" },
  });
}

export async function getCreditOffers(companyId: string) {
  return prisma.creditOffer.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTotalBalanceCents(companyId: string) {
  const accounts = await prisma.bankAccount.findMany({
    where: { companyId, consentStatus: "ATIVO" },
    select: { balanceCents: true },
  });
  return accounts.reduce((acc, a) => acc + a.balanceCents, 0);
}
