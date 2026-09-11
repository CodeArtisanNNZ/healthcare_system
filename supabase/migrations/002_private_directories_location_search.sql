begin;

revoke select on public.specialties from anon;
revoke select on public.symptom_rules from anon;
revoke select on public.doctors from anon;
revoke select on public.hospitals from anon;
revoke select on public.caregivers from anon;
revoke select on public.ambulances from anon;
revoke select on public.lab_tests from anon;
revoke select on public.medicines from anon;
revoke select on public.medicine_offers from anon;

revoke execute on function public.search_directory(text,text,integer) from anon;
grant execute on function public.search_directory(text,text,integer) to authenticated;

update storage.buckets set public = false where id = 'directory-images';

drop policy if exists directory_images_read on storage.objects;
create policy directory_images_read
on storage.objects
for select
to authenticated
using (bucket_id = 'directory-images' and public.is_active());

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
  extra text := '';
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

  if entity = 'doctors' and length(trim(q)) > 0 then
    extra := ' or t.specialty_id in (
      select s.id from public.specialties s
      where lower(s.name) like $1
      or exists(
        select 1 from public.symptom_rules r
        where r.specialty_id=s.id
        and (lower(r.keyword) like $1 or position(lower(r.keyword) in lower($3))>0)
      )
    )';
    ordering := '(
      select coalesce(max(r.priority),0)
      from public.symptom_rules r
      where r.specialty_id=t.specialty_id
      and (lower(r.keyword) like $1 or position(lower(r.keyword) in lower($3))>0)
    ) desc, t.experience desc nulls last,t.full_name,t.id';
  end if;

  if length(trim(location_filter)) > 0 then
    case entity
      when 'doctors' then
        location_clause := ' and lower(coalesce(t.location, '''')) like $4';
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
     where (lower(to_jsonb(t)::text) like $1 %s) %s
     order by %s limit 24 offset $2',
    entity, extra, location_clause, ordering
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
