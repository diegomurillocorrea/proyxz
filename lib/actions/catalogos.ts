"use server";

import { requireOrgContext } from "@/lib/data/auth-org";
import { revalidateAllDashboard } from "@/lib/actions/revalidate-dashboard";
import type { Id } from "@/lib/types";

export async function createTipoProyectoAction(input: {
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}) {
  const { supabase, orgId } = await requireOrgContext();
  const { error } = await supabase.from("tipos_proyecto").insert({
    organization_id: orgId,
    codigo: input.codigo.trim().toUpperCase(),
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    activo: input.activo ?? true,
  });
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function updateTipoProyectoAction(
  id: Id,
  patch: { nombre?: string; descripcion?: string; activo?: boolean },
) {
  const { supabase } = await requireOrgContext();
  const row: Record<string, string | boolean | null> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre.trim();
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion.trim() || null;
  if (patch.activo !== undefined) row.activo = patch.activo;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("tipos_proyecto").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function createPrecioManoObraAction(input: {
  tipoProyectoId: Id;
  concepto: string;
  unidad: string;
  precioUnitario: number;
  activo?: boolean;
}) {
  const { supabase, orgId } = await requireOrgContext();
  const { error } = await supabase.from("precios_mano_obra").insert({
    organization_id: orgId,
    tipo_proyecto_id: input.tipoProyectoId,
    concepto: input.concepto.trim(),
    unidad: input.unidad.trim(),
    precio_unitario: input.precioUnitario,
    activo: input.activo ?? true,
  });
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function updatePrecioManoObraAction(
  id: Id,
  patch: { concepto?: string; unidad?: string; precioUnitario?: number; activo?: boolean },
) {
  const { supabase } = await requireOrgContext();
  const row: Record<string, string | number | boolean> = {};
  if (patch.concepto !== undefined) row.concepto = patch.concepto.trim();
  if (patch.unidad !== undefined) row.unidad = patch.unidad.trim();
  if (patch.precioUnitario !== undefined) row.precio_unitario = patch.precioUnitario;
  if (patch.activo !== undefined) row.activo = patch.activo;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("precios_mano_obra").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function deletePrecioManoObraAction(id: Id) {
  const { supabase } = await requireOrgContext();
  const { error } = await supabase.from("precios_mano_obra").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}
