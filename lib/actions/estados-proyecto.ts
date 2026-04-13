"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidateAllDashboard } from "@/lib/actions/revalidate-dashboard";
import type { Id } from "@/lib/types";

export async function updateEstadoProyectoAction(
  id: Id,
  patch: { etiqueta?: string; activo?: boolean; orden?: number },
) {
  const supabase = await createClient();
  const row: Record<string, string | number | boolean> = {};
  if (patch.etiqueta !== undefined) row.etiqueta = patch.etiqueta;
  if (patch.activo !== undefined) row.activo = patch.activo;
  if (patch.orden !== undefined) row.orden = patch.orden;
  if (Object.keys(row).length === 0) return;

  const { error } = await supabase.from("estados_proyecto").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function reorderEstadosProyectoAction(orderedIds: Id[]) {
  const supabase = await createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("estados_proyecto")
      .update({ orden: i + 1 })
      .eq("id", orderedIds[i]);
    if (error) throw new Error(error.message);
  }
  revalidateAllDashboard();
}
