-- Orden manual de trabajos ya no se usa; listado por nombre.
alter table public.trabajos_especialidad drop column if exists orden;
