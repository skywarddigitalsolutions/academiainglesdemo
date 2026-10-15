"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, GraduationCap, Loader2, LogIn, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_PASSWORD } from "@/application/demo-constants";
import { ROLE_HOME } from "@/domain/user";
import { ResetDemoButton } from "@/features/demo/reset-demo-button";
import { errorMessage } from "@/lib/error-message";
import { useSession } from "@/providers/session-provider";

const DEMO_USERS = [
  {
    username: "admin",
    role: "Dirección",
    description: "Aprueba bimestres y administra alumnos y familias.",
    icon: ShieldCheck,
  },
  {
    username: "profesor",
    role: "Docente",
    description: "Carga calificaciones de 2° Grado A y 5° Grado A.",
    icon: GraduationCap,
  },
  {
    username: "padre",
    role: "Familia",
    description: "Consulta el boletín de sus dos hijos.",
    icon: Users,
  },
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
    <div className="flex min-h-screen flex-col bg-navy">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(110,193,228,0.25),transparent_60%)]"
      />
      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 self-start text-sm text-white/80 hover:text-white"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Volver al inicio
        </Link>

        <div className="rounded-2xl border-t-4 border-gold bg-card p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <BrandLogo className="h-16" />
            <h1 className="mt-3 text-2xl font-semibold">Boletín en línea</h1>
            <p className="text-sm text-muted-foreground">Instituto Inmaculada Concepción</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
              />
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="h-11 bg-navy text-base font-semibold text-white hover:bg-navy-soft"
              disabled={submitting || !username || !password}
            >
              {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <LogIn aria-hidden />}
              Ingresar
            </Button>
          </form>

          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold tracking-widest text-celeste-strong uppercase">
              Usuarios de demostración
            </p>
            <ul className="flex flex-col gap-2">
              {DEMO_USERS.map(({ username: user, role, description, icon: Icon }) => (
                <li key={user}>
                  <button
                    type="button"
                    onClick={() => fill(user)}
                    className="flex w-full items-start gap-3 rounded-xl border bg-background p-3 text-left transition-colors hover:border-celeste hover:bg-celeste-light focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-celeste-light">
                      <Icon className="size-4 text-navy" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-navy">
                        {role} · <span className="font-mono">{user}</span> /{" "}
                        <span className="font-mono">{DEMO_PASSWORD}</span>
                      </span>
                      <span className="block text-xs text-muted-foreground">{description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Toque un usuario para completar los datos automáticamente.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <ResetDemoButton className="text-white/80 hover:bg-white/10 hover:text-white" />
        </div>
      </main>
    </div>
  );
}
