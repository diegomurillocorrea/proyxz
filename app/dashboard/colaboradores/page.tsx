"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  createColaboradorAction,
  deleteColaboradorAction,
  updateColaboradorAction,
} from "@/lib/actions/colaboradores";
import { dangerButtonClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/input-classes";
import { useOrgStore } from "@/lib/org-store";
import type { Colaborador } from "@/lib/types";

export default function ColaboradoresPage() {
  const router = useRouter();
  const { colaboradores, rolesColaborador } = useOrgStore();
  const rolesSugeridos = useMemo(
    () =>
      [...rolesColaborador]
        .filter((r) => r.activo)
        .sort((a, b) => a.orden - b.orden)
        .map((r) => r.nombre),
    [rolesColaborador],
  );
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Colaborador | null>(null);
  const [busy, setBusy] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createRoles, setCreateRoles] = useState<string[]>([]);
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [deleteCandidate, setDeleteCandidate] = useState<Colaborador | null>(null);

  function parseRoles(raw?: string) {
    if (!raw) return [];
    return raw
      .split(/[;,|]/g)
      .map((r) => r.trim())
      .filter(Boolean);
  }

  function toggleCreateSuggestedRole(role: string) {
    setCreateRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  function toggleEditSuggestedRole(role: string) {
    setEditRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await createColaboradorAction({
        nombre: String(fd.get("nombre") ?? ""),
        rol: String(fd.get("rol") ?? "") || undefined,
        telefono: String(fd.get("telefono") ?? "") || undefined,
        email: String(fd.get("email") ?? "") || undefined,
        notas: String(fd.get("notas") ?? "") || undefined,
      });
      form.reset();
      setCreateRoles([]);
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
      await updateColaboradorAction(editing.id, {
        nombre: String(fd.get("nombre") ?? ""),
        rol: String(fd.get("rol") ?? "") || undefined,
        telefono: String(fd.get("telefono") ?? "") || undefined,
        email: String(fd.get("email") ?? "") || undefined,
        notas: String(fd.get("notas") ?? "") || undefined,
      });
      setEditing(null);
      setEditRoles([]);
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
      await deleteColaboradorAction(deleteCandidate.id);
      setDeleteCandidate(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  function openEdit(colaborador: Colaborador) {
    setEditing(colaborador);
    setEditRoles(parseRoles(colaborador.rol));
  }

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Colaboradores</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Solo agenda — sin cuenta en la aplicación (spec §8.3). Datos en Supabase.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/colaboradores/roles"
              className="shrink-0 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
            >
              Roles sugeridos →
            </Link>
            <button type="button" className={primaryButtonClass} onClick={() => setIsCreateOpen(true)} disabled={busy}>
              Nuevo colaborador
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
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {colaboradores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    No hay colaboradores todavía.
                  </td>
                </tr>
              ) : (
                colaboradores.map((c) => (
                  <tr key={c.id} className="text-zinc-700 dark:text-zinc-200">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{c.nombre}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {parseRoles(c.rol).length > 0 ? (
                          parseRoles(c.rol).map((role) => (
                            <span
                              key={`${c.id}-${role}`}
                              className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            >
                              {role}
                            </span>
                          ))
                        ) : c.rol?.trim() ? (
                          <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {c.rol.trim()}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{c.telefono ?? "—"}</td>
                    <td className="px-4 py-3">{c.email ?? "—"}</td>
                    <td className="max-w-xs px-4 py-3">
                      <span className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{c.notas ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" className={secondaryButtonClass} onClick={() => openEdit(c)}>
                          Editar
                        </button>
                        <button type="button" className={dangerButtonClass} onClick={() => setDeleteCandidate(c)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Nuevo colaborador</h2>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onCreate}>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre *</label>
                <input name="nombre" required className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Roles</label>
                <input type="hidden" name="rol" value={createRoles.join(", ")} />
                <RoleMultiSelect
                  options={rolesSugeridos}
                  selected={createRoles}
                  onToggle={toggleCreateSuggestedRole}
                />
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
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className={primaryButtonClass} disabled={busy}>
                  Guardar
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => {
                    setIsCreateOpen(false);
                    setCreateRoles([]);
                  }}
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Editar colaborador</h2>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={onUpdate}>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre *</label>
                <input name="nombre" required defaultValue={editing.nombre} className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Roles</label>
                <input type="hidden" name="rol" value={editRoles.join(", ")} />
                <RoleMultiSelect
                  options={rolesSugeridos}
                  selected={editRoles}
                  onToggle={toggleEditSuggestedRole}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Teléfono</label>
                <input name="telefono" defaultValue={editing.telefono ?? ""} className={`${inputClass} mt-1`} />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Correo</label>
                <input name="email" type="email" defaultValue={editing.email ?? ""} className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Notas</label>
                <textarea name="notas" rows={2} defaultValue={editing.notas ?? ""} className={`${inputClass} mt-1`} />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" className={primaryButtonClass} disabled={busy}>
                  Guardar
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => {
                    setEditing(null);
                    setEditRoles([]);
                  }}
                  disabled={busy}
                >
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
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Eliminar colaborador</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              ¿Eliminar a <span className="font-medium">{deleteCandidate.nombre}</span>?
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
    </>
  );
}

function RoleMultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (role: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-left text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200"
      >
        <span>{selected.length > 0 ? `${selected.length} rol(es) seleccionado(s)` : "Seleccionar roles"}</span>
        <span className={`text-xs text-zinc-500 transition dark:text-zinc-400 ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {selected.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((role) => (
            <span
              key={`selected-${role}`}
              className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              {role}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-zinc-400">Aun no hay roles seleccionados.</p>
      )}
      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          {options.length === 0 ? (
            <p className="px-2 py-1 text-xs text-zinc-400">No hay roles sugeridos activos.</p>
          ) : (
            options.map((role) => {
              const checked = selected.includes(role);
              return (
                <label
                  key={`option-${role}`}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(role)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600"
                  />
                  <span>{role}</span>
                </label>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
