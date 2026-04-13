"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useOrgStore } from "@/lib/org-store";
import { inputClass } from "@/lib/input-classes";

export default function EstadosProyectoPage() {
  const { estadosProyecto, updateEstadoProyecto, reorderEstados } = useOrgStore();

  const sorted = useMemo(
    () => [...estadosProyecto].sort((a, b) => a.orden - b.orden),
    [estadosProyecto],
  );

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= sorted.length) return;
    const ids = sorted.map((e) => e.id);
    const t = ids[index];
    ids[index] = ids[j];
    ids[j] = t;
    await reorderEstados(ids);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/dashboard/configuracion"
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
        >
          ← Configuración
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Estados de proyecto
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Maestro global de la organización. Los cambios aplican a cómo se listan y asignan estados en todos los proyectos.
        </p>
      </div>

      <ul className="space-y-4">
        {sorted.map((e, index) => (
          <li
            key={e.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Etiqueta visible
                  </label>
                  <input
                    className={`${inputClass} mt-1`}
                    value={e.etiqueta}
                    onChange={(ev) => void updateEstadoProyecto(e.id, { etiqueta: ev.target.value })}
                    aria-label={`Etiqueta para ${e.slug}`}
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Slug interno: <span className="font-mono text-zinc-700 dark:text-zinc-300">{e.slug}</span> · orden{" "}
                  {e.orden}
                </p>
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={e.activo}
                    onChange={(ev) => void updateEstadoProyecto(e.id, { activo: ev.target.checked })}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600"
                  />
                  Activo (asignable en proyectos)
                </label>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  onClick={() => void move(index, -1)}
                  disabled={index === 0}
                >
                  Subir
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  onClick={() => void move(index, 1)}
                  disabled={index === sorted.length - 1}
                >
                  Bajar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300">
        Los cambios se guardan en Supabase (tabla <span className="font-mono">estados_proyecto</span>) y aplican a
        todos los proyectos de tu organización.
      </p>
    </div>
  );
}
