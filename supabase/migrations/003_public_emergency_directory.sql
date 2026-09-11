begin;

-- Keep the ambulance table private. Anonymous visitors do NOT receive direct
-- SELECT permission. They can only execute the restricted function below.

create or replace function public.search_public_ambulances(
  location_filter text default ''
)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', a.id,
    'service_name', a.service_name,
    'driver_phone', a.driver_phone,
    'location', a.location,
    'city', a.city,
    'hospital_name', a.hospital_name,
    'availability', a.availability
  )
  from public.ambulances a
  where a.status = 'Active'
    and (
      length(trim(location_filter)) = 0
      or lower(
        concat_ws(
          ' ',
          coalesce(a.location, ''),
          coalesce(a.city, ''),
          coalesce(a.address, ''),
          coalesce(a.hospital_name, '')
        )
      ) like '%' || lower(trim(location_filter)) || '%'
    )
  order by
    case
      when lower(coalesce(a.availability, '')) like '%available%' then 0
      else 1
    end,
    a.service_name,
    a.id
  limit 12;
$$;

revoke all on function public.search_public_ambulances(text) from public;
grant execute on function public.search_public_ambulances(text) to anon;
grant execute on function public.search_public_ambulances(text) to authenticated;

commit;
