"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createPrecioManoObraAction,
  createTipoProyectoAction,
  deletePrecioManoObraAction,
  updatePrecioManoObraAction,
  updateTipoProyectoAction,
} from "@/lib/actions/catalogos";
import { formatUsd } from "@/lib/format";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/input-classes";
import { useOrgStore } from "@/lib/org-store";
import type { PrecioManoObra, TipoProyecto } from "@/lib/types";

export default function CatalogosPage() {
  const router = useRouter();
  const { tiposProyecto, preciosManoObra } = useOrgStore();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoProyecto | null>(null);
  const [editingPrecio, setEditingPrecio] = useState<PrecioManoObra | null>(null);
  const [deletePrecioCandidate, setDeletePrecioCandidate] = useState<PrecioManoObra | null>(null);

  function tipoNombre(id: string) {
    return tiposProyecto.find((t) => t.id === id)?.nombre ?? id;
  }

  async function onCreateTipo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await createTipoProyectoAction({
        codigo: String(fd.get("codigo") ?? ""),
        nombre: String(fd.get("nombre") ?? ""),
        descripcion: String(fd.get("descripcion") ?? "") || undefined,
      });
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdateTipo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingTipo) return;
    setBusy(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await updateTipoProyectoAction(editingTipo.id, {
        nombre: String(fd.get("nombre") ?? ""),
        descripcion: String(fd.get("descripcion") ?? "") || undefined,
        activo: fd.get("activo") === "on",
      });
      setEditingTipo(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onCreatePrecio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await createPrecioManoObraAction({
        tipoProyectoId: String(fd.get("tipoProyectoId") ?? ""),
        concepto: String(fd.get("concepto") ?? ""),
        unidad: String(fd.get("unidad") ?? ""),
        precioUnitario: Number(fd.get("precioUnitario")),
      });
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdatePrecio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingPrecio) return;
    setBusy(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      await updatePrecioManoObraAction(editingPrecio.id, {
        concepto: String(fd.get("concepto") ?? ""),
        unidad: String(fd.get("unidad") ?? ""),
        precioUnitario: Number(fd.get("precioUnitario")),
        activo: fd.get("activo") === "on",
      });
      setEditingPrecio(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function onDeletePrecio() {
    if (!deletePrecioCandidate) return;
    try {
      await deletePrecioManoObraAction(deletePrecioCandidate.id);
      setDeletePrecioCandidate(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Catálogos</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Tipos de obra y precios de mano de obra (Supabase).
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Nuevo tipo de proyecto</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onCreateTipo}>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Código *</label>
            <input name="codigo" required className={`${inputClass} mt-1 font-mono`} placeholder="TABLAROCA" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre *</label>
            <input name="nombre" required className={`${inputClass} mt-1`} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Descripción</label>
            <input name="descripcion" className={`${inputClass} mt-1`} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={primaryButtonClass} disabled={busy}>
              Crear tipo
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Tipos de proyecto</h2>
        <ul className="mt-4 space-y-2">
          {tiposProyecto.map((t) => (
            <li
              key={t.id}
              className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              {editingTipo?.id === t.id ? (
                <form className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end" onSubmit={onUpdateTipo}>
                  <div className="min-w-0 flex-1">
                    <label className="text-xs text-zinc-500">Nombre</label>
                    <input name="nombre" defaultValue={t.nombre} required className={`${inputClass} mt-1`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="text-xs text-zinc-500">Descripción</label>
                    <input name="descripcion" defaultValue={t.descripcion ?? ""} className={`${inputClass} mt-1`} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="activo" defaultChecked={t.activo} />
                    Activo
                  </label>
                  <button type="submit" className={secondaryButtonClass}>
                    OK
                  </button>
                  <button type="button" className={secondaryButtonClass} onClick={() => setEditingTipo(null)}>
                    Cancelar
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{t.nombre}</p>
                    <p className="text-xs text-zinc-500">{t.codigo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        t.activo
                          ? "text-xs font-medium text-emerald-700 dark:text-emerald-400"
                          : "text-xs text-zinc-400"
                      }
                    >
                      {t.activo ? "Activo" : "Inactivo"}
                    </span>
                    <button type="button" className={secondaryButtonClass} onClick={() => setEditingTipo(t)}>
                      Editar
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Nuevo precio de mano de obra</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onCreatePrecio}>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Tipo *</label>
            <select name="tipoProyectoId" required className={`${inputClass} mt-1`}>
              <option value="">Elegir…</option>
              {tiposProyecto.filter((x) => x.activo).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Concepto *</label>
            <input name="concepto" required className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Unidad *</label>
            <input name="unidad" required className={`${inputClass} mt-1`} placeholder="m², pza…" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Precio USD *</label>
            <input name="precioUnitario" type="number" step="0.01" min="0" required className={`${inputClass} mt-1`} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={primaryButtonClass} disabled={busy}>
              Agregar tarifa
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Precios de mano de obra</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3 text-right">Precio</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {preciosManoObra.map((p) => (
                <tr key={p.id} className="text-zinc-700 dark:text-zinc-200">
                  {editingPrecio?.id === p.id ? (
                    <td colSpan={5} className="bg-zinc-50/80 p-4 dark:bg-zinc-950/50">
                      <form className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end" onSubmit={onUpdatePrecio}>
                        <div>
                          <label className="text-xs text-zinc-500">Concepto</label>
                          <input name="concepto" defaultValue={p.concepto} required className={`${inputClass} mt-1`} />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500">Unidad</label>
                          <input name="unidad" defaultValue={p.unidad} required className={`${inputClass} mt-1`} />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500">Precio</label>
                          <input
                            name="precioUnitario"
                            type="number"
                            step="0.01"
                            defaultValue={p.precioUnitario}
                            required
                            className={`${inputClass} mt-1`}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="activo" defaultChecked={p.activo} />
                          Activo
                        </label>
                        <button type="submit" className={secondaryButtonClass}>
                          Guardar
                        </button>
                        <button type="button" className={secondaryButtonClass} onClick={() => setEditingPrecio(null)}>
                          Cancelar
                        </button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-xs">{tipoNombre(p.tipoProyectoId)}</td>
                      <td className="px-4 py-3">{p.concepto}</td>
                      <td className="px-4 py-3">{p.unidad}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                        {formatUsd(p.precioUnitario)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" className={secondaryButtonClass} onClick={() => setEditingPrecio(p)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`${secondaryButtonClass} ml-2 border-red-200 text-red-800 hover:bg-red-50 dark:border-red-900 dark:text-red-300`}
                          onClick={() => setDeletePrecioCandidate(p)}
                        >
                          Borrar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {deletePrecioCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Eliminar tarifa</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              ¿Eliminar la tarifa <span className="font-medium">{deletePrecioCandidate.concepto}</span>?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => setDeletePrecioCandidate(null)}
              >
                Cancelar
              </button>
              <button type="button" className={secondaryButtonClass} onClick={() => void onDeletePrecio()}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
