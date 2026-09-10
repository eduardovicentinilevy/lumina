"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { computeCreditScore } from "@/lib/credit";

export async function requestNewAnalysis() {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");

  const invoices = await prisma.invoice.findMany({ where: { companyId: session.companyId } });
  const result = computeCreditScore(
    invoices.map((i) => ({
      netAmountCents: i.netAmountCents,
      status: i.status,
      recurring: i.recurring,
      dueDate: i.dueDate,
      paidAt: i.paidAt,
      issuedAt: i.issuedAt,
    }))
  );

  if (result.approvedAmountCents > 0) {
    await prisma.creditOffer.create({
      data: {
        companyId: session.companyId,
        amountCents: result.approvedAmountCents,
        scoreValue: result.score,
        scoreFactors: JSON.stringify(result.factors),
        status: "OFERTADO",
        baasPartner: "Celcoin Instituição de Pagamento S.A.",
        decisionReason: result.decisionReason,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
    });
  }

  revalidatePath("/dashboard/credito");
  revalidatePath("/dashboard");
}

export async function respondToOffer(offerId: string, accept: boolean) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");

  await prisma.creditOffer.updateMany({
    where: { id: offerId, companyId: session.companyId, status: "OFERTADO" },
    data: { status: accept ? "ACEITO" : "RECUSADO" },
  });

  revalidatePath("/dashboard/credito");
  revalidatePath("/dashboard");
}
