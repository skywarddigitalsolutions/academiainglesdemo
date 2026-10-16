"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LogoCrest, LogoLockup } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_PASSWORD } from "@/application/demo-constants";
import { ROLE_HOME } from "@/domain/user";
import { ResetDemoButton } from "@/features/demo/reset-demo-button";
import { errorMessage } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";

const DEMO_USERS = [
  { username: "admin", role: "Dirección" },
  { username: "profesor", role: "Docente" },
  { username: "padre", role: "Familia" },
];

export function LoginPage() {
  const router = useRouter();
  const { state, login } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (state.status === "authenticated") {
      router.replace(ROLE_HOME[state.session.role]);
    }
  }, [state, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const session = await login(username, password);
      toast.success(`Bienvenido/a, ${session.displayName}`);
      router.push(ROLE_HOME[session.role]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function fill(user: string) {
    setUsername(user);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel (desktop) */}
      <aside className="relative isolate hidden w-[46%] max-w-[720px] flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_30%_10%,rgb(30_64_175/0.35),transparent_70%)]"
        />
        <div
          aria-hidden
          className="bg-grid-dark absolute inset-0 -z-10 [mask-image:radial-gradient(80%_70%_at_30%_30%,black,transparent)]"
        />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 self-start text-sm text-slate-400 transition-colors duration-150 hover:text-white"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Volver al sitio
        </Link>
        <div>
          <LogoLockup priority className="h-24" />
          <p className="mt-10 max-w-md text-2xl leading-snug font-medium tracking-[-0.02em] text-white">
            El boletín de calificaciones del instituto, en línea.
          </p>
        </div>
        <div>
          <div aria-hidden className="mb-5 h-px w-24 bg-gradient-to-r from-gold/60 to-transparent" />
          <p className="text-xs text-slate-500">Instituto de Inglés · Buenos Aires</p>
        </div>
      </aside>

      {/* Form */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between bg-ink px-4 text-white sm:px-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoCrest className="h-8" />
            <span className="text-sm font-semibold tracking-[-0.01em]">Inmaculada Concepción</span>
          </Link>
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            Volver
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">Ingresar</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Use el usuario y la contraseña que le entregó el instituto.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                  required
                />
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                className="mt-1 w-full"
                disabled={submitting || !username || !password}
              >
                {submitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
                Ingresar
                {!submitting && <ArrowRight aria-hidden />}
              </Button>
            </form>

            <div className="mt-10">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <p className="text-xs font-medium text-muted-foreground">Usuarios de demostración</p>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {DEMO_USERS.map(({ username: user, role }) => (
                  <button
                    key={user}
                    type="button"
                    onClick={() => fill(user)}
                    aria-pressed={username === user}
                    className={cn(
                      "flex flex-col items-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition-[border-color,background-color,box-shadow] duration-150 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none",
                      username === user && "border-primary/50 bg-primary-soft hover:border-primary/50 hover:bg-primary-soft",
                    )}
                  >
                    <span className="text-[13px] font-medium text-foreground">{role}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{user}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Toque un perfil para completar los datos. Contraseña:{" "}
                <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <ResetDemoButton className="h-8 text-xs text-muted-foreground" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
