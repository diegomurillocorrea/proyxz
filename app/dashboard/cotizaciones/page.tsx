"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CotizacionForm } from "@/components/dashboard/cotizacion-form";
import { deleteCotizacionAction } from "@/lib/actions/cotizaciones";
import { createProyectoFromCotizacionAction } from "@/lib/actions/proyectos";
import { montosCotizacion } from "@/lib/cotizacion-math";
import { formatPercent, formatUsd } from "@/lib/format";
import { dangerButtonClass, inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/input-classes";
import { useOrgStore } from "@/lib/org-store";
import type { Cotizacion } from "@/lib/types";

export default function CotizacionesPage() {
  const router = useRouter();
  const { cotizaciones, clientes, tiposProyecto, preciosManoObra, proyectos } = useOrgStore();
  const [editing, setEditing] = useState<Cotizacion | null>(null);
  const [creating, setCreating] = useState(false);
  const [proyectoFor, setProyectoFor] = useState<Cotizacion | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Cotizacion | null>(null);
  const [nombreProyecto, setNombreProyecto] = useState("");
  const [direccionObra, setDireccionObra] = useState("");
  const [error, setError] = useState<string | null>(null);

  function clienteNombre(id: string) {
    return clientes.find((c) => c.id === id)?.nombre ?? "—";
  }

  function tipoNombre(id: string) {
    return tiposProyecto.find((t) => t.id === id)?.nombre ?? id;
  }

  async function onDelete() {
    if (!deleteCandidate) return;
    setError(null);
    try {
      await deleteCotizacionAction(deleteCandidate.id);
      setDeleteCandidate(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function onCreateProyecto(e: React.FormEvent) {
    e.preventDefault();
    if (!proyectoFor) return;
    setError(null);
    try {
      await createProyectoFromCotizacionAction({
        cotizacionId: proyectoFor.id,
        nombre: nombreProyecto,
        direccionObra: direccionObra || undefined,
      });
      setProyectoFor(null);
      setNombreProyecto("");
      setDireccionObra("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Cotizaciones</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Multiparte por partida · IVA desglosado (13%) · USD · Supabase.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Nueva cotización</h2>
          <button type="button" className={secondaryButtonClass} onClick={() => setCreating((v) => !v)}>
            {creating ? "Ocultar formulario" : "Mostrar formulario"}
          </button>
        </div>
        {creating ? (
          <div className="mt-4">
            <CotizacionForm
              mode="create"
              clientes={clientes}
              tiposProyecto={tiposProyecto}
              preciosManoObra={preciosManoObra}
              onDone={() => {
                setCreating(false);
                router.refresh();
              }}
              onCancel={() => setCreating(false)}
            />
          </div>
        ) : null}
      </section>

      {cotizaciones.map((cot) => {
        const m = montosCotizacion(cot);
        const yaProyecto = proyectos.some((p) => p.cotizacionId === cot.id);
        return (
          <article
            key={cot.id}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div>
                <p className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">{cot.folio}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{clienteNombre(cot.clienteId)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {cot.estado}
                </span>
                {cot.estado === "borrador" ? (
                  <button type="button" className={dangerButtonClass} onClick={() => setDeleteCandidate(cot)}>
                    Eliminar
                  </button>
                ) : null}
                <button type="button" className={secondaryButtonClass} onClick={() => setEditing(editing?.id === cot.id ? null : cot)}>
                  {editing?.id === cot.id ? "Cerrar edición" : "Editar"}
                </button>
                {cot.estado === "aceptada" && !yaProyecto ? (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
                    onClick={() => {
                      setProyectoFor(cot);
                      setNombreProyecto("");
                      setDireccionObra("");
                    }}
                  >
                    Crear proyecto
                  </button>
                ) : null}
              </div>
            </header>

            {editing?.id === cot.id ? (
              <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                <CotizacionForm
                  mode="edit"
                  initial={cot}
                  clientes={clientes}
                  tiposProyecto={tiposProyecto}
                  preciosManoObra={preciosManoObra}
                  onDone={() => {
                    setEditing(null);
                    router.refresh();
                  }}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-lg text-left text-sm">
                <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-2">Tipo</th>
                    <th className="px-5 py-2">Concepto</th>
                    <th className="px-5 py-2">Und</th>
                    <th className="px-5 py-2 text-right">Cant.</th>
                    <th className="px-5 py-2 text-right">P.U.</th>
                    <th className="px-5 py-2 text-right">Subt.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {[...cot.partidas]
                    .sort((a, b) => a.orden - b.orden)
                    .map((p) => (
                      <tr key={p.id} className="text-zinc-700 dark:text-zinc-200">
                        <td className="px-5 py-2 text-xs text-zinc-500 dark:text-zinc-400">{tipoNombre(p.tipoProyectoId)}</td>
                        <td className="px-5 py-2">{p.concepto}</td>
                        <td className="px-5 py-2">{p.unidad}</td>
                        <td className="px-5 py-2 text-right tabular-nums">{p.cantidad}</td>
                        <td className="px-5 py-2 text-right tabular-nums">{formatUsd(p.precioUnitario)}</td>
                        <td className="px-5 py-2 text-right font-medium tabular-nums">
                          {formatUsd(p.cantidad * p.precioUnitario)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-col gap-1 border-t border-zinc-100 bg-zinc-50/80 px-5 py-4 text-sm dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Subtotal</span>
                <span className="tabular-nums">{formatUsd(m.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">IVA ({formatPercent(cot.tasaIva)})</span>
                <span className="tabular-nums">{formatUsd(m.montoIva)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold dark:border-zinc-700">
                <span>Total</span>
                <span className="text-emerald-700 tabular-nums dark:text-emerald-400">{formatUsd(m.total)}</span>
              </div>
            </footer>
          </article>
        );
      })}

      {proyectoFor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Crear proyecto desde cotización</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Folio <span className="font-mono">{proyectoFor.folio}</span> — estado aceptada.
            </p>
            <form className="mt-4 space-y-3" onSubmit={onCreateProyecto}>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Nombre de la obra</label>
                <input
                  value={nombreProyecto}
                  onChange={(e) => setNombreProyecto(e.target.value)}
                  className={`${inputClass} mt-1`}
                  placeholder="Opcional — por defecto se usa el folio"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Dirección de obra</label>
                <input
                  value={direccionObra}
                  onChange={(e) => setDireccionObra(e.target.value)}
                  className={`${inputClass} mt-1`}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className={primaryButtonClass}>
                  Crear proyecto
                </button>
                <button type="button" className={secondaryButtonClass} onClick={() => setProyectoFor(null)}>
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
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Eliminar cotización</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              ¿Eliminar la cotización <span className="font-mono">{deleteCandidate.folio}</span>? (solo borrador)
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

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/dashboard/proyectos" className="font-medium text-emerald-700 dark:text-emerald-400">
          Ver proyectos
        </Link>
      </p>
    </div>
  );
}
