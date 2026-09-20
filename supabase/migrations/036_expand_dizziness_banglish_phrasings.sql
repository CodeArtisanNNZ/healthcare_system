-- Expand dizziness/vertigo phrasing for common Banglish expressions.
begin;

with a(alias,language) as (
  values
    ('matha ghuracche','banglish'),
    ('matha ghurche','banglish'),
    ('matha ghurtesse','banglish'),
    ('matha ghurtese','banglish'),
    ('matha ghurtesey','banglish'),
    ('matha ghurai','banglish'),
    ('matha ghuray','banglish'),
    ('matha ghure','banglish'),
    ('matha tal khacche','banglish'),
    ('matha tal khay','banglish'),
    ('matha tal khaitese','banglish'),
    ('matha ghoray','banglish'),
    ('matha ghorche','banglish'),
    ('head is spinning','en'),
    ('room is spinning','en'),
    ('feel dizzy','en'),
    ('feeling dizzy','en'),
    ('dizzy spells','en'),
    ('lightheaded','en'),
    ('মাথা ঘুরছে','bn'),
    ('মাথা ঘোরাচ্ছে','bn'),
    ('মাথা ঘোরে','bn'),
    ('মাথা তাল খাচ্ছে','bn')
)
insert into public.symptom_aliases(concept_id,alias,language,normalized_alias)
select c.id,a.alias,a.language,public.normalize_symptom_phrase(a.alias)
from a
join public.symptom_concepts c on c.code='dizziness'
on conflict (concept_id,alias) do update set
  language=excluded.language,
  normalized_alias=excluded.normalized_alias;

commit;
