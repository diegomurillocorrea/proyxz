-- Especialidades de trabajo + trabajos por especialidad (catálogo por organización)

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

alter table public.especialidades enable row level security;
alter table public.trabajos_especialidad enable row level security;

create policy especialidades_all on public.especialidades for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

create policy trabajos_especialidad_all on public.trabajos_especialidad for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

grant select, insert, update, delete on public.especialidades to authenticated;
grant select, insert, update, delete on public.trabajos_especialidad to authenticated;

-- Catálogo por defecto (idempotente por organización)
create or replace function public.seed_especialidades_defaults (p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  e_alba uuid;
  e_metal uuid;
  e_tab uuid;
  e_elec uuid;
  e_plom uuid;
  e_pint uuid;
begin
  if exists (select 1 from public.especialidades where organization_id = p_org_id limit 1) then
    return;
  end if;

  insert into public.especialidades (organization_id, codigo, nombre, descripcion, activo, orden)
  values (p_org_id, 'ALBANILERIA', 'Albañilería', 'Mampostería, repello, concreto', true, 1)
  returning id into e_alba;

  insert into public.especialidades (organization_id, codigo, nombre, descripcion, activo, orden)
  values (p_org_id, 'ESTRUCTURA_METALICA', 'Estructura metálica', 'Soldadura, montaje', true, 2)
  returning id into e_metal;

  insert into public.especialidades (organization_id, codigo, nombre, descripcion, activo, orden)
  values (p_org_id, 'ACABADOS_TABLAROCA', 'Tablaroca / drywall', 'Plafones y muros ligeros', true, 3)
  returning id into e_tab;

  insert into public.especialidades (organization_id, codigo, nombre, descripcion, activo, orden)
  values (p_org_id, 'INSTALACIONES_ELECTRICAS', 'Electricidad', 'Canalización y luminarias', true, 4)
  returning id into e_elec;

  insert into public.especialidades (organization_id, codigo, nombre, descripcion, activo, orden)
  values (p_org_id, 'PLOMERIA', 'Plomería', 'Agua, desagüe, sanitarios', true, 5)
  returning id into e_plom;

  insert into public.especialidades (organization_id, codigo, nombre, descripcion, activo, orden)
  values (p_org_id, 'PINTURA', 'Pintura', 'Impermeabilización y acabados', true, 6)
  returning id into e_pint;

  insert into public.trabajos_especialidad (organization_id, especialidad_id, codigo, nombre, orden, activo)
  values
    (p_org_id, e_alba, 'REPELLO', 'Repello interior', 1, true),
    (p_org_id, e_alba, 'VACIADO_LOZA', 'Vaciado de loza', 2, true),
    (p_org_id, e_metal, 'MONTAJE_CUBIERTA', 'Montaje de cubierta metálica', 1, true),
    (p_org_id, e_tab, 'MURO_TABLAROCA', 'Muro tablaroca', 1, true),
    (p_org_id, e_elec, 'PUNTO_ELECTRICO', 'Punto eléctrico', 1, true),
    (p_org_id, e_plom, 'INST_SANITARIO', 'Instalación de sanitario', 1, true),
    (p_org_id, e_pint, 'PINTURA_INTERIOR', 'Pintura interior', 1, true);
end;
$$;

-- Ampliar semilla de organización nueva
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

  perform public.seed_especialidades_defaults(p_org_id);
end;
$$;

-- Organizaciones ya existentes (sin filas en especialidades)
do $$
declare
  r record;
begin
  for r in
    select o.id as org_id
    from public.organizations o
    where not exists (
      select 1 from public.especialidades e where e.organization_id = o.id
    )
  loop
    perform public.seed_especialidades_defaults(r.org_id);
  end loop;
end;
$$;
