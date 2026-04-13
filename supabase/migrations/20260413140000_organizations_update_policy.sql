-- Permitir que miembros autenticados actualicen su propia fila de organización (nombre, IVA, estado inicial)

create policy organizations_update on public.organizations for update
  using (id in (select public.user_organization_ids ()))
  with check (id in (select public.user_organization_ids ()));
