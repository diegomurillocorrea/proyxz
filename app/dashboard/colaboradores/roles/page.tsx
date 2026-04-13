"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  createRolColaboradorAction,
  deleteRolColaboradorAction,
  updateRolColaboradorAction,
} from "@/lib/actions/roles-colaborador";
import { dangerButtonClass, inputClass, primaryButtonClass } from "@/lib/input-classes";
import { useOrgStore } from "@/lib/org-store";

export default function RolesColaboradorPage() {
  const router = useRouter();
  const { rolesColaborador } = useOrgStore();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editActivo, setEditActivo] = useState(true);
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; nombre: string } | null>(null);

  const sorted = useMemo(
    () => [...rolesColaborador].sort((a, b) => a.orden - b.orden),
    [rolesColaborador],
  );

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await createRolColaboradorAction({ nombre: String(fd.get("nombre") ?? "") });
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmDelete() {
    if (!deleteCandidate) return;
    setError(null);
    setBusy(true);
    try {
      await deleteRolColaboradorAction(deleteCandidate.id);
      setDeleteCandidate(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  function onStartEdit(id: string, nombre: string, activo: boolean) {
    setError(null);
    setEditingId(id);
    setEditNombre(nombre);
    setEditActivo(activo);
  }

  function onCancelEdit() {
    setEditingId(null);
    setEditNombre("");
    setEditActivo(true);
  }

  async function onSaveEdit(id: string) {
    const nombre = editNombre.trim();
    if (!nombre) {
      setError("El nombre no puede quedar vacío.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await updateRolColaboradorAction(id, { nombre, activo: editActivo });
      onCancelEdit();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link
            href="/dashboard/colaboradores"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            ← Colaboradores
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Roles de colaborador
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Catálogo sugerido para la agenda (maestro, ayudante, etc.). Spec §8.1 — no son usuarios con login.
          </p>
        </div>

        {error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Nuevo rol
        </h2>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onCreate}>
          <div className="min-w-0 flex-1">
            <label htmlFor="rol-nombre" className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Nombre
            </label>
            <input
              id="rol-nombre"
              name="nombre"
              required
              className={`${inputClass} mt-1`}
              placeholder="Ej. Ayudante general"
            />
          </div>
          <button type="submit" className={`${primaryButtonClass} sm:w-auto sm:min-w-40`} disabled={busy}>
            Agregar
          </button>
        </form>
        </section>

        <ul className="space-y-4">
        {sorted.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
            No hay roles todavía. Agregá el primero arriba para empezar.
          </li>
        ) : (
          sorted.map((r) => {
            const isEditing = editingId === r.id;
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Nombre
                          </label>
                          <input
                            className={`${inputClass} mt-1`}
                            value={editNombre}
                            onChange={(ev) => setEditNombre(ev.target.value)}
                            aria-label={`Editar nombre del rol ${r.nombre}`}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                          <input
                            type="checkbox"
                            checked={editActivo}
                            disabled={busy}
                            onChange={(ev) => setEditActivo(ev.target.checked)}
                            className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600"
                          />
                          Activo (visible al elegir rol en colaboradores)
                        </label>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Nombre
                          </p>
                          <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-50">{r.nombre}</p>
                        </div>
                        <p className="text-sm text-zinc-700 dark:text-zinc-200">
                          Estado:{" "}
                          <span
                            className={
                              r.activo
                                ? "font-medium text-emerald-700 dark:text-emerald-400"
                                : "font-medium text-zinc-500 dark:text-zinc-400"
                            }
                          >
                            {r.activo ? "Activo" : "Inactivo"}
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className={primaryButtonClass}
                          disabled={busy}
                          onClick={() => void onSaveEdit(r.id)}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          disabled={busy}
                          onClick={onCancelEdit}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          onClick={() => onStartEdit(r.id, r.nombre, r.activo)}
                          disabled={busy || editingId !== null}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`${dangerButtonClass} mt-1`}
                          disabled={busy || editingId !== null}
                          onClick={() => setDeleteCandidate({ id: r.id, nombre: r.nombre })}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })
        )}
        </ul>

      </div>

      {deleteCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-role-title"
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 id="delete-role-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Eliminar rol
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Vas a eliminar <span className="font-semibold">{deleteCandidate.nombre}</span> del catálogo.
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Los colaboradores que ya tengan ese texto en <span className="font-semibold">Rol</span> no se
              modificarán automáticamente.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={() => setDeleteCandidate(null)}
                disabled={busy}
              >
                Cancelar
              </button>
              <button type="button" className={dangerButtonClass} onClick={() => void onConfirmDelete()} disabled={busy}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
