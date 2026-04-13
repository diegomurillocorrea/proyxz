-- Búsqueda de auth.users por email solo para admins de la org (sin service role en la app).

create or replace function public.lookup_auth_user_id_by_email (p_email text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_uid uuid;
begin
  select organization_id into v_org_id
  from public.organization_members
  where user_id = auth.uid ()
  limit 1;

  if v_org_id is null then
    raise exception 'No autenticado';
  end if;

  if not public.is_org_admin (v_org_id) then
    raise exception 'Solo un administrador puede buscar usuarios';
  end if;

  select id into v_uid
  from auth.users
  where lower (email) = lower (trim (p_email))
  limit 1;

  return v_uid;
end;
$$;

grant execute on function public.lookup_auth_user_id_by_email (text) to authenticated;
