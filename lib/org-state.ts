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

/** Estado de dominio de la organización (UI + alineado a Postgres). */
export type OrgState = {
  settings: OrgSettings;
  estadosProyecto: EstadoProyecto[];
  tiposProyecto: TipoProyecto[];
  preciosManoObra: PrecioManoObra[];
  clientes: Cliente[];
  rolesColaborador: RolColaborador[];
  colaboradores: Colaborador[];
  cotizaciones: Cotizacion[];
  proyectos: Proyecto[];
  entregables: Entregable[];
};
