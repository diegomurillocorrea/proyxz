"use server";

import { requireOrgContext } from "@/lib/data/auth-org";
import { revalidateAllDashboard } from "@/lib/actions/revalidate-dashboard";
import type { Id } from "@/lib/types";

function toSafeErrorMessage(err: unknown) {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : typeof err === "object" && err && "message" in err
          ? String((err as { message?: unknown }).message ?? "")
          : "";

  const message = raw.trim();
  if (!message) return "Error inesperado. Intentá nuevamente.";

  try {
    const parsed = JSON.parse(message) as { message?: unknown };
    const nested = typeof parsed?.message === "string" ? parsed.message : "";
    if (nested && (nested.includes("<html") || nested.toLowerCase().includes("cloudflare"))) {
      return "Servicio temporalmente no disponible. Intentá de nuevo en unos segundos.";
    }
  } catch {
    // ignore invalid JSON message
  }

  if (message.includes("<html") || message.toLowerCase().includes("cloudflare")) {
    return "Servicio temporalmente no disponible. Intentá de nuevo en unos segundos.";
  }

  return message;
}

export async function createColaboradorAction(input: {
  nombre: string;
  rol?: string;
  telefono?: string;
  email?: string;
  notas?: string;
}) {
  try {
    const { supabase, orgId } = await requireOrgContext();
    const { error } = await supabase.from("colaboradores").insert({
      organization_id: orgId,
      nombre: input.nombre.trim(),
      rol: input.rol?.trim() || null,
      telefono: input.telefono?.trim() || null,
      email: input.email?.trim() || null,
      notas: input.notas?.trim() || null,
    });
    if (error) throw new Error(error.message);
    revalidateAllDashboard();
  } catch (err) {
    throw new Error(toSafeErrorMessage(err));
  }
}

export async function updateColaboradorAction(
  id: Id,
  patch: {
    nombre?: string;
    rol?: string;
    telefono?: string;
    email?: string;
    notas?: string;
  },
) {
  try {
    const { supabase } = await requireOrgContext();
    const row: Record<string, string | null> = {};
    if (patch.nombre !== undefined) row.nombre = patch.nombre.trim();
    if (patch.rol !== undefined) row.rol = patch.rol.trim() || null;
    if (patch.telefono !== undefined) row.telefono = patch.telefono.trim() || null;
    if (patch.email !== undefined) row.email = patch.email.trim() || null;
    if (patch.notas !== undefined) row.notas = patch.notas.trim() || null;
    if (Object.keys(row).length === 0) return;
    const { error } = await supabase.from("colaboradores").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    revalidateAllDashboard();
  } catch (err) {
    throw new Error(toSafeErrorMessage(err));
  }
}

export async function deleteColaboradorAction(id: Id) {
  try {
    const { supabase } = await requireOrgContext();
    const { count, error: cErr } = await supabase
      .from("proyecto_colaboradores")
      .select("*", { count: "exact", head: true })
      .eq("colaborador_id", id);
    if (cErr) throw new Error(cErr.message);
    if (count && count > 0) {
      throw new Error("No se puede eliminar: está asignado a un proyecto.");
    }
    const { error } = await supabase.from("colaboradores").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidateAllDashboard();
  } catch (err) {
    throw new Error(toSafeErrorMessage(err));
  }
}
