begin;

create or replace function public.search_directory_filtered(
  entity text,
  q text default '',
  location_filter text default '',
  page_number integer default 1
)
returns setof jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  ordering text := 't.created_at desc,t.id';
  location_clause text := '';
begin
  if not entity = any(array[
    'doctors','hospitals','caregivers','ambulances','lab_tests',
    'medicines','medicine_offers','specialties','symptom_rules'
  ]) then
    raise exception 'Unknown directory';
  end if;

  if length(q) > 160 then raise exception 'Search too long'; end if;
  if length(location_filter) > 100 then raise exception 'Location filter too long'; end if;

  -- Doctor searches now use the conservative symptom/specialty resolver from 005.
  -- This keeps the directory page and Healthcare Central Assistant consistent.
  if entity = 'doctors' then
    return query
    select * from public.search_doctors_smart(q, location_filter, page_number);
    return;
  end if;

  if length(trim(location_filter)) > 0 then
    case entity
      when 'hospitals' then
        location_clause := ' and lower(concat_ws('' '', t.location, t.address)) like $4';
      when 'caregivers' then
        location_clause := ' and lower(coalesce(t.location, '''')) like $4';
      when 'ambulances' then
        location_clause := ' and lower(concat_ws('' '', t.location, t.city, t.address, t.hospital_name)) like $4';
      when 'lab_tests' then
        location_clause := ' and lower(concat_ws('' '', t.location, t.address, t.laboratory_name)) like $4';
      else
        location_clause := '';
    end case;
  end if;

  return query execute format(
    'select to_jsonb(t) from public.%I t
     where lower(to_jsonb(t)::text) like $1 %s
     order by %s limit 24 offset $2',
    entity, location_clause, ordering
  )
  using
    '%' || lower(q) || '%',
    (greatest(1,least(page_number,10000))-1)*24,
    q,
    '%' || lower(location_filter) || '%';
end;
$$;

revoke all on function public.search_directory_filtered(text,text,text,integer) from public;
grant execute on function public.search_directory_filtered(text,text,text,integer) to authenticated;

commit;
