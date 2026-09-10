"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { simulateSplitPayment } from "@/lib/tax";

export async function createInvoice(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");

  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerDocument = String(formData.get("customerDocument") ?? "").trim();
  const grossAmount = Number(formData.get("grossAmount") ?? 0);
  const dueInDays = Number(formData.get("dueInDays") ?? 7);
  const recurring = formData.get("recurring") === "on";

  if (!customerName || grossAmount <= 0) return;

  const company = await prisma.company.findUniqueOrThrow({ where: { id: session.companyId } });
  const split = simulateSplitPayment(Math.round(grossAmount * 100), company.taxRegime);

  await prisma.invoice.create({
    data: {
      companyId: session.companyId,
      customerName,
      customerDocument: customerDocument || "N/A",
      grossAmountCents: split.grossAmountCents,
      ibsAmountCents: split.ibsAmountCents,
      cbsAmountCents: split.cbsAmountCents,
      netAmountCents: split.netAmountCents,
      status: "PENDENTE",
      paymentMethod: "PIX_AUTOMATICO",
      recurring,
      pixMandateActive: true,
      dueDate: new Date(Date.now() + dueInDays * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/dashboard/cobranca");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/fluxo-caixa");
}

export async function markAsPaid(invoiceId: string) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");

  await prisma.invoice.updateMany({
    where: { id: invoiceId, companyId: session.companyId },
    data: { status: "PAGA", paidAt: new Date(), failureReason: null },
  });

  revalidatePath("/dashboard/cobranca");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/fluxo-caixa");
}

export async function retryCharge(invoiceId: string) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");

  await prisma.invoice.updateMany({
    where: { id: invoiceId, companyId: session.companyId },
    data: { status: "PENDENTE", failureReason: null, pixMandateActive: true },
  });

  revalidatePath("/dashboard/cobranca");
  revalidatePath("/dashboard");
}
