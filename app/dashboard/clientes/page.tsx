"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  archiveClienteAction,
  createClienteAction,
  updateClienteAction,
} from "@/lib/actions/clientes";
import { dangerButtonClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/input-classes";
import { useOrgStore } from "@/lib/org-store";
import type { Cliente } from "@/lib/types";

export default function ClientesPage() {
  const router = useRouter();
  const { clientes } = useOrgStore();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [busy, setBusy] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<Cliente | null>(null);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await createClienteAction({
        nombre: String(fd.get("nombre") ?? ""),
        telefono: String(fd.get("telefono") ?? "") || undefined,
        email: String(fd.get("email") ?? "") || undefined,
        notas: String(fd.get("notas") ?? "") || undefined,
      });
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await updateClienteAction(editing.id, {
        nombre: String(fd.get("nombre") ?? ""),
        telefono: String(fd.get("telefono") ?? "") || undefined,
        email: String(fd.get("email") ?? "") || undefined,
        notas: String(fd.get("notas") ?? "") || undefined,
        activo: fd.get("activo") === "on",
      });
      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function onArchive() {
    if (!archiveCandidate) return;
    setError(null);
    try {
      await archiveClienteAction(archiveCandidate.id);
      setArchiveCandidate(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Clientes</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Directorio persistido en Supabase (activo / archivado).
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Nuevo cliente
        </h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onCreate}>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre *</label>
            <input name="nombre" required className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Teléfono</label>
            <input name="telefono" className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Correo</label>
            <input name="email" type="email" className={`${inputClass} mt-1`} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Notas</label>
            <textarea name="notas" rows={2} className={`${inputClass} mt-1`} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={primaryButtonClass} disabled={busy}>
              Guardar cliente
            </button>
          </div>
        </form>
      </section>

      <ul className="space-y-3">
        {clientes.map((c) => (
          <li
            key={c.id}
            className={`rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 ${!c.activo ? "opacity-60" : ""}`}
          >
            {editing?.id === c.id ? (
              <form className="space-y-3" onSubmit={onUpdate}>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre</label>
                  <input name="nombre" required defaultValue={c.nombre} className={`${inputClass} mt-1`} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Teléfono</label>
                    <input name="telefono" defaultValue={c.telefono ?? ""} className={`${inputClass} mt-1`} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Correo</label>
                    <input name="email" type="email" defaultValue={c.email ?? ""} className={`${inputClass} mt-1`} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Notas</label>
                  <textarea name="notas" rows={2} defaultValue={c.notas ?? ""} className={`${inputClass} mt-1`} />
                </div>
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <input type="checkbox" name="activo" defaultChecked={c.activo} className="rounded border-zinc-300 text-emerald-600" />
                  Activo
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className={secondaryButtonClass} disabled={busy}>
                    Guardar
                  </button>
                  <button type="button" className={secondaryButtonClass} onClick={() => setEditing(null)}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">{c.nombre}</p>
                    {!c.activo ? (
                      <span className="mt-1 inline-block text-xs font-medium text-zinc-500">Archivado</span>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                      {c.telefono ? <span>{c.telefono}</span> : null}
                      {c.email ? <span>{c.email}</span> : null}
                    </div>
                    {c.notas ? (
                      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{c.notas}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={secondaryButtonClass} onClick={() => setEditing(c)}>
                      Editar
                    </button>
                    {c.activo ? (
                      <button type="button" className={dangerButtonClass} onClick={() => setArchiveCandidate(c)}>
                        Archivar
                      </button>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {archiveCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Archivar cliente</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              ¿Archivar a <span className="font-medium">{archiveCandidate.nombre}</span>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setArchiveCandidate(null)}>
                Cancelar
              </button>
              <button type="button" className={dangerButtonClass} onClick={() => void onArchive()}>
                Archivar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
