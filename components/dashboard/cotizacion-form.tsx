"use client";

import { useMemo, useState } from "react";
import type { PartidaInput } from "@/lib/actions/cotizaciones";
import { createCotizacionAction, updateCotizacionAction } from "@/lib/actions/cotizaciones";
import { formatUsd } from "@/lib/format";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/input-classes";
import type { Cliente, Cotizacion, CotizacionDocEstado, PrecioManoObra, TipoProyecto } from "@/lib/types";

const ESTADOS: CotizacionDocEstado[] = [
  "borrador",
  "enviada",
  "aceptada",
  "rechazada",
  "vencida",
];

function emptyPartida(tipos: TipoProyecto[]): PartidaInput {
  const t = tipos.find((x) => x.activo) ?? tipos[0];
  return {
    tipoProyectoId: t?.id ?? "",
    concepto: "",
    unidad: "m²",
    cantidad: 1,
    precioUnitario: 0,
  };
}

type Props = {
  clientes: Cliente[];
  tiposProyecto: TipoProyecto[];
  preciosManoObra: PrecioManoObra[];
  mode: "create" | "edit";
  initial?: Cotizacion;
  onDone: () => void;
  onCancel?: () => void;
};

export function CotizacionForm({
  clientes,
  tiposProyecto,
  preciosManoObra,
  mode,
  initial,
  onDone,
  onCancel,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const defaultCliente = clientes.find((c) => c.activo)?.id ?? clientes[0]?.id ?? "";

  const [folio, setFolio] = useState(initial?.folio ?? "");
  const [clienteId, setClienteId] = useState(initial?.clienteId ?? defaultCliente);
  const [estado, setEstado] = useState<CotizacionDocEstado>(initial?.estado ?? "borrador");
  const [fechaEmision, setFechaEmision] = useState(initial?.fechaEmision ?? new Date().toISOString().slice(0, 10));
  const [tasaIva, setTasaIva] = useState(initial?.tasaIva ?? 0.13);
  const [notas, setNotas] = useState(initial?.notas ?? "");

  const [partidas, setPartidas] = useState<PartidaInput[]>(() =>
    initial?.partidas.length
      ? initial.partidas.map((p) => ({
          tipoProyectoId: p.tipoProyectoId,
          concepto: p.concepto,
          unidad: p.unidad,
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario,
        }))
      : [emptyPartida(tiposProyecto)],
  );

  const preciosByTipo = useMemo(() => {
    const m = new Map<string, PrecioManoObra[]>();
    for (const pr of preciosManoObra.filter((x) => x.activo)) {
      const list = m.get(pr.tipoProyectoId) ?? [];
      list.push(pr);
      m.set(pr.tipoProyectoId, list);
    }
    return m;
  }, [preciosManoObra]);

  function updatePartida(i: number, patch: Partial<PartidaInput>) {
    setPartidas((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setPartidas((rows) => [...rows, emptyPartida(tiposProyecto)]);
  }

  function removeRow(i: number) {
    setPartidas((rows) => (rows.length <= 1 ? rows : rows.filter((_, j) => j !== i)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "create") {
        await createCotizacionAction({
          folio,
          clienteId,
          estado,
          fechaEmision,
          tasaIva,
          notas: notas || undefined,
          partidas,
        });
      } else if (initial) {
        await updateCotizacionAction(initial.id, {
          folio,
          clienteId,
          estado,
          fechaEmision,
          tasaIva,
          notas: notas || undefined,
          partidas: estado === "borrador" ? partidas : undefined,
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const borradorOnlyFields = mode === "create" || initial?.estado === "borrador";

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Folio *</label>
          <input
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
            required
            className={`${inputClass} mt-1 font-mono`}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Cliente *</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            className={`${inputClass} mt-1`}
          >
            {clientes.filter((c) => c.activo).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as CotizacionDocEstado)}
            className={`${inputClass} mt-1 capitalize`}
          >
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Fecha emisión</label>
          <input
            type="date"
            value={fechaEmision}
            onChange={(e) => setFechaEmision(e.target.value)}
            required
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Tasa IVA (0.13 = 13%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={tasaIva}
            onChange={(e) => setTasaIva(Number(e.target.value))}
            className={`${inputClass} mt-1`}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Notas</label>
        <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className={`${inputClass} mt-1`} />
      </div>

      {borradorOnlyFields ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Partidas</h3>
            <button type="button" className={secondaryButtonClass} onClick={addRow}>
              + Partida
            </button>
          </div>
          {partidas.map((row, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="text-xs text-zinc-500">Tipo de obra</label>
                  <select
                    value={row.tipoProyectoId}
                    onChange={(e) => updatePartida(i, { tipoProyectoId: e.target.value })}
                    className={`${inputClass} mt-1`}
                  >
                    {tiposProyecto.filter((t) => t.activo).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-500">Concepto</label>
                  <input
                    value={row.concepto}
                    onChange={(e) => updatePartida(i, { concepto: e.target.value })}
                    required
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Unidad</label>
                  <input
                    value={row.unidad}
                    onChange={(e) => updatePartida(i, { unidad: e.target.value })}
                    required
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Cantidad</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.cantidad}
                    onChange={(e) => updatePartida(i, { cantidad: Number(e.target.value) })}
                    required
                    className={`${inputClass} mt-1`}
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Precio unit. USD</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.precioUnitario}
                    onChange={(e) => updatePartida(i, { precioUnitario: Number(e.target.value) })}
                    required
                    className={`${inputClass} mt-1`}
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  className={`${inputClass} max-w-xs text-sm`}
                  defaultValue=""
                  onChange={(e) => {
                    const pid = e.target.value;
                    if (!pid) return;
                    const pr = preciosManoObra.find((p) => p.id === pid);
                    if (pr) {
                      updatePartida(i, {
                        tipoProyectoId: pr.tipoProyectoId,
                        concepto: pr.concepto,
                        unidad: pr.unidad,
                        precioUnitario: pr.precioUnitario,
                      });
                    }
                    e.target.value = "";
                  }}
                >
                  <option value="">Aplicar tarifa del catálogo…</option>
                  {(preciosByTipo.get(row.tipoProyectoId) ?? preciosManoObra).map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.concepto} — {formatUsd(pr.precioUnitario)}
                    </option>
                  ))}
                </select>
                <button type="button" className={secondaryButtonClass} onClick={() => removeRow(i)}>
                  Quitar partida
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Esta cotización ya no está en borrador: las partidas no se editan aquí. Podés cambiar estado y notas.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryButtonClass} disabled={busy}>
          {mode === "create" ? "Crear cotización" : "Guardar cambios"}
        </button>
        {onCancel ? (
          <button type="button" className={secondaryButtonClass} onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
