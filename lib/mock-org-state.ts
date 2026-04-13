import type { OrgState } from "./org-state";
import {
  defaultOrgSettings,
  seedClientes,
  seedColaboradores,
  seedCotizaciones,
  seedEntregables,
  seedEstadosProyecto,
  seedPrecios,
  seedProyectos,
  seedRolesColaborador,
  seedTipos,
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
  rolesColaborador: clone(seedRolesColaborador),
  colaboradores: clone(seedColaboradores),
  cotizaciones: clone(seedCotizaciones),
  proyectos: clone(seedProyectos),
  entregables: clone(seedEntregables),
};
