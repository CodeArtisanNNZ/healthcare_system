begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- Expand the symptom vocabulary. These rows route users to a type of specialist;
-- they are not diagnoses. We intentionally include English, Bangla and common
-- Banglish spellings because Healthcare Central is designed for Bangladesh.
with seed(keyword, specialty_name, priority, emergency_notice) as (
  values
    -- General medicine / first-contact symptoms
    ('fever','General Physician',72,null),
    ('high fever','Medicine Specialist',82,null),
    ('jor','General Physician',72,null),
    ('onek jor','Medicine Specialist',82,null),
    ('জ্বর','General Physician',72,null),
    ('বেশি জ্বর','Medicine Specialist',82,null),
    ('weakness','General Physician',68,null),
    ('very weak','Medicine Specialist',76,null),
    ('durbol','General Physician',68,null),
    ('durbol lagche','General Physician',72,null),
    ('দুর্বল লাগছে','General Physician',72,null),
    ('দুর্বলতা','General Physician',68,null),
    ('body ache','General Physician',68,null),
    ('shorir betha','General Physician',68,null),
    ('শরীর ব্যথা','General Physician',68,null),
    ('loss of appetite','Medicine Specialist',72,null),
    ('khida nei','Medicine Specialist',72,null),
    ('khide nei','Medicine Specialist',72,null),
    ('ক্ষুধা নেই','Medicine Specialist',72,null),
    ('nausea','Medicine Specialist',70,null),
    ('bomi bomi','Medicine Specialist',70,null),
    ('বমি বমি','Medicine Specialist',70,null),
    ('vomiting','Medicine Specialist',75,null),
    ('bomi','Medicine Specialist',75,null),
    ('বমি','Medicine Specialist',75,null),
    ('dizziness','General Physician',62,null),
    ('matha ghura','General Physician',62,null),
    ('মাথা ঘোরা','General Physician',62,null),
    ('fainting','Neurologist',90,'Sudden fainting, especially with chest pain, weakness, severe headache or breathing difficulty, needs urgent assessment.'),
    ('ojnan hoye jawa','Neurologist',90,'Sudden fainting can need urgent medical assessment.'),
    ('অজ্ঞান হয়ে যাওয়া','Neurologist',90,'হঠাৎ অজ্ঞান হয়ে গেলে দ্রুত চিকিৎসা মূল্যায়ন প্রয়োজন হতে পারে।'),

    -- Neurology
    ('severe headache','Neurologist',100,null),
    ('one sided headache','Neurologist',95,null),
    ('headache with vomiting','Neurologist',105,null),
    ('headache with blurred vision','Neurologist',105,null),
    ('matha betha bomi','Neurologist',105,null),
    ('matha betha chokh jhapsha','Neurologist',105,null),
    ('মাথা ব্যথা বমি','Neurologist',105,null),
    ('মাথা ব্যথা চোখ ঝাপসা','Neurologist',105,null),
    ('seizure','Neurologist',115,'A first seizure, prolonged seizure, repeated seizures, injury or breathing difficulty needs urgent medical assessment.'),
    ('fit','Neurologist',105,null),
    ('khichuni','Neurologist',115,'A first or prolonged seizure needs urgent medical assessment.'),
    ('খিঁচুনি','Neurologist',115,'প্রথমবার বা দীর্ঘ সময় খিঁচুনি হলে জরুরি চিকিৎসা মূল্যায়ন প্রয়োজন।'),
    ('speech problem','Neurologist',95,null),
    ('kotha joriye jawa','Neurologist',120,'Sudden speech difficulty can be a stroke warning. Use emergency services now.'),
    ('কথা জড়িয়ে যাওয়া','Neurologist',120,'হঠাৎ কথা জড়িয়ে যাওয়া স্ট্রোকের সতর্কসংকেত হতে পারে। এখনই জরুরি সহায়তা নিন।'),
    ('sudden confusion','Neurologist',115,'Sudden confusion can be an emergency, especially with weakness, severe headache, fever or reduced consciousness.'),
    ('memory loss','Neurologist',82,null),
    ('forgetfulness','Neurologist',78,null),
    ('mone thake na','Neurologist',78,null),
    ('ভুলে যাই','Neurologist',78,null),
    ('balance problem','Neurologist',82,null),
    ('walking imbalance','Neurologist',85,null),
    ('hata te balance nai','Neurologist',85,null),
    ('হাঁটতে ভারসাম্য নেই','Neurologist',85,null),

    -- Eye
    ('watery eyes','Eye Specialist',82,null),
    ('chokh diye pani','Eye Specialist',82,null),
    ('চোখ দিয়ে পানি','Eye Specialist',82,null),
    ('eye redness','Eye Specialist',86,null),
    ('chokh lal','Eye Specialist',86,null),
    ('চোখ লাল','Eye Specialist',86,null),
    ('double vision','Eye Specialist',100,null),
    ('duita dekhi','Eye Specialist',100,null),
    ('দুইটা দেখি','Eye Specialist',100,null),
    ('light sensitivity','Eye Specialist',88,null),
    ('alo sojjo hoy na','Eye Specialist',88,null),
    ('আলো সহ্য হয় না','Eye Specialist',88,null),
    ('eye swelling','Eye Specialist',88,null),
    ('chokh fule geche','Eye Specialist',88,null),
    ('চোখ ফুলে গেছে','Eye Specialist',88,null),

    -- ENT
    ('sore throat','ENT Specialist',88,null),
    ('throat pain','ENT Specialist',88,null),
    ('gola betha','ENT Specialist',88,null),
    ('গলা ব্যথা','ENT Specialist',88,null),
    ('runny nose','ENT Specialist',76,null),
    ('nak diye pani','ENT Specialist',76,null),
    ('নাক দিয়ে পানি','ENT Specialist',76,null),
    ('blocked nose','ENT Specialist',82,null),
    ('nasal congestion','ENT Specialist',82,null),
    ('nak bondho','ENT Specialist',82,null),
    ('নাক বন্ধ','ENT Specialist',82,null),
    ('ear discharge','ENT Specialist',92,null),
    ('kane puj','ENT Specialist',92,null),
    ('কানে পুঁজ','ENT Specialist',92,null),
    ('ringing in ears','ENT Specialist',88,null),
    ('tinnitus','ENT Specialist',90,null),
    ('kane shobdo','ENT Specialist',88,null),
    ('কানে শব্দ','ENT Specialist',88,null),
    ('vertigo','ENT Specialist',84,null),
    ('room spinning','ENT Specialist',84,null),
    ('charpash ghure','ENT Specialist',84,null),
    ('চারপাশ ঘুরে','ENT Specialist',84,null),

    -- Chest / respiratory
    ('cough','Chest Medicine Specialist',70,null),
    ('dry cough','Chest Medicine Specialist',82,null),
    ('kashi','Chest Medicine Specialist',70,null),
    ('shukna kashi','Chest Medicine Specialist',82,null),
    ('কাশি','Chest Medicine Specialist',70,null),
    ('শুকনা কাশি','Chest Medicine Specialist',82,null),
    ('chest tightness','Chest Medicine Specialist',92,null),
    ('buke tight lage','Chest Medicine Specialist',92,null),
    ('বুকে টান লাগে','Chest Medicine Specialist',92,null),
    ('breathlessness','Chest Medicine Specialist',94,null),
    ('shash nite koshto','Chest Medicine Specialist',96,null),
    ('শ্বাস নিতে কষ্ট','Chest Medicine Specialist',96,null),
    ('blue lips','Emergency Medicine Specialist',130,'Blue lips with breathing difficulty can indicate dangerously low oxygen. Use emergency services now.'),
    ('ঠোঁট নীল','Emergency Medicine Specialist',130,'শ্বাসকষ্টের সাথে ঠোঁট নীল হলে এখনই জরুরি সহায়তা নিন।'),

    -- Cardiology
    ('chest pain','Cardiologist',88,null),
    ('buk betha','Cardiologist',88,null),
    ('বুক ব্যথা','Cardiologist',88,null),
    ('chest pressure','Cardiologist',96,null),
    ('buke chap','Cardiologist',96,null),
    ('বুকে চাপ','Cardiologist',96,null),
    ('fast heartbeat','Cardiologist',92,null),
    ('heartbeat fast','Cardiologist',92,null),
    ('heart beat beshi','Cardiologist',92,null),
    ('হার্টবিট বেশি','Cardiologist',92,null),
    ('high blood pressure','Cardiologist',82,null),
    ('pressure beshi','Cardiologist',78,null),
    ('প্রেশার বেশি','Cardiologist',78,null),
    ('chest pain sweating','Cardiologist',125,'Chest pain with sweating can be a heart emergency. Use emergency services now.'),
    ('buk betha gham','Cardiologist',125,'Chest pain with sweating can be a heart emergency. Use emergency services now.'),
    ('বুক ব্যথা ঘাম','Cardiologist',125,'বুক ব্যথার সাথে ঘাম হলে এখনই জরুরি সহায়তা নিন।'),

    -- Gastroenterology / bowel
    ('stomach pain','Gastroenterologist',82,null),
    ('pet e betha','Gastroenterologist',82,null),
    ('পেটে ব্যথা','Gastroenterologist',82,null),
    ('diarrhea','Gastroenterologist',80,null),
    ('loose motion','Gastroenterologist',80,null),
    ('patla paykhana','Gastroenterologist',80,null),
    ('পাতলা পায়খানা','Gastroenterologist',80,null),
    ('constipation','Gastroenterologist',82,null),
    ('koshto kathinno','Gastroenterologist',82,null),
    ('কোষ্ঠকাঠিন্য','Gastroenterologist',82,null),
    ('bloating','Gastroenterologist',76,null),
    ('pet fapa','Gastroenterologist',76,null),
    ('পেট ফাঁপা','Gastroenterologist',76,null),
    ('blood in stool','Gastroenterologist',100,null),
    ('paykhanay rokto','Gastroenterologist',100,null),
    ('পায়খানায় রক্ত','Gastroenterologist',100,null),
    ('vomiting blood','Emergency Medicine Specialist',130,'Vomiting blood can be a medical emergency. Use emergency services now.'),
    ('rokto bomi','Emergency Medicine Specialist',130,'Vomiting blood can be a medical emergency. Use emergency services now.'),
    ('রক্ত বমি','Emergency Medicine Specialist',130,'রক্ত বমি হলে এখনই জরুরি চিকিৎসা নিন।'),

    -- Liver
    ('yellow skin','Hepatologist',95,null),
    ('yellow eyes and skin','Hepatologist',100,null),
    ('chokh holud','Hepatologist',92,null),
    ('চোখ হলুদ','Hepatologist',92,null),
    ('liver problem','Hepatologist',95,null),
    ('liver er somossa','Hepatologist',95,null),
    ('লিভারের সমস্যা','Hepatologist',95,null),

    -- Kidney / urinary
    ('frequent urination','Urologist',86,null),
    ('bar bar prosab','Urologist',86,null),
    ('বার বার প্রস্রাব','Urologist',86,null),
    ('low urine','Kidney Specialist',92,null),
    ('prosab kom','Kidney Specialist',92,null),
    ('প্রস্রাব কম','Kidney Specialist',92,null),
    ('side back pain','Kidney Specialist',82,null),
    ('flank pain','Kidney Specialist',88,null),
    ('kidney side pain','Kidney Specialist',88,null),
    ('urine leakage','Urologist',84,null),
    ('prosab dhore rakhte pari na','Urologist',84,null),
    ('প্রস্রাব ধরে রাখতে পারি না','Urologist',84,null),
    ('unable to urinate','Urologist',115,'Complete inability to pass urine can require urgent treatment.'),
    ('prosab hocche na','Urologist',115,'Complete inability to pass urine can require urgent treatment.'),
    ('প্রস্রাব হচ্ছে না','Urologist',115,'একদম প্রস্রাব না হলে দ্রুত জরুরি চিকিৎসা নিন।'),

    -- Diabetes / endocrine
    ('excessive thirst','Diabetes Specialist',88,null),
    ('always thirsty','Diabetes Specialist',88,null),
    ('onek pipasa','Diabetes Specialist',88,null),
    ('অনেক পিপাসা','Diabetes Specialist',88,null),
    ('frequent urination and thirst','Diabetes Specialist',96,null),
    ('bar bar prosab pipasa','Diabetes Specialist',96,null),
    ('বার বার প্রস্রাব পিপাসা','Diabetes Specialist',96,null),
    ('unexplained weight loss','Endocrinologist',78,null),
    ('weight komche','Endocrinologist',78,null),
    ('ওজন কমছে','Endocrinologist',78,null),
    ('weight gain','Endocrinologist',72,null),
    ('weight barche','Endocrinologist',72,null),
    ('ওজন বাড়ছে','Endocrinologist',72,null),

    -- Dermatology
    ('skin discoloration','Dermatologist',88,null),
    ('skin color change','Dermatologist',88,null),
    ('chamrar rong bodle','Dermatologist',88,null),
    ('ত্বকের রং বদল','Dermatologist',88,null),
    ('white skin patch','Dermatologist',92,null),
    ('shada dag','Dermatologist',92,null),
    ('সাদা দাগ','Dermatologist',92,null),
    ('dark skin patch','Dermatologist',88,null),
    ('kalo dag','Dermatologist',88,null),
    ('কালো দাগ','Dermatologist',88,null),
    ('eczema','Dermatologist',95,null),
    ('fungal infection','Dermatologist',95,null),
    ('ringworm','Dermatologist',95,null),
    ('dad','Dermatologist',90,null),
    ('দাদ','Dermatologist',90,null),
    ('scalp itching','Dermatologist',84,null),
    ('mathay chulkani','Dermatologist',84,null),
    ('মাথায় চুলকানি','Dermatologist',84,null),

    -- Orthopaedics / PM&R / rheumatology
    ('ankle pain','Orthopaedic Surgeon',88,null),
    ('wrist pain','Orthopaedic Surgeon',88,null),
    ('hip pain','Orthopaedic Surgeon',90,null),
    ('sprain','Orthopaedic Surgeon',92,null),
    ('mochke geche','Orthopaedic Surgeon',92,null),
    ('মচকে গেছে','Orthopaedic Surgeon',92,null),
    ('muscle pain','Physical Medicine & Rehabilitation Specialist',78,null),
    ('muscle strain','Physical Medicine & Rehabilitation Specialist',88,null),
    ('peshi betha','Physical Medicine & Rehabilitation Specialist',78,null),
    ('পেশি ব্যথা','Physical Medicine & Rehabilitation Specialist',78,null),
    ('joint swelling','Rheumatologist',94,null),
    ('morning stiffness','Rheumatologist',96,null),
    ('multiple joint pain','Rheumatologist',94,null),
    ('onek joint betha','Rheumatologist',94,null),
    ('অনেক জয়েন্টে ব্যথা','Rheumatologist',94,null),
    ('arthritis','Rheumatologist',96,null),

    -- Gynaecology / obstetrics
    ('period pain','Gynaecologist',90,null),
    ('menstrual cramps','Gynaecologist',90,null),
    ('masik betha','Gynaecologist',90,null),
    ('মাসিক ব্যথা','Gynaecologist',90,null),
    ('late period','Gynaecologist',84,null),
    ('period late','Gynaecologist',84,null),
    ('masik deri','Gynaecologist',84,null),
    ('মাসিক দেরি','Gynaecologist',84,null),
    ('missed period','Gynaecologist',86,null),
    ('period hoy nai','Gynaecologist',86,null),
    ('মাসিক হয়নি','Gynaecologist',86,null),
    ('pregnancy pain','Obstetrician',94,null),
    ('pregnancy severe pain','Obstetrician',120,'Severe pain during pregnancy can need urgent assessment.'),
    ('gorvobosthay betha','Obstetrician',94,null),
    ('গর্ভাবস্থায় ব্যথা','Obstetrician',94,null),

    -- Paediatrics / neonatology
    ('child fever','Paediatrician',96,null),
    ('baby fever','Paediatrician',96,null),
    ('bacchar jor','Paediatrician',96,null),
    ('বাচ্চার জ্বর','Paediatrician',96,null),
    ('শিশুর জ্বর','Paediatrician',96,null),
    ('child cough','Paediatrician',88,null),
    ('baby cough','Paediatrician',88,null),
    ('bacchar kashi','Paediatrician',88,null),
    ('বাচ্চার কাশি','Paediatrician',88,null),
    ('child vomiting','Paediatrician',88,null),
    ('baby vomiting','Paediatrician',88,null),
    ('baccha bomi','Paediatrician',88,null),
    ('বাচ্চা বমি','Paediatrician',88,null),
    ('newborn feeding problem','Neonatologist',100,null),
    ('newborn not feeding','Neonatologist',105,null),
    ('notun baccha dudh khay na','Neonatologist',105,null),
    ('নবজাতক দুধ খায় না','Neonatologist',105,null),
    ('newborn breathing problem','Neonatologist',125,'Breathing difficulty in a newborn needs urgent medical assessment.'),
    ('নবজাতকের শ্বাসকষ্ট','Neonatologist',125,'নবজাতকের শ্বাসকষ্ট হলে দ্রুত জরুরি চিকিৎসা নিন।'),

    -- Mental health / sleep
    ('cannot sleep','Sleep Medicine Specialist',78,null),
    ('insomnia','Sleep Medicine Specialist',90,null),
    ('ghum hoy na','Sleep Medicine Specialist',78,null),
    ('ঘুম হয় না','Sleep Medicine Specialist',78,null),
    ('snoring','Sleep Medicine Specialist',88,null),
    ('nak daka','Sleep Medicine Specialist',88,null),
    ('নাক ডাকা','Sleep Medicine Specialist',88,null),
    ('daytime sleepiness','Sleep Medicine Specialist',86,null),
    ('din e ghum','Sleep Medicine Specialist',86,null),
    ('দিনে ঘুম পায়','Sleep Medicine Specialist',86,null),
    ('stress','Psychologist',72,null),
    ('too much stress','Psychologist',80,null),
    ('onek stress','Psychologist',80,null),
    ('অনেক স্ট্রেস','Psychologist',80,null),
    ('sad all the time','Psychologist',86,null),
    ('mon kharap sob somoy','Psychologist',86,null),
    ('সবসময় মন খারাপ','Psychologist',86,null),
    ('panic with chest pain','Psychiatrist',90,null),

    -- Allergy
    ('sneezing','Allergy Specialist',74,null),
    ('hachhi','Allergy Specialist',74,null),
    ('হাঁচি','Allergy Specialist',74,null),
    ('itchy eyes','Allergy Specialist',82,null),
    ('chokh chulkay','Allergy Specialist',82,null),
    ('চোখ চুলকায়','Allergy Specialist',82,null),
    ('swollen lips','Allergy Specialist',100,null),
    ('thot fule geche','Allergy Specialist',100,null),
    ('ঠোঁট ফুলে গেছে','Allergy Specialist',100,null),
    ('throat swelling','Emergency Medicine Specialist',128,'Throat swelling, especially with breathing difficulty, can be a severe allergic reaction. Use emergency services now.'),
    ('gola fule shash kosto','Emergency Medicine Specialist',130,'Throat swelling with breathing difficulty can be a severe allergic reaction. Use emergency services now.'),
    ('গলা ফুলে শ্বাসকষ্ট','Emergency Medicine Specialist',130,'গলা ফুলে শ্বাসকষ্ট হলে এখনই জরুরি সহায়তা নিন।'),

    -- Haematology
    ('low hemoglobin','Haematologist',92,null),
    ('low hb','Haematologist',92,null),
    ('anemia','Haematologist',88,null),
    ('rokto kom','Haematologist',88,null),
    ('রক্ত কম','Haematologist',88,null),
    ('easy bruising','Haematologist',90,null),
    ('easily bruised','Haematologist',90,null),
    ('platelet low','Haematologist',94,null),
    ('low platelets','Haematologist',94,null),
    ('platelet kom','Haematologist',94,null),
    ('প্লেটলেট কম','Haematologist',94,null),

    -- Surgery / maxillofacial / vascular
    ('hernia','General Surgeon',96,null),
    ('appendix pain','General Surgeon',88,null),
    ('gallstone','General Surgeon',92,null),
    ('gallbladder stone','General Surgeon',92,null),
    ('jaw pain','Maxillofacial Surgeon',88,null),
    ('jaw fracture','Maxillofacial Surgeon',110,null),
    ('choyal betha','Maxillofacial Surgeon',88,null),
    ('চোয়াল ব্যথা','Maxillofacial Surgeon',88,null),
    ('varicose veins','Vascular Surgeon',96,null),
    ('leg veins swollen','Vascular Surgeon',88,null),
    ('paye shira fule','Vascular Surgeon',88,null),
    ('পায়ে শিরা ফুলে','Vascular Surgeon',88,null),
    ('leg ulcer','Vascular Surgeon',92,null),

    -- Red-flag generic emergency phrases
    ('cannot breathe','Emergency Medicine Specialist',140,'Severe breathing difficulty is an emergency. Use emergency services now.'),
    ('not breathing','Emergency Medicine Specialist',140,'Not breathing is an emergency. Call 999 now.'),
    ('shash nite parchi na','Emergency Medicine Specialist',140,'Severe breathing difficulty is an emergency. Use emergency services now.'),
    ('শ্বাস নিতে পারছি না','Emergency Medicine Specialist',140,'শ্বাস নিতে না পারলে এখনই ৯৯৯ বা জরুরি সহায়তায় কল করুন।'),
    ('unconscious','Emergency Medicine Specialist',140,'Unconsciousness is an emergency. Call 999 now.'),
    ('ojnan','Emergency Medicine Specialist',140,'Unconsciousness is an emergency. Call 999 now.'),
    ('অজ্ঞান','Emergency Medicine Specialist',140,'অজ্ঞান হলে এখনই ৯৯৯ বা জরুরি সহায়তায় কল করুন।'),
    ('severe bleeding','Emergency Medicine Specialist',140,'Severe uncontrolled bleeding is an emergency. Use emergency services now.'),
    ('rokto bondho hocche na','Emergency Medicine Specialist',140,'Severe uncontrolled bleeding is an emergency. Use emergency services now.'),
    ('রক্ত বন্ধ হচ্ছে না','Emergency Medicine Specialist',140,'রক্তপাত বন্ধ না হলে এখনই জরুরি সহায়তা নিন।')
)
insert into public.symptom_rules(keyword, specialty_id, priority, emergency_notice)
select
  seed.keyword,
  s.id,
  seed.priority,
  seed.emergency_notice
from seed
join public.specialties s on lower(s.name)=lower(seed.specialty_name)
where not exists (
  select 1 from public.symptom_rules r
  where lower(trim(r.keyword))=lower(trim(seed.keyword))
    and r.specialty_id=s.id
);

-- Match multiple symptoms in one free-text message and rank up to three
-- specialist types. Exact/sub-string matches are strongest; pg_trgm handles
-- misspellings and Banglish variation. The function returns routing advice only.
create or replace function public.resolve_doctor_triage_multi(query_text text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  q text := lower(trim(coalesce(query_text,'')));
  result jsonb;
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;

  if length(q) = 0 then
    return jsonb_build_object(
      'urgent', false,
      'emergency_notice', null,
      'primary_specialty_id', null,
      'primary_specialty_name', null,
      'suggestions', '[]'::jsonb
    );
  end if;

  if length(q) > 500 then
    raise exception 'Search too long';
  end if;

  with matched as (
    select
      r.id,
      r.keyword,
      r.specialty_id,
      s.name as specialty_name,
      r.priority,
      r.emergency_notice,
      case
        when q = lower(trim(r.keyword)) then 1.15
        when position(lower(trim(r.keyword)) in q) > 0 then
          1.0 + least(0.10, length(trim(r.keyword))::numeric / greatest(length(q),1)::numeric * 0.10)
        when word_similarity(lower(trim(r.keyword)), q) >= 0.72 then
          word_similarity(lower(trim(r.keyword)), q) * 0.95
        when similarity(lower(trim(r.keyword)), q) >= 0.62 then
          similarity(lower(trim(r.keyword)), q) * 0.88
        else 0
      end as strength
    from public.symptom_rules r
    join public.specialties s on s.id=r.specialty_id
    where
      position(lower(trim(r.keyword)) in q) > 0
      or word_similarity(lower(trim(r.keyword)), q) >= 0.72
      or similarity(lower(trim(r.keyword)), q) >= 0.62
  ),
  useful as (
    select * from matched where strength > 0
  ),
  scored as (
    select
      specialty_id,
      specialty_name,
      sum(strength * (1 + least(priority,140)::numeric / 220)) as score,
      max(priority) as top_priority,
      count(*) as matched_count,
      jsonb_agg(
        jsonb_build_object(
          'phrase', keyword,
          'strength', round(strength::numeric, 3)
        )
        order by strength desc, priority desc, length(keyword) desc
      ) as matched_symptoms
    from useful
    group by specialty_id, specialty_name
  ),
  top_specialties as (
    select * from scored
    order by score desc, top_priority desc, matched_count desc, specialty_name
    limit 3
  ),
  primary_row as (
    select * from top_specialties
    order by score desc, top_priority desc, matched_count desc, specialty_name
    limit 1
  ),
  emergency_row as (
    select emergency_notice, priority
    from useful
    where emergency_notice is not null and trim(emergency_notice) <> ''
    order by priority desc, strength desc
    limit 1
  )
  select jsonb_build_object(
    'urgent', exists(select 1 from emergency_row),
    'emergency_notice', (select emergency_notice from emergency_row),
    'primary_specialty_id', (select specialty_id from primary_row),
    'primary_specialty_name', (select specialty_name from primary_row),
    'suggestions', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'specialty_id', t.specialty_id,
            'specialty_name', t.specialty_name,
            'score', round(t.score::numeric, 3),
            'matched_count', t.matched_count,
            'matched_symptoms', t.matched_symptoms
          )
          order by t.score desc, t.top_priority desc, t.matched_count desc, t.specialty_name
        )
        from top_specialties t
      ),
      '[]'::jsonb
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.resolve_doctor_triage_multi(text) from public;
grant execute on function public.resolve_doctor_triage_multi(text) to authenticated;

commit;
