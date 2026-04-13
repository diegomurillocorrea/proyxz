-- Roles de aplicación: visibilidad entre miembros de la org y actualización solo por admin.
-- Incluye RPC para listar miembros con email (join a auth.users).

drop policy if exists members_select on public.organization_members;

create policy members_select_org on public.organization_members
  for select
  using (organization_id in (select public.user_organization_ids()));

create or replace function public.is_org_admin (p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
      and organization_id = p_org_id
      and role = 'admin'
  );
$$;

grant execute on function public.is_org_admin (uuid) to authenticated;

create policy members_update_admin on public.organization_members
  for update
  using (public.is_org_admin (organization_id))
  with check (public.is_org_admin (organization_id));

-- Lista miembros de las organizaciones del usuario actual (incluye email desde auth.users).
create or replace function public.list_organization_members_with_email ()
returns table (user_id uuid, email text, role text)
language sql
stable
security definer
set search_path = public
as $$
  select om.user_id, u.email::text, om.role
  from public.organization_members om
  join auth.users u on u.id = om.user_id
  where om.organization_id in (select public.user_organization_ids ());
$$;

grant execute on function public.list_organization_members_with_email () to authenticated;
