"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setProyectoColaboradoresAction, updateProyectoAction } from "@/lib/actions/proyectos";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/input-classes";
import { useOrgStore } from "@/lib/org-store";
import type { Id, Proyecto } from "@/lib/types";

export default function ProyectosPage() {
  const router = useRouter();
  const { proyectos, clientes, estadosProyecto, cotizaciones, colaboradores } = useOrgStore();
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [cols, setCols] = useState<Record<Id, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function clienteNombre(id: string) {
    return clientes.find((c) => c.id === id)?.nombre ?? "—";
  }

  function estadoEtiqueta(id: string) {
    return estadosProyecto.find((e) => e.id === id)?.etiqueta ?? "—";
  }

  function cotFolio(id: string) {
    return cotizaciones.find((c) => c.id === id)?.folio ?? "—";
  }

  function openEdit(p: Proyecto) {
    setEditing(p);
    const m: Record<string, boolean> = {};
    for (const c of colaboradores) {
      m[c.id] = p.colaboradorIds.includes(c.id);
    }
    setCols(m);
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await updateProyectoAction(editing.id, {
        nombre: String(fd.get("nombre") ?? ""),
        direccionObra: String(fd.get("direccionObra") ?? "") || undefined,
        descripcion: String(fd.get("descripcion") ?? "") || undefined,
        estadoProyectoId: String(fd.get("estadoProyectoId") ?? ""),
      });
      const selectedIds = Object.entries(cols)
        .filter(([, v]) => v)
        .map(([k]) => k);
      await setProyectoColaboradoresAction(editing.id, selectedIds);
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Proyectos</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Obras vinculadas a cotización aceptada. Estado y colaboradores en Supabase.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Obra</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Cotización</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {proyectos.map((p) => (
              <tr key={p.id} className="text-zinc-700 dark:text-zinc-200">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{p.nombre}</td>
                <td className="px-4 py-3">{clienteNombre(p.clienteId)}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs">{cotFolio(p.cotizacionId)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {estadoEtiqueta(p.estadoProyectoId)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className={secondaryButtonClass} onClick={() => openEdit(p)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Editar proyecto</h3>
            <form className="mt-4 space-y-4" onSubmit={onSave}>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre</label>
                <input name="nombre" required defaultValue={editing.nombre} className={`${inputClass} mt-1`} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Estado del proyecto</label>
                <select
                  name="estadoProyectoId"
                  defaultValue={editing.estadoProyectoId}
                  required
                  className={`${inputClass} mt-1`}
                >
                  {estadosProyecto
                    .filter((e) => e.activo)
                    .sort((a, b) => a.orden - b.orden)
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.etiqueta}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Dirección de obra</label>
                <input name="direccionObra" defaultValue={editing.direccionObra ?? ""} className={`${inputClass} mt-1`} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Descripción</label>
                <textarea name="descripcion" rows={2} defaultValue={editing.descripcion ?? ""} className={`${inputClass} mt-1`} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Colaboradores en obra
                </p>
                <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
                  {colaboradores.map((c) => (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={cols[c.id] ?? false}
                          onChange={(e) => setCols((s) => ({ ...s, [c.id]: e.target.checked }))}
                          className="rounded border-zinc-300 text-emerald-600"
                        />
                        <span>{c.nombre}</span>
                        {c.rol ? <span className="text-xs text-zinc-500">({c.rol})</span> : null}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className={primaryButtonClass} disabled={busy}>
                  Guardar
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => setEditing(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/dashboard/cotizaciones" className="font-medium text-emerald-700 dark:text-emerald-400">
          Cotizaciones
        </Link>{" "}
        ·{" "}
        <Link href="/dashboard/entregables" className="font-medium text-emerald-700 dark:text-emerald-400">
          Entregables
        </Link>
      </p>
    </div>
  );
}
