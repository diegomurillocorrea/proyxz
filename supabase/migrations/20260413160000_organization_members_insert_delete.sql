-- CRUD miembros: alta y baja solo para administradores de la organización.

create policy members_insert_admin on public.organization_members
  for insert
  with check (
    organization_id in (select public.user_organization_ids ())
    and public.is_org_admin (organization_id)
  );

create policy members_delete_admin on public.organization_members
  for delete
  using (public.is_org_admin (organization_id));
