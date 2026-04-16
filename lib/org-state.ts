import type {
  Cliente,
  Colaborador,
  Cotizacion,
  Entregable,
  Especialidad,
  EstadoProyecto,
  OrgSettings,
  PrecioManoObra,
  Proyecto,
  TipoProyecto,
  TrabajoEspecialidad,
} from "./types";

/** Estado de dominio de la organización (UI + alineado a Postgres). */
export type OrgState = {
  settings: OrgSettings;
  estadosProyecto: EstadoProyecto[];
  tiposProyecto: TipoProyecto[];
  preciosManoObra: PrecioManoObra[];
  clientes: Cliente[];
  colaboradores: Colaborador[];
  cotizaciones: Cotizacion[];
  proyectos: Proyecto[];
  entregables: Entregable[];
  especialidades: Especialidad[];
  trabajosEspecialidad: TrabajoEspecialidad[];
};
