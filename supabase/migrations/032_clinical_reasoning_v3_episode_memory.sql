-- HCC Clinical Reasoning Engine v3
-- Persistent clinical episodes + structured evidence + broader concept matching.
-- This supports navigation/triage, not diagnosis.

begin;

create table if not exists public.clinical_episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid not null,
  status text not null default 'active'
    check (status in ('active','closed')),
  primary_concept_id uuid references public.symptom_concepts(id) on delete set null,
  primary_concept_code text,
  primary_specialty_name text,
  context_text text not null default '',
  pending_question_id uuid references public.symptom_followup_questions(id) on delete set null,
  pending_attribute_key text,
  urgency_level text not null default 'unknown'
    check (urgency_level in ('unknown','self_care','routine','soon','urgent','emergency')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create unique index if not exists clinical_episodes_one_active_per_conversation
  on public.clinical_episodes(user_id, conversation_id)
  where status='active';

create index if not exists clinical_episodes_user_updated_idx
  on public.clinical_episodes(user_id, updated_at desc);

create table if not exists public.clinical_episode_evidence (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.clinical_episodes(id) on delete cascade,
  concept_id uuid references public.symptom_concepts(id) on delete set null,
  evidence_key text not null,
  value text not null,
  polarity text not null default 'present'
    check (polarity in ('present','absent','uncertain','answer')),
  confidence numeric not null default 0.8
    check (confidence >= 0 and confidence <= 1),
  source_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(episode_id, evidence_key)
);

create index if not exists clinical_episode_evidence_episode_idx
  on public.clinical_episode_evidence(episode_id, updated_at);

alter table public.assistant_messages
  add column if not exists conversation_id uuid,
  add column if not exists episode_id uuid references public.clinical_episodes(id) on delete set null;

create index if not exists assistant_messages_conversation_idx
  on public.assistant_messages(user_id, conversation_id, created_at);

create index if not exists assistant_messages_episode_idx
  on public.assistant_messages(episode_id, created_at);

alter table public.clinical_episodes enable row level security;
alter table public.clinical_episode_evidence enable row level security;

revoke all on public.clinical_episodes from anon, authenticated;
revoke all on public.clinical_episode_evidence from anon, authenticated;
grant select on public.clinical_episodes to authenticated;
grant select on public.clinical_episode_evidence to authenticated;
grant all on public.clinical_episodes to service_role;
grant all on public.clinical_episode_evidence to service_role;

drop policy if exists clinical_episodes_read on public.clinical_episodes;
create policy clinical_episodes_read
on public.clinical_episodes
for select to authenticated
using (
  (user_id = (select auth.uid()) and public.is_active())
  or public.is_admin()
);

drop policy if exists clinical_episode_evidence_read on public.clinical_episode_evidence;
create policy clinical_episode_evidence_read
on public.clinical_episode_evidence
for select to authenticated
using (
  exists (
    select 1
    from public.clinical_episodes e
    where e.id=clinical_episode_evidence.episode_id
      and (
        (e.user_id=(select auth.uid()) and public.is_active())
        or public.is_admin()
      )
  )
);

insert into public.symptom_concepts
(code,canonical_name,canonical_bn,body_system,default_specialty_id,routing_priority)
values
('sore_throat','Sore throat / throat pain','গলা ব্যথা','ent',(select id from public.specialties where lower(name)='ent specialist' limit 1),108),
('cough','Cough','কাশি','respiratory',(select id from public.specialties where lower(name)='chest medicine specialist' limit 1),102),
('ear_pain','Ear pain','কানে ব্যথা','ent',(select id from public.specialties where lower(name)='ent specialist' limit 1),108),
('eye_problem','Eye pain / visual symptom','চোখের সমস্যা','eye',(select id from public.specialties where lower(name)='eye specialist' limit 1),108),
('back_pain','Back / waist pain','পিঠ বা কোমর ব্যথা','musculoskeletal',(select id from public.specialties where lower(name)='physical medicine & rehabilitation specialist' limit 1),104),
('joint_pain','Joint pain','জয়েন্ট ব্যথা','musculoskeletal',(select id from public.specialties where lower(name)='orthopaedic surgeon' limit 1),104),
('diarrhea','Diarrhea / loose stool','পাতলা পায়খানা','gastrointestinal',(select id from public.specialties where lower(name)='gastroenterologist' limit 1),104),
('dizziness','Dizziness / vertigo','মাথা ঘোরা','neurologic',(select id from public.specialties where lower(name)='medicine specialist' limit 1),104),
('general_weakness','General weakness','দুর্বল লাগা','general',(select id from public.specialties where lower(name)='medicine specialist' limit 1),96),
('menstrual_problem','Menstrual / period problem','মাসিকের সমস্যা','gynaecologic',(select id from public.specialties where lower(name)='gynaecologist' limit 1),108)
on conflict (code) do update set
  canonical_name=excluded.canonical_name,
  canonical_bn=excluded.canonical_bn,
  body_system=excluded.body_system,
  default_specialty_id=excluded.default_specialty_id,
  routing_priority=excluded.routing_priority,
  active=true;

with a(code,alias,language) as (
  values
  ('sore_throat','gola betha','banglish'),('sore_throat','gola batha','banglish'),('sore_throat','throat pain','en'),('sore_throat','sore throat','en'),('sore_throat','গলা ব্যথা','bn'),
  ('cough','kashi','banglish'),('cough','khasi','banglish'),('cough','cough','en'),('cough','কাশি','bn'),
  ('ear_pain','kan betha','banglish'),('ear_pain','ear pain','en'),('ear_pain','earache','en'),('ear_pain','কানে ব্যথা','bn'),
  ('eye_problem','chokh betha','banglish'),('eye_problem','eye pain','en'),('eye_problem','blurred vision','en'),('eye_problem','chokh jhapsha','banglish'),('eye_problem','চোখে ব্যথা','bn'),('eye_problem','ঝাপসা দেখি','bn'),
  ('back_pain','komor betha','banglish'),('back_pain','pith betha','banglish'),('back_pain','back pain','en'),('back_pain','lower back pain','en'),('back_pain','কোমর ব্যথা','bn'),('back_pain','পিঠ ব্যথা','bn'),
  ('joint_pain','joint betha','banglish'),('joint_pain','joint pain','en'),('joint_pain','জয়েন্ট ব্যথা','bn'),('joint_pain','জয়েন্ট ব্যথা','bn'),
  ('diarrhea','patla paykhana','banglish'),('diarrhea','loose motion','en'),('diarrhea','diarrhea','en'),('diarrhea','diarrhoea','en'),('diarrhea','পাতলা পায়খানা','bn'),('diarrhea','পাতলা পায়খানা','bn'),
  ('dizziness','matha ghure','banglish'),('dizziness','matha ghuray','banglish'),('dizziness','dizzy','en'),('dizziness','dizziness','en'),('dizziness','vertigo','en'),('dizziness','মাথা ঘোরা','bn'),
  ('general_weakness','durbol lagche','banglish'),('general_weakness','weakness','en'),('general_weakness','feeling weak','en'),('general_weakness','দুর্বল লাগছে','bn'),
  ('menstrual_problem','period problem','en'),('menstrual_problem','period late','en'),('menstrual_problem','masik problem','banglish'),('menstrual_problem','masik late','banglish'),('menstrual_problem','মাসিকের সমস্যা','bn'),('menstrual_problem','মাসিক দেরি','bn')
)
insert into public.symptom_aliases(concept_id,alias,language,normalized_alias)
select c.id,a.alias,a.language,public.normalize_symptom_phrase(a.alias)
from a
join public.symptom_concepts c on c.code=a.code
on conflict (concept_id,alias) do update set
  language=excluded.language,
  normalized_alias=excluded.normalized_alias;

with q(code,attribute_key,question_en,question_bn,question_banglish,answer_type,options,priority,required) as (
  values
  ('sore_throat','throat_red_flags','Are you having trouble breathing or swallowing saliva, or is your throat/tongue rapidly swelling?','শ্বাস নিতে বা লালা গিলতে কষ্ট হচ্ছে, অথবা গলা/জিহ্বা দ্রুত ফুলে যাচ্ছে?','Shash nite ba lala gilte kosto hocche, ba gola/jihba rapidly fule jacche?','choice','["No","Yes","Not sure"]'::jsonb,1,true),
  ('sore_throat','duration','How long has the throat pain been present?','গলা ব্যথা কতদিন ধরে হচ্ছে?','Gola betha koto din dhore hocche?','choice','["Today","1–3 days","4–7 days","More than a week"]'::jsonb,20,true),
  ('cough','breathing_red_flags','Do you have severe breathing difficulty, blue lips, fainting, or coughing up a significant amount of blood?','গুরুতর শ্বাসকষ্ট, ঠোঁট নীল হওয়া, অজ্ঞান হওয়া, বা কাশির সাথে অনেক রক্ত যাচ্ছে?','Severe shashkosto, thot nil, ojnan, ba kashir sathe onek rokto jacche?','choice','["No","Yes","Not sure"]'::jsonb,1,true),
  ('cough','duration','How long have you had the cough?','কাশি কতদিন ধরে হচ্ছে?','Kashi koto din dhore hocche?','choice','["Today","1–3 days","4–7 days","More than a week"]'::jsonb,20,true),
  ('ear_pain','duration','How long have you had the ear pain?','কানের ব্যথা কতদিন ধরে হচ্ছে?','Kan betha koto din dhore hocche?','choice','["Today","1–3 days","4–7 days","More than a week"]'::jsonb,20,true),
  ('eye_problem','eye_red_flags','Was there sudden vision loss, severe eye injury, chemical exposure, or severe eye pain with vomiting?','হঠাৎ দৃষ্টি চলে গেছে, চোখে গুরুতর আঘাত/কেমিক্যাল লেগেছে, অথবা বমির সাথে তীব্র চোখব্যথা আছে?','Hotat vision loss, severe eye injury/chemical exposure, ba bomi sathe severe eye pain ache?','choice','["No","Yes","Not sure"]'::jsonb,1,true),
  ('back_pain','back_red_flags','Do you have new leg weakness/numbness, loss of bladder or bowel control, numbness around the groin, or major trauma?','নতুন পা দুর্বল/অবশ, প্রস্রাব-পায়খানার নিয়ন্ত্রণ হারানো, কুঁচকির আশেপাশে অবশভাব, বা বড় আঘাত আছে?','New leg weakness/obosh, bladder-bowel control loss, groin area numbness, ba major trauma ache?','choice','["No","Yes","Not sure"]'::jsonb,1,true),
  ('joint_pain','duration','How long has the joint pain been present?','জয়েন্টের ব্যথা কতদিন ধরে হচ্ছে?','Joint betha koto din dhore hocche?','choice','["Today","1–3 days","4–7 days","More than a week"]'::jsonb,20,true),
  ('diarrhea','diarrhea_red_flags','Is there blood or black stool, fainting, severe dehydration, severe abdominal pain, or inability to keep fluids down?','রক্ত/কালো পায়খানা, অজ্ঞানভাব, গুরুতর পানিশূন্যতা, তীব্র পেটব্যথা, বা পানি খেলেও রাখতে না পারা—এর কোনোটি আছে?','Rokto/black stool, ojnan, severe dehydration, severe pet betha, ba pani-o dhore rakhte na para ache?','choice','["No","Yes","Not sure"]'::jsonb,1,true),
  ('dizziness','dizziness_red_flags','Did the dizziness start suddenly with weakness, numbness, speech trouble, severe headache, fainting, or chest pain?','মাথা ঘোরার সাথে হঠাৎ দুর্বলতা, অবশভাব, কথা জড়িয়ে যাওয়া, তীব্র মাথাব্যথা, অজ্ঞান, বা বুকব্যথা আছে?','Dizziness sathe hotat weakness, obosh, speech problem, severe headache, ojnan, ba buk betha ache?','choice','["No","Yes","Not sure"]'::jsonb,1,true),
  ('general_weakness','duration','How long have you been feeling weak?','দুর্বল কতদিন ধরে লাগছে?','Durbol koto din dhore lagche?','choice','["Today","1–3 days","4–7 days","More than a week"]'::jsonb,20,true),
  ('menstrual_problem','pregnancy_context','Is pregnancy possible?','গর্ভধারণের সম্ভাবনা আছে?','Pregnancy possible?','choice','["No","Yes","Not sure"]'::jsonb,8,true)
)
insert into public.symptom_followup_questions
(concept_id,attribute_key,question_en,question_bn,question_banglish,answer_type,options,priority,required)
select c.id,q.attribute_key,q.question_en,q.question_bn,q.question_banglish,q.answer_type,q.options,q.priority,q.required
from q
join public.symptom_concepts c on c.code=q.code
on conflict (concept_id,attribute_key) do update set
  question_en=excluded.question_en,
  question_bn=excluded.question_bn,
  question_banglish=excluded.question_banglish,
  answer_type=excluded.answer_type,
  options=excluded.options,
  priority=excluded.priority,
  required=excluded.required,
  active=true;

drop function if exists public.match_symptom_concepts(text);

create function public.match_symptom_concepts(query_text text)
returns table(
  concept_id uuid,
  code text,
  canonical_name text,
  canonical_bn text,
  matched_alias text,
  score numeric,
  normalized_query text,
  default_specialty_id uuid,
  default_specialty_name text
)
language sql
stable
security invoker
set search_path=public,extensions
as $$
  with q as (
    select public.normalize_symptom_phrase(query_text) as nq
  ),
  candidates as (
    select
      c.id concept_id,
      c.code,
      c.canonical_name,
      c.canonical_bn,
      a.normalized_alias matched_alias,
      c.default_specialty_id,
      s.name default_specialty_name,
      q.nq normalized_query,
      case
        when position(a.normalized_alias in q.nq)>0 then
          1.0
          + least(0.25, length(a.normalized_alias)::numeric / greatest(length(q.nq),1)::numeric * 0.25)
        when (
          select count(*)
          from unnest(string_to_array(a.normalized_alias,' ')) t
          where length(t)>=2 and t = any(string_to_array(q.nq,' '))
        )::numeric
        / greatest(array_length(string_to_array(a.normalized_alias,' '),1),1)::numeric >= 0.66
        then
          0.72
          + 0.20 * (
            (
              select count(*)
              from unnest(string_to_array(a.normalized_alias,' ')) t
              where length(t)>=2 and t = any(string_to_array(q.nq,' '))
            )::numeric
            / greatest(array_length(string_to_array(a.normalized_alias,' '),1),1)::numeric
          )
        when length(a.normalized_alias)>=4
          and greatest(
            word_similarity(a.normalized_alias,q.nq),
            similarity(a.normalized_alias,q.nq)
          ) >= 0.58
        then greatest(
          word_similarity(a.normalized_alias,q.nq),
          similarity(a.normalized_alias,q.nq)
        )::numeric * 0.78
        else 0::numeric
      end + c.routing_priority::numeric/5000 as score
    from q
    join public.symptom_aliases a on (
      position(a.normalized_alias in q.nq)>0
      or (
        (
          select count(*)
          from unnest(string_to_array(a.normalized_alias,' ')) t
          where length(t)>=2 and t = any(string_to_array(q.nq,' '))
        )::numeric
        / greatest(array_length(string_to_array(a.normalized_alias,' '),1),1)::numeric >= 0.66
      )
      or (
        length(a.normalized_alias)>=4
        and greatest(
          word_similarity(a.normalized_alias,q.nq),
          similarity(a.normalized_alias,q.nq)
        ) >= 0.58
      )
    )
    join public.symptom_concepts c on c.id=a.concept_id and c.active
    left join public.specialties s on s.id=c.default_specialty_id
  ),
  ranked as (
    select *,
      row_number() over(
        partition by concept_id
        order by score desc,length(matched_alias) desc
      ) rn
    from candidates
    where score>0
  )
  select
    concept_id,code,canonical_name,canonical_bn,matched_alias,
    score::numeric,normalized_query,default_specialty_id,default_specialty_name
  from ranked
  where rn=1
  order by score desc
  limit 8;
$$;

revoke all on function public.match_symptom_concepts(text) from public;
grant execute on function public.match_symptom_concepts(text) to authenticated;

commit;
