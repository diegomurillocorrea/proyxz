-- Maestro de roles sugeridos para colaboradores de agenda (spec §8.1).

create table if not exists public.roles_colaborador (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  activo boolean not null default true
);

create unique index if not exists roles_colaborador_org_nombre_lower_idx
  on public.roles_colaborador (organization_id, lower(trim(nombre)));

alter table public.roles_colaborador enable row level security;

drop policy if exists roles_colaborador_all on public.roles_colaborador;

create policy roles_colaborador_all on public.roles_colaborador for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

grant select, insert, update, delete on public.roles_colaborador to authenticated;

-- Semilla en nuevas orgs
create or replace function public.seed_new_organization (p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t_tab uuid;
  t_elec uuid;
begin
  insert into estados_proyecto (organization_id, slug, etiqueta, orden, activo)
  values
    (p_org_id, 'COTIZACION', 'Cotización', 1, true),
    (p_org_id, 'APROBADO', 'Aprobado', 2, true),
    (p_org_id, 'EN_PROGRESO', 'En progreso', 3, true),
    (p_org_id, 'FINALIZADO', 'Finalizado', 4, true);

  insert into tipos_proyecto (organization_id, codigo, nombre, descripcion, activo)
  values (p_org_id, 'TABLAROCA', 'Tablaroca / drywall', 'Muros, plafones, pastas', true)
  returning id into t_tab;

  insert into tipos_proyecto (organization_id, codigo, nombre, descripcion, activo)
  values (p_org_id, 'ELECTRICIDAD', 'Electricidad', 'Instalaciones y luminarias', true)
  returning id into t_elec;

  insert into precios_mano_obra (organization_id, tipo_proyecto_id, concepto, unidad, precio_unitario, activo)
  values
    (p_org_id, t_tab, 'Muro tablaroca 12.7 mm instalado', 'm²', 8.5, true),
    (p_org_id, t_elec, 'Punto eléctrico (contacto + cableado básico)', 'pza', 12, true);

  insert into roles_colaborador (organization_id, nombre, orden, activo) values
    (p_org_id, 'Maestro', 1, true),
    (p_org_id, 'Ayudante', 2, true),
    (p_org_id, 'Supervisor', 3, true),
    (p_org_id, 'Subcontratista', 4, true),
    (p_org_id, 'Otro', 5, true);
end;
$$;

-- Orgs ya existentes
insert into roles_colaborador (organization_id, nombre, orden, activo)
select o.id, v.nombre, v.orden, true
from public.organizations o
cross join (values
  ('Maestro', 1),
  ('Ayudante', 2),
  ('Supervisor', 3),
  ('Subcontratista', 4),
  ('Otro', 5)
) as v(nombre, orden)
where not exists (
  select 1
  from public.roles_colaborador r
  where r.organization_id = o.id
    and lower(trim(r.nombre)) = lower(trim(v.nombre))
);
