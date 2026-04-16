"use server";

import { requireOrgContext } from "@/lib/data/auth-org";
import { revalidateAllDashboard } from "@/lib/actions/revalidate-dashboard";
import type { Id } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const CODIGO_ESP_RE = /^[A-Z0-9_]{1,64}$/;
const CODIGO_TRAB_RE = /^[A-Z0-9_]{1,64}$/;

function normalizeCodigoEspecialidad(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "_");
}

/** Slug interno único (tabla); la UI lista por índice 1..n. */
function codigoBaseFromNombre(nombre: string): string {
  const folded = nombre
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  let base = folded.length > 0 ? folded : "ESPECIALIDAD";
  if (base.length > 64) base = base.slice(0, 64);
  if (!CODIGO_ESP_RE.test(base)) base = "ESPECIALIDAD";
  return base;
}

async function allocateCodigoEspecialidad(
  supabase: SupabaseClient,
  orgId: string,
  nombre: string,
): Promise<string> {
  const base = codigoBaseFromNombre(nombre);

  for (let n = 0; n < 500; n++) {
    const suffix = n === 0 ? "" : `_${n}`;
    const maxBaseLen = Math.min(base.length, 64 - suffix.length);
    const candidate = (maxBaseLen > 0 ? base.slice(0, maxBaseLen) : "E") + suffix;
    if (!CODIGO_ESP_RE.test(candidate)) continue;

    const { data, error } = await supabase
      .from("especialidades")
      .select("id")
      .eq("organization_id", orgId)
      .eq("codigo", candidate)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;
  }
  throw new Error("No se pudo generar un código único para la especialidad.");
}

/** Slug interno único por especialidad; la UI lista por índice 1..n. */
async function allocateCodigoTrabajo(
  supabase: SupabaseClient,
  orgId: string,
  especialidadId: Id,
  nombre: string,
): Promise<string> {
  const base = codigoBaseFromNombre(nombre);

  for (let n = 0; n < 500; n++) {
    const suffix = n === 0 ? "" : `_${n}`;
    const maxBaseLen = Math.min(base.length, 64 - suffix.length);
    const candidate = (maxBaseLen > 0 ? base.slice(0, maxBaseLen) : "T") + suffix;
    if (!CODIGO_TRAB_RE.test(candidate)) continue;

    const { data, error } = await supabase
      .from("trabajos_especialidad")
      .select("id")
      .eq("organization_id", orgId)
      .eq("especialidad_id", especialidadId)
      .eq("codigo", candidate)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;
  }
  throw new Error("No se pudo generar un código único para el trabajo.");
}

async function assertEspecialidadEnOrg(especialidadId: Id) {
  const { supabase, orgId } = await requireOrgContext();
  const { data, error } = await supabase
    .from("especialidades")
    .select("id")
    .eq("id", especialidadId)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Especialidad no encontrada en tu organización.");
  return { supabase, orgId };
}

export async function createEspecialidadAction(input: {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}) {
  const { supabase, orgId } = await requireOrgContext();
  const codigo = await allocateCodigoEspecialidad(supabase, orgId, input.nombre);
  const { error } = await supabase.from("especialidades").insert({
    organization_id: orgId,
    codigo,
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    activo: input.activo ?? true,
  });
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function updateEspecialidadAction(
  id: Id,
  patch: {
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
  },
) {
  const { supabase, orgId } = await requireOrgContext();
  const row: Record<string, string | number | boolean | null> = {};
  if (patch.codigo !== undefined) {
    const c = normalizeCodigoEspecialidad(patch.codigo);
    if (!CODIGO_ESP_RE.test(c)) {
      throw new Error("Código: usar letras mayúsculas, números o guion bajo (máx. 64).");
    }
    row.codigo = c;
  }
  if (patch.nombre !== undefined) row.nombre = patch.nombre.trim();
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion.trim() || null;
  if (patch.activo !== undefined) row.activo = patch.activo;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase
    .from("especialidades")
    .update(row)
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function deleteEspecialidadAction(id: Id) {
  const { supabase, orgId } = await requireOrgContext();
  const { error } = await supabase
    .from("especialidades")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function createTrabajoEspecialidadAction(input: {
  especialidadId: Id;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}) {
  const { supabase, orgId } = await assertEspecialidadEnOrg(input.especialidadId);
  const codigo = await allocateCodigoTrabajo(supabase, orgId, input.especialidadId, input.nombre);
  const { error } = await supabase.from("trabajos_especialidad").insert({
    organization_id: orgId,
    especialidad_id: input.especialidadId,
    codigo,
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    activo: input.activo ?? true,
  });
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function updateTrabajoEspecialidadAction(
  id: Id,
  patch: {
    nombre?: string;
    descripcion?: string;
    activo?: boolean;
  },
) {
  const { supabase, orgId } = await requireOrgContext();
  const row: Record<string, string | number | boolean | null> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre.trim();
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion.trim() || null;
  if (patch.activo !== undefined) row.activo = patch.activo;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase
    .from("trabajos_especialidad")
    .update(row)
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function deleteTrabajoEspecialidadAction(id: Id) {
  const { supabase, orgId } = await requireOrgContext();
  const { error } = await supabase
    .from("trabajos_especialidad")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}
