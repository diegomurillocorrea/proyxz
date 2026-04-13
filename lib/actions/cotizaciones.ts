"use server";

import { requireOrgContext } from "@/lib/data/auth-org";
import { revalidateAllDashboard } from "@/lib/actions/revalidate-dashboard";
import type { CotizacionDocEstado, Id } from "@/lib/types";

export type PartidaInput = {
  tipoProyectoId: Id;
  concepto: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
};

export async function createCotizacionAction(input: {
  folio: string;
  clienteId: Id;
  estado: CotizacionDocEstado;
  fechaEmision: string;
  tasaIva: number;
  notas?: string;
  partidas: PartidaInput[];
}) {
  const { supabase, orgId } = await requireOrgContext();
  if (input.partidas.length === 0) {
    throw new Error("Agregá al menos una partida.");
  }
  const { data: cot, error: cErr } = await supabase
    .from("cotizaciones")
    .insert({
      organization_id: orgId,
      folio: input.folio.trim(),
      cliente_id: input.clienteId,
      estado: input.estado,
      fecha_emision: input.fechaEmision,
      tasa_iva: input.tasaIva,
      notas: input.notas?.trim() || null,
    })
    .select("id")
    .single();
  if (cErr) throw new Error(cErr.message);
  const cotId = cot.id as string;

  const { error: pErr } = await supabase.from("partidas_cotizacion").insert(
    input.partidas.map((p, i) => ({
      organization_id: orgId,
      cotizacion_id: cotId,
      tipo_proyecto_id: p.tipoProyectoId,
      concepto: p.concepto.trim(),
      unidad: p.unidad.trim(),
      cantidad: p.cantidad,
      precio_unitario: p.precioUnitario,
      orden: i + 1,
    })),
  );
  if (pErr) throw new Error(pErr.message);
  revalidateAllDashboard();
}

export async function updateCotizacionAction(
  id: Id,
  patch: {
    folio?: string;
    clienteId?: Id;
    estado?: CotizacionDocEstado;
    fechaEmision?: string;
    tasaIva?: number;
    notas?: string;
    partidas?: PartidaInput[];
  },
) {
  const { supabase, orgId } = await requireOrgContext();

  const { data: current, error: curErr } = await supabase
    .from("cotizaciones")
    .select("estado")
    .eq("id", id)
    .single();
  if (curErr) throw new Error(curErr.message);
  const currentEstado = current.estado as string;

  if (patch.partidas !== undefined) {
    if (currentEstado !== "borrador") {
      throw new Error("Solo se pueden editar partidas en borrador.");
    }
    const { error: delErr } = await supabase.from("partidas_cotizacion").delete().eq("cotizacion_id", id);
    if (delErr) throw new Error(delErr.message);
    if (patch.partidas.length === 0) throw new Error("Debe haber al menos una partida.");
    const { error: insErr } = await supabase.from("partidas_cotizacion").insert(
      patch.partidas.map((p, i) => ({
        organization_id: orgId,
        cotizacion_id: id,
        tipo_proyecto_id: p.tipoProyectoId,
        concepto: p.concepto.trim(),
        unidad: p.unidad.trim(),
        cantidad: p.cantidad,
        precio_unitario: p.precioUnitario,
        orden: i + 1,
      })),
    );
    if (insErr) throw new Error(insErr.message);
  }

  const row: Record<string, string | number | null> = {};
  if (patch.folio !== undefined) row.folio = patch.folio.trim();
  if (patch.clienteId !== undefined) row.cliente_id = patch.clienteId;
  if (patch.estado !== undefined) row.estado = patch.estado;
  if (patch.fechaEmision !== undefined) row.fecha_emision = patch.fechaEmision;
  if (patch.tasaIva !== undefined) row.tasa_iva = patch.tasaIva;
  if (patch.notas !== undefined) row.notas = patch.notas.trim() || null;
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("cotizaciones").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  }
  revalidateAllDashboard();
}

export async function deleteCotizacionAction(id: Id) {
  const { supabase } = await requireOrgContext();
  const { data: cot, error: cErr } = await supabase
    .from("cotizaciones")
    .select("estado")
    .eq("id", id)
    .single();
  if (cErr) throw new Error(cErr.message);
  if ((cot.estado as string) !== "borrador") {
    throw new Error("Solo se pueden eliminar cotizaciones en borrador.");
  }
  const { count, error: pErr } = await supabase
    .from("proyectos")
    .select("*", { count: "exact", head: true })
    .eq("cotizacion_id", id);
  if (pErr) throw new Error(pErr.message);
  if (count && count > 0) {
    throw new Error("No se puede eliminar: existe un proyecto vinculado.");
  }
  const { error } = await supabase.from("cotizaciones").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}
