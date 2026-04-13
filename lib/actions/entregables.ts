"use server";

import { requireOrgContext } from "@/lib/data/auth-org";
import { revalidateAllDashboard } from "@/lib/actions/revalidate-dashboard";
import type { Entregable, Id } from "@/lib/types";

export async function createEntregableAction(input: {
  proyectoId: Id;
  titulo: string;
  descripcion?: string;
  estado: Entregable["estado"];
  fechaObjetivo?: string;
}) {
  const { supabase, orgId } = await requireOrgContext();
  const { error } = await supabase.from("entregables").insert({
    organization_id: orgId,
    proyecto_id: input.proyectoId,
    titulo: input.titulo.trim(),
    descripcion: input.descripcion?.trim() || null,
    estado: input.estado,
    fecha_objetivo: input.fechaObjetivo || null,
  });
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function updateEntregableAction(
  id: Id,
  patch: {
    titulo?: string;
    descripcion?: string;
    estado?: Entregable["estado"];
    fechaObjetivo?: string;
    fechaEntregaReal?: string;
  },
) {
  const { supabase } = await requireOrgContext();
  const row: Record<string, string | null> = {};
  if (patch.titulo !== undefined) row.titulo = patch.titulo.trim();
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion.trim() || null;
  if (patch.estado !== undefined) row.estado = patch.estado;
  if (patch.fechaObjetivo !== undefined) row.fecha_objetivo = patch.fechaObjetivo || null;
  if (patch.fechaEntregaReal !== undefined) row.fecha_entrega_real = patch.fechaEntregaReal || null;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("entregables").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function deleteEntregableAction(id: Id) {
  const { supabase } = await requireOrgContext();
  const { error } = await supabase.from("entregables").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}
