-- Corrige ensure_org_for_user: evita gen_random_bytes (falla si pgcrypto no está disponible en la función)

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
