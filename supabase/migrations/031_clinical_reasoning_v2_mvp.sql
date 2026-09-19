-- HCC Clinical Reasoning Engine v2 (MVP)
-- Structured symptom concepts, aliases, and dynamic follow-up questions.
-- This supports symptom understanding and care navigation; it does not diagnose.

begin;

create table if not exists public.symptom_concepts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  canonical_name text not null,
  canonical_bn text,
  body_system text,
  default_specialty_id uuid references public.specialties(id) on delete set null,
  routing_priority integer not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.symptom_aliases (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.symptom_concepts(id) on delete cascade,
  alias text not null,
  language text not null default 'mixed'
    check (language in ('en','bn','banglish','mixed')),
  normalized_alias text not null,
  created_at timestamptz not null default now(),
  unique (concept_id, alias)
);

create index if not exists symptom_aliases_normalized_idx
  on public.symptom_aliases using gin (normalized_alias gin_trgm_ops);

create table if not exists public.symptom_followup_questions (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.symptom_concepts(id) on delete cascade,
  attribute_key text not null,
  question_en text not null,
  question_bn text not null,
  question_banglish text not null,
  answer_type text not null default 'choice'
    check (answer_type in ('choice','text')),
  options jsonb not null default '[]'::jsonb,
  priority integer not null default 100,
  required boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (concept_id, attribute_key)
);

alter table public.symptom_concepts enable row level security;
alter table public.symptom_aliases enable row level security;
alter table public.symptom_followup_questions enable row level security;

grant select on public.symptom_concepts to authenticated;
grant select on public.symptom_aliases to authenticated;
grant select on public.symptom_followup_questions to authenticated;

drop policy if exists symptom_concepts_read on public.symptom_concepts;
create policy symptom_concepts_read on public.symptom_concepts
for select to authenticated using (public.is_active());

drop policy if exists symptom_aliases_read on public.symptom_aliases;
create policy symptom_aliases_read on public.symptom_aliases
for select to authenticated using (public.is_active());

drop policy if exists symptom_questions_read on public.symptom_followup_questions;
create policy symptom_questions_read on public.symptom_followup_questions
for select to authenticated using (public.is_active());

insert into public.symptom_concepts
(code,canonical_name,canonical_bn,body_system,default_specialty_id,routing_priority)
values
('dental_pain','Dental pain','দাঁতের ব্যথা','oral',(select id from public.specialties where lower(name)='dentist' limit 1),120),
('headache','Headache','মাথাব্যথা','neurologic',(select id from public.specialties where lower(name) in ('medicine specialist','general physician') order by case lower(name) when 'medicine specialist' then 1 else 2 end limit 1),110),
('abdominal_pain','Abdominal pain','পেটের ব্যথা','gastrointestinal',(select id from public.specialties where lower(name)='gastroenterologist' limit 1),115),
('chest_pain','Chest pain','বুকের ব্যথা','cardiovascular',(select id from public.specialties where lower(name)='cardiologist' limit 1),140),
('breathing_difficulty','Breathing difficulty','শ্বাসকষ্ট','respiratory',(select id from public.specialties where lower(name)='chest medicine specialist' limit 1),145),
('vomiting','Vomiting','বমি','gastrointestinal',(select id from public.specialties where lower(name) in ('medicine specialist','gastroenterologist') order by case lower(name) when 'medicine specialist' then 1 else 2 end limit 1),100),
('fever','Fever','জ্বর','general',(select id from public.specialties where lower(name)='medicine specialist' limit 1),100),
('rash','Skin rash','চামড়ায় র‍্যাশ','dermatologic',(select id from public.specialties where lower(name)='dermatologist' limit 1),105),
('urinary_burning','Burning urination','প্রস্রাবে জ্বালা','urinary',(select id from public.specialties where lower(name)='urologist' limit 1),105),
('fracture_injury','Suspected fracture / limb injury','হাড় ভাঙা বা অঙ্গের আঘাত','musculoskeletal',(select id from public.specialties where lower(name)='orthopaedic surgeon' limit 1),130)
on conflict (code) do update set
canonical_name=excluded.canonical_name,canonical_bn=excluded.canonical_bn,body_system=excluded.body_system,
default_specialty_id=excluded.default_specialty_id,routing_priority=excluded.routing_priority,active=true;

with a(code,alias,language) as (
  values
  ('dental_pain','dant','banglish'),('dental_pain','dant betha','banglish'),('dental_pain','tooth pain','en'),('dental_pain','toothache','en'),('dental_pain','teeth pain','en'),('dental_pain','দাঁত ব্যথা','bn'),('dental_pain','দাঁতে ব্যথা','bn'),
  ('headache','matha betha','banglish'),('headache','headache','en'),('headache','head pain','en'),('headache','মাথা ব্যথা','bn'),
  ('abdominal_pain','pet betha','banglish'),('abdominal_pain','stomach pain','en'),('abdominal_pain','abdominal pain','en'),('abdominal_pain','belly pain','en'),('abdominal_pain','পেট ব্যথা','bn'),
  ('chest_pain','buk betha','banglish'),('chest_pain','chest pain','en'),('chest_pain','বুক ব্যথা','bn'),
  ('breathing_difficulty','shash kosto','banglish'),('breathing_difficulty','breathing difficulty','en'),('breathing_difficulty','shortness of breath','en'),('breathing_difficulty','শ্বাস কষ্ট','bn'),
  ('vomiting','bomi','banglish'),('vomiting','vomiting','en'),('vomiting','vomit','en'),('vomiting','বমি','bn'),
  ('fever','jor','banglish'),('fever','fever','en'),('fever','জ্বর','bn'),
  ('rash','rash','mixed'),('rash','র‍্যাশ','bn'),('rash','চামড়ায় র‍্যাশ','bn'),
  ('urinary_burning','prosab e jala','banglish'),('urinary_burning','burning urine','en'),('urinary_burning','burning urination','en'),('urinary_burning','প্রস্রাবে জ্বালা','bn'),
  ('fracture_injury','fracture','en'),('fracture_injury','broken bone','en'),('fracture_injury','haddi venge','banglish'),('fracture_injury','haddi venge geche','banglish'),('fracture_injury','bone venge','banglish'),('fracture_injury','হাড় ভেঙে গেছে','bn'),('fracture_injury','হাড় ভেঙে গেছে','bn')
)
insert into public.symptom_aliases(concept_id,alias,language,normalized_alias)
select c.id,a.alias,a.language,public.normalize_symptom_phrase(a.alias)
from a join public.symptom_concepts c on c.code=a.code
on conflict (concept_id,alias) do update set language=excluded.language,normalized_alias=excluded.normalized_alias;

with q(code,attribute_key,question_en,question_bn,question_banglish,answer_type,options,priority,required) as (
  values
  ('dental_pain','dental_red_flags','Do you have facial swelling, fever, or trouble swallowing or breathing?','মুখ ফুলে গেছে, জ্বর আছে, অথবা গিলতে বা শ্বাস নিতে কষ্ট হচ্ছে?','Mukh fule geche, jor ache, ba gilte/shash nite kosto hocche?','choice','["No","Yes","Not sure"]'::jsonb,10,true),
  ('dental_pain','duration','How long have you had the tooth pain?','দাঁতের ব্যথা কতদিন ধরে হচ্ছে?','Dant-er betha koto din dhore hocche?','choice','["Today","1–3 days","4–7 days","More than a week"]'::jsonb,20,true),
  ('headache','headache_red_flags','Did the headache start suddenly at maximum intensity, or do you have weakness, numbness, speech trouble, fainting, or new vision loss?','মাথাব্যথা কি হঠাৎ খুব তীব্রভাবে শুরু হয়েছে, অথবা দুর্বলতা, অবশভাব, কথা জড়িয়ে যাওয়া, অজ্ঞান হওয়া বা নতুন দৃষ্টি কমে যাওয়ার মতো কিছু আছে?','Matha betha ki hotat khub tibro vabe shuru hoyeche, ba weakness/obosh/kotha jorano/ojnan/new vision loss ache?','choice','["No","Yes","Not sure"]'::jsonb,5,true),
  ('headache','duration','How long has the headache been going on?','মাথাব্যথা কতক্ষণ বা কতদিন ধরে হচ্ছে?','Matha betha koto khon ba koto din dhore hocche?','choice','["Less than 1 hour","Today","1–3 days","More than 3 days"]'::jsonb,20,true),
  ('abdominal_pain','pain_location','Where is the abdominal pain strongest?','পেটের ব্যথা সবচেয়ে বেশি কোথায়?','Pet-er betha shobcheye beshi kothay?','choice','["Upper abdomen","Lower abdomen","Right side","Left side","All over"]'::jsonb,10,true),
  ('abdominal_pain','abdominal_red_flags','Is the pain severe or sudden, or is there repeated vomiting, fainting, blood, a rigid abdomen, or possible pregnancy with strong pain?','ব্যথা কি হঠাৎ বা খুব তীব্র, অথবা বারবার বমি, অজ্ঞান, রক্তপাত, পেট শক্ত হয়ে যাওয়া, কিংবা গর্ভধারণের সম্ভাবনার সাথে তীব্র ব্যথা আছে?','Betha ki hotat ba khub tibro, ba bar bar bomi/ojnan/rokto/pet shokto/pregnancy possibility sathe strong pain ache?','choice','["No","Yes","Not sure"]'::jsonb,5,true),
  ('abdominal_pain','duration','How long have you had the abdominal pain?','পেটের ব্যথা কতদিন ধরে হচ্ছে?','Pet betha koto din dhore hocche?','choice','["Less than 6 hours","Today","1–3 days","More than 3 days"]'::jsonb,20,true),
  ('chest_pain','chest_red_flags','Is the chest pain severe, crushing, or accompanied by breathing trouble, sweating, faintness, or pain spreading to the arm, jaw, or back?','বুকের ব্যথা কি খুব তীব্র/চাপের মতো, অথবা শ্বাসকষ্ট, ঘাম, অজ্ঞানভাব, বা হাত-চোয়াল-পিঠে ছড়িয়ে যাচ্ছে?','Buk-er betha ki khub tibro/chap-er moto, ba shashkosto, gham, ojnan bhab, ba hat/jaw/pith-e choriye jacche?','choice','["No","Yes","Not sure"]'::jsonb,1,true),
  ('chest_pain','duration','When did the chest pain start?','বুকের ব্যথা কখন শুরু হয়েছে?','Buk-er betha kokhon shuru hoyeche?','choice','["Just now","Today","1–3 days","Longer"]'::jsonb,15,true),
  ('breathing_difficulty','breathing_red_flags','Are you struggling to breathe at rest, unable to speak normally, turning blue, fainting, or rapidly getting worse?','বিশ্রামেও কি শ্বাস নিতে খুব কষ্ট হচ্ছে, স্বাভাবিকভাবে কথা বলতে পারছেন না, ঠোঁট নীল হচ্ছে, অজ্ঞান হচ্ছেন, বা দ্রুত খারাপ হচ্ছে?','Rest-eo ki shash nite khub kosto, normal kotha bola jacche na, thot nil, ojnan, ba rapidly worse hocche?','choice','["No","Yes","Not sure"]'::jsonb,1,true),
  ('rash','rash_red_flags','Do you also have trouble breathing, swelling of the lips/tongue/throat, faintness, or a rapidly spreading severe rash?','র‍্যাশের সাথে শ্বাসকষ্ট, ঠোঁট/জিহ্বা/গলা ফুলে যাওয়া, অজ্ঞানভাব, বা খুব দ্রুত ছড়িয়ে পড়া গুরুতর র‍্যাশ আছে?','Rash-er sathe shashkosto, lips/jihba/gola fule jawa, ojnan bhab, ba rapidly spreading severe rash ache?','choice','["No","Yes","Not sure"]'::jsonb,1,true),
  ('rash','duration','How long has the rash been present?','র‍্যাশ কতদিন ধরে আছে?','Rash koto din dhore ache?','choice','["Today","1–3 days","4–7 days","More than a week"]'::jsonb,20,true),
  ('urinary_burning','urinary_red_flags','Do you have fever with back/side pain, vomiting, visible blood, pregnancy, or inability to pass urine?','জ্বরের সাথে পিঠ/পাশে ব্যথা, বমি, চোখে দেখা রক্ত, গর্ভাবস্থা, বা একেবারেই প্রস্রাব না হওয়া—এর কোনোটি আছে?','Jor sathe pith/pash betha, bomi, visible rokto, pregnancy, ba prosab ekdom hocche na—er konota ache?','choice','["No","Yes","Not sure"]'::jsonb,5,true),
  ('urinary_burning','duration','How long has the burning with urination been happening?','প্রস্রাবে জ্বালা কতদিন ধরে হচ্ছে?','Prosab-e jala koto din dhore hocche?','choice','["Today","1–3 days","4–7 days","More than a week"]'::jsonb,20,true),
  ('fracture_injury','fracture_red_flags','Is bone visible, is there heavy bleeding or major deformity, or is the limb numb, cold/blue, or impossible to move?','হাড় দেখা যাচ্ছে, প্রচুর রক্তপাত/বড় বিকৃতি আছে, অথবা অঙ্গটি অবশ, ঠান্ডা/নীল, বা একেবারেই নড়াতে পারছেন না?','Haddi dekha jacche, onek rokto/major deformity ache, ba limb obosh, thanda/nil, ba ekdom narate parchen na?','choice','["No","Yes","Not sure"]'::jsonb,1,true),
  ('fracture_injury','injury_timing','When did the injury happen?','আঘাতটি কখন লেগেছে?','Injury-ta kokhon hoyeche?','choice','["Just now","Today","1–3 days ago","Longer ago"]'::jsonb,10,true)
)
insert into public.symptom_followup_questions(concept_id,attribute_key,question_en,question_bn,question_banglish,answer_type,options,priority,required)
select c.id,q.attribute_key,q.question_en,q.question_bn,q.question_banglish,q.answer_type,q.options,q.priority,q.required
from q join public.symptom_concepts c on c.code=q.code
on conflict (concept_id,attribute_key) do update set
question_en=excluded.question_en,question_bn=excluded.question_bn,question_banglish=excluded.question_banglish,
answer_type=excluded.answer_type,options=excluded.options,priority=excluded.priority,required=excluded.required,active=true;

create or replace function public.match_symptom_concepts(query_text text)
returns table(concept_id uuid,code text,canonical_name text,canonical_bn text,matched_alias text,score numeric,normalized_query text)
language sql stable security invoker set search_path=public,extensions
as $$
  with q as (select public.normalize_symptom_phrase(query_text) as nq),
  ranked as (
    select c.id concept_id,c.code,c.canonical_name,c.canonical_bn,a.normalized_alias matched_alias,
      ((case when position(a.normalized_alias in q.nq)>0
        then 1.0 + least(0.25,length(a.normalized_alias)::numeric/greatest(length(q.nq),1)::numeric*0.25)
        when length(a.normalized_alias)>=4 and word_similarity(a.normalized_alias,q.nq)>=0.72
        then word_similarity(a.normalized_alias,q.nq)::numeric*0.82 else 0::numeric end)
       + c.routing_priority::numeric/5000) score,
      q.nq normalized_query,
      row_number() over(partition by c.id order by
        case when position(a.normalized_alias in q.nq)>0 then 2
             when word_similarity(a.normalized_alias,q.nq)>=0.72 then 1 else 0 end desc,
        length(a.normalized_alias) desc) rn
    from q
    join public.symptom_aliases a on (
      position(a.normalized_alias in q.nq)>0 or
      (length(a.normalized_alias)>=4 and word_similarity(a.normalized_alias,q.nq)>=0.72)
    )
    join public.symptom_concepts c on c.id=a.concept_id and c.active
  )
  select concept_id,code,canonical_name,canonical_bn,matched_alias,score::numeric,normalized_query
  from ranked where rn=1 and score>0 order by score desc limit 5;
$$;

revoke all on function public.match_symptom_concepts(text) from public;
grant execute on function public.match_symptom_concepts(text) to authenticated;

commit;
