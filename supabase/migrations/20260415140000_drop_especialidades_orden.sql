-- Orden manual de especialidades ya no se usa; listado por nombre.
alter table public.especialidades drop column if exists orden;
