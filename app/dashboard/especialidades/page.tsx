"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  createEspecialidadAction,
  createTrabajoEspecialidadAction,
  deleteEspecialidadAction,
  deleteTrabajoEspecialidadAction,
  updateEspecialidadAction,
  updateTrabajoEspecialidadAction,
} from "@/lib/actions/especialidades";
import {
  dangerButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/lib/input-classes";
import { useOrgStore } from "@/lib/org-store";
import type { Especialidad, TrabajoEspecialidad } from "@/lib/types";

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const tableHeadClass =
  "border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400";

export default function EspecialidadesPage() {
  const router = useRouter();
  const { especialidades, trabajosEspecialidad } = useOrgStore();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Especialidad | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Especialidad | null>(null);
  const [expandedEspecialidadId, setExpandedEspecialidadId] = useState<string | null>(null);

  const [trabajoCreateForEspecialidadId, setTrabajoCreateForEspecialidadId] = useState<string | null>(null);
  const [editingTrabajo, setEditingTrabajo] = useState<TrabajoEspecialidad | null>(null);
  const [deleteTrabajoCandidate, setDeleteTrabajoCandidate] = useState<TrabajoEspecialidad | null>(null);

  const countByEspecialidad = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of trabajosEspecialidad) {
      m.set(t.especialidadId, (m.get(t.especialidadId) ?? 0) + 1);
    }
    return m;
  }, [trabajosEspecialidad]);

  const trabajosByEspecialidadId = useMemo(() => {
    const m = new Map<string, TrabajoEspecialidad[]>();
    for (const t of trabajosEspecialidad) {
      const list = m.get(t.especialidadId) ?? [];
      list.push(t);
      m.set(t.especialidadId, list);
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    return m;
  }, [trabajosEspecialidad]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await createEspecialidadAction({
        nombre: String(fd.get("nombre") ?? ""),
        descripcion: String(fd.get("descripcion") ?? "") || undefined,
      });
      form.reset();
      setIsCreateOpen(false);
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
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await updateEspecialidadAction(editing.id, {
        nombre: String(fd.get("nombre") ?? ""),
        descripcion: String(fd.get("descripcion") ?? "") || undefined,
        activo: fd.get("activo") === "on",
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
    setError(null);
    try {
      await deleteEspecialidadAction(deleteCandidate.id);
      setDeleteCandidate(null);
      setExpandedEspecialidadId((id) => (id === deleteCandidate.id ? null : id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function onCreateTrabajo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trabajoCreateForEspecialidadId) return;
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await createTrabajoEspecialidadAction({
        especialidadId: trabajoCreateForEspecialidadId,
        nombre: String(fd.get("nombre") ?? ""),
        descripcion: String(fd.get("descripcion") ?? "") || undefined,
      });
      form.reset();
      setTrabajoCreateForEspecialidadId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdateTrabajo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingTrabajo) return;
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await updateTrabajoEspecialidadAction(editingTrabajo.id, {
        nombre: String(fd.get("nombre") ?? ""),
        descripcion: String(fd.get("descripcion") ?? "") || undefined,
        activo: fd.get("activo") === "on",
      });
      setEditingTrabajo(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteTrabajo() {
    if (!deleteTrabajoCandidate) return;
    setError(null);
    try {
      await deleteTrabajoEspecialidadAction(deleteTrabajoCandidate.id);
      setDeleteTrabajoCandidate(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  const sorted = useMemo(
    () => [...especialidades].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [especialidades],
  );

  function toggleExpanded(id: string) {
    setExpandedEspecialidadId((prev) => (prev === id ? null : id));
  }

  const trabajoCreateEspecialidadNombre = useMemo(() => {
    if (!trabajoCreateForEspecialidadId) return "";
    return especialidades.find((e) => e.id === trabajoCreateForEspecialidadId)?.nombre ?? "";
  }, [trabajoCreateForEspecialidadId, especialidades]);

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Especialidades</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Oficios por rama y sus trabajos concretos (Supabase). Desplegá una fila para ver y gestionar trabajos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className={primaryButtonClass} onClick={() => setIsCreateOpen(true)} disabled={busy}>
              Nueva especialidad
            </button>
          </div>
        </div>

        {error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className="px-4 py-3">N.º</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Trabajos</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No hay especialidades todavía.
                  </td>
                </tr>
              ) : (
                sorted.flatMap((esp, index) => {
                  const isOpen = expandedEspecialidadId === esp.id;
                  const trabajosList = trabajosByEspecialidadId.get(esp.id) ?? [];
                  const mainRow = (
                    <tr key={esp.id} className="text-zinc-700 dark:text-zinc-200">
                      <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-300">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{esp.nombre}</td>
                      <td className="max-w-xs px-4 py-3">
                        <span className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                          {esp.descripcion ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            esp.activo
                              ? "text-xs font-medium text-emerald-700 dark:text-emerald-400"
                              : "text-xs text-zinc-400"
                          }
                        >
                          {esp.activo ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                        {countByEspecialidad.get(esp.id) ?? 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button type="button" className={secondaryButtonClass} onClick={() => setEditing(esp)}>
                            Editar
                          </button>
                          <button type="button" className={dangerButtonClass} onClick={() => setDeleteCandidate(esp)}>
                            Eliminar
                          </button>
                          <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            aria-expanded={isOpen}
                            aria-label={isOpen ? "Ocultar trabajos" : "Ver trabajos de la especialidad"}
                            onClick={() => toggleExpanded(esp.id)}
                          >
                            <ChevronDownIcon
                              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  const detailRow = isOpen ? (
                    <tr
                      key={`${esp.id}-trabajos`}
                      className="border-t border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/40"
                    >
                      <td colSpan={6} className="p-4">
                        <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <p className="min-w-0 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            Trabajos · {esp.nombre}
                          </p>
                          <button
                            type="button"
                            className={`${primaryButtonClass} inline-flex! w-fit! shrink-0 px-5`}
                            disabled={busy}
                            onClick={() => setTrabajoCreateForEspecialidadId(esp.id)}
                          >
                            Nuevo trabajo
                          </button>
                        </div>
                        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
                          <table className="w-full text-left text-sm">
                            <thead className={tableHeadClass}>
                              <tr>
                                <th className="px-4 py-3">N.º</th>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">Trabajos</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {trabajosList.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
                                  >
                                    Sin trabajos definidos. Usá &quot;Nuevo trabajo&quot; para agregar el primero.
                                  </td>
                                </tr>
                              ) : (
                                trabajosList.map((t, ti) => (
                                  <tr key={t.id} className="text-zinc-700 dark:text-zinc-200">
                                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-300">{ti + 1}</td>
                                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{t.nombre}</td>
                                    <td className="max-w-xs px-4 py-3">
                                      <span className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                                        {t.descripcion ?? "—"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={
                                          t.activo
                                            ? "text-xs font-medium text-emerald-700 dark:text-emerald-400"
                                            : "text-xs text-zinc-400"
                                        }
                                      >
                                        {t.activo ? "Activo" : "Inactivo"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-300">—</td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex flex-wrap justify-end gap-2">
                                        <button
                                          type="button"
                                          className={secondaryButtonClass}
                                          onClick={() => setEditingTrabajo(t)}
                                        >
                                          Editar
                                        </button>
                                        <button
                                          type="button"
                                          className={dangerButtonClass}
                                          onClick={() => setDeleteTrabajoCandidate(t)}
                                        >
                                          Eliminar
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  ) : null;
                  return detailRow ? [mainRow, detailRow] : [mainRow];
                })
              )}
            </tbody>
          </table>
        </section>
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Nueva especialidad</h2>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onCreate}>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre *</label>
                <input name="nombre" required className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Descripción</label>
                <input name="descripcion" className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className={primaryButtonClass} disabled={busy}>
                  Guardar
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => setIsCreateOpen(false)}
                  disabled={busy}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Editar especialidad</h2>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onUpdate}>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre *</label>
                <input name="nombre" required defaultValue={editing.nombre} className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Descripción</label>
                <input name="descripcion" defaultValue={editing.descripcion ?? ""} className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <input type="checkbox" name="activo" defaultChecked={editing.activo} />
                  Activa
                </label>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className={primaryButtonClass} disabled={busy}>
                  Guardar
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => setEditing(null)} disabled={busy}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Eliminar especialidad</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Se eliminará <span className="font-medium">{deleteCandidate.nombre}</span> y todos sus trabajos
              asociados.
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

      {trabajoCreateForEspecialidadId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Nuevo trabajo</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Especialidad: {trabajoCreateEspecialidadNombre}</p>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onCreateTrabajo}>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre *</label>
                <input name="nombre" required className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Descripción</label>
                <input name="descripcion" className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className={primaryButtonClass} disabled={busy}>
                  Guardar
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => setTrabajoCreateForEspecialidadId(null)}
                  disabled={busy}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingTrabajo ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Editar trabajo</h2>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onUpdateTrabajo}>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre *</label>
                <input name="nombre" required defaultValue={editingTrabajo.nombre} className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Descripción</label>
                <input
                  name="descripcion"
                  defaultValue={editingTrabajo.descripcion ?? ""}
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <input type="checkbox" name="activo" defaultChecked={editingTrabajo.activo} />
                  Activo
                </label>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className={primaryButtonClass} disabled={busy}>
                  Guardar
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => setEditingTrabajo(null)}
                  disabled={busy}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTrabajoCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Eliminar trabajo</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              ¿Eliminar <span className="font-medium">{deleteTrabajoCandidate.nombre}</span>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setDeleteTrabajoCandidate(null)}>
                Cancelar
              </button>
              <button type="button" className={dangerButtonClass} onClick={() => void onDeleteTrabajo()}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
