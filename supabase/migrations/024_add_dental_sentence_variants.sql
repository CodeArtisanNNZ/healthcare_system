-- Add common sentence-style dental phrasing that should route to Dentist.
with seed(keyword,specialty_name,priority) as (
  values
    ('dant e betha','Dentist',108),
    ('dant e onek betha','Dentist',110),
    ('dante betha','Dentist',108),
    ('dante onek betha','Dentist',110),
    ('amar dant e betha','Dentist',108),
    ('amar dant e onek betha','Dentist',110),
    ('দাঁতে অনেক ব্যথা','Dentist',110),
    ('আমার দাঁতে ব্যথা','Dentist',108),
    ('আমার দাঁতে অনেক ব্যথা','Dentist',110)
), resolved as (
  select s.keyword,sp.id specialty_id,s.priority::numeric
  from seed s
  join public.specialties sp on lower(sp.name)=lower(s.specialty_name)
)
insert into public.symptom_rules(keyword,specialty_id,priority)
select keyword,specialty_id,priority
from resolved r
where not exists (
  select 1
  from public.symptom_rules e
  where lower(trim(e.keyword))=lower(trim(r.keyword))
    and e.specialty_id=r.specialty_id
);
