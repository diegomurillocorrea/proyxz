-- Quita maestro de roles sugeridos y el campo rol en colaboradores (solo agenda).

drop policy if exists roles_colaborador_all on public.roles_colaborador;

drop table if exists public.roles_colaborador;

alter table public.colaboradores
  drop column if exists rol;

-- Restaura semilla de org sin insertar roles_colaborador.
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
