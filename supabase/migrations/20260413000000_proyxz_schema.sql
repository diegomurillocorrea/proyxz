-- Proyxz — esquema multi-tenant (organización + RLS)
-- Ejecutar en Supabase SQL Editor o: supabase db push

-- Extensiones
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tablas base
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi organización',
  slug text not null unique,
  moneda text not null default 'USD',
  tasa_iva_default numeric(5, 4) not null default 0.13,
  estado_inicial_proyecto_slug text not null default 'APROBADO',
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'admin',
  primary key (organization_id, user_id)
);

create unique index organization_members_one_org_per_user on public.organization_members (user_id);

create table public.estados_proyecto (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  slug text not null,
  etiqueta text not null,
  orden int not null,
  activo boolean not null default true,
  unique (organization_id, slug)
);

create table public.tipos_proyecto (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  codigo text not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  unique (organization_id, codigo)
);

create table public.precios_mano_obra (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  tipo_proyecto_id uuid not null references public.tipos_proyecto (id) on delete cascade,
  concepto text not null,
  unidad text not null,
  precio_unitario numeric(14, 4) not null,
  activo boolean not null default true
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  nombre text not null,
  rfc text,
  telefono text,
  email text,
  direccion text,
  notas text,
  activo boolean not null default true
);

create table public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  nombre text not null,
  rol text,
  telefono text,
  email text,
  notas text
);

create table public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  folio text not null,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  estado text not null check (
    estado in ('borrador', 'enviada', 'aceptada', 'rechazada', 'vencida')
  ),
  fecha_emision date not null,
  tasa_iva numeric(5, 4) not null default 0.13,
  notas text,
  created_at timestamptz not null default now(),
  unique (organization_id, folio)
);

create table public.partidas_cotizacion (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  cotizacion_id uuid not null references public.cotizaciones (id) on delete cascade,
  tipo_proyecto_id uuid not null references public.tipos_proyecto (id) on delete restrict,
  concepto text not null,
  unidad text not null,
  cantidad numeric(14, 4) not null,
  precio_unitario numeric(14, 4) not null,
  orden int not null
);

create index partidas_cotizacion_cotizacion_id_idx on public.partidas_cotizacion (cotizacion_id);

create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  nombre text not null,
  cliente_id uuid not null references public.clientes (id) on delete restrict,
  cotizacion_id uuid not null unique references public.cotizaciones (id) on delete restrict,
  estado_proyecto_id uuid not null references public.estados_proyecto (id) on delete restrict,
  direccion_obra text,
  descripcion text
);

create table public.proyecto_colaboradores (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  primary key (proyecto_id, colaborador_id)
);

create table public.entregables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  titulo text not null,
  descripcion text,
  estado text not null check (
    estado in ('pendiente', 'en_progreso', 'entregado', 'rechazado')
  ),
  fecha_objetivo date,
  fecha_entrega_real date
);

-- ---------------------------------------------------------------------------
-- Semilla para una organización nueva (spec §10.2 + tipos/precios mínimos)
-- ---------------------------------------------------------------------------

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
end;
$$;

-- ---------------------------------------------------------------------------
-- Primera organización + membresía + semilla (MVP: un usuario → una org)
-- ---------------------------------------------------------------------------

create or replace function public.ensure_org_for_user ()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_org_id uuid;
  v_slug text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select organization_id into v_org_id
  from organization_members
  where user_id = uid
  limit 1;

  if v_org_id is not null then
    return v_org_id;
  end if;

  -- Sin gen_random_bytes (pgcrypto puede no estar en el search_path de la función)
  v_slug := 'org-' || substr(md5(random()::text || clock_timestamp()::text || uid::text), 1, 12);

  insert into organizations (name, slug)
  values ('Mi organización', v_slug)
  returning id into v_org_id;

  insert into organization_members (organization_id, user_id, role)
  values (v_org_id, uid, 'admin');

  perform public.seed_new_organization(v_org_id);
  return v_org_id;
end;
$$;

grant execute on function public.ensure_org_for_user () to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.estados_proyecto enable row level security;
alter table public.tipos_proyecto enable row level security;
alter table public.precios_mano_obra enable row level security;
alter table public.clientes enable row level security;
alter table public.colaboradores enable row level security;
alter table public.cotizaciones enable row level security;
alter table public.partidas_cotizacion enable row level security;
alter table public.proyectos enable row level security;
alter table public.proyecto_colaboradores enable row level security;
alter table public.entregables enable row level security;

-- Helper: orgs del usuario actual
create or replace function public.user_organization_ids ()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from organization_members where user_id = auth.uid();
$$;

grant execute on function public.user_organization_ids () to authenticated;

-- organizations
create policy orgs_select on public.organizations for select using (id in (select public.user_organization_ids ()));

-- organization_members
create policy members_select on public.organization_members for select using (user_id = auth.uid());

-- Tablas con organization_id
create policy estados_all on public.estados_proyecto for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

create policy tipos_all on public.tipos_proyecto for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

create policy precios_all on public.precios_mano_obra for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

create policy clientes_all on public.clientes for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

create policy colaboradores_all on public.colaboradores for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

create policy cotizaciones_all on public.cotizaciones for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

create policy partidas_all on public.partidas_cotizacion for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

create policy proyectos_all on public.proyectos for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

create policy entregables_all on public.entregables for all
  using (organization_id in (select public.user_organization_ids ()))
  with check (organization_id in (select public.user_organization_ids ()));

-- proyecto_colaboradores (vía proyecto y colaborador de la misma org)
create policy proyecto_colaboradores_all on public.proyecto_colaboradores for all
  using (
    proyecto_id in (select id from public.proyectos where organization_id in (select public.user_organization_ids ()))
  )
  with check (
    proyecto_id in (select id from public.proyectos where organization_id in (select public.user_organization_ids ()))
    and colaborador_id in (select id from public.colaboradores where organization_id in (select public.user_organization_ids ()))
  );

-- Grants
grant select, insert, update, delete on all tables in schema public to authenticated;
