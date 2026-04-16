---
name: proyxz-ux-ui
description: Aplica el patrón de dashboard CRUD de Proyxz (cabecera, tabla en tarjeta, modales de formulario y confirmación destructiva, alertas y botones compartidos). Usa al crear o alinear vistas en app/dashboard, páginas de listado con acciones, o cuando el usuario menciona proyxz-ux-ui, UX de colaboradores o consistencia con esa vista.
---

# Proyxz dashboard UX/UI (patrón colaboradores)

Referencia canónica: `app/dashboard/colaboradores/page.tsx`. Objetivo: que nuevas vistas del dashboard se vean y comporten igual (espaciado, zinc + emerald, modales, tabla).

## Antes de codificar

1. Importar clases compartidas desde `@/lib/input-classes`: `inputClass`, `primaryButtonClass`, `secondaryButtonClass`, `dangerButtonClass`.
2. Contenedor de página: ancho máximo y ritmo vertical fijo.

## Shell de página

```tsx
<div className="mx-auto max-w-5xl space-y-8">
```

Todo el contenido principal (cabecera, error, bloque de datos) va dentro; los modales van como hermanos al final del fragmento (`<>...</>`), no dentro de este `div`.

## Cabecera (título + acción principal)

- Fila responsive: columna en móvil, fila alineada abajo en `sm+`.

```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
  <div>
    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
  </div>
  <div className="flex items-center gap-3">
    <button type="button" className={primaryButtonClass} onClick={...} disabled={busy}>
      {primaryCtaLabel}
    </button>
  </div>
</div>
```

## Mensaje de error

- Debajo de la cabecera, solo si hay error.
- `role="alert"` para accesibilidad.

```tsx
<p
  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
  role="alert"
>
  {error}
</p>
```

## Tabla en “tarjeta”

- Sección con borde redondeado y fondo que contrasta con el fondo de la página.

```tsx
<section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
  <table className="w-full text-left text-sm">
    <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
      <tr>
        <th className="px-4 py-3">...</th>
        <th className="px-4 py-3 text-right">Acciones</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
```

- Fila de datos: `className="text-zinc-700 dark:text-zinc-200"`; celda principal: `font-medium text-zinc-900 dark:text-zinc-50`.
- Valores vacíos: mostrar `—` como en la referencia.
- Texto largo en celda: `max-w-xs` + `line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400` si aplica.

### Estado vacío

Una fila con `colSpan` que cubra todas las columnas:

```tsx
<td colSpan={n} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
  {emptyMessage}
</td>
```

### Acciones en fila

Contenedor alineado a la derecha:

```tsx
<td className="px-4 py-3 text-right">
  <div className="flex justify-end gap-2">
    <button type="button" className={secondaryButtonClass} onClick={...}>
      Editar
    </button>
    <button type="button" className={dangerButtonClass} onClick={...}>
      Eliminar
    </button>
  </div>
</td>
```

## Modal de formulario (crear / editar)

- Overlay: inferior en móvil, centrado en `sm+`; scrim oscuro semitransparente.

```tsx
<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
  <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{modalTitle}</h2>
```

- Formulario en rejilla de dos columnas desde `sm`:

```tsx
<form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={...}>
```

- Campo ancho completo: envolver en `sm:col-span-2`.
- Etiqueta + control:

```tsx
<label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{label}</label>
<input className={`${inputClass} mt-1`} />
```

- Fila de botones del formulario: `sm:col-span-2 flex gap-2` — primario (Guardar) + secundario (Cancelar); deshabilitar mientras `busy`.

## Modal de confirmación destructiva

- Overlay más oscuro y panel más estrecho, siempre centrado.

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4">
  <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">...</h3>
    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">...</p>
    <div className="mt-5 flex justify-end gap-2">
      <button type="button" className={secondaryButtonClass}>Cancelar</button>
      <button type="button" className={dangerButtonClass}>Eliminar</button>
    </div>
  </div>
</div>
```

## Tokens de diseño (resumen)

| Uso | Clases / origen |
|-----|------------------|
| Neutros título | `text-zinc-900 dark:text-zinc-50` |
| Neutros cuerpo / meta | `text-zinc-500`, `text-zinc-600`, `text-zinc-700` + variantes `dark:` |
| Acento / primario | `primaryButtonClass` (emerald en `input-classes`) |
| Bordes superficies | `border-zinc-200` / `dark:border-zinc-800` |
| Radio grande | `rounded-2xl` (tarjetas y modales), `rounded-xl` (inputs y botones) |

No duplicar strings largos de focus/hover de inputs o botones: siempre `inputClass` y las `*ButtonClass` de `@/lib/input-classes`.

## Checklist al aplicar esta skill a otra vista

- [ ] `max-w-5xl` + `space-y-8` en el contenedor principal.
- [ ] Cabecera con el mismo layout responsive y jerarquía tipográfica.
- [ ] CTA principal con `primaryButtonClass` y `disabled={busy}` cuando haya operación async.
- [ ] Errores con el bloque rojo y `role="alert"`.
- [ ] Listado principal en `section` con tabla y mismas clases de `thead` / `tbody` / celdas.
- [ ] Modales de formulario: overlay `bg-black/40`, `max-w-2xl`, form grid `sm:grid-cols-2`.
- [ ] Confirmación destructiva: `bg-zinc-950/70`, `max-w-md`, acciones alineadas a la derecha.
- [ ] Texto en españés de producto alineado al resto del dashboard (botones: Guardar / Cancelar / Editar / Eliminar donde aplique).
