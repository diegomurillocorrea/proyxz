"use server";

import { requireOrgContext } from "@/lib/data/auth-org";
import { revalidateAllDashboard } from "@/lib/actions/revalidate-dashboard";
import type { Id } from "@/lib/types";

export async function createClienteAction(input: {
  nombre: string;
  telefono?: string;
  email?: string;
  notas?: string;
  activo?: boolean;
}) {
  const { supabase, orgId } = await requireOrgContext();
  const { error } = await supabase.from("clientes").insert({
    organization_id: orgId,
    nombre: input.nombre.trim(),
    telefono: input.telefono?.trim() || null,
    email: input.email?.trim() || null,
    notas: input.notas?.trim() || null,
    activo: input.activo ?? true,
  });
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function updateClienteAction(
  id: Id,
  patch: {
    nombre?: string;
    telefono?: string;
    email?: string;
    notas?: string;
    activo?: boolean;
  },
) {
  const { supabase } = await requireOrgContext();
  const row: Record<string, string | boolean | null> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre.trim();
  if (patch.telefono !== undefined) row.telefono = patch.telefono.trim() || null;
  if (patch.email !== undefined) row.email = patch.email.trim() || null;
  if (patch.notas !== undefined) row.notas = patch.notas.trim() || null;
  if (patch.activo !== undefined) row.activo = patch.activo;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("clientes").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function archiveClienteAction(id: Id) {
  await updateClienteAction(id, { activo: false });
}
