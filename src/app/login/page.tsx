import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-brand-dark">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
            Lumina
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-foreground">Entrar na plataforma</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Acesse a tesouraria inteligente da sua empresa.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm redirectTo={redirectTo} />
        </div>
        <p className="mt-6 text-center text-sm text-foreground/60">
          Ainda não tem conta?{" "}
          <Link href="/registro" className="font-medium text-brand hover:text-brand-dark">
            Comece grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
