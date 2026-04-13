"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateOrganizationSettingsAction } from "@/lib/actions/organization";
import { inputClass, primaryButtonClass } from "@/lib/input-classes";
import { useOrgStore } from "@/lib/org-store";

export default function ConfiguracionPage() {
  const router = useRouter();
  const { settings, estadosProyecto } = useOrgStore();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await updateOrganizationSettingsAction({
        name: String(fd.get("name") ?? ""),
        tasaIvaDefault: Number(fd.get("tasaIvaDefault")),
        estadoInicialProyectoSlug: String(fd.get("estadoInicialProyectoSlug") ?? ""),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const slugs = [...estadosProyecto].sort((a, b) => a.orden - b.orden).map((e) => e.slug);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Configuración</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ajustes generales de la organización (persistidos en Supabase).
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Organización</h2>
        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre</label>
            <input
              name="name"
              defaultValue={settings.organizationName ?? "Mi organización"}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Tasa IVA por defecto (0.13)</label>
            <input
              name="tasaIvaDefault"
              type="number"
              step="0.01"
              min="0"
              max="1"
              defaultValue={settings.tasaIvaDefault}
              className={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Estado inicial al crear proyecto (slug)</label>
            <select
              name="estadoInicialProyectoSlug"
              defaultValue={settings.estadoInicialProyectoSlug}
              className={`${inputClass} mt-1 font-mono text-sm`}
            >
              {slugs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={primaryButtonClass} disabled={busy}>
            Guardar organización
          </button>
        </form>
      </section>

      <ul className="space-y-3">
        <li>
          <Link
            href="/dashboard/configuracion/estados"
            className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-medium text-zinc-900 transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20"
          >
            Estados de proyecto
            <span className="text-zinc-400" aria-hidden>
              →
            </span>
          </Link>
          <p className="mt-1 px-1 text-xs text-zinc-500 dark:text-zinc-400">
            Catálogo global: etiquetas, orden y activo. Semilla: Cotización, Aprobado, En progreso, Finalizado.
          </p>
        </li>
      </ul>
    </div>
  );
}
