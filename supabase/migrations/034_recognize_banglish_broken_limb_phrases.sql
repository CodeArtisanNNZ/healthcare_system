-- Recognize common Bangla/Banglish ways patients describe a broken limb.
-- These aliases feed the structured fracture_injury concept so HCC asks
-- circulation/open-fracture red flags instead of showing the generic fallback.

begin;

with aliases(alias, language) as (
  values
    ('pa venge gese','banglish'),
    ('pa venge geche','banglish'),
    ('paye venge gese','banglish'),
    ('paye venge geche','banglish'),
    ('paa venge gese','banglish'),
    ('paa venge geche','banglish'),
    ('pa bhenge gese','banglish'),
    ('pa bhenge geche','banglish'),
    ('paye bhenge geche','banglish'),
    ('pa vanga','banglish'),
    ('pa bhanga','banglish'),
    ('pa vangse','banglish'),
    ('pa vengeche','banglish'),
    ('leg venge geche','banglish'),
    ('leg venge gese','banglish'),
    ('my leg broke','en'),
    ('my leg is broken','en'),
    ('broken leg','en'),
    ('broken foot','en'),
    ('foot is broken','en'),
    ('arm venge geche','banglish'),
    ('hat venge geche','banglish'),
    ('hat venge gese','banglish'),
    ('hand venge geche','banglish'),
    ('my arm broke','en'),
    ('my arm is broken','en'),
    ('broken arm','en'),
    ('broken hand','en'),
    ('পা ভেঙে গেছে','bn'),
    ('পা ভেঙ্গে গেছে','bn'),
    ('পায়ের হাড় ভেঙে গেছে','bn'),
    ('পায়ের হাড় ভেঙে গেছে','bn'),
    ('হাত ভেঙে গেছে','bn'),
    ('হাত ভেঙ্গে গেছে','bn'),
    ('হাতের হাড় ভেঙে গেছে','bn'),
    ('হাতের হাড় ভেঙে গেছে','bn')
)
insert into public.symptom_aliases(concept_id,alias,language,normalized_alias)
select c.id,a.alias,a.language,public.normalize_symptom_phrase(a.alias)
from aliases a
join public.symptom_concepts c on c.code='fracture_injury'
on conflict (concept_id,alias) do update
set language=excluded.language,
    normalized_alias=excluded.normalized_alias;

-- Keep the legacy routing fallback useful even when the concept layer is unavailable.
with orthopaedic as (
  select id from public.specialties where lower(name)='orthopaedic surgeon' limit 1
),
seed(keyword,priority,patient_guidance) as (
  values
    ('pa venge gese',132,'A suspected broken leg needs prompt in-person assessment. Avoid putting weight on it.'),
    ('pa venge geche',132,'A suspected broken leg needs prompt in-person assessment. Avoid putting weight on it.'),
    ('paye venge gese',132,'A suspected broken leg needs prompt in-person assessment. Avoid putting weight on it.'),
    ('paye venge geche',132,'A suspected broken leg needs prompt in-person assessment. Avoid putting weight on it.'),
    ('pa bhenge geche',132,'A suspected broken leg needs prompt in-person assessment. Avoid putting weight on it.'),
    ('broken leg',132,'A suspected broken leg needs prompt in-person assessment. Avoid putting weight on it.'),
    ('my leg broke',132,'A suspected broken leg needs prompt in-person assessment. Avoid putting weight on it.'),
    ('hat venge geche',132,'A suspected broken arm or hand needs prompt in-person assessment.'),
    ('hat venge gese',132,'A suspected broken arm or hand needs prompt in-person assessment.'),
    ('broken arm',132,'A suspected broken arm needs prompt in-person assessment.'),
    ('পা ভেঙে গেছে',132,'পা ভাঙার সন্দেহ হলে দ্রুত সরাসরি চিকিৎসা নিন এবং পায়ে ভর দেবেন না।'),
    ('পা ভেঙ্গে গেছে',132,'পা ভাঙার সন্দেহ হলে দ্রুত সরাসরি চিকিৎসা নিন এবং পায়ে ভর দেবেন না।'),
    ('হাত ভেঙে গেছে',132,'হাত ভাঙার সন্দেহ হলে দ্রুত সরাসরি চিকিৎসা নিন।'),
    ('হাত ভেঙ্গে গেছে',132,'হাত ভাঙার সন্দেহ হলে দ্রুত সরাসরি চিকিৎসা নিন।')
),
updated as (
  update public.symptom_rules r
  set specialty_id=o.id,
      priority=s.priority,
      patient_guidance=s.patient_guidance
  from seed s
  cross join orthopaedic o
  where lower(trim(r.keyword))=lower(trim(s.keyword))
  returning r.id
)
insert into public.symptom_rules(keyword,specialty_id,priority,patient_guidance)
select s.keyword,o.id,s.priority,s.patient_guidance
from seed s
cross join orthopaedic o
where not exists (
  select 1 from public.symptom_rules r
  where lower(trim(r.keyword))=lower(trim(s.keyword))
);

commit;
