"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Crest } from "@/components/brand/crest";
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
  { username: "profesor", role: "Profesor" },
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
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Volver al inicio
        </Link>

        <div className="rounded-lg border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <Crest className="mb-6 h-8 text-foreground" />
            <h1 className="text-xl font-semibold">Ingresar</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Boletín en línea · Instituto Inmaculada Concepción
            </p>
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
                className="h-10"
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
                className="h-10"
                required
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="mt-2 h-10"
              disabled={submitting || !username || !password}
            >
              {submitting && <Loader2 className="animate-spin" aria-hidden />}
              Ingresar
            </Button>
          </form>

          <div className="mt-8 border-t pt-6">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              Usuarios de demostración
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_USERS.map(({ username: user, role }) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => fill(user)}
                  aria-pressed={username === user}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border bg-card px-3 text-xs transition-colors hover:bg-slate-50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                    username === user && "border-primary bg-blue-50 text-primary hover:bg-blue-50",
                  )}
                >
                  <span className="font-medium">{role}</span>
                  <span className="font-mono text-muted-foreground">{user}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Toque un usuario para completar los datos. Contraseña:{" "}
              <span className="font-mono">{DEMO_PASSWORD}</span>
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <ResetDemoButton className="text-muted-foreground" />
        </div>
      </main>
    </div>
  );
}
