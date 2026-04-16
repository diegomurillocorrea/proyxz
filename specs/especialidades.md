# Spec: Especialidades de trabajo

## 1. Resumen

Permitir que cada organización defina y mantenga un **catálogo de especialidades de trabajo** (por ejemplo: albañilería, estructura metálica, tablaroca, electricidad, plomería, pintura). Estas especialidades sirven como vocabulario común para describir **qué hace** un colaborador o **qué tipo de trabajo** predomina en un proyecto, sin mezclarlas con “tipo de proyecto” ni con precios de mano de obra.

**Requisito funcional principal:** dos niveles de catálogo con CRUD completo en cada nivel:

1. **CRUD de especialidades** — alta, listado, edición y baja (o desactivación) por organización.
2. **CRUD de trabajos dentro de cada especialidad** — cada especialidad contiene su propia lista de **trabajos** (tareas u oficios concretos bajo esa rama; por ejemplo, bajo “Albañilería”: vaciado de concreto, repello, instalación de block, etc.), también con CRUD completo **acotado a la especialidad padre**.

**Alcance MVP sugerido:** ambos CRUDs en dashboard + persistencia en Supabase con RLS por `organization_id` (y FK de trabajos → especialidad). Las relaciones con colaboradores o proyectos pueden ser **fase 2** (ver §7).

---

## 2. Objetivos de negocio

- Unificar nombres de oficios / ramas para reportes y asignaciones.
- Reducir texto libre repetido en notas de colaboradores u obras.
- Base para futuros filtros (“mostrar colaboradores con especialidad X”) o métricas por rama.

**No objetivos (MVP):** tarifas por especialidad, certificaciones, niveles (junior/senior), ni integración con cotizaciones salvo que se decida explícitamente.

---

## 3. Usuarios y historias

| Actor | Historia |
|--------|-----------|
| Admin de org | Quiero crear, editar y desactivar especialidades para que mi equipo use las mismas etiquetas. |
| Admin de org | Quiero un código corto estable (slug/código) para integraciones y seeds. |
| Admin de org | Dentro de una especialidad, quiero crear, editar y eliminar o desactivar **trabajos** que representen tareas concretas de esa rama. |
| Miembro | Quiero ver la lista de especialidades activas al asignar datos (cuando exista el vínculo con colaborador/proyecto). |
| Miembro | Quiero ver los trabajos de una especialidad al elegir granularidad fina (cuando exista el vínculo con colaborador/proyecto en fase 2 de §7). |

---

## 4. Modelo de dominio

### 4.1 Entidad: `Especialidad`

Campos conceptuales (alinear con `TipoProyecto` / `tipos_proyecto` en código y BD):

| Campo | Tipo | Reglas |
|--------|------|--------|
| `id` | UUID | PK |
| `organizationId` | UUID | FK a `organizations`, obligatorio |
| `codigo` | string | Único **por organización**. Mayúsculas y sin espacios recomendado (ej. `ALBANILERIA`, `ESTRUCTURA_METALICA`). |
| `nombre` | string | Obligatorio, legible (ej. “Albañilería”). |
| `descripcion` | string opcional | Texto auxiliar. |
| `activo` | boolean | Default `true`. Desactivar en lugar de borrar cuando ya esté en uso (fase 2). |
| `orden` | number opcional | Para ordenar en selects y listas (si no se usa, ordenar por `nombre`). |
| `createdAt` / `updatedAt` | timestamptz | Opcional pero recomendable en BD. |

**Relación:** una especialidad tiene **muchos** trabajos (`1 : N`). Los trabajos no existen “huérfanos” fuera de una especialidad en el modelo de producto.

### 4.2 Entidad: `Trabajo` (hijo de `Especialidad`)

Representa un ítem concreto catalogable bajo una especialidad (sinónimos aceptables en UI: “tarea de obra”, “partida de catálogo”; en datos usar nombre estable `trabajos`).

| Campo | Tipo | Reglas |
|--------|------|--------|
| `id` | UUID | PK |
| `organizationId` | UUID | Misma org que la especialidad; redundante para RLS cómodo **o** inferido solo vía `especialidad_id` si las políticas lo permiten (decisión de implementación). |
| `especialidadId` | UUID | FK a `especialidades`, obligatorio, `on delete cascade` (si se borra la especialidad, borrar sus trabajos) o `restrict` si se prefiere impedir borrado con hijos. |
| `codigo` | string opcional | Único **por especialidad** (o por organización si se prefiere unicidad global de códigos de trabajo). |
| `nombre` | string | Obligatorio (ej. “Repello interior”). |
| `descripcion` | string opcional | |
| `activo` | boolean | Default `true`. |
| `orden` | number | Default `0` para orden en listas. |
| `createdAt` / `updatedAt` | timestamptz | Recomendable. |

### 4.3 Relación con conceptos existentes

- **`tipos_proyecto`:** clasificación comercial/técnica del proyecto y cotización (tablaroca, electricidad en seed). **Distinto** de especialidad: un proyecto puede tener un tipo y varias especialidades en obra, o viceversa; no fusionar tablas en MVP salvo decisión explícita.
- **`colaboradores`:** en la fase de vínculos (§7), N:N `colaborador_especialidades` o array según convención del repo.
- **`proyectos`:** en la misma fase de vínculos, N:N o lista según necesidad de obra.
- **`precios_mano_obra` / partidas:** no confundir “trabajo” de este catálogo con partidas de cotización salvo que más adelante se **vincule** explícitamente (fuera de MVP).

---

## 5. Datos y Supabase

### 5.1 Tabla propuesta: `public.especialidades`

```sql
-- Borrador conceptual; la migración real debe incluir RLS y políticas alineadas al resto del esquema.
create table public.especialidades (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  codigo text not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, codigo)
);
```

### 5.2 Tabla propuesta: `public.trabajos_especialidad` (o `especialidad_trabajos`)

Nombre de tabla a fijar en migración; debe reflejar FK a especialidad.

```sql
create table public.trabajos_especialidad (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  especialidad_id uuid not null references public.especialidades (id) on delete cascade,
  codigo text,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (especialidad_id, codigo),
  constraint trabajos_especialidad_codigo_nn check (codigo is null or length(trim(codigo)) > 0)
);
create index trabajos_especialidad_especialidad_id_idx on public.trabajos_especialidad (especialidad_id);
```

- Restricción de consistencia: en `INSERT`/`UPDATE`, validar que `especialidades.organization_id` coincida con `organization_id` del trabajo (check en app o trigger en BD).

### 5.3 RLS

- Misma filosofía que `tipos_proyecto` / `clientes`: acceso solo a filas donde `organization_id` corresponde a la membresía del usuario autenticado.
- Para `trabajos_especialidad`, filtrar por `organization_id` de la fila (recomendado duplicar org en el hijo) o políticas que comprueben org vía join a `especialidades`.
- Políticas: `SELECT`, `INSERT`, `UPDATE` (y `DELETE` solo si el producto permite borrado físico; si no, basta con `activo = false`).

### 5.4 Semilla (`seed_new_organization`)

Opcional en MVP: insertar un conjunto mínimo de especialidades de ejemplo **por organización nueva**, por ejemplo:

- `ALBANILERIA` — Albañilería  
- `ESTRUCTURA_METALICA` — Estructura metálica  
- `TABLAROCA` — Tablaroca / drywall  
- `ELECTRICIDAD` — Electricidad  
- `PLOMERIA` — Plomería  
- `PINTURA` — Pintura  

(Valores ajustables según mercado El Salvador / naming del producto.)

Opcional: bajo cada especialidad sembrada, 1–2 trabajos de ejemplo (ej. Albañilería → “Repello”, “Vaciado de loza”).

---

## 6. Aplicación (Next.js / Proyxz)

### 6.1 Tipos TypeScript

En `lib/types.ts` (o módulo dedicado), añadir:

```ts
export interface Especialidad {
  id: Id;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
}

export interface TrabajoEspecialidad {
  id: Id;
  especialidadId: Id;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
}
```

### 6.2 Estado mock y carga

- Extender `lib/mock-org-state.ts`, `lib/org-state.ts` y `lib/data/load-org-state.ts` con `especialidades[]` y **`trabajosEspecialidad[]`** (o mapa anidado `especialidad.trabajos[]` según convenga al resto del estado).
- Si existe patrón de server actions para catálogos, reutilizarlo (validación Zod, revalidate paths).
- Server actions separadas o módulo único con prefijo claro: `createEspecialidad`, `updateEspecialidad`, … y `createTrabajoEspecialidad`, … siempre validando que `especialidadId` pertenezca a la org del usuario.

### 6.3 UI

**Especialidades (CRUD):**

- Ruta sugerida: `app/dashboard/especialidades/page.tsx` (o bajo configuración).
- Listado: tabla o cards con código, nombre, estado, acciones (editar / desactivar), y acceso explícito a **“Ver trabajos”** o contador de trabajos.
- Formulario: crear/editar especialidad con validación de código único por org.

**Trabajos (CRUD dentro de cada especialidad):**

- Ruta sugerida: `app/dashboard/especialidades/[especialidadId]/trabajos/page.tsx` (detalle de la especialidad + lista de trabajos) **o** panel lateral / drawer desde el listado principal, siempre con contexto de especialidad visible.
- Listado de trabajos filtrado por `especialidadId`; acciones crear / editar / desactivar (o eliminar).
- Crear trabajo: el `especialidadId` viene de la URL o del contexto; no permitir elegir especialidad de otra org.
- Navegación: enlace en el sidebar a “Especialidades”; breadcrumb `Especialidades → {nombre} → Trabajos`.

### 6.4 Validación

**Especialidad:**

- `codigo`: requerido, patrón seguro (ej. `^[A-Z0-9_]+$` con longitud máxima).
- `nombre`: requerido, longitud máxima razonable.
- `orden`: entero ≥ 0.

**Trabajo:**

- `nombre`: requerido.
- `codigo`: si se envía, mismo patrón y unicidad **por especialidad** (o regla acordada en §8).
- `orden`: entero ≥ 0.
- `especialidadId`: obligatorio y comprobación de pertenencia a la org.

---

## 7. Fases y criterios de aceptación

### Fase 1 — CRUD especialidades + CRUD trabajos (esta spec)

- [ ] Migración Supabase: tablas `especialidades` y `trabajos_especialidad` (o nombre final) + índices y restricciones.
- [ ] RLS en ambas tablas alineado al resto del esquema.
- [ ] Tipos TS y estado org (mock + Supabase) incluyendo trabajos anidados o en colección paralela con FK.
- [ ] Server actions: CRUD completo de especialidades; CRUD completo de trabajos **scoped** a `especialidadId`.
- [ ] UI: listado y formularios de especialidades; pantalla (o panel) de trabajos por especialidad con las mismas operaciones.
- [ ] Sin regresiones en builds y tipos.

### Fase 2 — Vínculos (spec aparte o anexo)

- [ ] Asignar especialidades (y/o trabajos) a `colaboradores` (N:N o según diseño).
- [ ] Opcional: asignar a `proyectos` o a entregables.
- [ ] Filtros y vistas que consuman esas relaciones.

---

## 8. Preguntas abiertas (decidir antes o durante implementación)

1. ¿Las especialidades deben **duplicar** nombres de `tipos_proyecto` (riesgo de confusión) o mantenerse **ortogonales** (recomendado: ortogonales + documentar en UI)?
2. ¿Borrado físico permitido si nunca se usó, o solo desactivación?
3. ¿Orden fijo por `orden` o alfabético por defecto?
4. ¿Traducciones / i18n del `nombre` en el futuro? (afecta si `nombre` es clave de negocio o solo display.)
5. ¿El `codigo` del trabajo es obligatorio o opcional? Si es opcional, la unicidad `(especialidad_id, codigo)` solo aplica cuando `codigo` no es null (PostgreSQL: índice único parcial).

---

## 9. Referencias en el repo

- Catálogo similar: `tipos_proyecto` en `supabase/migrations/20260413000000_proyxz_schema.sql` y tipo `TipoProyecto` en `lib/types.ts`.
- Multi-tenant y seed: función `public.seed_new_organization` en la misma migración.

---

## 10. Changelog del documento

| Fecha | Cambio |
|--------|--------|
| 2026-04-15 | Creación inicial del spec MVP + fase 2. |
| 2026-04-15 | CRUD anidado: trabajos por especialidad (modelo 1:N, tablas, UI, criterios). |
