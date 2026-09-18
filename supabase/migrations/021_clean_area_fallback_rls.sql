-- Avoid overlapping permissive SELECT policies on healthcare_area_fallbacks.
drop policy if exists healthcare_area_fallbacks_admin_all on public.healthcare_area_fallbacks;

drop policy if exists healthcare_area_fallbacks_admin_insert on public.healthcare_area_fallbacks;
create policy healthcare_area_fallbacks_admin_insert
on public.healthcare_area_fallbacks for insert
to authenticated
with check (public.is_admin());

drop policy if exists healthcare_area_fallbacks_admin_update on public.healthcare_area_fallbacks;
create policy healthcare_area_fallbacks_admin_update
on public.healthcare_area_fallbacks for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists healthcare_area_fallbacks_admin_delete on public.healthcare_area_fallbacks;
create policy healthcare_area_fallbacks_admin_delete
on public.healthcare_area_fallbacks for delete
to authenticated
using (public.is_admin());
