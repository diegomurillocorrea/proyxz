"use server";

import { requireOrgContext } from "@/lib/data/auth-org";
import { revalidateAllDashboard } from "@/lib/actions/revalidate-dashboard";

export async function updateOrganizationSettingsAction(input: {
  name?: string;
  tasaIvaDefault?: number;
  estadoInicialProyectoSlug?: string;
}) {
  const { supabase, orgId } = await requireOrgContext();
  const row: Record<string, string | number> = {};
  if (input.name !== undefined) row.name = input.name.trim();
  if (input.tasaIvaDefault !== undefined) row.tasa_iva_default = input.tasaIvaDefault;
  if (input.estadoInicialProyectoSlug !== undefined) {
    row.estado_inicial_proyecto_slug = input.estadoInicialProyectoSlug.trim().toUpperCase();
  }
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("organizations").update(row).eq("id", orgId);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}
