# Especificación del producto — DAIEGO Proyxz

## 0. Cómo usar este documento

Este archivo es la **fuente de verdad** de lo que Proyxz debe hacer: dominio de negocio, datos, flujos y prioridades. Cualquier desarrollo (UI, API, base de datos) debe **alinearse con el spec**; si algo cambia, **actualiza primero este documento** y luego el código.

**Versión del documento:** ver sección [Historial](#21-historial-del-documento).

---

## 1. Resumen ejecutivo

**DAIEGO Proyxz** es una aplicación web para **gestionar proyectos de construcción y acabados**: desde el contacto con el **cliente** y la **cotización**, pasando por **colaboradores**, **tipos de obra**, **estados del proyecto** (catálogo **administrable** por la organización) y **entregables**, hasta el seguimiento operativo. Está orientada a oficios como **tablaroca (drywall)**, **albañilería**, **cielo falso**, **electricidad** y otras especialidades configurables.

**Objetivo central:** una sola herramienta donde la empresa registre **cotizaciones** (siempre antes de abrir un proyecto), con **obra multiparte** (varias especialidades en la misma cotización/proyecto vía partidas), use **precios de mano de obra** por tipo de obra, asigne **colaboradores como agenda** (sin cuenta en la app), y visualice **estado** y **entregables** con **IVA desglosado** según normativa de **El Salvador** (**13%**) y moneda **dólar estadounidense (USD)**.

---

## 2. Visión y objetivos

| Objetivo | Descripción |
|----------|-------------|
| **Unificar** | Clientes, proyectos, cotizaciones, colaboradores y catálogos (tipos de obra, precios, **estados de proyecto**) en un mismo sistema. |
| **Estandarizar** | Tipos de proyecto y listas de precios de mano de obra por tipo, para cotizar de forma repetible y comparable. |
| **Seguir** | Estados del proyecto (**configurables a nivel organización**) y entregables claros para saber en qué etapa está cada obra. |
| **Colaborar** | Colaboradores de **agenda** asignados a proyectos (contacto en obra; sin login — [§8](#8-colaboradores)). |

**No es (por ahora) un reemplazo completo de:** contabilidad general, nómina legal detallada, BIM/CAD, ni inventario de materiales a nivel ERP — salvo que se amplíe el spec en una versión posterior.

---

## 3. Usuarios y contexto

### 3.1 Perfiles previstos

| Perfil | Necesidad principal |
|--------|---------------------|
| **Administrador / dueño** | Configurar tipos de proyecto, precios de mano de obra, **catálogo global de estados de proyecto**, usuarios o permisos; ver todos los proyectos y reportes básicos. |
| **Coordinador / estimador** | Crear clientes y cotizaciones; al aceptar cotización, generar proyecto; asignar colaboradores de agenda; actualizar estados y entregables. |
| **Colaborador (agenda)** | No es usuario de la aplicación: es contacto asignable a obras (ver [§8.3](#83-colaboradores-solo-agenda)). |

Los roles con **login** (administrador, coordinador, etc.) se implementarán con el proveedor de auth elegido ([§18](#18-stack-técnico-y-persistencia)). Este spec define **qué datos y acciones** existen en el dominio.

### 3.2 Contexto de uso

- Obra y oficina: interfaz usable en **escritorio** prioritariamente; **tablet/móvil** deseable para consulta rápida en segunda fase si el spec lo mantiene explícito.

---

## 4. Especialidades y tipos de proyecto (dominio)

### 4.1 Catálogo inicial sugerido

El sistema debe permitir **tipos de proyecto configurables**. Como referencia de negocio, se contemplan al menos:

| Código sugerido | Nombre | Notas |
|-----------------|--------|--------|
| `TABLAROCA` | Tablaroca / drywall | Muros, plafones, detalles, pastas, lijado. |
| `ALBANILERIA` | Albañilería | Muros, aplanados, mampostería, castillos/cadenas según mercado. |
| `CIELO_FALSO` | Cielo falso | Suspensiones, losetas/paneles, accesorios. |
| `ELECTRICIDAD` | Electricidad | Instalaciones, contactos, luminarias, tableros (alcance según licencias locales). |
| `PLOMERIA` | Plomería | Opcional en catálogo inicial si aplica al negocio. |
| `PINTURA` | Pintura | Opcional. |
| `OTRO` | Otro / genérico | Para obras mixtas o hasta definir subtipo. |

**Regla:** ningún tipo queda “hardcodeado” solo en UI; deben existir en **datos maestros** (tabla o equivalente) para poder agregar, desactivar o renombrar sin desplegar código.

### 4.2 Obra multiparte (decisión de producto)

- **Desde el inicio** el modelo es **multiparte:** una misma cotización (y el proyecto que de ella nace) puede incluir **varias especialidades**.
- La especialidad **no** se fija solo a nivel “proyecto único tipo”: cada **partida** de cotización va asociada a un **tipo de proyecto** (maestro), de modo que una obra puede combinar, por ejemplo, tablaroca + electricidad + cielo falso en un solo folio.
- Opcional en UI: mostrar resumen “especialidades involucradas” como lista derivada de las partidas.

---

## 5. Glosario

| Término | Significado en Proyxz |
|---------|------------------------|
| **Cliente** | Persona u organización que contrata la obra. |
| **Proyecto** | Instancia de obra vinculada a un cliente; **solo existe** tras una cotización **aceptada** (ver [§12](#12-cotizaciones)). Puede agrupar varias especialidades vía partidas. |
| **Tipo de proyecto** | Especialidad del catálogo maestro (tablaroca, electricidad, etc.); se asocia principalmente a **cada partida** para precios y reporteo multiparte. |
| **Cotización** | Propuesta formal **previa** al proyecto: partidas (cada una con tipo de obra), subtotales, **IVA** y total; al **aceptarla** se habilita crear el proyecto. Tiene su propio **estado de documento** (borrador, enviada, aceptada…), distinto del **estado del proyecto** en obra. |
| **Partida** | Renglón de cotización: concepto, unidad, cantidad, precio unitario, subtotal, **tipo de proyecto** (obligatorio para coherencia con precios de mano de obra y multiparte). |
| **Precio de mano de obra** | Tarifa de referencia por unidad de medida y **tipo de proyecto** (p. ej. m² de tablaroca instalado). |
| **Colaborador** | Persona en **agenda** (contacto de obra); **sin** usuario ni contraseña en Proyxz. |
| **Estado del proyecto** | Etapa del ciclo de vida definida en el **maestro administrable** de la organización (ver [§10](#10-estados-del-proyecto-catálogo-administrable)). |
| **Entregable** | Resultado verificable (documento, firma, foto, acta, etc.) asociado a una fecha o hito. |

---

## 6. Modelo conceptual de datos (entidades y relaciones)

Descripción lógica para que implementación (DB + API) sea consistente.

```
Cliente 1 ── * Cotización ── * PartidaCotización ── 1 TipoDeProyecto
       │            │
       │            └── (sin Proyecto hasta aceptar; ver flujo)
       │
       └── * Proyecto  ─── 1 Cotización (aceptada, origen obligatorio)
              │          └── 1 EstadoProyecto (FK catálogo administrable)
              │
              ├── * AsignaciónProyectoColaborador ── 1 Colaborador (agenda)
              │
              ├── * Entregable
              │
              └── * HistorialEstadoProyecto (cambios de estado en el tiempo)

Organización 1 ── * EstadoProyecto (etiqueta, slug, orden, activo; editable en config global)
TipoDeProyecto 1 ── * PrecioManoObra (tarifas por unidad)
```

**Relaciones clave:**

- **Cotización siempre antes del proyecto:** no existe proyecto sin **cotización de origen** en estado **aceptada** (relación 1:1 recomendada en MVP: un proyecto nace de una cotización aceptada).
- **Multiparte:** cada **partida** referencia un **tipo de proyecto**; una cotización/proyecto puede mezclar especialidades.
- Una **cotización** pertenece a un **cliente**; **no** está ligada a un proyecto hasta que el proyecto se crea **a partir** de esa cotización aceptada.
- **Precios de mano de obra** dependen del **tipo de proyecto** (y unidad: m², ml, pza, viaje, etc.) y alimentan sugerencias al capturar partidas.
- **Colaboradores** (agenda) se ligan a proyectos mediante asignación; no tienen credenciales en el sistema.
- **Estado actual del proyecto** referencia una fila del maestro **EstadoProyecto** de la misma **organización** ([§10](#10-estados-del-proyecto-catálogo-administrable)).

---

## 7. Clientes

### 7.1 Datos mínimos

- Nombre o razón social.
- RFC / identificador fiscal (opcional según país).
- Contacto: teléfono, correo, dirección fiscal o de obra (campos flexibles).
- Notas internas.
- Estado: activo / inactivo.

### 7.2 Comportamiento

- No se debe borrar un cliente con proyectos activos sin flujo explícito (archivo o restricción); el spec recomienda **archivar** en lugar de eliminar en duro.

---

## 8. Colaboradores

### 8.1 Datos mínimos

- Nombre completo.
- Rol sugerido: maestro, ayudante, supervisor, subcontratista, otro (configurable en datos maestros si se desea).
- Contacto.
- Notas (especialidad, disponibilidad).

### 8.2 Asignación a proyecto

- Relación muchos a muchos: un colaborador en varios proyectos; un proyecto con varios colaboradores.
- Campos útiles: fecha de inicio/fin en obra, tipo de participación, costo interno opcional (fase posterior si no va en MVP).

### 8.3 Colaboradores solo agenda

- Los colaboradores son **registro de contacto** (catálogo de personas de confianza / cuadrilla / subcontratistas).
- **No** tienen cuenta en la app: no inician sesión, no tienen rol de aplicación ni permisos propios.
- Cualquier “responsable” de entregable o acción en sistema es un **usuario con login** (coordinador, admin), no un colaborador de agenda.

---

## 9. Tipos de proyecto (maestro)

- CRUD protegido (solo admin o rol equivalente).
- Campos: nombre, código interno, descripción, orden de visualización, **activo**.
- Los proyectos nuevos solo consumen tipos **activos** indirectamente vía **partidas** (y catálogos de precio); la captura de partidas solo ofrece tipos activos.

---

## 10. Estados del proyecto (catálogo administrable)

### 10.1 Principio

- Los estados de proyecto **no** están fijos en código como única verdad: son un **maestro global por organización**.
- La edición (altas, bajas lógicas, renombre de etiqueta, orden) ocurre en una sección de **configuración general** aplicable a **toda** la empresa u organización — **no** es una configuración “por proyecto” en el sentido de que cada obra tenga su propia lista de estados; **todos los proyectos** comparten el mismo catálogo de la org.
- La UI de listados, filtros y kanban (si existe) debe leer siempre del catálogo activo.

### 10.2 Semilla por defecto al crear la organización

Orden sugerido para el flujo típico; la org puede renombrar etiquetas, reordenar o añadir más estados.

| Orden | Etiqueta en pantalla (ejemplo) | Slug interno (estable, no cambiar a la ligera) |
|------:|-------------------------------|--------------------------------------------------|
| 1 | Cotización | `COTIZACION` |
| 2 | Aprobado | `APROBADO` |
| 3 | En progreso | `EN_PROGRESO` |
| 4 | Finalizado | `FINALIZADO` |

**Nota de negocio:** el proyecto **solo se crea** tras cotización **aceptada** ([§12](#12-cotizaciones)). El estado sembrado **Cotización** queda disponible si la operación quiere reflejar una fase interna posterior (p. ej. ajustes de alcance) o puede quedar sin usar; el **estado inicial** al generar el proyecto se define en [§10.6](#106-estado-inicial-al-crear-el-proyecto).

### 10.3 Campos mínimos del maestro `EstadoProyecto`

- **Etiqueta** (texto visible; editable).
- **Slug** (identificador interno para lógica, reportes y migraciones; **inmutable** tras crear salvo herramienta avanzada).
- **Orden** (entero para pipelines y selects).
- **Activo** (boolean): los inactivos no se asignan a proyectos nuevos; los proyectos que ya los tenían pueden mantenerlos hasta migración explícita.
- Opcional: color para UI, descripción interna.

### 10.4 Pantalla de administración (configuración general)

- Listar estados de la organización.
- Crear nuevo estado, editar **etiqueta** y **orden**, activar/desactivar.
- **Eliminación:** no borrar físicamente si existen proyectos en ese estado; ofrecer **desactivar** y/o **migrar** proyectos a otro estado antes de ocultar.
- Solo perfiles con permiso de administración (ver [§3.1](#31-perfiles-previstos)).

### 10.5 Transiciones y auditoría

- **MVP:** permitir cambiar el estado de un proyecto a **cualquier otro estado activo** del catálogo, con registro de **historial** (estado anterior, estado nuevo, usuario, fecha). Esto respeta que el negocio puede reordenar el pipeline sin que el código imponga un grafo rígido.
- **Fase posterior (opcional):** matriz de transiciones permitidas por slug, si la org lo requiere.
- Cuando exista backend (Supabase), las reglas de integridad y el historial deben validarse en **servidor**, no solo en cliente.

### 10.6 Estado inicial al crear el proyecto

- Ajuste por organización: **`estadoInicialProyectoId`** (o equivalente) apuntando a una fila del maestro.
- **Valor por defecto del producto** si no se configura: estado sembrado con slug **`APROBADO`** (coherente con que la cotización ya fue **aceptada** antes de existir el proyecto).

### 10.7 Aclaración: estado del proyecto “Cotización” vs estado del documento cotización

- El **estado del documento cotización** (borrador, enviada, aceptada, rechazada, vencida) vive en el módulo de cotizaciones ([§12](#12-cotizaciones)).
- La etiqueta sembrada **Cotización** en el **maestro de estados del proyecto** es otro concepto: etapa de la **obra** en el tablero operativo. Si en pantalla genera confusión, la org puede **renombrar la etiqueta** (p. ej. “Pre-arranque” o “Planificación”) **sin** cambiar el slug `COTIZACION` salvo migración controlada.

---

## 11. Entregables

### 11.1 Definición

Un **entregable** es un hito verificable ligado a un proyecto: puede ser documental, fotográfico o una checklist.

### 11.2 Datos mínimos

- Título y descripción.
- Fecha objetivo y fecha real de entrega.
- Estado: pendiente / en progreso / entregado / rechazado (con comentario).
- **Responsable:** usuario con login (coordinador/admin). Opcional “contacto en obra” referenciando colaborador de agenda **sin** acceso al sistema.
- Adjuntos (fase 2 si el almacenamiento no está en MVP).

---

## 12. Cotizaciones

### 12.1 Propósito

Formalizar precios y alcance **antes** de existir un proyecto. **Regla de negocio:** toda obra (**proyecto**) debe tener una cotización **aceptada** de la cual nace; no hay “alta de proyecto” sin ese antecedente.

### 12.2 Datos de la cotización

- Folio o número legible.
- Cliente (obligatorio).
- **Sin proyecto** al crear: el proyecto se genera **después**, cuando la cotización pasa a **aceptada** (flujo explícito: aceptar → crear proyecto vinculado).
- **Moneda:** **USD** (dólar estadounidense) como moneda por defecto de la organización; El Salvador opera con dólar estadounidense.
- Fecha de emisión, vigencia hasta.
- Estado: borrador / enviada / aceptada / rechazada / vencida.
- **Montos e IVA — El Salvador:**
  - **Subtotal:** suma de subtotales de partidas **antes** de impuestos (base imponible).
  - **Tasa de IVA:** tasa general **13%** (Ley del IVA de El Salvador; gravamen estándar sobre la mayoría de bienes y servicios). Por defecto en cotización **13%**; la org podría permitir en el futuro excepciones documentadas (exentos / tasas especiales) si el spec y el asesor fiscal lo amplían.
  - **Monto IVA:** subtotal × 0,13 (mostrado explícitamente en pantalla e impresos/PDF futuros).
  - **Total:** subtotal + monto IVA (IVA **desglosado** para el cliente).
- Notas y términos.

### 12.3 Partidas

Cada partida incluye:

- **Tipo de proyecto** (obligatorio): especialidad de esa línea (multiparte).
- Concepto / descripción.
- Unidad de medida (m², ml, pza, servicio, etc.).
- Cantidad.
- Precio unitario (puede **precargarse** desde catálogo de mano de obra del **mismo tipo de proyecto** de la partida).
- Subtotal calculado (cantidad × precio unitario).
- Orden dentro de la cotización.

### 12.4 Reglas

- Partidas editables en borrador; bloqueo parcial o versionado al **enviar** (definir en implementación: versión 1 = bloqueo estricto opcional).
- Subtotal, IVA y total **siempre** recalculados de forma determinista (idealmente validados también en servidor cuando exista backend).
- **Prohibido** crear proyecto si no hay cotización en estado **aceptada** vinculada como origen.

---

## 13. Precios de mano de obra (por tipo de proyecto)

### 13.1 Propósito

Catálogo de **tarifas de referencia** para armar cotizaciones rápidas y homogéneas según el tipo de obra.

### 13.2 Datos mínimos

- Tipo de proyecto (FK).
- Concepto (p. ej. “Instalación muro tablaroca 12.7 mm”).
- Unidad de medida.
- Precio unitario vigente.
- Vigencia desde / hasta (opcional; permite historial de aumentos).
- Activo / inactivo.

### 13.3 Comportamiento en cotización

- Al agregar partida, primero se elige el **tipo de proyecto** de esa línea; el catálogo de mano de obra filtra por ese tipo.
- El usuario puede **elegir del catálogo** o escribir concepto/libre; si elige del catálogo, se copian concepto, unidad y precio sugerido (editables antes de enviar).

---

## 14. Proyectos (obra)

### 14.1 Datos mínimos

- Nombre o título de la obra.
- Cliente (coherente con la cotización de origen).
- **Cotización de origen** (obligatoria, estado aceptada): FK o referencia inequívoca.
- **Estado actual:** FK al maestro **EstadoProyecto** de la organización ([§10](#10-estados-del-proyecto-catálogo-administrable)).
- Dirección de obra (si aplica).
- Fechas: inicio estimado, fin estimado, inicio real, fin real (opcionales según fase).
- Descripción / alcance resumido (puede inicializarse desde la cotización).
- **Especialidades:** derivadas de las partidas de la cotización de origen (multiparte); opcional etiqueta resumida en listados (“mixto: tablaroca, electricidad”).

### 14.2 Vistas deseadas

- Listado filtrable por estado, cliente, **tipos de obra presentes** (según partidas), fechas, texto.
- Detalle del proyecto: resumen, **cotización origen** (lectura), colaboradores de agenda, entregables, historial de estados, timeline simple (fase 2).

---

## 15. Flujos principales (historias de usuario)

1. **Alta de cliente** → crear **cotización** en **USD** con partidas **multiparte** (cada partida con tipo de obra; precios sugeridos desde mano de obra; **IVA 13%** desglosado: subtotal, IVA, total) → enviar / **aceptar** cotización → **crear proyecto** vinculado con **estado inicial** según [§10.6](#106-estado-inicial-al-crear-el-proyecto) (por defecto slug `APROBADO`) → asignar **colaboradores de agenda** → definir **entregables** → cambiar **estado** usando el **catálogo administrable** (p. ej. hacia **Finalizado**).
2. **Cliente recurrente:** mismo flujo — **siempre** cotización (nueva versión o nuevo folio) **antes** de proyecto; no hay atajo “proyecto sin cotización”.
3. **Administrador** actualiza **precios de mano de obra** por tipo de proyecto y, en **configuración general**, el **catálogo de estados de proyecto** (etiquetas, orden, activos); las **cotizaciones nuevas** usan precios vigentes al momento de captura; las ya enviadas/aceptadas no mutan montos históricos sin una acción explícita de nueva versión (si se implementa versionado en el futuro).

---

## 16. Reglas de negocio resumidas

- **Proyecto sin cotización aceptada:** no permitido.
- **Multiparte:** cada partida lleva **tipo de proyecto** del maestro activo.
- **Moneda:** cotizaciones y montos de referencia en **USD** por defecto para operación en El Salvador.
- **IVA:** cotización con tasa general **13%** (El Salvador), **desglosado** (subtotal, tasa, monto IVA, total), salvo ampliación futura del spec para exenciones u otras tasas con sustento fiscal.
- **Estados de proyecto:** definidos en **maestro global** de la org; solo valores **activos** en asignaciones nuevas; historial de cambios obligatorio cuando haya persistencia.
- **Proyecto en curso:** solo existe si hay cotización **aceptada** de origen; el significado operativo de “en obra” lo cubre la etiqueta que la org configure (p. ej. **En progreso** en la semilla por defecto).
- Precios de mano de obra: cambios no alteran cotizaciones ya formalizadas (histórico inmutable salvo nueva cotización/revisión explícita).
- Clientes con historial: priorizar **archivo** sobre borrado físico.
- **Colaboradores:** solo agenda; **no** son usuarios del sistema.

---

## 17. No funcional (calidad)

- **Idioma de la interfaz:** español como defecto (regionalización El Salvador / Centroamérica en formatos de fecha y número donde aplique); textos centralizados para futura i18n si se requiere.
- **Seguridad:** autenticación y autorización por rol; toda mutación crítica vía API con validación y auditoría mínima (usuario, timestamp, estado anterior/nuevo).
- **Rendimiento:** listados paginados; búsqueda por cliente y proyecto con índices adecuados en DB.
- **Accesibilidad:** contraste, foco, etiquetas en formularios; objetivo razonable WCAG 2.1 AA en pantallas principales.

---

## 18. Stack técnico y persistencia

### 18.1 Frontend y tooling

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 5 |
| Estilos | Tailwind CSS 4 |
| Calidad | ESLint (`eslint-config-next`) |

**Nota Next.js:** revisar `node_modules/next/dist/docs/` ante APIs nuevas o deprecaciones (regla del repo en `AGENTS.md`).

### 18.2 Objetivo de plataforma (organización + Supabase)

- **Meta:** autenticación y base de datos con **[Supabase](https://supabase.com/)** (Auth + Postgres + políticas RLS según diseño futuro).
- **Orden deseado:** primero flujo de **organización** (multi-tenant: una empresa/org, miembros con rol, datos acotados a la org). El detalle de tablas y RLS se documentará al acercarse la integración.
- **Perfil fiscal por defecto de la org (Proyxz / El Salvador):** moneda **USD**, IVA de cotización **13%** desglosado; semilla de **estados de proyecto** según [§10.2](#102-semilla-por-defecto-al-crear-la-organización).
- **Fase actual (decisión):** desarrollo **sin base de datos persistente** en el código: estado en memoria, **mocks** o almacenamiento local **solo** para iterar UI y reglas; **no** sustituye el modelo definitivo.

### 18.3 Principio de implementación “hacia Supabase”

- Modelar el dominio con **tipos TypeScript** y una **capa de acceso a datos** (repositorios / acciones) que hoy lea/escriba memoria o fixtures, pero con **la misma forma** que tendrán filas en Postgres (entidades alineadas a [§6](#6-modelo-conceptual-de-datos-entidades-y-relaciones)).
- Evitar lógica de negocio acoplada a “solo cliente”; cuando exista Supabase, se intercambia el adaptador sin reescribir pantallas enteras.
- Variables de entorno y despliegue se detallarán al conectar Supabase (URL, anon key, etc.).

### 18.4 Despliegue

- Compatible con hosting Node/edge habitual de Next.js; sin exigencia adicional hasta existir backend real.

---

## 19. Experiencia de usuario y marca DAIEGO

- **Dirección visual:** Poppins, neutros zinc, acento esmeralda, soporte claro/oscuro, patrones de login y shell tipo dashboard alineados al sistema DAIEGO.
- **Navegación sugerida (alto nivel):** Dashboard → Proyectos → Clientes → Cotizaciones → Catálogos (tipos de proyecto, precios) → Colaboradores → **Configuración** (incluye **Estados de proyecto**, maestro global de la org).

---

## 20. Fases de implementación

### Fase A — MVP (recomendado)

- UI y flujos con **datos no persistentes** (mocks / memoria), respetando reglas: **cotización antes de proyecto**, **multiparte** por partida, **IVA 13% desglosado en USD**, colaboradores **solo agenda**.
- CRUD en memoria: clientes, colaboradores (agenda), tipos de proyecto, precios de mano de obra por tipo, **maestro de estados de proyecto** (semilla por defecto [§10.2](#102-semilla-por-defecto-al-crear-la-organización)) y **pantalla de configuración** para editarlos a nivel general.
- Cotizaciones: partidas con **tipo por línea**, subtotal / IVA (13%) / total en **USD**, estados hasta **aceptada**.
- Proyectos: creación **solo** desde cotización **aceptada**; estado actual = FK al maestro; cambios con historial simulado o en memoria (validación estricta en servidor en fase Supabase).
- Entregables: CRUD ligado a proyecto; responsable = usuario del sistema (simulado si no hay auth).
- UI DAIEGO en layout principal y listados.

### Fase B — Supabase y organización

- Crear proyecto Supabase, esquema Postgres alineado a este spec, **Auth**, **organización** y membresías.
- Sustituir mocks por repositorios reales; RLS por `org_id`.
- Historial de estados y auditoría mínima en servidor.

### Fase C

- Adjuntos en entregables (p. ej. Storage).
- Reportes exportables (CSV/PDF) con mismo desglose de IVA.
- Roles coordinador vs admin refinados.
- Integraciones externas solo tras ampliar este spec.

---

## 21. Historial del documento

| Versión | Fecha | Cambios |
|---------|--------|---------|
| 0.1 | 2026-04-12 | Spec inicial (plantilla técnica). |
| 0.2 | 2026-04-12 | Especificación funcional completa: construcción, entidades, cotizaciones, estados, entregables, colaboradores, precios por tipo, fases MVP. |
| 0.3 | 2026-04-12 | Decisiones de producto cerradas: multiparte desde el inicio; cotización obligatoria antes del proyecto; IVA desglosado; Supabase + org como meta, sin DB en fase actual; colaboradores solo agenda. Ajustes en modelo, flujos y fases. |
| 0.4 | 2026-04-12 | El Salvador: IVA **13%**, moneda **USD**; estados de proyecto como **maestro administrable** global por org con semilla (Cotización, Aprobado, En progreso, Finalizado); estado inicial por defecto al crear proyecto; MVP de transiciones libre entre estados activos con historial. |

---

## 22. Decisiones de producto resueltas

| # | Tema | Decisión |
|---|------|----------|
| 1 | Alcance por especialidad | **Multiparte desde el inicio:** cada partida tiene tipo de proyecto; una cotización/proyecto puede combinar varias especialidades. |
| 2 | Orden cotización / proyecto | **Cotización siempre antes del proyecto.** No se crea proyecto sin cotización **aceptada** como origen. |
| 3 | Impuestos y moneda | **El Salvador:** IVA general **13%** en cotización, **desglosado**. **Moneda: USD** (dólar estadounidense). Exenciones u otras tasas solo si se amplía el spec con criterio fiscal. |
| 4 | Auth y base de datos | **Objetivo: Supabase** (Postgres + Auth). Primero modelo de **organización**; la implementación **actual** puede ir **sin DB** (mocks), diseñando capa de datos **pensando en** el esquema Supabase futuro. |
| 5 | Colaboradores | **Solo agenda** (contactos). **No** tienen login ni rol en la aplicación. |
| 6 | Estados del proyecto | **Catálogo administrable** a nivel **organización** (configuración general). Semilla por defecto: **Cotización**, **Aprobado**, **En progreso**, **Finalizado**. Estado inicial al crear proyecto desde cotización aceptada: **`APROBADO`** por defecto ([§10.6](#106-estado-inicial-al-crear-el-proyecto)). Transiciones en MVP: cualquier estado **activo** → otro activo, con **historial**. |

**Pendientes menores** (opcionales): matriz de transiciones restringidas por org; soporte explícito en UI para bienes/servicios **exentos** de IVA según art. 45–46 de la ley salvadoreña.

---

*Documento vivo: cualquier desviación en código respecto a este spec debe reflejarse aquí o corregirse en código a propósito.*
