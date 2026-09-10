import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-brand-dark">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
            Lumina
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">
            Crie a conta da sua empresa
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            14 dias grátis no plano Starter. Sem cartão de crédito.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-sm text-foreground/60">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-brand hover:text-brand-dark">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
