"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const INSTITUTION_POOL = [
  "Banco do Brasil",
  "Santander PJ",
  "C6 Bank Empresas",
  "Sicoob",
  "Banco Safra",
  "Stone Conta PJ",
];

export async function connectAccount() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");

  const existing = await prisma.bankAccount.findMany({
    where: { companyId: session.companyId },
    select: { institution: true },
  });
  const usedNames = new Set(existing.map((a) => a.institution));
  const available = INSTITUTION_POOL.filter((name) => !usedNames.has(name));
  const institution = available[Math.floor(Math.random() * available.length)] ?? "Nova Instituição Financeira";

  const account = await prisma.bankAccount.create({
    data: {
      companyId: session.companyId,
      institution,
      accountType: "Conta Corrente PJ",
      balanceCents: 50_000 + Math.round(Math.random() * 900_000),
      consentStatus: "ATIVO",
      consentExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  const categories = [
    { label: "Recebimento Pix de clientes", isCredit: true },
    { label: "Fornecedores", isCredit: false },
    { label: "Tarifas bancárias", isCredit: false },
  ];
  for (let i = 0; i < 6; i++) {
    const cat = categories[i % categories.length];
    await prisma.transaction.create({
      data: {
        bankAccountId: account.id,
        description: cat.label,
        amountCents: 20_000 + Math.round(Math.random() * 200_000),
        isCredit: cat.isCredit,
        category: cat.label,
        occurredAt: new Date(Date.now() - i * 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  revalidatePath("/dashboard/contas");
  revalidatePath("/dashboard");
}

export async function renewConsent(accountId: string) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");

  await prisma.bankAccount.updateMany({
    where: { id: accountId, companyId: session.companyId },
    data: {
      consentStatus: "ATIVO",
      consentExpires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      lastSyncedAt: new Date(),
    },
  });

  revalidatePath("/dashboard/contas");
  revalidatePath("/dashboard");
}
