"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { DaiegoLogo } from "@/components/daiego-logo";

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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
        <DaiegoLogo href="/dashboard" variant="compact" />
        <button
          type="button"
          className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:text-zinc-200"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? "Cerrar" : "Menú"}
        </button>
      </header>
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div
        id="mobile-drawer"
        className={`fixed inset-y-0 right-0 z-50 w-[min(100%,18rem)] transform border-l border-zinc-200 bg-white shadow-xl transition-transform dark:border-zinc-800 dark:bg-zinc-900 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex flex-col gap-1 p-4 pt-16" aria-label="Móvil">
          {nav.map(({ href, label }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  active
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
