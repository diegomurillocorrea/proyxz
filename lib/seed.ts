import type {
  Cliente,
  Colaborador,
  Cotizacion,
  Entregable,
  EstadoProyecto,
  OrgSettings,
  PrecioManoObra,
  Proyecto,
  RolColaborador,
  TipoProyecto,
} from "./types";

const ids = {
  est1: "est-cot",
  est2: "est-apr",
  est3: "est-prog",
  est4: "est-fin",
  tipo1: "tipo-tab",
  tipo2: "tipo-elec",
  cli1: "cli-1",
  col1: "col-1",
  cot1: "cot-1",
  proy1: "proy-1",
  ent1: "ent-1",
  pmo1: "pmo-1",
  pmo2: "pmo-2",
  rc1: "rol-col-1",
  rc2: "rol-col-2",
  rc3: "rol-col-3",
  rc4: "rol-col-4",
  rc5: "rol-col-5",
} as const;

export const defaultOrgSettings: OrgSettings = {
  moneda: "USD",
  tasaIvaDefault: 0.13,
  estadoInicialProyectoSlug: "APROBADO",
  organizationName: "Organización demo",
};

export const seedEstadosProyecto: EstadoProyecto[] = [
  { id: ids.est1, slug: "COTIZACION", etiqueta: "Cotización", orden: 1, activo: true },
  { id: ids.est2, slug: "APROBADO", etiqueta: "Aprobado", orden: 2, activo: true },
  { id: ids.est3, slug: "EN_PROGRESO", etiqueta: "En progreso", orden: 3, activo: true },
  { id: ids.est4, slug: "FINALIZADO", etiqueta: "Finalizado", orden: 4, activo: true },
];

export const seedTipos: TipoProyecto[] = [
  {
    id: ids.tipo1,
    codigo: "TABLAROCA",
    nombre: "Tablaroca / drywall",
    descripcion: "Muros, plafones, pastas",
    activo: true,
  },
  {
    id: ids.tipo2,
    codigo: "ELECTRICIDAD",
    nombre: "Electricidad",
    descripcion: "Instalaciones y luminarias",
    activo: true,
  },
];

export const seedPrecios: PrecioManoObra[] = [
  {
    id: ids.pmo1,
    tipoProyectoId: ids.tipo1,
    concepto: "Muro tablaroca 12.7 mm instalado",
    unidad: "m²",
    precioUnitario: 8.5,
    activo: true,
  },
  {
    id: ids.pmo2,
    tipoProyectoId: ids.tipo2,
    concepto: "Punto eléctrico (contacto + cableado básico)",
    unidad: "pza",
    precioUnitario: 12,
    activo: true,
  },
];

export const seedClientes: Cliente[] = [
  {
    id: ids.cli1,
    nombre: "Constructora Ejemplo S.A. de C.V.",
    telefono: "+503 7000-0000",
    email: "obras@ejemplo.sv",
    activo: true,
  },
];

export const seedRolesColaborador: RolColaborador[] = [
  { id: ids.rc1, nombre: "Maestro", orden: 1, activo: true },
  { id: ids.rc2, nombre: "Ayudante", orden: 2, activo: true },
  { id: ids.rc3, nombre: "Supervisor", orden: 3, activo: true },
  { id: ids.rc4, nombre: "Subcontratista", orden: 4, activo: true },
  { id: ids.rc5, nombre: "Otro", orden: 5, activo: true },
];

export const seedColaboradores: Colaborador[] = [
  {
    id: ids.col1,
    nombre: "Carlos Rivas",
    rol: "Maestro tablaroca",
    telefono: "+503 7777-1111",
  },
];

const partidasCot1 = [
  {
    id: "part-1",
    tipoProyectoId: ids.tipo1,
    concepto: "Muro tablaroca 12.7 mm instalado",
    unidad: "m²",
    cantidad: 120,
    precioUnitario: 8.5,
    orden: 1,
  },
  {
    id: "part-2",
    tipoProyectoId: ids.tipo2,
    concepto: "Punto eléctrico (contacto + cableado básico)",
    unidad: "pza",
    cantidad: 24,
    precioUnitario: 12,
    orden: 2,
  },
];

export const seedCotizaciones: Cotizacion[] = [
  {
    id: ids.cot1,
    folio: "COT-2026-0001",
    clienteId: ids.cli1,
    estado: "aceptada",
    fechaEmision: "2026-04-01",
    partidas: partidasCot1,
    tasaIva: 0.13,
    notas: "Obra residencial — cotización de ejemplo (mock).",
  },
];

export const seedProyectos: Proyecto[] = [
  {
    id: ids.proy1,
    nombre: "Residencial Las Magnolias — Tablaroca y eléctrico",
    clienteId: ids.cli1,
    cotizacionId: ids.cot1,
    estadoProyectoId: ids.est3,
    direccionObra: "San Salvador, colonia Escalón",
    descripcion: "Acabados interior — fase mock",
    colaboradorIds: [ids.col1],
  },
];

export const seedEntregables: Entregable[] = [
  {
    id: ids.ent1,
    proyectoId: ids.proy1,
    titulo: "Entrega de muros primer nivel",
    descripcion: "Inspección con residente de obra",
    estado: "pendiente",
    fechaObjetivo: "2026-04-20",
  },
];

export { montosCotizacion, subtotalCotizacion } from "./cotizacion-math";
