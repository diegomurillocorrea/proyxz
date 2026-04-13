/** Tipos alineados a spec.md Proyxz — fase mock en memoria */

export type Id = string;

export type CotizacionDocEstado =
  | "borrador"
  | "enviada"
  | "aceptada"
  | "rechazada"
  | "vencida";

export interface EstadoProyecto {
  id: Id;
  slug: string;
  etiqueta: string;
  orden: number;
  activo: boolean;
}

export interface TipoProyecto {
  id: Id;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface PrecioManoObra {
  id: Id;
  tipoProyectoId: Id;
  concepto: string;
  unidad: string;
  precioUnitario: number;
  activo: boolean;
}

export interface Cliente {
  id: Id;
  nombre: string;
  telefono?: string;
  email?: string;
  notas?: string;
  activo: boolean;
}

export interface Colaborador {
  id: Id;
  nombre: string;
  rol?: string;
  telefono?: string;
  email?: string;
  notas?: string;
}

/** Maestro global por organización — roles sugeridos en agenda (spec §8.1). */
export interface RolColaborador {
  id: Id;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface PartidaCotizacion {
  id: Id;
  tipoProyectoId: Id;
  concepto: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  orden: number;
}

export interface Cotizacion {
  id: Id;
  folio: string;
  clienteId: Id;
  estado: CotizacionDocEstado;
  fechaEmision: string;
  partidas: PartidaCotizacion[];
  /** Tasa IVA El Salvador 0.13 por defecto */
  tasaIva: number;
  notas?: string;
}

export interface Proyecto {
  id: Id;
  nombre: string;
  clienteId: Id;
  cotizacionId: Id;
  estadoProyectoId: Id;
  direccionObra?: string;
  descripcion?: string;
  colaboradorIds: Id[];
}

export interface Entregable {
  id: Id;
  proyectoId: Id;
  titulo: string;
  descripcion?: string;
  estado: "pendiente" | "en_progreso" | "entregado" | "rechazado";
  fechaObjetivo?: string;
  fechaEntregaReal?: string;
}

export interface OrgSettings {
  moneda: "USD";
  tasaIvaDefault: number;
  estadoInicialProyectoSlug: string;
  /** Nombre visible de la organización (tabla organizations). */
  organizationName?: string;
}
