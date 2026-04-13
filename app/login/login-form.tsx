"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DaiegoLogo } from "@/components/daiego-logo";
import { DaiegoFooter } from "@/components/dashboard/daiego-footer";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { inputClass, primaryButtonClass } from "@/lib/input-classes";
import { createClient } from "@/utils/supabase/client";
import { getSupabasePublicConfig } from "@/utils/supabase/public-env";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextRaw = searchParams.get("next");
  const redirectTo =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/dashboard";

  const { isConfigured } = getSupabasePublicConfig();

  useEffect(() => {
    if (!isConfigured) return;
    try {
      const supabase = createClient();
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace(redirectTo);
          router.refresh();
        }
      });
    } catch {
      // env incompleto en tiempo de ejecución
    }
  }, [isConfigured, redirectTo, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isConfigured) {
      setError("Falta configurar Supabase en .env.local (URL y clave pública).");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signError) {
        setError(signError.message);
        setBusy(false);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-950">
      <ThemeToggleButton placement="login" />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-xl sm:p-10">
          <div className="mb-8 text-center sm:text-left">
            <div className="mb-4 flex justify-center sm:justify-start">
              <DaiegoLogo href="/login" variant="default" />
            </div>
            <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Iniciar sesión
            </h1>
          </div>

          {!isConfigured ? (
            <p
              className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
              role="alert"
            >
              Copiá <span className="font-mono">.env.example</span> a{" "}
              <span className="font-mono">.env.local</span> y definí{" "}
              <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> y la clave pública.
            </p>
          ) : null}

          <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Correo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={show}
                  onChange={(e) => setShow(e.target.checked)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600"
                />
                Mostrar contraseña
              </label>
            </div>

            {error ? (
              <p id="login-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className={primaryButtonClass} disabled={busy || !isConfigured}>
              {busy ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
      <DaiegoFooter />
    </div>
  );
}
