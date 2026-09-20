-- Expand HCC Clinical Reasoning v3/v4 with broad common symptom concepts and
-- natural English/Bangla/Banglish aliases. This reduces dependence on exact phrases.
-- The list is intentionally specific enough to avoid matching generic words like "pain".

begin;

insert into public.symptom_concepts
(code,canonical_name,canonical_bn,body_system,default_specialty_id,routing_priority)
values
('constipation','Constipation','কোষ্ঠকাঠিন্য','gastrointestinal',(select id from public.specialties where lower(name)='gastroenterologist' limit 1),102),
('nausea','Nausea','বমি বমি ভাব','gastrointestinal',(select id from public.specialties where lower(name)='medicine specialist' limit 1),100),
('appetite_loss','Loss of appetite','খাবারে রুচি কম','general',(select id from public.specialties where lower(name)='medicine specialist' limit 1),96),
('acid_reflux','Acid reflux / heartburn','বুকজ্বালা / এসিডিটি','gastrointestinal',(select id from public.specialties where lower(name)='gastroenterologist' limit 1),104),
('abdominal_bloating','Abdominal bloating / gas','পেট ফাঁপা / গ্যাস','gastrointestinal',(select id from public.specialties where lower(name)='gastroenterologist' limit 1),98),
('palpitations','Palpitations / racing heartbeat','বুক ধড়ফড়','cardiovascular',(select id from public.specialties where lower(name)='cardiologist' limit 1),118),
('fainting','Fainting / loss of consciousness','অজ্ঞান হওয়া','neurologic',(select id from public.specialties where lower(name)='medicine specialist' limit 1),125),
('nose_bleed','Nosebleed','নাক দিয়ে রক্ত পড়া','ent',(select id from public.specialties where lower(name)='ent specialist' limit 1),112),
('nasal_congestion','Blocked / congested nose','নাক বন্ধ','ent',(select id from public.specialties where lower(name)='ent specialist' limit 1),98),
('runny_nose','Runny nose','নাক দিয়ে পানি পড়া','ent',(select id from public.specialties where lower(name)='ent specialist' limit 1),96),
('hearing_problem','Hearing problem','শুনতে সমস্যা','ent',(select id from public.specialties where lower(name)='ent specialist' limit 1),108),
('vision_change','Vision change / blurred vision','দৃষ্টি ঝাপসা / দেখতে সমস্যা','eye',(select id from public.specialties where lower(name)='eye specialist' limit 1),116),
('skin_itching','Skin itching','চুলকানি','dermatologic',(select id from public.specialties where lower(name)='dermatologist' limit 1),100),
('skin_lump','Skin lump / bump','ত্বকে গুটি','dermatologic',(select id from public.specialties where lower(name)='dermatologist' limit 1),100),
('hair_loss','Hair loss','চুল পড়া','dermatologic',(select id from public.specialties where lower(name)='dermatologist' limit 1),96),
('mouth_ulcer','Mouth ulcer / sore','মুখে ঘা','oral',(select id from public.specialties where lower(name)='dentist' limit 1),100),
('gum_bleeding','Bleeding gums','মাড়ি থেকে রক্ত','oral',(select id from public.specialties where lower(name)='dentist' limit 1),102),
('urinary_frequency','Frequent urination','বারবার প্রস্রাব','urinary',(select id from public.specialties where lower(name)='urologist' limit 1),104),
('blood_in_urine','Blood in urine','প্রস্রাবে রক্ত','urinary',(select id from public.specialties where lower(name)='urologist' limit 1),120),
('blood_in_stool','Blood in stool','পায়খানায় রক্ত','gastrointestinal',(select id from public.specialties where lower(name)='gastroenterologist' limit 1),120),
('neck_pain','Neck pain','ঘাড় ব্যথা','musculoskeletal',(select id from public.specialties where lower(name)='physical medicine & rehabilitation specialist' limit 1),102),
('shoulder_pain','Shoulder pain','কাঁধে ব্যথা','musculoskeletal',(select id from public.specialties where lower(name)='orthopaedic surgeon' limit 1),102),
('knee_pain','Knee pain','হাঁটু ব্যথা','musculoskeletal',(select id from public.specialties where lower(name)='orthopaedic surgeon' limit 1),104),
('leg_pain','Leg pain','পায়ে ব্যথা','musculoskeletal',(select id from public.specialties where lower(name)='orthopaedic surgeon' limit 1),100),
('arm_pain','Arm pain','হাতে ব্যথা','musculoskeletal',(select id from public.specialties where lower(name)='orthopaedic surgeon' limit 1),100),
('numbness_tingling','Numbness / tingling','অবশ / ঝিনঝিনি','neurologic',(select id from public.specialties where lower(name)='neurologist' limit 1),116),
('tremor','Tremor / shaking','হাত-পা কাঁপা','neurologic',(select id from public.specialties where lower(name)='neurologist' limit 1),108),
('speech_problem','Speech difficulty','কথা বলতে সমস্যা','neurologic',(select id from public.specialties where lower(name)='neurologist' limit 1),122),
('heavy_period','Heavy menstrual bleeding','মাসিকে অতিরিক্ত রক্তপাত','gynaecologic',(select id from public.specialties where lower(name)='gynaecologist' limit 1),112),
('vaginal_discharge','Vaginal discharge','যোনিপথে স্রাব','gynaecologic',(select id from public.specialties where lower(name)='gynaecologist' limit 1),102),
('pregnancy_concern','Pregnancy-related concern','গর্ভাবস্থার সমস্যা','obstetric',(select id from public.specialties where lower(name)='obstetrician' limit 1),116)
on conflict (code) do update set
  canonical_name=excluded.canonical_name,
  canonical_bn=excluded.canonical_bn,
  body_system=excluded.body_system,
  default_specialty_id=excluded.default_specialty_id,
  routing_priority=excluded.routing_priority,
  active=true;

with a(code,alias,language) as (
  values
  -- constipation
  ('constipation','constipation','en'),('constipation','constipated','en'),('constipation','hard stool','en'),
  ('constipation','cant poop','en'),('constipation','cannot poop','en'),('constipation','paykhana hocche na','banglish'),
  ('constipation','paykhana kothin','banglish'),('constipation','koshtokathinno','banglish'),('constipation','কোষ্ঠকাঠিন্য','bn'),
  ('constipation','পায়খানা হচ্ছে না','bn'),('constipation','পায়খানা হচ্ছে না','bn'),

  -- nausea
  ('nausea','nausea','en'),('nausea','nauseous','en'),('nausea','feel like vomiting','en'),('nausea','feeling like vomiting','en'),
  ('nausea','bomi bomi lage','banglish'),('nausea','bomi bomi bhab','banglish'),('nausea','bomi mone hocche','banglish'),
  ('nausea','বমি বমি লাগে','bn'),('nausea','বমি বমি ভাব','bn'),

  -- appetite
  ('appetite_loss','loss of appetite','en'),('appetite_loss','no appetite','en'),('appetite_loss','dont feel like eating','en'),
  ('appetite_loss','khete iccha kore na','banglish'),('appetite_loss','khida nai','banglish'),('appetite_loss','ruchi nai','banglish'),
  ('appetite_loss','খেতে ইচ্ছে করে না','bn'),('appetite_loss','খিদে নেই','bn'),('appetite_loss','রুচি নেই','bn'),

  -- reflux
  ('acid_reflux','heartburn','en'),('acid_reflux','acid reflux','en'),('acid_reflux','acidity','en'),('acid_reflux','burning chest after eating','en'),
  ('acid_reflux','buk jala','banglish'),('acid_reflux','buk jole','banglish'),('acid_reflux','acidity hocche','banglish'),('acid_reflux','gastric jala','banglish'),
  ('acid_reflux','বুক জ্বালা','bn'),('acid_reflux','এসিডিটি','bn'),('acid_reflux','অ্যাসিডিটি','bn'),

  -- bloating
  ('abdominal_bloating','bloating','en'),('abdominal_bloating','bloated stomach','en'),('abdominal_bloating','stomach gas','en'),
  ('abdominal_bloating','pet fapa','banglish'),('abdominal_bloating','pet fule ache','banglish'),('abdominal_bloating','gas hocche','banglish'),
  ('abdominal_bloating','পেট ফাঁপা','bn'),('abdominal_bloating','পেটে গ্যাস','bn'),

  -- palpitations
  ('palpitations','palpitations','en'),('palpitations','heart racing','en'),('palpitations','heart beating fast','en'),('palpitations','heartbeat feels fast','en'),
  ('palpitations','buk dhorfor','banglish'),('palpitations','buk dhorfor kore','banglish'),('palpitations','heart beat bere geche','banglish'),
  ('palpitations','বুক ধড়ফড়','bn'),('palpitations','বুক ধরফর','bn'),('palpitations','হৃদস্পন্দন বেড়ে গেছে','bn'),

  -- fainting
  ('fainting','fainted','en'),('fainting','passed out','en'),('fainting','lost consciousness','en'),('fainting','blackout','en'),
  ('fainting','ojnan hoye gesi','banglish'),('fainting','oggan hoye gesi','banglish'),('fainting','gian chilo na','banglish'),
  ('fainting','অজ্ঞান হয়ে গেছি','bn'),('fainting','জ্ঞান হারিয়েছি','bn'),

  -- nose bleed
  ('nose_bleed','nosebleed','en'),('nose_bleed','nose bleeding','en'),('nose_bleed','blood from nose','en'),
  ('nose_bleed','nak diye rokto','banglish'),('nose_bleed','nak theke rokto','banglish'),('nose_bleed','nak diye rokto porche','banglish'),
  ('nose_bleed','নাক দিয়ে রক্ত','bn'),('nose_bleed','নাক থেকে রক্ত পড়ছে','bn'),

  -- nose symptoms
  ('nasal_congestion','blocked nose','en'),('nasal_congestion','stuffy nose','en'),('nasal_congestion','nose blocked','en'),
  ('nasal_congestion','nak bondho','banglish'),('nasal_congestion','nak diye shash nite parchi na','banglish'),
  ('nasal_congestion','নাক বন্ধ','bn'),
  ('runny_nose','runny nose','en'),('runny_nose','watery nose','en'),('runny_nose','nose is running','en'),
  ('runny_nose','nak diye pani','banglish'),('runny_nose','nak diye pani porche','banglish'),('runny_nose','sordi porche','banglish'),
  ('runny_nose','নাক দিয়ে পানি পড়ছে','bn'),('runny_nose','সর্দি পড়ছে','bn'),

  -- hearing
  ('hearing_problem','hearing problem','en'),('hearing_problem','cant hear properly','en'),('hearing_problem','hearing loss','en'),
  ('hearing_problem','kane kom shuni','banglish'),('hearing_problem','shunte problem','banglish'),('hearing_problem','kane shunte pacchi na','banglish'),
  ('hearing_problem','কানে কম শুনি','bn'),('hearing_problem','শুনতে সমস্যা','bn'),

  -- vision
  ('vision_change','blurred vision','en'),('vision_change','blurry vision','en'),('vision_change','vision is blurry','en'),('vision_change','cant see clearly','en'),
  ('vision_change','chokhe jhapsha','banglish'),('vision_change','jhapsha dekhi','banglish'),('vision_change','chokhe kom dekhi','banglish'),
  ('vision_change','চোখে ঝাপসা','bn'),('vision_change','ঝাপসা দেখি','bn'),('vision_change','ভালোভাবে দেখতে পারছি না','bn'),

  -- skin
  ('skin_itching','itching','en'),('skin_itching','itchy skin','en'),('skin_itching','skin itching','en'),
  ('skin_itching','chulkani','banglish'),('skin_itching','gaye chulkay','banglish'),('skin_itching','skin chulkay','banglish'),
  ('skin_itching','চুলকানি','bn'),('skin_itching','গায়ে চুলকায়','bn'),
  ('skin_lump','skin lump','en'),('skin_lump','bump on skin','en'),('skin_lump','skin bump','en'),
  ('skin_lump','gaye guta','banglish'),('skin_lump','skin e guta','banglish'),('skin_lump','choto guta','banglish'),
  ('skin_lump','গায়ে গুটি','bn'),('skin_lump','ত্বকে গুটি','bn'),

  -- hair
  ('hair_loss','hair loss','en'),('hair_loss','hair falling','en'),('hair_loss','losing hair','en'),
  ('hair_loss','chul pore','banglish'),('hair_loss','chul onek pore','banglish'),('hair_loss','chul jhore','banglish'),
  ('hair_loss','চুল পড়ে','bn'),('hair_loss','চুল ঝরে','bn'),

  -- mouth/gum
  ('mouth_ulcer','mouth ulcer','en'),('mouth_ulcer','mouth sore','en'),('mouth_ulcer','ulcer in mouth','en'),
  ('mouth_ulcer','mukhe gha','banglish'),('mouth_ulcer','mukher vitore gha','banglish'),('mouth_ulcer','jibhe gha','banglish'),
  ('mouth_ulcer','মুখে ঘা','bn'),('mouth_ulcer','জিহ্বায় ঘা','bn'),
  ('gum_bleeding','bleeding gums','en'),('gum_bleeding','gums bleeding','en'),('gum_bleeding','blood from gums','en'),
  ('gum_bleeding','mari theke rokto','banglish'),('gum_bleeding','mari diye rokto','banglish'),
  ('gum_bleeding','মাড়ি থেকে রক্ত','bn'),('gum_bleeding','মাড়ি থেকে রক্ত','bn'),

  -- urinary
  ('urinary_frequency','frequent urination','en'),('urinary_frequency','peeing frequently','en'),('urinary_frequency','urinating often','en'),
  ('urinary_frequency','bar bar prosab','banglish'),('urinary_frequency','barbar peshab','banglish'),('urinary_frequency','ghono ghono prosab','banglish'),
  ('urinary_frequency','বারবার প্রস্রাব','bn'),('urinary_frequency','ঘন ঘন প্রস্রাব','bn'),
  ('blood_in_urine','blood in urine','en'),('blood_in_urine','bloody urine','en'),('blood_in_urine','urine has blood','en'),
  ('blood_in_urine','prosab e rokto','banglish'),('blood_in_urine','peshab e rokto','banglish'),('blood_in_urine','prosab lal','banglish'),
  ('blood_in_urine','প্রস্রাবে রক্ত','bn'),('blood_in_urine','প্রস্রাব লাল','bn'),
  ('blood_in_stool','blood in stool','en'),('blood_in_stool','bloody stool','en'),('blood_in_stool','blood when pooping','en'),
  ('blood_in_stool','paykhana e rokto','banglish'),('blood_in_stool','poop e rokto','banglish'),('blood_in_stool','paykhana lal','banglish'),
  ('blood_in_stool','পায়খানায় রক্ত','bn'),('blood_in_stool','পায়খানায় রক্ত','bn'),

  -- musculoskeletal
  ('neck_pain','neck pain','en'),('neck_pain','neck hurts','en'),('neck_pain','ghaar betha','banglish'),('neck_pain','ghar betha','banglish'),
  ('neck_pain','ঘাড় ব্যথা','bn'),('neck_pain','ঘাড় ব্যথা','bn'),
  ('shoulder_pain','shoulder pain','en'),('shoulder_pain','shoulder hurts','en'),('shoulder_pain','kadh betha','banglish'),('shoulder_pain','kadhe betha','banglish'),
  ('shoulder_pain','কাঁধে ব্যথা','bn'),
  ('knee_pain','knee pain','en'),('knee_pain','knee hurts','en'),('knee_pain','hatu betha','banglish'),('knee_pain','hatute betha','banglish'),
  ('knee_pain','হাঁটু ব্যথা','bn'),('knee_pain','হাঁটুতে ব্যথা','bn'),
  ('leg_pain','leg pain','en'),('leg_pain','my leg hurts','en'),('leg_pain','pain in my leg','en'),('leg_pain','pa betha','banglish'),('leg_pain','paye betha','banglish'),
  ('leg_pain','amar pa betha','banglish'),('leg_pain','পায়ে ব্যথা','bn'),('leg_pain','পায়ে ব্যথা','bn'),
  ('arm_pain','arm pain','en'),('arm_pain','my arm hurts','en'),('arm_pain','hand pain','en'),('arm_pain','hat betha','banglish'),('arm_pain','hate betha','banglish'),
  ('arm_pain','হাতে ব্যথা','bn'),

  -- neuro
  ('numbness_tingling','numbness','en'),('numbness_tingling','tingling','en'),('numbness_tingling','pins and needles','en'),
  ('numbness_tingling','feels numb','en'),('numbness_tingling','jhijhi','banglish'),('numbness_tingling','jhinjhini','banglish'),
  ('numbness_tingling','obosh lage','banglish'),('numbness_tingling','haat pa obosh','banglish'),
  ('numbness_tingling','ঝিনঝিনি','bn'),('numbness_tingling','অবশ লাগে','bn'),('numbness_tingling','হাত পা অবশ','bn'),
  ('tremor','tremor','en'),('tremor','shaking hands','en'),('tremor','hands shaking','en'),('tremor','hand tremor','en'),
  ('tremor','hat kape','banglish'),('tremor','haat kape','banglish'),('tremor','hat pa kape','banglish'),
  ('tremor','হাত কাঁপে','bn'),('tremor','হাত পা কাঁপে','bn'),
  ('speech_problem','speech problem','en'),('speech_problem','trouble speaking','en'),('speech_problem','words are slurred','en'),('speech_problem','slurred speech','en'),
  ('speech_problem','kotha joray','banglish'),('speech_problem','kotha bolte problem','banglish'),('speech_problem','kotha ber hoy na','banglish'),
  ('speech_problem','কথা জড়িয়ে যায়','bn'),('speech_problem','কথা বলতে সমস্যা','bn'),

  -- gynae/obstetric
  ('heavy_period','heavy period','en'),('heavy_period','heavy menstrual bleeding','en'),('heavy_period','period bleeding too much','en'),
  ('heavy_period','period e onek rokto','banglish'),('heavy_period','masik e beshi rokto','banglish'),
  ('heavy_period','মাসিকে অনেক রক্ত','bn'),('heavy_period','মাসিকে অতিরিক্ত রক্তপাত','bn'),
  ('vaginal_discharge','vaginal discharge','en'),('vaginal_discharge','white discharge','en'),
  ('vaginal_discharge','shada srab','banglish'),('vaginal_discharge','joni srab','banglish'),('vaginal_discharge','white discharge hocche','banglish'),
  ('vaginal_discharge','সাদা স্রাব','bn'),('vaginal_discharge','যোনিপথে স্রাব','bn'),
  ('pregnancy_concern','pregnancy problem','en'),('pregnancy_concern','problem during pregnancy','en'),('pregnancy_concern','pregnant and pain','en'),
  ('pregnancy_concern','pregnancy te problem','banglish'),('pregnancy_concern','pregnant betha','banglish'),('pregnancy_concern','pregnancy te betha','banglish'),
  ('pregnancy_concern','গর্ভাবস্থায় সমস্যা','bn'),('pregnancy_concern','গর্ভাবস্থায় ব্যথা','bn')
)
insert into public.symptom_aliases(concept_id,alias,language,normalized_alias)
select c.id,a.alias,a.language,public.normalize_symptom_phrase(a.alias)
from a
join public.symptom_concepts c on c.code=a.code
on conflict (concept_id,alias) do update
set language=excluded.language,
    normalized_alias=excluded.normalized_alias;

-- Add focused red-flag questions to common symptoms that can hide urgent problems.
with q(code,attribute_key,question_en,question_bn,question_banglish,priority) as (
  values
  ('palpitations','palpitation_red_flags',
   'Are you having chest pain, severe shortness of breath, fainting, or feeling like you may pass out?',
   'বুকব্যথা, গুরুতর শ্বাসকষ্ট, অজ্ঞান হওয়া বা অজ্ঞান হয়ে যাওয়ার মতো লাগছে?',
   'Buk betha, severe shashkosto, ojnan howa, ba ojnan hoye jaben mone hocche?',1),
  ('fainting','fainting_red_flags',
   'Did you faint during exertion, with chest pain, severe headache, seizure-like movements, major injury, or have you not fully recovered?',
   'পরিশ্রমের সময়, বুকব্যথা/তীব্র মাথাব্যথার সাথে অজ্ঞান হয়েছেন, খিঁচুনির মতো হয়েছে, বড় আঘাত লেগেছে, বা এখনও পুরোপুরি স্বাভাবিক হননি?',
   'Exertion-er somoy, buk betha/severe matha betha sathe ojnan, seizure-er moto movement, major injury, ba ekhono fully recover koren ni?',1),
  ('blood_in_stool','stool_blood_red_flags',
   'Is there a large amount of blood, black tar-like stool, fainting, severe weakness, or severe abdominal pain?',
   'অনেক রক্ত, কালো আলকাতরার মতো পায়খানা, অজ্ঞানভাব, খুব দুর্বল লাগা, বা তীব্র পেটব্যথা আছে?',
   'Onek rokto, black tar-like stool, ojnan bhab, khub durbol, ba severe pet betha ache?',1),
  ('blood_in_urine','urine_blood_red_flags',
   'Is there heavy bleeding, inability to urinate, severe side/back pain, fever with chills, or are you feeling faint?',
   'অনেক রক্ত, প্রস্রাব একেবারে বন্ধ, তীব্র পাশ/পিঠ ব্যথা, কাঁপুনি সহ জ্বর, বা অজ্ঞানভাব আছে?',
   'Onek rokto, prosab ekdom bondho, severe pash/pith betha, jor sathe kapuni, ba ojnan bhab ache?',1),
  ('vision_change','vision_red_flags',
   'Did your vision suddenly decrease or disappear, or do you have severe eye pain, eye injury, flashes with a curtain-like shadow, or new weakness/speech trouble?',
   'দৃষ্টি কি হঠাৎ কমে/চলে গেছে, তীব্র চোখব্যথা/আঘাত, আলোর ঝলকানির সাথে পর্দার মতো ছায়া, বা নতুন দুর্বলতা/কথার সমস্যা আছে?',
   'Vision hotat kome/geche, severe eye pain/injury, flashes sathe curtain-like shadow, ba new weakness/speech problem ache?',1),
  ('numbness_tingling','neuro_red_flags',
   'Did the numbness start suddenly on one side, or is it accompanied by weakness, facial droop, speech trouble, severe headache, or loss of bladder/bowel control?',
   'অবশভাব কি হঠাৎ এক পাশে শুরু হয়েছে, অথবা দুর্বলতা, মুখ বেঁকে যাওয়া, কথা জড়িয়ে যাওয়া, তীব্র মাথাব্যথা, বা প্রস্রাব-পায়খানার নিয়ন্ত্রণ হারানো আছে?',
   'Obosh hotat ek pashe shuru, ba weakness, mukh beke jawa, kotha jorano, severe matha betha, ba bladder/bowel control loss ache?',1),
  ('pregnancy_concern','pregnancy_red_flags',
   'Are you having heavy bleeding, severe abdominal pain, fainting, seizure, severe headache with vision changes, or reduced/absent baby movement later in pregnancy?',
   'অতিরিক্ত রক্তপাত, তীব্র পেটব্যথা, অজ্ঞান, খিঁচুনি, দৃষ্টি পরিবর্তনের সাথে তীব্র মাথাব্যথা, বা গর্ভাবস্থার পরের দিকে বাচ্চার নড়াচড়া কম/বন্ধ হয়েছে?',
   'Heavy bleeding, severe pet betha, ojnan, khichuni, vision change sathe severe headache, ba later pregnancy-te baby movement kom/bondho?',1)
)
insert into public.symptom_followup_questions
(concept_id,attribute_key,question_en,question_bn,question_banglish,answer_type,options,priority,required)
select c.id,q.attribute_key,q.question_en,q.question_bn,q.question_banglish,
       'choice','["No","Yes","Not sure"]'::jsonb,q.priority,true
from q
join public.symptom_concepts c on c.code=q.code
on conflict (concept_id,attribute_key) do update set
  question_en=excluded.question_en,
  question_bn=excluded.question_bn,
  question_banglish=excluded.question_banglish,
  options=excluded.options,
  priority=excluded.priority,
  required=true,
  active=true;

commit;
