import type { SupabaseClient } from "@supabase/supabase-js";
import type { OrgState } from "@/lib/org-state";
import type {
  Cliente,
  Colaborador,
  Cotizacion,
  CotizacionDocEstado,
  Entregable,
  EstadoProyecto,
  Id,
  OrgSettings,
  PartidaCotizacion,
  PrecioManoObra,
  Proyecto,
  RolColaborador,
  TipoProyecto,
} from "@/lib/types";

type OrgRow = {
  moneda: string;
  tasa_iva_default: string | number;
  estado_inicial_proyecto_slug: string;
};

export async function loadOrgState(supabase: SupabaseClient): Promise<OrgState> {
  const { data: orgRows, error: orgErr } = await supabase
    .from("organizations")
    .select("moneda, tasa_iva_default, estado_inicial_proyecto_slug, name")
    .limit(1);

  if (orgErr) throw orgErr;
  const org = orgRows?.[0];
  if (!org) {
    throw new Error("No hay organización para este usuario.");
  }

  const settings: OrgSettings = {
    moneda: "USD",
    tasaIvaDefault: Number((org as OrgRow).tasa_iva_default),
    estadoInicialProyectoSlug: (org as OrgRow).estado_inicial_proyecto_slug,
    organizationName: (org as OrgRow & { name?: string }).name,
  };

  const [
    { data: estRows, error: e1 },
    { data: tiposRows, error: e2 },
    { data: precRows, error: e3 },
    { data: cliRows, error: e4 },
    { data: rolesColabRows, error: eRoles },
    { data: colRows, error: e5 },
    { data: cotRows, error: e6 },
    { data: proyRows, error: e7 },
    { data: entRows, error: e8 },
  ] = await Promise.all([
    supabase.from("estados_proyecto").select("*").order("orden", { ascending: true }),
    supabase.from("tipos_proyecto").select("*").order("codigo", { ascending: true }),
    supabase.from("precios_mano_obra").select("*"),
    supabase.from("clientes").select("*").order("nombre", { ascending: true }),
    supabase.from("roles_colaborador").select("*").order("orden", { ascending: true }),
    supabase.from("colaboradores").select("*").order("nombre", { ascending: true }),
    supabase.from("cotizaciones").select("*").order("fecha_emision", { ascending: false }),
    supabase.from("proyectos").select("*"),
    supabase.from("entregables").select("*"),
  ]);

  const errs = [e1, e2, e3, e4, eRoles, e5, e6, e7, e8].filter(Boolean);
  if (errs.length) throw errs[0];

  const cotizacionIds = (cotRows ?? []).map((c: { id: string }) => c.id);
  let partidasByCot = new Map<string, PartidaCotizacion[]>();
  if (cotizacionIds.length > 0) {
    const { data: partRows, error: ep } = await supabase
      .from("partidas_cotizacion")
      .select("*")
      .in("cotizacion_id", cotizacionIds)
      .order("orden", { ascending: true });
    if (ep) throw ep;
    partidasByCot = new Map();
    for (const p of partRows ?? []) {
      const row = p as {
        id: string;
        cotizacion_id: string;
        tipo_proyecto_id: string;
        concepto: string;
        unidad: string;
        cantidad: string | number;
        precio_unitario: string | number;
        orden: number;
      };
      const partida: PartidaCotizacion = {
        id: row.id,
        tipoProyectoId: row.tipo_proyecto_id,
        concepto: row.concepto,
        unidad: row.unidad,
        cantidad: Number(row.cantidad),
        precioUnitario: Number(row.precio_unitario),
        orden: row.orden,
      };
      const list = partidasByCot.get(row.cotizacion_id) ?? [];
      list.push(partida);
      partidasByCot.set(row.cotizacion_id, list);
    }
  }

  const proyectoIds = (proyRows ?? []).map((p: { id: string }) => p.id);
  let colabsByProyecto = new Map<string, Id[]>();
  if (proyectoIds.length > 0) {
    const { data: pcRows, error: epc } = await supabase
      .from("proyecto_colaboradores")
      .select("proyecto_id, colaborador_id")
      .in("proyecto_id", proyectoIds);
    if (epc) throw epc;
    colabsByProyecto = new Map();
    for (const r of pcRows ?? []) {
      const row = r as { proyecto_id: string; colaborador_id: string };
      const list = colabsByProyecto.get(row.proyecto_id) ?? [];
      list.push(row.colaborador_id);
      colabsByProyecto.set(row.proyecto_id, list);
    }
  }

  const estadosProyecto: EstadoProyecto[] = (estRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    slug: r.slug as string,
    etiqueta: r.etiqueta as string,
    orden: r.orden as number,
    activo: r.activo as boolean,
  }));

  const tiposProyecto: TipoProyecto[] = (tiposRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    codigo: r.codigo as string,
    nombre: r.nombre as string,
    descripcion: (r.descripcion as string | null) ?? undefined,
    activo: r.activo as boolean,
  }));

  const preciosManoObra: PrecioManoObra[] = (precRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    tipoProyectoId: r.tipo_proyecto_id as string,
    concepto: r.concepto as string,
    unidad: r.unidad as string,
    precioUnitario: Number(r.precio_unitario),
    activo: r.activo as boolean,
  }));

  const clientes: Cliente[] = (cliRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    nombre: r.nombre as string,
    telefono: (r.telefono as string | null) ?? undefined,
    email: (r.email as string | null) ?? undefined,
    notas: (r.notas as string | null) ?? undefined,
    activo: r.activo as boolean,
  }));

  const rolesColaborador: RolColaborador[] = (rolesColabRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    nombre: r.nombre as string,
    orden: r.orden as number,
    activo: r.activo as boolean,
  }));

  const colaboradores: Colaborador[] = (colRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    nombre: r.nombre as string,
    rol: (r.rol as string | null) ?? undefined,
    telefono: (r.telefono as string | null) ?? undefined,
    email: (r.email as string | null) ?? undefined,
    notas: (r.notas as string | null) ?? undefined,
  }));

  const cotizaciones: Cotizacion[] = (cotRows ?? []).map((r: Record<string, unknown>) => {
    const id = r.id as string;
    return {
      id,
      folio: r.folio as string,
      clienteId: r.cliente_id as string,
      estado: r.estado as CotizacionDocEstado,
      fechaEmision: String(r.fecha_emision),
      partidas: partidasByCot.get(id) ?? [],
      tasaIva: Number(r.tasa_iva),
      notas: (r.notas as string | null) ?? undefined,
    };
  });

  const proyectos: Proyecto[] = (proyRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    nombre: r.nombre as string,
    clienteId: r.cliente_id as string,
    cotizacionId: r.cotizacion_id as string,
    estadoProyectoId: r.estado_proyecto_id as string,
    direccionObra: (r.direccion_obra as string | null) ?? undefined,
    descripcion: (r.descripcion as string | null) ?? undefined,
    colaboradorIds: colabsByProyecto.get(r.id as string) ?? [],
  }));

  const entregables: Entregable[] = (entRows ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    proyectoId: r.proyecto_id as string,
    titulo: r.titulo as string,
    descripcion: (r.descripcion as string | null) ?? undefined,
    estado: r.estado as Entregable["estado"],
    fechaObjetivo: r.fecha_objetivo ? String(r.fecha_objetivo) : undefined,
    fechaEntregaReal: r.fecha_entrega_real ? String(r.fecha_entrega_real) : undefined,
  }));

  return {
    settings,
    estadosProyecto,
    tiposProyecto,
    preciosManoObra,
    clientes,
    rolesColaborador,
    colaboradores,
    cotizaciones,
    proyectos,
    entregables,
  };
}
