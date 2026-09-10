import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from "./auth";
import { prisma } from "./prisma";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentCompany() {
  const session = await getSession();
  if (!session) return null;

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    include: { subscription: true },
  });

  if (!company) return null;
  return { company, user: session };
}
