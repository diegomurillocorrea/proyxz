"use server";

import { requireOrgContext } from "@/lib/data/auth-org";
import { revalidateAllDashboard } from "@/lib/actions/revalidate-dashboard";
import type { Id } from "@/lib/types";

export async function createRolColaboradorAction(input: { nombre: string }) {
  const { supabase, orgId } = await requireOrgContext();
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("Nombre requerido.");

  const { data: last } = await supabase
    .from("roles_colaborador")
    .select("orden")
    .eq("organization_id", orgId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orden = (last?.orden ?? 0) + 1;

  const { error } = await supabase.from("roles_colaborador").insert({
    organization_id: orgId,
    nombre,
    orden,
    activo: true,
  });
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function updateRolColaboradorAction(
  id: Id,
  patch: { nombre?: string; activo?: boolean },
) {
  const { supabase } = await requireOrgContext();
  const row: Record<string, string | boolean> = {};
  if (patch.nombre !== undefined) {
    const n = patch.nombre.trim();
    if (!n) throw new Error("El nombre no puede quedar vacío.");
    row.nombre = n;
  }
  if (patch.activo !== undefined) row.activo = patch.activo;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("roles_colaborador").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function deleteRolColaboradorAction(id: Id) {
  const { supabase } = await requireOrgContext();
  const { error } = await supabase.from("roles_colaborador").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function reorderRolesColaboradorAction(orderedIds: Id[]) {
  const { supabase } = await requireOrgContext();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("roles_colaborador")
      .update({ orden: i + 1 })
      .eq("id", orderedIds[i]);
    if (error) throw new Error(error.message);
  }
  revalidateAllDashboard();
}
