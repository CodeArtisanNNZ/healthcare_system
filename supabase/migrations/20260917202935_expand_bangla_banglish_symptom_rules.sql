begin;

-- Curated from common patient-facing terminology and red-flag symptom groups
-- published by WHO, CDC, NHS and Bangladesh-facing clinical providers. These
-- are routing phrases only; they do not diagnose disease.
-- Sources reviewed:
-- https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue
-- https://www.cdc.gov/stroke/signs-symptoms/index.html
-- https://www.nhs.uk/conditions/heart-attack/symptoms/
-- https://www.nhs.uk/conditions/anaphylaxis/
-- https://www.praavahealth.com/health-topics/dengue

create or replace function public.normalize_symptom_phrase(value text)
returns text
language plpgsql
immutable
security invoker
set search_path = public, extensions
as $$
declare
  normalized text := lower(trim(coalesce(value, '')));
begin
  normalized := replace(normalized, 'ব্যাথা', 'ব্যথা');
  normalized := replace(normalized, 'প্রসাব', 'প্রস্রাব');
  normalized := replace(normalized, 'পেশাব', 'প্রস্রাব');
  normalized := regexp_replace(normalized, '[[:punct:]]+', ' ', 'g');
  normalized := regexp_replace(normalized, '\s+', ' ', 'g');

  normalized := regexp_replace(normalized, '\m(byatha|batha|beetha|bhetha|betha)\M', 'betha', 'g');
  normalized := regexp_replace(normalized, '\m(mathay|matay|mata)\M', 'matha', 'g');
  normalized := regexp_replace(normalized, '\m(jwar|jorr)\M', 'jor', 'g');
  normalized := regexp_replace(normalized, '\m(kasi|khasi|khashi)\M', 'kashi', 'g');
  normalized := regexp_replace(normalized, '\m(vomi|bomy)\M', 'bomi', 'g');
  normalized := regexp_replace(normalized, '\m(cokh|chockh)\M', 'chokh', 'g');
  normalized := regexp_replace(normalized, '\m(gura|ghora)\M', 'ghura', 'g');
  normalized := regexp_replace(normalized, '\m(koshto|kosto|khosto)\M', 'kosto', 'g');
  normalized := regexp_replace(normalized, '\m(sas|sash|shas)\M', 'shash', 'g');
  normalized := regexp_replace(normalized, '\m(proshab|proshrab|peshab|posrab)\M', 'prosab', 'g');
  normalized := regexp_replace(normalized, '\m(rakto|rokto)\M', 'rokto', 'g');
  normalized := regexp_replace(normalized, '\m(daat|dat|datar|dater)\M', 'dant', 'g');
  normalized := regexp_replace(normalized, '\m(kamar)\M', 'komor', 'g');
  normalized := regexp_replace(normalized, '\m(kaner|kane)\M', 'kan', 'g');
  normalized := regexp_replace(normalized, '\m(peter|pete)\M', 'pet', 'g');
  normalized := regexp_replace(normalized, '\m(bacchar|bacchar|bachchar)\M', 'bacchar', 'g');

  return trim(regexp_replace(normalized, '\s+', ' ', 'g'));
end;
$$;

revoke all on function public.normalize_symptom_phrase(text) from public;
grant execute on function public.normalize_symptom_phrase(text) to authenticated;

with new_rules(keyword, specialty_name, priority, emergency_notice, patient_guidance) as (
  values
    -- Primary care / medicine: broad or early symptoms should not over-specialise.
    ('জ্বর', 'Medicine Specialist', 72, null, 'Rest, fluids and monitoring may help a mild fever. Seek clinical advice if it is high, persistent, recurrent, or accompanied by warning signs.'),
    ('অনেক জ্বর', 'Medicine Specialist', 82, null, 'A high or persistent fever needs clinical assessment, especially with dehydration, rash, bleeding, breathing difficulty or unusual drowsiness.'),
    ('হঠাৎ জ্বর', 'Medicine Specialist', 80, null, null),
    ('জ্বর কাঁপুনি', 'Medicine Specialist', 86, null, null),
    ('জ্বর শরীর ব্যথা', 'Medicine Specialist', 88, null, null),
    ('জ্বর মাথা ব্যথা', 'Medicine Specialist', 88, null, null),
    ('জ্বর দুর্বলতা', 'Medicine Specialist', 84, null, null),
    ('শরীর ব্যথা', 'Medicine Specialist', 72, null, null),
    ('গা ব্যথা', 'Medicine Specialist', 72, null, null),
    ('গা ম্যাজম্যাজ', 'Medicine Specialist', 68, null, null),
    ('অনেক দুর্বল', 'Medicine Specialist', 76, null, null),
    ('দুর্বল লাগে', 'Medicine Specialist', 70, null, null),
    ('সবসময় ক্লান্ত', 'Medicine Specialist', 76, null, null),
    ('ক্ষুধা নেই', 'Medicine Specialist', 72, null, null),
    ('খেতে ইচ্ছা করে না', 'Medicine Specialist', 72, null, null),
    ('ওজন কমছে', 'Medicine Specialist', 88, null, 'Unexplained weight loss should be assessed by a clinician; it has many possible causes.'),
    ('রাতে ঘাম', 'Medicine Specialist', 86, null, null),
    ('পানি শূন্যতা', 'Medicine Specialist', 92, null, 'Use oral fluids if able. Confusion, fainting, very little urine or inability to drink needs urgent assessment.'),
    ('মুখ শুকিয়ে যায়', 'Medicine Specialist', 72, null, null),
    ('jor kapuni', 'Medicine Specialist', 86, null, null),
    ('jor shorir betha', 'Medicine Specialist', 88, null, null),
    ('jor matha betha', 'Medicine Specialist', 88, null, null),
    ('shorir durbol', 'Medicine Specialist', 74, null, null),
    ('durbol lage', 'Medicine Specialist', 70, null, null),
    ('sob somoy klanto', 'Medicine Specialist', 76, null, null),
    ('khabar ruchi nai', 'Medicine Specialist', 72, null, null),
    ('ojon kome jacche', 'Medicine Specialist', 88, null, null),
    ('rate gham', 'Medicine Specialist', 86, null, null),
    ('mukh shukiye jay', 'Medicine Specialist', 72, null, null),
    ('dengue shondeho', 'Medicine Specialist', 98, null, 'Dengue cannot be confirmed from symptoms alone. Seek testing and clinical advice; urgent warning signs include bleeding, severe abdominal pain, repeated vomiting, extreme weakness or breathing difficulty.'),
    ('ডেঙ্গু সন্দেহ', 'Medicine Specialist', 98, null, 'Dengue cannot be confirmed from symptoms alone. Seek testing and clinical advice; urgent warning signs include bleeding, severe abdominal pain, repeated vomiting, extreme weakness or breathing difficulty.'),

    -- Cardiac symptoms and emergency patterns.
    ('বুক ভার লাগে', 'Cardiologist', 92, null, null),
    ('বুকে জ্বালা আর চাপ', 'Cardiologist', 94, null, null),
    ('বুক ব্যথা বাম হাতে', 'Cardiologist', 126, 'Chest pain spreading to the arm can be an emergency. Seek urgent medical help now.', null),
    ('বুক ব্যথা চোয়ালে', 'Cardiologist', 126, 'Chest pain spreading to the jaw can be an emergency. Seek urgent medical help now.', null),
    ('বুক ব্যথা শ্বাসকষ্ট', 'Cardiologist', 130, 'Chest pain with breathing difficulty needs urgent assessment.', null),
    ('বুক ব্যথা বমি ভাব', 'Cardiologist', 124, 'Chest pain with nausea can be serious. Seek urgent assessment.', null),
    ('ঠান্ডা ঘাম বুক ব্যথা', 'Cardiologist', 132, 'Chest pain with cold sweating can be a heart emergency. Seek urgent help now.', null),
    ('হার্টবিট অনিয়মিত', 'Cardiologist', 98, null, null),
    ('বুক ধকধক', 'Cardiologist', 92, null, null),
    ('হাঁটলে বুক ব্যথা', 'Cardiologist', 100, null, null),
    ('হাঁটলে শ্বাসকষ্ট', 'Cardiologist', 96, null, null),
    ('পা ফুলে শ্বাসকষ্ট', 'Cardiologist', 108, null, null),
    ('buk vari lage', 'Cardiologist', 92, null, null),
    ('buk betha bam hate', 'Cardiologist', 126, 'Chest pain spreading to the arm can be an emergency. Seek urgent medical help now.', null),
    ('buk betha choyal e', 'Cardiologist', 126, 'Chest pain spreading to the jaw can be an emergency. Seek urgent medical help now.', null),
    ('buk betha shash kosto', 'Cardiologist', 130, 'Chest pain with breathing difficulty needs urgent assessment.', null),
    ('thanda gham buk betha', 'Cardiologist', 132, 'Chest pain with cold sweating can be a heart emergency. Seek urgent help now.', null),
    ('heart beat oniyomito', 'Cardiologist', 98, null, null),
    ('hatle buk betha', 'Cardiologist', 100, null, null),
    ('pa fule shash kosto', 'Cardiologist', 108, null, null),

    -- Respiratory / chest medicine.
    ('কফ সহ কাশি', 'Chest Medicine Specialist', 82, null, null),
    ('অনেক দিনের কাশি', 'Chest Medicine Specialist', 92, null, null),
    ('তিন সপ্তাহ কাশি', 'Chest Medicine Specialist', 98, null, 'A cough lasting several weeks needs clinical assessment.'),
    ('কাশিতে রক্ত', 'Chest Medicine Specialist', 126, 'Coughing blood needs urgent medical assessment.', null),
    ('শ্বাসে শোঁ শোঁ', 'Chest Medicine Specialist', 100, null, null),
    ('শ্বাস ফুলে যায়', 'Chest Medicine Specialist', 96, null, null),
    ('রাতে কাশি বাড়ে', 'Chest Medicine Specialist', 88, null, null),
    ('বুকে কফ জমে', 'Chest Medicine Specialist', 88, null, null),
    ('kof soho kashi', 'Chest Medicine Specialist', 82, null, null),
    ('onek diner kashi', 'Chest Medicine Specialist', 92, null, null),
    ('kashite rokto', 'Chest Medicine Specialist', 126, 'Coughing blood needs urgent medical assessment.', null),
    ('shashe sho sho', 'Chest Medicine Specialist', 100, null, null),
    ('shash fule jay', 'Chest Medicine Specialist', 96, null, null),
    ('rate kashi bare', 'Chest Medicine Specialist', 88, null, null),
    ('buke kof jome', 'Chest Medicine Specialist', 88, null, null),

    -- Gastrointestinal and liver-related symptoms.
    ('পাতলা পায়খানা', 'Gastroenterologist', 82, null, 'Use oral rehydration if able. Blood in stool, severe dehydration, fainting or persistent vomiting needs prompt assessment.'),
    ('বার বার পায়খানা', 'Gastroenterologist', 82, null, null),
    ('পায়খানায় রক্ত', 'Gastroenterologist', 108, null, 'Blood in stool needs clinical assessment; heavy bleeding, fainting or black tarry stool can be urgent.'),
    ('কালো পায়খানা', 'Gastroenterologist', 118, 'Black tarry stool can indicate internal bleeding. Seek urgent medical assessment.', null),
    ('পেটে গ্যাস', 'Gastroenterologist', 70, null, null),
    ('বুক জ্বালা', 'Gastroenterologist', 76, null, null),
    ('টক ঢেকুর', 'Gastroenterologist', 76, null, null),
    ('কোষ্ঠকাঠিন্য', 'Gastroenterologist', 78, null, null),
    ('পেট ফাঁপা', 'Gastroenterologist', 74, null, null),
    ('বমি হচ্ছে', 'Gastroenterologist', 78, null, null),
    ('বার বার বমি', 'Gastroenterologist', 100, null, 'Repeated vomiting can cause dehydration and needs assessment, especially if fluids cannot be kept down.'),
    ('তীব্র পেট ব্যথা', 'Gastroenterologist', 112, 'Severe or sudden abdominal pain needs urgent medical assessment.', null),
    ('ডান পাশে পেট ব্যথা', 'Gastroenterologist', 94, null, null),
    ('pet e gas', 'Gastroenterologist', 70, null, null),
    ('buk jala', 'Gastroenterologist', 76, null, null),
    ('tok dhekur', 'Gastroenterologist', 76, null, null),
    ('koshtho kathinno', 'Gastroenterologist', 78, null, null),
    ('pet fapa', 'Gastroenterologist', 74, null, null),
    ('bar bar bomi', 'Gastroenterologist', 100, null, null),
    ('paykhana rokto', 'Gastroenterologist', 108, null, null),
    ('kalo paykhana', 'Gastroenterologist', 118, 'Black tarry stool can indicate internal bleeding. Seek urgent medical assessment.', null),
    ('চোখ হলুদ', 'Hepatologist', 104, null, null),
    ('প্রস্রাব গাঢ় হলুদ', 'Hepatologist', 90, null, null),
    ('পেট ফুলে পানি', 'Hepatologist', 100, null, null),
    ('chokh holud', 'Hepatologist', 104, null, null),
    ('prosab garo holud', 'Hepatologist', 90, null, null),

    -- Neurology and stroke red flags.
    ('হঠাৎ মুখ বেঁকে গেছে', 'Neurologist', 136, 'Sudden facial droop can be a stroke sign. Seek emergency care immediately.', null),
    ('হঠাৎ কথা জড়ায়', 'Neurologist', 136, 'Sudden speech difficulty can be a stroke sign. Seek emergency care immediately.', null),
    ('হঠাৎ হাত অবশ', 'Neurologist', 132, 'Sudden one-sided numbness or weakness can be a stroke sign. Seek emergency care immediately.', null),
    ('শরীরের এক পাশ অবশ', 'Neurologist', 136, 'Sudden one-sided numbness or weakness can be a stroke sign. Seek emergency care immediately.', null),
    ('হঠাৎ দেখতে সমস্যা', 'Neurologist', 128, 'Sudden vision trouble can be a stroke sign. Seek urgent medical assessment.', null),
    ('হঠাৎ ভারসাম্য হারানো', 'Neurologist', 128, 'Sudden loss of balance can be a stroke sign. Seek urgent medical assessment.', null),
    ('জীবনের সবচেয়ে তীব্র মাথা ব্যথা', 'Neurologist', 136, 'A sudden worst-ever headache is an emergency. Seek immediate medical help.', null),
    ('মাথায় আঘাতের পর বমি', 'Neurologist', 130, 'Vomiting or confusion after a head injury needs urgent assessment.', null),
    ('মাথায় আঘাতের পর ঘুম', 'Neurologist', 126, 'Unusual drowsiness after a head injury needs urgent assessment.', null),
    ('হাত পা ঝিনঝিন', 'Neurologist', 82, null, null),
    ('হাত কাঁপে', 'Neurologist', 86, null, null),
    ('বার বার মাথা ঘোরে', 'Neurologist', 88, null, null),
    ('স্মৃতি কমে যাচ্ছে', 'Neurologist', 90, null, null),
    ('hotat mukh beke geche', 'Neurologist', 136, 'Sudden facial droop can be a stroke sign. Seek emergency care immediately.', null),
    ('hotat kotha joray', 'Neurologist', 136, 'Sudden speech difficulty can be a stroke sign. Seek emergency care immediately.', null),
    ('shorirer ek pash obosh', 'Neurologist', 136, 'Sudden one-sided numbness or weakness can be a stroke sign. Seek emergency care immediately.', null),
    ('hotat balance nei', 'Neurologist', 128, 'Sudden loss of balance can be a stroke sign. Seek urgent medical assessment.', null),
    ('jiboner shobcheye tibro matha betha', 'Neurologist', 136, 'A sudden worst-ever headache is an emergency. Seek immediate medical help.', null),
    ('mathay aghater por bomi', 'Neurologist', 130, 'Vomiting or confusion after a head injury needs urgent assessment.', null),
    ('hat pa jhinjhin', 'Neurologist', 82, null, null),
    ('hat kape', 'Neurologist', 86, null, null),
    ('sriti kome jacche', 'Neurologist', 90, null, null),

    -- ENT.
    ('গলা খুসখুস', 'ENT Specialist', 72, null, null),
    ('গিলতে ব্যথা', 'ENT Specialist', 86, null, null),
    ('গিলতে পারি না', 'ENT Specialist', 106, null, null),
    ('কানে কম শুনি', 'ENT Specialist', 92, null, null),
    ('হঠাৎ কানে শুনি না', 'ENT Specialist', 118, 'Sudden hearing loss needs urgent specialist assessment.', null),
    ('কান দিয়ে পানি', 'ENT Specialist', 90, null, null),
    ('কান দিয়ে পুঁজ', 'ENT Specialist', 94, null, null),
    ('কানে শব্দ', 'ENT Specialist', 84, null, null),
    ('নাক বন্ধ', 'ENT Specialist', 74, null, null),
    ('নাক দিয়ে রক্ত', 'ENT Specialist', 94, null, null),
    ('সাইনাস ব্যথা', 'ENT Specialist', 88, null, null),
    ('কণ্ঠস্বর বসে গেছে', 'ENT Specialist', 86, null, null),
    ('gola khushkhush', 'ENT Specialist', 72, null, null),
    ('gilte betha', 'ENT Specialist', 86, null, null),
    ('kan e kom shuni', 'ENT Specialist', 92, null, null),
    ('kan diye puj', 'ENT Specialist', 94, null, null),
    ('kan e shobdo', 'ENT Specialist', 84, null, null),
    ('nak bondho', 'ENT Specialist', 74, null, null),
    ('nak diye rokto', 'ENT Specialist', 94, null, null),
    ('sinus betha', 'ENT Specialist', 88, null, null),
    ('golar shor boshe geche', 'ENT Specialist', 86, null, null),

    -- Eye.
    ('চোখ লাল', 'Eye Specialist', 78, null, null),
    ('চোখে ব্যথা', 'Eye Specialist', 88, null, null),
    ('চোখ দিয়ে পানি পড়ে', 'Eye Specialist', 74, null, null),
    ('চোখে পুঁজ', 'Eye Specialist', 86, null, null),
    ('দুইটা দেখি', 'Eye Specialist', 104, null, null),
    ('হঠাৎ চোখে দেখি না', 'Eye Specialist', 128, 'Sudden loss of vision is an emergency. Seek urgent eye or emergency care.', null),
    ('চোখে আঘাত', 'Eye Specialist', 112, null, null),
    ('চোখে কেমিক্যাল', 'Eye Specialist', 136, 'Chemical exposure to the eye is an emergency. Rinse continuously with clean water and seek emergency care.', null),
    ('chokh lal', 'Eye Specialist', 78, null, null),
    ('chokh betha', 'Eye Specialist', 88, null, null),
    ('chokh diye pani pore', 'Eye Specialist', 74, null, null),
    ('duita dekhi', 'Eye Specialist', 104, null, null),
    ('hotat chokhe dekhi na', 'Eye Specialist', 128, 'Sudden loss of vision is an emergency. Seek urgent eye or emergency care.', null),
    ('chokhe chemical', 'Eye Specialist', 136, 'Chemical exposure to the eye is an emergency. Rinse continuously with clean water and seek emergency care.', null),

    -- Skin.
    ('ত্বক লাল ফুলে গেছে', 'Dermatologist', 88, null, null),
    ('ফোঁড়া', 'Dermatologist', 86, null, null),
    ('ঘা শুকায় না', 'Dermatologist', 94, null, null),
    ('চামড়া উঠে যাচ্ছে', 'Dermatologist', 90, null, null),
    ('চুল পড়ে যাচ্ছে', 'Dermatologist', 86, null, null),
    ('নখ ভেঙে যায়', 'Dermatologist', 78, null, null),
    ('মুখে ব্রণ', 'Dermatologist', 92, null, null),
    ('ঠোঁটের পাশে ঘা', 'Dermatologist', 82, null, null),
    ('skin lal fule geche', 'Dermatologist', 88, null, null),
    ('fora', 'Dermatologist', 86, null, null),
    ('gha shukay na', 'Dermatologist', 94, null, null),
    ('chul pore jacche', 'Dermatologist', 86, null, null),
    ('mukhe bron', 'Dermatologist', 92, null, null),

    -- Orthopaedics.
    ('ঘাড় ব্যথা', 'Orthopaedic Surgeon', 80, null, null),
    ('কাঁধ ব্যথা', 'Orthopaedic Surgeon', 86, null, null),
    ('কনুই ব্যথা', 'Orthopaedic Surgeon', 84, null, null),
    ('কবজি ব্যথা', 'Orthopaedic Surgeon', 84, null, null),
    ('গোড়ালি ব্যথা', 'Orthopaedic Surgeon', 86, null, null),
    ('পিঠ ব্যথা', 'Orthopaedic Surgeon', 80, null, null),
    ('পড়ে গিয়ে ব্যথা', 'Orthopaedic Surgeon', 92, null, null),
    ('হাত নড়াতে পারি না', 'Orthopaedic Surgeon', 98, null, null),
    ('পা নড়াতে পারি না', 'Orthopaedic Surgeon', 98, null, null),
    ('ghar betha', 'Orthopaedic Surgeon', 80, null, null),
    ('kandh betha', 'Orthopaedic Surgeon', 86, null, null),
    ('konui betha', 'Orthopaedic Surgeon', 84, null, null),
    ('kobji betha', 'Orthopaedic Surgeon', 84, null, null),
    ('gorali betha', 'Orthopaedic Surgeon', 86, null, null),
    ('pith betha', 'Orthopaedic Surgeon', 80, null, null),
    ('pore giye betha', 'Orthopaedic Surgeon', 92, null, null),

    -- Women’s health / pregnancy.
    ('মাসিক অনিয়মিত', 'Gynaecologist', 90, null, null),
    ('মাসিক বন্ধ', 'Gynaecologist', 88, null, null),
    ('মাসিকে অতিরিক্ত রক্তপাত', 'Gynaecologist', 106, null, null),
    ('তলপেটে ব্যথা', 'Gynaecologist', 84, null, null),
    ('সাদা স্রাব', 'Gynaecologist', 82, null, null),
    ('যোনিতে চুলকানি', 'Gynaecologist', 88, null, null),
    ('সহবাসে ব্যথা', 'Gynaecologist', 90, null, null),
    ('masik oniyomito', 'Gynaecologist', 90, null, null),
    ('masik bondho', 'Gynaecologist', 88, null, null),
    ('masike beshi rokto', 'Gynaecologist', 106, null, null),
    ('tol pete betha', 'Gynaecologist', 84, null, null),
    ('shada srab', 'Gynaecologist', 82, null, null),
    ('jonite chulkani', 'Gynaecologist', 88, null, null),
    ('গর্ভাবস্থায় বাচ্চা নড়ে না', 'Obstetrician', 132, 'Reduced or absent fetal movement needs urgent maternity assessment.', null),
    ('গর্ভাবস্থায় পানি ভাঙা', 'Obstetrician', 130, 'Possible breaking of waters needs prompt maternity assessment.', null),
    ('গর্ভাবস্থায় তীব্র মাথা ব্যথা', 'Obstetrician', 126, 'Severe headache during pregnancy needs urgent clinical assessment.', null),
    ('pregnancy te baccha nore na', 'Obstetrician', 132, 'Reduced or absent fetal movement needs urgent maternity assessment.', null),
    ('pregnancy te pani vanga', 'Obstetrician', 130, 'Possible breaking of waters needs prompt maternity assessment.', null),

    -- Urinary / kidney.
    ('প্রস্রাব কম', 'Kidney Specialist', 90, null, null),
    ('প্রস্রাব ফেনা', 'Kidney Specialist', 92, null, null),
    ('মুখ পা ফুলে গেছে', 'Kidney Specialist', 98, null, null),
    ('কোমরের পাশে ব্যথা', 'Kidney Specialist', 92, null, null),
    ('prosab kom', 'Kidney Specialist', 90, null, null),
    ('prosab fena', 'Kidney Specialist', 92, null, null),
    ('mukh pa fule geche', 'Kidney Specialist', 98, null, null),
    ('komorer pashe betha', 'Kidney Specialist', 92, null, null),
    ('প্রস্রাব আটকে যায়', 'Urologist', 112, null, null),
    ('প্রস্রাবের বেগ কিন্তু হয় না', 'Urologist', 118, 'Inability to pass urine can require urgent treatment.', null),
    ('অণ্ডকোষে ব্যথা', 'Urologist', 104, null, null),
    ('হঠাৎ অণ্ডকোষে তীব্র ব্যথা', 'Urologist', 132, 'Sudden severe testicular pain is an emergency. Seek immediate care.', null),
    ('prosab atke jay', 'Urologist', 112, null, null),
    ('ondokoshe betha', 'Urologist', 104, null, null),

    -- Children / newborns.
    ('বাচ্চা খেতে চায় না', 'Paediatrician', 92, null, null),
    ('বাচ্চা নিস্তেজ', 'Paediatrician', 112, null, null),
    ('বাচ্চার ডায়রিয়া', 'Paediatrician', 94, null, null),
    ('বাচ্চার র‍্যাশ', 'Paediatrician', 86, null, null),
    ('বাচ্চার শ্বাসকষ্ট', 'Paediatrician', 126, 'Breathing difficulty in a child needs urgent medical assessment.', null),
    ('baccha khete chay na', 'Paediatrician', 92, null, null),
    ('baccha nistej', 'Paediatrician', 112, null, null),
    ('bacchar diarrhea', 'Paediatrician', 94, null, null),
    ('bacchar rash', 'Paediatrician', 86, null, null),
    ('bacchar shash kosto', 'Paediatrician', 126, 'Breathing difficulty in a child needs urgent medical assessment.', null),
    ('নবজাতক নীল হয়ে যায়', 'Neonatologist', 136, 'A blue or poorly breathing newborn needs emergency care immediately.', null),
    ('নবজাতক খিঁচুনি', 'Neonatologist', 136, 'A seizure in a newborn needs emergency care immediately.', null),
    ('notun baccha nil hoye jay', 'Neonatologist', 136, 'A blue or poorly breathing newborn needs emergency care immediately.', null),

    -- Mental health.
    ('ঘুম হয় না দুশ্চিন্তা', 'Psychiatrist', 84, null, null),
    ('অতিরিক্ত ভয়', 'Psychiatrist', 86, null, null),
    ('হঠাৎ প্যানিক', 'Psychiatrist', 92, null, null),
    ('কিছু ভালো লাগে না', 'Psychiatrist', 94, null, null),
    ('নিজেকে আঘাত করতে চাই', 'Psychiatrist', 136, 'Thoughts of self-harm need immediate support. Stay with a trusted person and seek emergency or crisis help now.', null),
    ('বাঁচতে চাই না', 'Psychiatrist', 136, 'Thoughts of suicide need immediate support. Stay with a trusted person and seek emergency or crisis help now.', null),
    ('ghum hoy na dushchinta', 'Psychiatrist', 84, null, null),
    ('otirikto voy', 'Psychiatrist', 86, null, null),
    ('kichu valo lage na', 'Psychiatrist', 94, null, null),
    ('nijeke aghat korte chai', 'Psychiatrist', 136, 'Thoughts of self-harm need immediate support. Stay with a trusted person and seek emergency or crisis help now.', null),
    ('bachte chai na', 'Psychiatrist', 136, 'Thoughts of suicide need immediate support. Stay with a trusted person and seek emergency or crisis help now.', null),

    -- Dental.
    ('দাঁত শিরশির', 'Dentist', 86, null, null),
    ('দাঁত ভেঙে গেছে', 'Dentist', 96, null, null),
    ('মাড়ি থেকে রক্ত', 'Dentist', 88, null, null),
    ('মুখ ফুলে দাঁত ব্যথা', 'Dentist', 104, null, null),
    ('dant shirshir', 'Dentist', 86, null, null),
    ('dant venge geche', 'Dentist', 96, null, null),
    ('mari theke rokto', 'Dentist', 88, null, null),
    ('mukh fule dant betha', 'Dentist', 104, null, null),

    -- Blood, endocrine and general surgery.
    ('সহজে কালশিটে', 'Haematologist', 90, null, null),
    ('বার বার রক্তপাত', 'Haematologist', 104, null, null),
    ('রক্তশূন্যতা', 'Haematologist', 92, null, null),
    ('hemoglobin kom', 'Haematologist', 92, null, null),
    ('সহজে রক্ত বন্ধ হয় না', 'Haematologist', 112, null, null),
    ('গলায় গুটি', 'Endocrinologist', 92, null, null),
    ('থাইরয়েড সমস্যা', 'Endocrinologist', 100, null, null),
    ('thyroid er somossa', 'Endocrinologist', 100, null, null),
    ('অতিরিক্ত পিপাসা প্রস্রাব', 'Medicine Specialist', 96, null, null),
    ('sugar beshi pipasa', 'Medicine Specialist', 96, null, null),
    ('হার্নিয়া', 'General Surgeon', 100, null, null),
    ('কুঁচকিতে ফোলা', 'General Surgeon', 94, null, null),
    ('পেটের গুটি', 'General Surgeon', 92, null, null),
    ('kuchkite fola', 'General Surgeon', 94, null, null),

    -- Additional emergency phrases in everyday Bangla/Banglish.
    ('শ্বাস বন্ধ', 'Emergency Medicine Specialist', 140, 'Call emergency services immediately. The person may not be breathing.', null),
    ('জ্ঞান ফিরছে না', 'Emergency Medicine Specialist', 140, 'Unresponsiveness is an emergency. Seek immediate help.', null),
    ('অতিরিক্ত রক্তপাত', 'Emergency Medicine Specialist', 140, 'Severe bleeding is an emergency. Apply firm pressure if safe and seek immediate help.', null),
    ('বিষ খেয়েছে', 'Emergency Medicine Specialist', 140, 'Possible poisoning is an emergency. Seek immediate medical help and do not induce vomiting unless instructed by professionals.', null),
    ('বিদ্যুৎ শক', 'Emergency Medicine Specialist', 138, 'Electrical injury can be serious. Seek emergency assessment.', null),
    ('পানিতে ডুবে গেছে', 'Emergency Medicine Specialist', 140, 'Drowning or near-drowning is an emergency. Call emergency services immediately.', null),
    ('গলায় খাবার আটকে গেছে', 'Emergency Medicine Specialist', 140, 'Choking is an emergency. Call for immediate help.', null),
    ('আগুনে পুড়ে গেছে', 'Emergency Medicine Specialist', 136, 'Major burns need emergency care.', null),
    ('shash bondho', 'Emergency Medicine Specialist', 140, 'Call emergency services immediately. The person may not be breathing.', null),
    ('giyan firche na', 'Emergency Medicine Specialist', 140, 'Unresponsiveness is an emergency. Seek immediate help.', null),
    ('beshi rokto porche', 'Emergency Medicine Specialist', 140, 'Severe bleeding is an emergency. Apply firm pressure if safe and seek immediate help.', null),
    ('bish kheyeche', 'Emergency Medicine Specialist', 140, 'Possible poisoning is an emergency. Seek immediate medical help.', null),
    ('current legeche', 'Emergency Medicine Specialist', 138, 'Electrical injury can be serious. Seek emergency assessment.', null),
    ('panite dube geche', 'Emergency Medicine Specialist', 140, 'Drowning or near-drowning is an emergency. Call emergency services immediately.', null),
    ('golay khabar atke geche', 'Emergency Medicine Specialist', 140, 'Choking is an emergency. Call for immediate help.', null),
    ('agune pure geche', 'Emergency Medicine Specialist', 136, 'Major burns need emergency care.', null)
), resolved as (
  select
    nr.keyword,
    s.id as specialty_id,
    nr.priority::numeric as priority,
    nr.emergency_notice,
    nr.patient_guidance
  from new_rules nr
  join public.specialties s on lower(s.name) = lower(nr.specialty_name)
)
insert into public.symptom_rules(keyword, specialty_id, priority, emergency_notice, patient_guidance)
select r.keyword, r.specialty_id, r.priority, r.emergency_notice, r.patient_guidance
from resolved r
where not exists (
  select 1
  from public.symptom_rules existing
  where lower(trim(existing.keyword)) = lower(trim(r.keyword))
    and existing.specialty_id = r.specialty_id
);

commit;
