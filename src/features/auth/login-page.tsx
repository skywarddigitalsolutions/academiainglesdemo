"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LogoCrest } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEMO_PASSWORD } from "@/application/demo-constants";
import { ROLE_HOME } from "@/domain/user";
import { ResetDemoButton } from "@/features/demo/reset-demo-button";
import { errorMessage } from "@/lib/error-message";
import { INSTITUTION_CONTACT } from "@/lib/institution";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";
import { hasLoginErrors, validateLogin, type LoginErrors } from "./login-form";

const DEMO_USERS = [
  { username: "admin", role: "Dirección" },
  { username: "profesor", role: "Docente" },
  { username: "padre", role: "Familia" },
];

/** Tinted inputs that turn white with the celeste focus ring. */
const INPUT = "h-11 bg-primary-tint focus-visible:bg-card";

export function LoginPage() {
  const router = useRouter();
  const { state, login } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "authenticated") {
      router.replace(ROLE_HOME[state.session.role]);
    }
  }, [state, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const errors = validateLogin(username, password);
    setFieldErrors(errors);
    setError(null);
    if (hasLoginErrors(errors)) {
      (errors.username ? usernameRef : passwordRef).current?.focus();
      return;
    }
    setSubmitting(true);
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
    setFieldErrors({});
    setError(null);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 navy-backdrop px-4 py-5 sm:gap-7 sm:px-6 sm:py-8 [@media(max-height:680px)]:gap-3 [@media(max-height:680px)]:py-3">
      {/* Identity on the navy background; it also links back to the site. */}
      <Link
        href="/"
        title="Ir al sitio del instituto"
        className="flex flex-col items-center rounded-xl px-3 py-1 text-center focus-visible:ring-2 focus-visible:ring-navy-muted/70 focus-visible:outline-none"
      >
        <LogoCrest decorative className="h-14 sm:h-20 [@media(max-height:680px)]:h-11" />
        <span className="mt-2 font-serif text-lg leading-tight font-semibold text-white sm:mt-3 sm:text-2xl">
          Instituto Inmaculada Concepción
        </span>
        <span className="mt-0.5 text-xs tracking-[0.04em] text-navy-muted sm:text-[13px]">
          Instituto de Inglés
        </span>
        <span aria-hidden className="mt-2.5 h-px w-12 bg-gold sm:mt-3.5 sm:w-16" />
      </Link>

      <div className="w-full max-w-[25rem] rounded-2xl bg-card px-5 py-6 shadow-[0_1px_2px_rgb(0_0_0/0.12)] sm:px-9 sm:py-8 [@media(max-height:680px)]:py-4">
        <h1 className="font-serif text-[1.85rem] leading-tight font-semibold tracking-[-0.02em] text-navy">
          Ingresar
        </h1>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          <Field
            id="username"
            label="Usuario"
            error={fieldErrors.username}
            input={
              <Input
                ref={usernameRef}
                id="username"
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, username: undefined }));
                }}
                aria-invalid={fieldErrors.username ? true : undefined}
                aria-describedby={fieldErrors.username ? "username-error" : undefined}
                className={INPUT}
                required
              />
            }
          />
          <Field
            id="password"
            label="Contraseña"
            error={fieldErrors.password}
            input={
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className={INPUT}
                required
              />
            }
          />
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
            className="mt-1 h-11 w-full text-[0.95rem]"
            aria-disabled={submitting || undefined}
          >
            {submitting ? <Loader2 className="animate-spin" aria-hidden /> : null}
            {submitting ? "Ingresando…" : "Ingresar"}
            {!submitting && <ArrowRight aria-hidden />}
          </Button>
        </form>

        <div className="mt-1 flex justify-center">
          <DemoUsers selected={username} onSelect={fill} />
        </div>

        <p className="mt-4 border-t border-slate-200/80 pt-4 text-center text-[13px] leading-relaxed text-slate-600">
          ¿No tiene usuario? Solicítelo en Secretaría:{" "}
          <a
            href={`mailto:${INSTITUTION_CONTACT.email}`}
            className="font-medium text-primary-strong underline-offset-4 hover:underline"
          >
            {INSTITUTION_CONTACT.email}
          </a>
        </p>
      </div>
    </main>
  );
}

/** Demo helpers in a popover, so they take no space in the login itself. */
function DemoUsers({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (username: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // Keep the popover open while the "Reiniciar demo" confirmation is in use.
  function keepForDialog(event: Event) {
    if ((event.target as HTMLElement | null)?.closest?.("[role=alertdialog]")) {
      event.preventDefault();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-11 text-[13px] text-slate-600 sm:h-9">
          Usuarios de demostración
          <ChevronDown aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        collisionPadding={16}
        className="w-[min(19rem,calc(100vw-2rem))] p-2"
        onInteractOutside={keepForDialog}
        onFocusOutside={keepForDialog}
      >
        <p className="px-2 pt-1 text-[13px] font-semibold text-foreground">
          Usuarios de demostración
        </p>
        <p className="px-2 text-xs text-slate-600">Toque un perfil para completar los datos.</p>
        <ul className="mt-2 flex flex-col">
          {DEMO_USERS.map(({ username: user, role }) => (
            <li key={user}>
              <button
                type="button"
                onClick={() => {
                  onSelect(user);
                  setOpen(false);
                }}
                aria-pressed={selected === user}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-sm transition-colors duration-150 hover:bg-primary-tint focus-visible:bg-primary-tint focus-visible:outline-none",
                  selected === user && "bg-primary-soft hover:bg-primary-soft",
                )}
              >
                <span className="font-medium text-foreground">{role}</span>
                <span className="text-xs text-slate-600">{user}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-slate-100 px-2 pt-1">
          <p className="text-xs text-slate-600">
            Contraseña: <span className="font-medium text-slate-700">{DEMO_PASSWORD}</span>
          </p>
          <ResetDemoButton className="-mr-2 h-11 text-xs text-slate-600 sm:h-9" />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Field({
  id,
  label,
  error,
  input,
}: {
  id: string;
  label: string;
  error?: string;
  input: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {input}
      {error && (
        <p id={`${id}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
