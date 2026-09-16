begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- Keep the specialty catalogue useful for future doctor records without
-- creating duplicates when this migration is re-applied.
with wanted(name) as (
  values
    ('Paediatrician'),
    ('Physical Medicine & Rehabilitation Specialist'),
    ('Pulmonologist'),
    ('Hepatologist'),
    ('Cardiac Surgeon'),
    ('Maxillofacial Surgeon'),
    ('Pain Medicine Specialist'),
    ('Sleep Medicine Specialist'),
    ('Emergency Medicine Specialist')
)
insert into public.specialties(name)
select w.name
from wanted w
where not exists (
  select 1 from public.specialties s where lower(s.name)=lower(w.name)
);

-- Symptom routing is deliberately conservative. Common, non-specific symptoms
-- point to a broad medical specialty; more specific phrases get higher priority.
-- These are routing hints only, never diagnoses.
with seed(keyword, specialty_name, priority, emergency_notice) as (
  values
    -- Dentistry
    ('tooth pain','Dentist',100,null),
    ('tooth ache','Dentist',100,null),
    ('dental pain','Dentist',100,null),
    ('gum swelling','Dentist',90,null),
    ('bleeding gums','Dentist',85,null),
    ('broken tooth','Dentist',95,null),
    ('dater betha','Dentist',100,null),
    ('datar betha','Dentist',100,null),
    ('dant betha','Dentist',100,null),
    ('দাঁতের ব্যথা','Dentist',100,null),
    ('দাতের ব্যথা','Dentist',100,null),
    ('মাড়ি ফুলে গেছে','Dentist',90,null),

    -- Cardiology
    ('palpitations','Cardiologist',95,null),
    ('heart racing','Cardiologist',95,null),
    ('irregular heartbeat','Cardiologist',95,null),
    ('heart doctor','Cardiologist',100,null),
    ('cardiac doctor','Cardiologist',100,null),
    ('heart er doctor','Cardiologist',100,null),
    ('buk dhorfor','Cardiologist',95,null),
    ('বুক ধড়ফড়','Cardiologist',95,null),
    ('হার্ট ডাক্তার','Cardiologist',100,null),
    ('severe chest pain','Cardiologist',120,'Severe chest pain can be an emergency. Use emergency services now.'),
    ('crushing chest pain','Cardiologist',120,'Crushing chest pain can be an emergency. Use emergency services now.'),
    ('chest pain with shortness of breath','Cardiologist',125,'Chest pain with breathing difficulty can be an emergency. Use emergency services now.'),
    ('তীব্র বুক ব্যথা','Cardiologist',120,'তীব্র বুক ব্যথা জরুরি অবস্থা হতে পারে। এখনই জরুরি সহায়তা নিন।'),

    -- Neurology
    ('migraine','Neurologist',100,null),
    ('recurrent headache','Neurologist',90,null),
    ('headache','Neurologist',65,null),
    ('numbness','Neurologist',85,null),
    ('tingling','Neurologist',80,null),
    ('tremor','Neurologist',90,null),
    ('shaking hands','Neurologist',85,null),
    ('memory problem','Neurologist',75,null),
    ('matha betha','Neurologist',65,null),
    ('matha byatha','Neurologist',65,null),
    ('মাথা ব্যথা','Neurologist',65,null),
    ('মাইগ্রেন','Neurologist',100,null),
    ('one sided weakness','Neurologist',125,'Sudden one-sided weakness may be a stroke. Use emergency services now.'),
    ('face drooping','Neurologist',125,'Sudden facial drooping may be a stroke. Use emergency services now.'),
    ('slurred speech','Neurologist',125,'Sudden slurred speech may be a stroke. Use emergency services now.'),
    ('হঠাৎ এক পাশ দুর্বল','Neurologist',125,'হঠাৎ শরীরের এক পাশ দুর্বল হওয়া স্ট্রোকের লক্ষণ হতে পারে। এখনই জরুরি সহায়তা নিন।'),

    -- ENT
    ('ear pain','ENT Specialist',95,null),
    ('hearing loss','ENT Specialist',100,null),
    ('blocked ear','ENT Specialist',85,null),
    ('sinus problem','ENT Specialist',90,null),
    ('persistent sinusitis','ENT Specialist',95,null),
    ('tonsil problem','ENT Specialist',90,null),
    ('ear nose throat','ENT Specialist',100,null),
    ('kan betha','ENT Specialist',95,null),
    ('kan nak gola','ENT Specialist',100,null),
    ('কানে ব্যথা','ENT Specialist',95,null),
    ('কান নাক গলা','ENT Specialist',100,null),

    -- Eye
    ('eye pain','Eye Specialist',95,null),
    ('blurred vision','Eye Specialist',95,null),
    ('red eye','Eye Specialist',85,null),
    ('eye infection','Eye Specialist',90,null),
    ('eye doctor','Eye Specialist',100,null),
    ('chokher doctor','Eye Specialist',100,null),
    ('চোখে ব্যথা','Eye Specialist',95,null),
    ('চোখ ঝাপসা','Eye Specialist',95,null),
    ('চোখের ডাক্তার','Eye Specialist',100,null),
    ('sudden vision loss','Eye Specialist',125,'Sudden vision loss needs urgent medical assessment.'),
    ('হঠাৎ দৃষ্টি চলে গেছে','Eye Specialist',125,'হঠাৎ দৃষ্টি চলে যাওয়া জরুরি অবস্থা হতে পারে। এখনই জরুরি সহায়তা নিন।'),

    -- Dermatology
    ('skin rash','Dermatologist',95,null),
    ('rash','Dermatologist',75,null),
    ('itchy skin','Dermatologist',90,null),
    ('itching','Dermatologist',70,null),
    ('acne','Dermatologist',95,null),
    ('hair loss','Dermatologist',85,null),
    ('skin infection','Dermatologist',90,null),
    ('skin doctor','Dermatologist',100,null),
    ('chulkani','Dermatologist',75,null),
    ('চুলকানি','Dermatologist',75,null),
    ('ত্বকে র‍্যাশ','Dermatologist',95,null),
    ('চর্ম ডাক্তার','Dermatologist',100,null),

    -- Orthopaedics / rehabilitation
    ('knee pain','Orthopaedic Surgeon',100,null),
    ('joint pain','Orthopaedic Surgeon',85,null),
    ('back pain','Orthopaedic Surgeon',80,null),
    ('neck pain','Orthopaedic Surgeon',80,null),
    ('shoulder pain','Orthopaedic Surgeon',90,null),
    ('bone pain','Orthopaedic Surgeon',85,null),
    ('fracture','Orthopaedic Surgeon',110,null),
    ('sports injury','Orthopaedic Surgeon',100,null),
    ('payer betha','Orthopaedic Surgeon',80,null),
    ('paye betha','Orthopaedic Surgeon',80,null),
    ('hatur betha','Orthopaedic Surgeon',100,null),
    ('komor betha','Orthopaedic Surgeon',80,null),
    ('হাঁটু ব্যথা','Orthopaedic Surgeon',100,null),
    ('কোমর ব্যথা','Orthopaedic Surgeon',80,null),
    ('হাড় ভেঙেছে','Orthopaedic Surgeon',110,null),
    ('rehabilitation','Physical Medicine & Rehabilitation Specialist',100,null),
    ('stroke rehabilitation','Physical Medicine & Rehabilitation Specialist',110,null),
    ('injury rehabilitation','Physical Medicine & Rehabilitation Specialist',105,null),
    ('chronic musculoskeletal pain','Physical Medicine & Rehabilitation Specialist',95,null),

    -- Gynaecology / obstetrics / fertility
    ('irregular period','Gynaecologist',100,null),
    ('heavy period','Gynaecologist',95,null),
    ('heavy menstrual bleeding','Gynaecologist',100,null),
    ('pelvic pain','Gynaecologist',85,null),
    ('vaginal discharge','Gynaecologist',90,null),
    ('gynae doctor','Gynaecologist',100,null),
    ('period irregular','Gynaecologist',100,null),
    ('masik irregular','Gynaecologist',100,null),
    ('অনিয়মিত মাসিক','Gynaecologist',100,null),
    ('গাইনি ডাক্তার','Gynaecologist',100,null),
    ('pregnancy checkup','Obstetrician',100,null),
    ('antenatal care','Obstetrician',100,null),
    ('pregnant doctor','Obstetrician',95,null),
    ('pregnancy bleeding','Obstetrician',125,'Bleeding during pregnancy may need urgent assessment.'),
    ('গর্ভাবস্থায় রক্তপাত','Obstetrician',125,'গর্ভাবস্থায় রক্তপাত হলে দ্রুত জরুরি চিকিৎসা নিন।'),
    ('infertility','Fertility Specialist',100,null),
    ('trying to conceive','Fertility Specialist',90,null),

    -- Gastroenterology / liver / colorectal
    ('persistent stomach pain','Gastroenterologist',95,null),
    ('abdominal pain','Gastroenterologist',75,null),
    ('acid reflux','Gastroenterologist',95,null),
    ('heartburn','Gastroenterologist',85,null),
    ('gastric problem','Gastroenterologist',85,null),
    ('stomach ulcer','Gastroenterologist',100,null),
    ('pet betha','Gastroenterologist',75,null),
    ('পেট ব্যথা','Gastroenterologist',75,null),
    ('গ্যাস্ট্রিক','Gastroenterologist',85,null),
    ('jaundice','Liver Specialist',100,null),
    ('hepatitis','Liver Specialist',100,null),
    ('yellow eyes','Liver Specialist',85,null),
    ('জন্ডিস','Liver Specialist',100,null),
    ('piles','Colorectal Surgeon',95,null),
    ('hemorrhoids','Colorectal Surgeon',95,null),
    ('anal bleeding','Colorectal Surgeon',105,null),

    -- Kidney / urinary
    ('kidney pain','Kidney Specialist',95,null),
    ('high creatinine','Kidney Specialist',100,null),
    ('protein in urine','Kidney Specialist',100,null),
    ('kidney disease','Kidney Specialist',100,null),
    ('কিডনি সমস্যা','Kidney Specialist',100,null),
    ('painful urination','Urologist',100,null),
    ('burning urination','Urologist',100,null),
    ('blood in urine','Urologist',110,null),
    ('urinary retention','Urologist',110,null),
    ('prostate problem','Urologist',100,null),
    ('prosab e jala','Urologist',100,null),
    ('প্রস্রাবে জ্বালা','Urologist',100,null),
    ('প্রস্রাবে রক্ত','Urologist',110,null),

    -- Chest / respiratory / allergy
    ('persistent cough','Chest Medicine Specialist',90,null),
    ('wheezing','Chest Medicine Specialist',100,null),
    ('asthma','Chest Medicine Specialist',100,null),
    ('breathing problem','Chest Medicine Specialist',85,null),
    ('shortness of breath','Chest Medicine Specialist',95,null),
    ('coughing blood','Chest Medicine Specialist',125,'Coughing blood can require urgent medical assessment.'),
    ('shash kosto','Chest Medicine Specialist',95,null),
    ('শ্বাসকষ্ট','Chest Medicine Specialist',95,null),
    ('হাঁপানি','Chest Medicine Specialist',100,null),
    ('severe difficulty breathing','Chest Medicine Specialist',130,'Severe breathing difficulty is an emergency. Use emergency services now.'),
    ('allergy','Allergy Specialist',90,null),
    ('hives','Allergy Specialist',95,null),
    ('recurrent sneezing','Allergy Specialist',80,null),
    ('tongue swelling with breathing difficulty','Allergy Specialist',130,'Tongue or throat swelling with breathing difficulty can be a severe allergic reaction. Use emergency services now.'),

    -- Endocrine / diabetes
    ('diabetes','Diabetes Specialist',100,null),
    ('high blood sugar','Diabetes Specialist',100,null),
    ('uncontrolled sugar','Diabetes Specialist',100,null),
    ('blood sugar high','Diabetes Specialist',100,null),
    ('sugar beshi','Diabetes Specialist',100,null),
    ('ডায়াবেটিস','Diabetes Specialist',100,null),
    ('thyroid problem','Endocrinologist',100,null),
    ('thyroid','Endocrinologist',90,null),
    ('hormone problem','Endocrinologist',85,null),
    ('থাইরয়েড','Endocrinologist',100,null),

    -- Mental health
    ('anxiety','Psychiatrist',85,null),
    ('panic attack','Psychiatrist',100,null),
    ('depression','Psychiatrist',100,null),
    ('hallucination','Psychiatrist',110,null),
    ('hearing voices','Psychiatrist',110,null),
    ('mental health doctor','Psychiatrist',100,null),
    ('panic','Psychiatrist',80,null),
    ('মানসিক ডাক্তার','Psychiatrist',100,null),
    ('suicidal thoughts','Psychiatrist',130,'If there is immediate danger or intent to self-harm, seek emergency help now.'),
    ('want to kill myself','Psychiatrist',130,'If there is immediate danger or intent to self-harm, seek emergency help now.'),
    ('আত্মহত্যার চিন্তা','Psychiatrist',130,'নিজেকে ক্ষতি করার তাৎক্ষণিক ঝুঁকি থাকলে এখনই জরুরি সহায়তা নিন।'),

    -- Rheumatology / blood / cancer
    ('joint swelling','Rheumatologist',95,null),
    ('morning stiffness','Rheumatologist',100,null),
    ('multiple joint pain','Rheumatologist',100,null),
    ('autoimmune disease','Rheumatologist',100,null),
    ('anemia','Haematologist',90,null),
    ('low hemoglobin','Haematologist',95,null),
    ('easy bruising','Haematologist',90,null),
    ('blood disorder','Haematologist',100,null),
    ('cancer','Oncologist',100,null),
    ('tumor','Oncologist',90,null),
    ('chemotherapy','Oncologist',100,null),
    ('cancer doctor','Oncologist',100,null),

    -- General/internal medicine: intentionally lower priority because these are broad symptoms.
    ('fever','Medicine Specialist',50,null),
    ('high fever','Medicine Specialist',65,null),
    ('weakness','Medicine Specialist',45,null),
    ('fatigue','Medicine Specialist',45,null),
    ('body ache','Medicine Specialist',45,null),
    ('loss of appetite','Medicine Specialist',45,null),
    ('jor','Medicine Specialist',50,null),
    ('durbol','Medicine Specialist',45,null),
    ('জ্বর','Medicine Specialist',50,null),
    ('দুর্বলতা','Medicine Specialist',45,null),

    -- Paediatric / newborn terms
    ('child doctor','Paediatrician',100,null),
    ('baby doctor','Paediatrician',100,null),
    ('bacchar doctor','Paediatrician',100,null),
    ('child fever','Paediatrician',105,null),
    ('baby fever','Paediatrician',105,null),
    ('শিশু ডাক্তার','Paediatrician',100,null),
    ('বাচ্চার জ্বর','Paediatrician',105,null),
    ('newborn problem','Neonatologist',100,null),
    ('newborn jaundice','Neonatologist',105,null),
    ('নবজাতকের সমস্যা','Neonatologist',100,null),

    -- Other useful specialty terms
    ('varicose veins','Vascular Surgeon',100,null),
    ('leg vein swelling','Vascular Surgeon',90,null),
    ('sleep apnea','Sleep Medicine Specialist',100,null),
    ('snoring with breathing pauses','Sleep Medicine Specialist',100,null),
    ('chronic pain management','Pain Medicine Specialist',100,null),
    ('maxillofacial injury','Maxillofacial Surgeon',100,null),
    ('jaw fracture','Maxillofacial Surgeon',100,null),
    ('cardiac surgery','Cardiac Surgeon',100,null),
    ('heart surgery','Cardiac Surgeon',100,null)
)
insert into public.symptom_rules(keyword,specialty_id,priority,emergency_notice)
select
  seed.keyword,
  s.id,
  seed.priority,
  seed.emergency_notice
from seed
join public.specialties s on lower(s.name)=lower(seed.specialty_name)
where not exists (
  select 1
  from public.symptom_rules r
  where lower(trim(r.keyword))=lower(trim(seed.keyword))
    and r.specialty_id=s.id
);

create index if not exists symptom_rules_keyword_lower_idx
  on public.symptom_rules ((lower(keyword)));
create index if not exists symptom_rules_specialty_priority_idx
  on public.symptom_rules (specialty_id, priority desc);

-- Resolve one conservative starting specialty. Exact phrase containment wins;
-- fuzzy matching is only allowed at a high threshold to avoid mistakes such as
-- "payer betha" being confused with "dater betha".
create or replace function public.resolve_doctor_intent(query_text text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  q_norm text := lower(trim(regexp_replace(coalesce(query_text,''), '[[:punct:]]+', ' ', 'g')));
  matched record;
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;
  if length(query_text) > 160 then raise exception 'Search too long'; end if;
  if q_norm = '' then
    return jsonb_build_object('specialty_id',null,'specialty_name',null,'matched_phrase',null,'emergency_notice',null,'confidence',0);
  end if;

  -- A direct specialty-name search is the strongest signal.
  select s.id as specialty_id, s.name as specialty_name, s.name as matched_phrase,
         null::text as emergency_notice, 1.0::numeric as confidence, 10000::numeric as priority
  into matched
  from public.specialties s
  where lower(s.name)=q_norm
     or lower(s.name) like '%' || q_norm || '%'
     or q_norm like '%' || lower(s.name) || '%'
  order by case when lower(s.name)=q_norm then 0 else 1 end, length(s.name)
  limit 1;

  if matched.specialty_id is null then
    select r.specialty_id, s.name as specialty_name, r.keyword as matched_phrase,
           r.emergency_notice,
           case
             when lower(trim(r.keyword))=q_norm then 1.0
             when q_norm like '%' || lower(trim(r.keyword)) || '%' then 0.98
             when lower(trim(r.keyword)) like '%' || q_norm || '%' and length(q_norm)>=5 then 0.90
             else greatest(
               extensions.similarity(lower(r.keyword), q_norm),
               extensions.word_similarity(lower(r.keyword), q_norm)
             )
           end as confidence,
           r.priority
    into matched
    from public.symptom_rules r
    join public.specialties s on s.id=r.specialty_id
    where lower(trim(r.keyword))=q_norm
       or q_norm like '%' || lower(trim(r.keyword)) || '%'
       or (length(q_norm)>=5 and lower(trim(r.keyword)) like '%' || q_norm || '%')
       or (
         length(q_norm)>=5
         and extensions.similarity(lower(r.keyword), q_norm)>=0.72
         and extensions.word_similarity(lower(r.keyword), q_norm)>=0.72
       )
    order by
      case
        when lower(trim(r.keyword))=q_norm then 0
        when q_norm like '%' || lower(trim(r.keyword)) || '%' then 1
        when lower(trim(r.keyword)) like '%' || q_norm || '%' then 2
        else 3
      end,
      length(r.keyword) desc,
      r.priority desc,
      greatest(
        extensions.similarity(lower(r.keyword), q_norm),
        extensions.word_similarity(lower(r.keyword), q_norm)
      ) desc
    limit 1;
  end if;

  return jsonb_build_object(
    'specialty_id', matched.specialty_id,
    'specialty_name', matched.specialty_name,
    'matched_phrase', matched.matched_phrase,
    'emergency_notice', matched.emergency_notice,
    'confidence', coalesce(matched.confidence,0)
  );
end;
$$;

revoke all on function public.resolve_doctor_intent(text) from public;
grant execute on function public.resolve_doctor_intent(text) to authenticated;

create or replace function public.search_doctors_smart(
  query_text text default '',
  location_filter text default '',
  page_number integer default 1
)
returns setof jsonb
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  q_norm text := lower(trim(coalesce(query_text,'')));
  location_norm text := lower(trim(coalesce(location_filter,'')));
  offset_rows integer := (greatest(1,least(page_number,10000))-1)*24;
  intent jsonb;
  resolved_specialty uuid;
  resolved_name text;
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;
  if length(query_text)>160 then raise exception 'Search too long'; end if;
  if length(location_filter)>100 then raise exception 'Location filter too long'; end if;

  intent := public.resolve_doctor_intent(query_text);
  resolved_specialty := nullif(intent->>'specialty_id','')::uuid;
  resolved_name := lower(coalesce(intent->>'specialty_name',''));

  return query
  select to_jsonb(t)
  from public.doctors t
  left join public.specialties s on s.id=t.specialty_id
  where t.status='Active'
    and (
      q_norm=''
      or (resolved_specialty is not null and t.specialty_id=resolved_specialty)
      or lower(concat_ws(' ',t.full_name,t.specialization,t.qualification,t.hospital_name,s.name)) like '%' || q_norm || '%'
      or (resolved_name<>'' and lower(concat_ws(' ',t.specialization,s.name)) like '%' || resolved_name || '%')
      or (
        length(q_norm)>=4
        and extensions.word_similarity(
          q_norm,
          lower(concat_ws(' ',t.full_name,t.specialization,t.qualification,t.hospital_name,s.name))
        )>=0.55
      )
    )
    and (
      location_norm=''
      or lower(coalesce(t.location,'')) like '%' || location_norm || '%'
      or lower(coalesce(t.hospital_name,'')) like '%' || location_norm || '%'
    )
  order by
    case
      when resolved_specialty is not null and t.specialty_id=resolved_specialty then 0
      when q_norm<>'' and lower(t.full_name) like '%' || q_norm || '%' then 1
      when q_norm<>'' and lower(concat_ws(' ',t.specialization,s.name)) like '%' || q_norm || '%' then 2
      else 3
    end,
    t.experience desc nulls last,
    t.full_name,
    t.id
  limit 24 offset offset_rows;
end;
$$;

revoke all on function public.search_doctors_smart(text,text,integer) from public;
grant execute on function public.search_doctors_smart(text,text,integer) to authenticated;

commit;
