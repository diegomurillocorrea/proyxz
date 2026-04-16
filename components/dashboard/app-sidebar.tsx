"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DaiegoLogo } from "@/components/daiego-logo";
import { ThemeToggleButton } from "@/components/dashboard/theme-toggle-button";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

const nav = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/proyectos", label: "Proyectos" },
  { href: "/dashboard/clientes", label: "Clientes" },
  { href: "/dashboard/cotizaciones", label: "Cotizaciones" },
  { href: "/dashboard/catalogos", label: "Catálogos" },
  { href: "/dashboard/especialidades", label: "Especialidades" },
  { href: "/dashboard/colaboradores", label: "Colaboradores" },
  { href: "/dashboard/entregables", label: "Entregables" },
  { href: "/dashboard/configuracion", label: "Configuración" },
] as const;

const linkFocus =
  "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 dark:focus:ring-offset-zinc-900";

function displayName(user: User | null): string {
  if (!user) return "Usuario";
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const fullName = meta?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  return user.email ?? "Usuario";
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    void supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      router.push("/login");
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <DaiegoLogo href="/dashboard" variant="compact" />
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Construcción y acabados
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Principal">
        {nav.map(({ href, label }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${linkFocus} ${
                active
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="mb-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          <p className="font-medium text-zinc-800 dark:text-zinc-200">
            {displayName(user)}
          </p>
          <p className="truncate">{user?.email ?? "—"}</p>
        </div>
        <ThemeToggleButton placement="sidebar" />
        <button
          type="button"
          onClick={() => void signOut()}
          className={`mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-700 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40 ${linkFocus}`}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
