"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createEntregableAction,
  deleteEntregableAction,
  updateEntregableAction,
} from "@/lib/actions/entregables";
import { dangerButtonClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/input-classes";
import { useOrgStore } from "@/lib/org-store";
import type { Entregable } from "@/lib/types";

const ESTADOS: Entregable["estado"][] = ["pendiente", "en_progreso", "entregado", "rechazado"];

export default function EntregablesPage() {
  const router = useRouter();
  const { entregables, proyectos } = useOrgStore();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Entregable | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Entregable | null>(null);

  function proyectoNombre(id: string) {
    return proyectos.find((p) => p.id === id)?.nombre ?? id.slice(0, 8);
  }

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await createEntregableAction({
        proyectoId: String(fd.get("proyectoId") ?? ""),
        titulo: String(fd.get("titulo") ?? ""),
        descripcion: String(fd.get("descripcion") ?? "") || undefined,
        estado: (fd.get("estado") as Entregable["estado"]) ?? "pendiente",
        fechaObjetivo: String(fd.get("fechaObjetivo") ?? "") || undefined,
      });
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await updateEntregableAction(editing.id, {
        titulo: String(fd.get("titulo") ?? ""),
        descripcion: String(fd.get("descripcion") ?? "") || undefined,
        estado: (fd.get("estado") as Entregable["estado"]) ?? "pendiente",
        fechaObjetivo: String(fd.get("fechaObjetivo") ?? "") || undefined,
        fechaEntregaReal: String(fd.get("fechaEntregaReal") ?? "") || undefined,
      });
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!deleteCandidate) return;
    try {
      await deleteEntregableAction(deleteCandidate.id);
      setDeleteCandidate(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Entregables</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Hitos por proyecto (Supabase).
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Nuevo entregable</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onCreate}>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Proyecto *</label>
            <select name="proyectoId" required className={`${inputClass} mt-1`}>
              <option value="">Elegir…</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Título *</label>
            <input name="titulo" required className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Estado</label>
            <select name="estado" defaultValue="pendiente" className={`${inputClass} mt-1`}>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Fecha objetivo</label>
            <input name="fechaObjetivo" type="date" className={`${inputClass} mt-1`} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Descripción</label>
            <textarea name="descripcion" rows={2} className={`${inputClass} mt-1`} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={primaryButtonClass} disabled={busy}>
              Crear
            </button>
          </div>
        </form>
      </section>

      <ul className="space-y-3">
        {entregables.map((e) => (
          <li
            key={e.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {editing?.id === e.id ? (
              <form className="space-y-3" onSubmit={onUpdate}>
                <p className="text-xs text-zinc-500">Proyecto: {proyectoNombre(e.proyectoId)}</p>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Título</label>
                  <input name="titulo" required defaultValue={e.titulo} className={`${inputClass} mt-1`} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Estado</label>
                    <select name="estado" defaultValue={e.estado} className={`${inputClass} mt-1`}>
                      {ESTADOS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Fecha objetivo</label>
                    <input
                      name="fechaObjetivo"
                      type="date"
                      defaultValue={e.fechaObjetivo ?? ""}
                      className={`${inputClass} mt-1`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Fecha entrega real</label>
                    <input
                      name="fechaEntregaReal"
                      type="date"
                      defaultValue={e.fechaEntregaReal ?? ""}
                      className={`${inputClass} mt-1`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Descripción</label>
                  <textarea name="descripcion" rows={2} defaultValue={e.descripcion ?? ""} className={`${inputClass} mt-1`} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className={secondaryButtonClass} disabled={busy}>
                    Guardar
                  </button>
                  <button type="button" className={secondaryButtonClass} onClick={() => setEditing(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">{e.titulo}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{proyectoNombre(e.proyectoId)}</p>
                  <p className="mt-1 text-sm capitalize text-zinc-600 dark:text-zinc-300">{e.estado}</p>
                  {e.descripcion ? (
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{e.descripcion}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button type="button" className={secondaryButtonClass} onClick={() => setEditing(e)}>
                    Editar
                  </button>
                  <button type="button" className={dangerButtonClass} onClick={() => setDeleteCandidate(e)}>
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {deleteCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Eliminar entregable</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              ¿Eliminar <span className="font-medium">{deleteCandidate.titulo}</span>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setDeleteCandidate(null)}>
                Cancelar
              </button>
              <button type="button" className={dangerButtonClass} onClick={() => void onDelete()}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
