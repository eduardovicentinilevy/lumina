import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";
import { PLAN_DETAILS } from "@/lib/plans";

const registerSchema = z.object({
  companyName: z.string().min(2, "Informe a razão social."),
  cnpj: z.string().min(11, "CNPJ inválido."),
  taxRegime: z.enum(["SIMPLES_NACIONAL", "LUCRO_PRESUMIDO", "LUCRO_REAL"]),
  sector: z.string().min(2, "Informe o setor de atuação."),
  name: z.string().min(2, "Informe o seu nome."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { companyName, cnpj, taxRegime, sector, name, email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
  }

  const existingCompany = await prisma.company.findUnique({ where: { cnpj } });
  if (existingCompany) {
    return NextResponse.json({ error: "Já existe uma empresa cadastrada com este CNPJ." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      cnpj,
      taxRegime,
      sector,
      plan: "STARTER",
      users: {
        create: { name, email, passwordHash, role: "ADMIN" },
      },
      subscription: {
        create: {
          plan: "STARTER",
          pricePerMonthCents: PLAN_DETAILS.STARTER.priceCents ?? 0,
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          active: true,
        },
      },
    },
    include: { users: true },
  });

  const user = company.users[0];
  const token = await createSessionToken({
    userId: user.id,
    companyId: company.id,
    email: user.email,
    name: user.name,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
