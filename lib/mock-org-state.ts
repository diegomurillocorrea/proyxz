import type { OrgState } from "./org-state";
import {
  defaultOrgSettings,
  seedClientes,
  seedColaboradores,
  seedCotizaciones,
  seedEntregables,
  seedEstadosProyecto,
  seedEspecialidades,
  seedPrecios,
  seedProyectos,
  seedTipos,
  seedTrabajosEspecialidad,
} from "./seed";

function clone<T>(x: T): T {
  return structuredClone(x);
}

/** Datos demo cuando no hay Supabase configurado (desarrollo). */
export const mockOrgState: OrgState = {
  settings: clone(defaultOrgSettings),
  estadosProyecto: clone(seedEstadosProyecto),
  tiposProyecto: clone(seedTipos),
  preciosManoObra: clone(seedPrecios),
  clientes: clone(seedClientes),
  colaboradores: clone(seedColaboradores),
  cotizaciones: clone(seedCotizaciones),
  proyectos: clone(seedProyectos),
  entregables: clone(seedEntregables),
  especialidades: clone(seedEspecialidades),
  trabajosEspecialidad: clone(seedTrabajosEspecialidad),
};
