"use server";

import { requireOrgContext } from "@/lib/data/auth-org";
import { revalidateAllDashboard } from "@/lib/actions/revalidate-dashboard";
import type { Id } from "@/lib/types";

export async function createProyectoFromCotizacionAction(input: {
  cotizacionId: Id;
  nombre: string;
  direccionObra?: string;
  descripcion?: string;
}) {
  const { supabase, orgId } = await requireOrgContext();

  const { data: cot, error: cErr } = await supabase
    .from("cotizaciones")
    .select("id, cliente_id, estado, folio")
    .eq("id", input.cotizacionId)
    .single();
  if (cErr) throw new Error(cErr.message);
  if ((cot.estado as string) !== "aceptada") {
    throw new Error("La cotización debe estar en estado «aceptada» para crear el proyecto.");
  }

  const { count, error: pcErr } = await supabase
    .from("proyectos")
    .select("*", { count: "exact", head: true })
    .eq("cotizacion_id", input.cotizacionId);
  if (pcErr) throw new Error(pcErr.message);
  if (count && count > 0) {
    throw new Error("Ya existe un proyecto para esta cotización.");
  }

  const { data: org, error: oErr } = await supabase
    .from("organizations")
    .select("estado_inicial_proyecto_slug")
    .eq("id", orgId)
    .single();
  if (oErr) throw new Error(oErr.message);
  const slug = org.estado_inicial_proyecto_slug as string;

  const { data: est, error: eErr } = await supabase
    .from("estados_proyecto")
    .select("id")
    .eq("organization_id", orgId)
    .eq("slug", slug)
    .maybeSingle();
  if (eErr) throw new Error(eErr.message);
  if (!est) {
    throw new Error(`No se encontró el estado de proyecto con slug «${slug}».`);
  }

  const nombre =
    input.nombre.trim() ||
    `Obra — ${(cot.folio as string) ?? input.cotizacionId.slice(0, 8)}`;

  const { error: insErr } = await supabase.from("proyectos").insert({
    organization_id: orgId,
    nombre,
    cliente_id: cot.cliente_id as string,
    cotizacion_id: input.cotizacionId,
    estado_proyecto_id: est.id as string,
    direccion_obra: input.direccionObra?.trim() || null,
    descripcion: input.descripcion?.trim() || null,
  });
  if (insErr) throw new Error(insErr.message);
  revalidateAllDashboard();
}

export async function updateProyectoAction(
  id: Id,
  patch: {
    nombre?: string;
    direccionObra?: string;
    descripcion?: string;
    estadoProyectoId?: Id;
  },
) {
  const { supabase } = await requireOrgContext();
  const row: Record<string, string | null> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre.trim();
  if (patch.direccionObra !== undefined) row.direccion_obra = patch.direccionObra.trim() || null;
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion.trim() || null;
  if (patch.estadoProyectoId !== undefined) row.estado_proyecto_id = patch.estadoProyectoId;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("proyectos").update(row).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAllDashboard();
}

export async function setProyectoColaboradoresAction(proyectoId: Id, colaboradorIds: Id[]) {
  const { supabase } = await requireOrgContext();
  const { error: dErr } = await supabase.from("proyecto_colaboradores").delete().eq("proyecto_id", proyectoId);
  if (dErr) throw new Error(dErr.message);
  if (colaboradorIds.length === 0) {
    revalidateAllDashboard();
    return;
  }
  const { error: iErr } = await supabase.from("proyecto_colaboradores").insert(
    colaboradorIds.map((colaborador_id) => ({
      proyecto_id: proyectoId,
      colaborador_id,
    })),
  );
  if (iErr) throw new Error(iErr.message);
  revalidateAllDashboard();
}
