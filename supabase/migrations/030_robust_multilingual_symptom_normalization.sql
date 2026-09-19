-- Robust multilingual symptom normalization for Healthcare Central.
-- This does NOT diagnose illnesses. It only collapses common English, Bangla,
-- Banglish and misspelled symptom vocabulary to stable canonical terms so the
-- existing reviewed symptom-routing rules can match more reliably.
--
-- Important: "all possible spellings" is not finite. This layer deliberately
-- handles a broad set of common real-world variants while keeping fuzzy matching
-- and the reviewed symptom_rules table as the fallback.

begin;

create or replace function public.normalize_symptom_phrase(value text)
returns text
language plpgsql
immutable
security invoker
set search_path = public, extensions
as $$
declare
  normalized text := lower(trim(coalesce(value, '')));
  item record;
begin
  if normalized = '' then return ''; end if;

  -- Normalize punctuation/spacing first.
  normalized := replace(normalized, '’', '''');
  normalized := replace(normalized, '‘', '''');
  normalized := replace(normalized, '–', '-');
  normalized := replace(normalized, '—', '-');
  normalized := regexp_replace(normalized, '[[:punct:]]+', ' ', 'g');
  normalized := regexp_replace(normalized, E'\\s+', ' ', 'g');

  -- Common Bangla spelling variants and phrase aliases.
  normalized := replace(normalized, 'ব্যাথা', 'ব্যথা');
  normalized := replace(normalized, 'প্রসাব', 'প্রস্রাব');
  normalized := replace(normalized, 'পেশাব', 'প্রস্রাব');
  normalized := replace(normalized, 'পিরিয়ড', 'মাসিক');
  normalized := replace(normalized, 'পিরিয়ড', 'মাসিক');
  normalized := replace(normalized, 'মাথাব্যথা', 'মাথা ব্যথা');
  normalized := replace(normalized, 'দাঁতের ব্যথা', 'দাঁত ব্যথা');
  normalized := replace(normalized, 'দাঁতে ব্যথা', 'দাঁত ব্যথা');
  normalized := replace(normalized, 'দাঁতে অনেক ব্যথা', 'দাঁত অনেক ব্যথা');
  normalized := replace(normalized, 'শ্বাস নিতে কষ্ট', 'শ্বাস কষ্ট');
  normalized := replace(normalized, 'শ্বাস নিতে সমস্যা', 'শ্বাস কষ্ট');
  normalized := replace(normalized, 'শ্বাসকষ্ট', 'শ্বাস কষ্ট');
  normalized := replace(normalized, 'মাথা ঘোরা', 'matha ghure');
  normalized := replace(normalized, 'বুক ধড়ফড়', 'palpitation');
  normalized := replace(normalized, 'বুক ধরফর', 'palpitation');
  normalized := replace(normalized, 'পাতলা পায়খানা', 'diarrhea');
  normalized := replace(normalized, 'পাতলা পায়খানা', 'diarrhea');
  normalized := replace(normalized, 'কোষ্ঠকাঠিন্য', 'constipation');
  normalized := replace(normalized, 'কালো পায়খানা', 'black stool');
  normalized := replace(normalized, 'কালো পায়খানা', 'black stool');
  normalized := replace(normalized, 'বমি বমি ভাব', 'nausea');
  normalized := replace(normalized, 'খেতে ইচ্ছে করে না', 'appetite loss');
  normalized := replace(normalized, 'খিদে নেই', 'appetite loss');
  normalized := replace(normalized, 'খাবারে রুচি নেই', 'appetite loss');
  normalized := replace(normalized, 'গায়ে র‍্যাশ', 'rash');
  normalized := replace(normalized, 'গায়ে র‍্যাশ', 'rash');
  normalized := replace(normalized, 'চামড়ায় র‍্যাশ', 'rash');
  normalized := replace(normalized, 'চামড়ায় র‍্যাশ', 'rash');

  -- Canonicalize high-frequency Bangla body/symptom words into the same
  -- vocabulary used for Banglish. Order matters: longer inflected forms first.
  normalized := replace(normalized, 'দাঁতের', ' dant ');
  normalized := replace(normalized, 'দাঁতে', ' dant e ');
  normalized := replace(normalized, 'দাঁত', ' dant ');
  normalized := replace(normalized, 'মাথায়', ' matha ');
  normalized := replace(normalized, 'মাথায়', ' matha ');
  normalized := replace(normalized, 'মাথা', ' matha ');
  normalized := replace(normalized, 'ব্যথা', ' betha ');
  normalized := replace(normalized, 'জ্বর', ' jor ');
  normalized := replace(normalized, 'কাশি', ' kashi ');
  normalized := replace(normalized, 'বমি', ' bomi ');
  normalized := replace(normalized, 'চোখে', ' chokh ');
  normalized := replace(normalized, 'চোখ', ' chokh ');
  normalized := replace(normalized, 'কানে', ' kan ');
  normalized := replace(normalized, 'কান', ' kan ');
  normalized := replace(normalized, 'নাকে', ' nak ');
  normalized := replace(normalized, 'নাক', ' nak ');
  normalized := replace(normalized, 'গলায়', ' gola ');
  normalized := replace(normalized, 'গলায়', ' gola ');
  normalized := replace(normalized, 'গলা', ' gola ');
  normalized := replace(normalized, 'বুকে', ' buk ');
  normalized := replace(normalized, 'বুক', ' buk ');
  normalized := replace(normalized, 'পেটে', ' pet ');
  normalized := replace(normalized, 'পেট', ' pet ');
  normalized := replace(normalized, 'রক্ত', ' rokto ');
  normalized := replace(normalized, 'শ্বাস', ' shash ');
  normalized := replace(normalized, 'কষ্ট', ' kosto ');
  normalized := replace(normalized, 'প্রস্রাব', ' prosab ');
  normalized := replace(normalized, 'পায়খানা', ' paykhana ');
  normalized := replace(normalized, 'পায়খানা', ' paykhana ');
  normalized := replace(normalized, 'চুলকানি', ' chulkani ');
  normalized := replace(normalized, 'চুলকায়', ' chulkani ');
  normalized := replace(normalized, 'চুলকায়', ' chulkani ');
  normalized := replace(normalized, 'ফুলে', ' fule ');
  normalized := replace(normalized, 'ফোলা', ' fule ');
  normalized := replace(normalized, 'দুর্বল', ' durbol ');
  normalized := replace(normalized, 'অবশ', ' obosh ');
  normalized := replace(normalized, 'অজ্ঞান', ' ojnan ');
  normalized := replace(normalized, 'খিঁচুনি', ' khichuni ');
  normalized := replace(normalized, 'পুঁজ', ' puj ');
  normalized := replace(normalized, 'র‍্যাশ', ' rash ');
  normalized := replace(normalized, 'র‌্যাশ', ' rash ');
  normalized := replace(normalized, 'মাসিক', ' masik ');
  normalized := replace(normalized, 'বাচ্চা', ' baccha ');
  normalized := replace(normalized, 'শিশু', ' baccha ');
  normalized := replace(normalized, 'হাঁটু', ' hatu ');
  normalized := replace(normalized, 'মুখে', ' mukh ');
  normalized := replace(normalized, 'মুখ', ' mukh ');
  normalized := replace(normalized, 'চুল', ' chul ');
  normalized := replace(normalized, 'ঘাম', ' gham ');
  normalized := replace(normalized, 'পানি', ' pani ');
  normalized := replace(normalized, 'জ্বালা', ' jala ');
  normalized := replace(normalized, 'ঝাপসা', ' jhapsha ');
  normalized := replace(normalized, 'ফোসকা', ' foshka ');
  normalized := replace(normalized, 'গুটি', ' guta ');
  normalized := replace(normalized, 'গাঁট', ' guta ');

  normalized := trim(regexp_replace(normalized, E'\\s+', ' ', 'g'));

  -- Phrase-level English/Banglish aliases. These run before token aliases so
  -- phrases such as "shortness of breath" keep their medical meaning.
  for item in
    select *
    from (values
      (E'\\m(toothache|tooth[[:space:]]+ache|tooth[[:space:]]+pain|teeth[[:space:]]+pain|dental[[:space:]]+pain)\\M', 'dant betha'),
      (E'\\m(headache|head[[:space:]]+ache|head[[:space:]]+pain)\\M', 'matha betha'),
      (E'\\m(stomach[[:space:]]+ache|stomach[[:space:]]+pain|belly[[:space:]]+pain|abdominal[[:space:]]+pain)\\M', 'pet betha'),
      (E'\\m(chest[[:space:]]+pain)\\M', 'buk betha'),
      (E'\\m(earache|ear[[:space:]]+ache|ear[[:space:]]+pain)\\M', 'kan betha'),
      (E'\\m(eye[[:space:]]+pain)\\M', 'chokh betha'),
      (E'\\m(sore[[:space:]]+throat|throat[[:space:]]+pain)\\M', 'gola betha'),
      (E'\\m(lower[[:space:]]+back[[:space:]]+pain)\\M', 'komor betha'),
      (E'\\m(shortness[[:space:]]+of[[:space:]]+breath|difficulty[[:space:]]+breathing|breathing[[:space:]]+difficulty|breathing[[:space:]]+trouble|breathlessness)\\M', 'shash kosto'),
      (E'\\m(loose[[:space:]]+motion|loose[[:space:]]+stool|watery[[:space:]]+stool)\\M', 'diarrhea'),
      (E'\\m(feeling[[:space:]]+nauseous|feel[[:space:]]+nauseous)\\M', 'nausea'),
      (E'\\m(loss[[:space:]]+of[[:space:]]+appetite|no[[:space:]]+appetite|poor[[:space:]]+appetite)\\M', 'appetite loss'),
      (E'\\m(frequent[[:space:]]+urination|peeing[[:space:]]+frequently|urinating[[:space:]]+frequently)\\M', 'bar bar prosab'),
      (E'\\m(burning[[:space:]]+urine|burning[[:space:]]+urination|burns[[:space:]]+when[[:space:]]+urinating)\\M', 'prosab e jala'),
      (E'\\m(blood[[:space:]]+in[[:space:]]+urine|bloody[[:space:]]+urine)\\M', 'prosab e rokto'),
      (E'\\m(blood[[:space:]]+in[[:space:]]+stool|bloody[[:space:]]+stool)\\M', 'paykhana e rokto'),
      (E'\\m(coughing[[:space:]]+blood|cough[[:space:]]+with[[:space:]]+blood)\\M', 'kashi te rokto'),
      (E'\\m(heart[[:space:]]+racing|racing[[:space:]]+heart|heart[[:space:]]+palpitations)\\M', 'palpitation'),
      (E'\\m(feel[[:space:]]+dizzy|feeling[[:space:]]+dizzy)\\M', 'dizziness'),
      (E'\\m(fainted|passed[[:space:]]+out|lost[[:space:]]+consciousness)\\M', 'ojnan'),
      (E'\\m(one[[:space:]]+side[[:space:]]+numb|one[[:space:]]+side[[:space:]]+weak|one-sided[[:space:]]+weakness)\\M', 'ek pashe obosh'),
      (E'\\m(face[[:space:]]+drooping|facial[[:space:]]+droop)\\M', 'mukh beke geche'),
      (E'\\m(slurred[[:space:]]+speech|speech[[:space:]]+slurred)\\M', 'kotha joray'),
      (E'\\m(swollen[[:space:]]+face|face[[:space:]]+swelling)\\M', 'mukh fule'),
      (E'\\m(swollen[[:space:]]+leg|leg[[:space:]]+swelling)\\M', 'pa fule'),
      (E'\\m(swollen[[:space:]]+joint|joint[[:space:]]+swelling)\\M', 'joint fule'),
      (E'\\m(skin[[:space:]]+rash|body[[:space:]]+rash)\\M', 'rash'),
      (E'\\m(hair[[:space:]]+loss|hair[[:space:]]+falling|hair[[:space:]]+fall)\\M', 'chul pore'),
      (E'\\m(missed[[:space:]]+period|period[[:space:]]+missing|period[[:space:]]+stopped)\\M', 'masik hoy na'),
      (E'\\m(period[[:space:]]+late|late[[:space:]]+period)\\M', 'masik late'),
      (E'\\m(heavy[[:space:]]+period|heavy[[:space:]]+menstrual[[:space:]]+bleeding)\\M', 'masik e beshi rokto'),
      (E'\\m(vaginal[[:space:]]+discharge|white[[:space:]]+discharge)\\M', 'joni srab'),
      (E'\\m(erectile[[:space:]]+dysfunction|erection[[:space:]]+problem)\\M', 'erection problem')
    ) as aliases(pattern, replacement)
  loop
    normalized := regexp_replace(normalized, item.pattern, item.replacement, 'g');
  end loop;

  -- Token-level aliases and common misspellings/transliteration variants.
  for item in
    select *
    from (values
      (E'\\m(amr|amarrr|aamar|amar)\\M', 'amar'),
      (E'\\m(byatha|batha|beetha|bhetha|beta|betha|pain|ache|hurts|hurt|hurting)\\M', 'betha'),
      (E'\\m(mathay|matay|mata|matha|head)\\M', 'matha'),
      (E'\\m(daat|dat|dant|danth|tooth|teeth)\\M', 'dant'),
      (E'\\m(jwar|jorr|jhor|jor|fever)\\M', 'jor'),
      (E'\\m(kasi|khasi|khashi|kashi|cough|coughing)\\M', 'kashi'),
      (E'\\m(vomi|bomy|bomi|vomit|vomiting|puke|puking)\\M', 'bomi'),
      (E'\\m(cokh|chockh|chok|chokh|eye|eyes)\\M', 'chokh'),
      (E'\\m(kaan|kaner|kane|kan|ear|ears)\\M', 'kan'),
      (E'\\m(naak|nak|nose)\\M', 'nak'),
      (E'\\m(golay|gola|throat)\\M', 'gola'),
      (E'\\m(buke|buk|chest)\\M', 'buk'),
      (E'\\m(peter|pete|pett|pet|stomach|belly|abdomen|abdominal)\\M', 'pet'),
      (E'\\m(proshab|proshrab|peshab|posrab|prosab|urine|pee|peeing|urination)\\M', 'prosab'),
      (E'\\m(rakto|rokto|blood|bleeding|bleed)\\M', 'rokto'),
      (E'\\m(sas|sash|shas|shash|breath|breathing)\\M', 'shash'),
      (E'\\m(koshto|kosto|khosto|trouble|difficulty)\\M', 'kosto'),
      (E'\\m(gura|ghora|ghure|ghura)\\M', 'ghure'),
      (E'\\m(chulkay|chulkani|itch|itchy|itching)\\M', 'chulkani'),
      (E'\\m(fule|phule|swollen|swelling)\\M', 'fule'),
      (E'\\m(durbol|durbal|weak|weakness)\\M', 'durbol'),
      (E'\\m(obosh|obos|numb|numbness)\\M', 'obosh'),
      (E'\\m(ojnan|oggan|ogyan|unconscious|unresponsive)\\M', 'ojnan'),
      (E'\\m(khichuni|khichony|seizure|convulsion|convulsions)\\M', 'khichuni'),
      (E'\\m(puj|pus)\\M', 'puj'),
      (E'\\m(srob|srab|discharge)\\M', 'srab'),
      (E'\\m(piriod|peroid|peried|period|mashik|masik|menstruation|menstrual)\\M', 'masik'),
      (E'\\m(baccha|bacha|bachcha|child|kid)\\M', 'baccha'),
      (E'\\m(mukh|face|mouth)\\M', 'mukh'),
      (E'\\m(hatu|knee)\\M', 'hatu'),
      (E'\\m(chul|hair)\\M', 'chul'),
      (E'\\m(gham|sweat|sweating)\\M', 'gham'),
      (E'\\m(jala|burns|burning)\\M', 'jala'),
      (E'\\m(jhapsha|blurry|blurred)\\M', 'jhapsha'),
      (E'\\m(foshka|foska|blister|blisters)\\M', 'foshka'),
      (E'\\m(guta|guti|lump|mass)\\M', 'guta'),
      (E'\\m(mari|gum|gums)\\M', 'mari'),
      (E'\\m(khomor|komor|waist)\\M', 'komor'),
      (E'\\m(rash|rashes)\\M', 'rash'),
      (E'\\m(diarrhoea|diarrhea)\\M', 'diarrhea'),
      (E'\\m(constipated|constipation)\\M', 'constipation'),
      (E'\\m(nauseous|nausea)\\M', 'nausea'),
      (E'\\m(dizzy|dizziness)\\M', 'dizziness'),
      (E'\\m(palpitation|palpitations)\\M', 'palpitation'),
      (E'\\m(allergic|allergy)\\M', 'allergy'),
      (E'\\m(infection|infected)\\M', 'infection'),
      (E'\\m(fractured|fracture|broken)\\M', 'fracture'),
      (E'\\m(sob|shortness)\\M', 'shortness'),
      (E'\\m(onek|onnek|onekka|very|severe)\\M', 'onek'),
      (E'\\m(hotat|hothat|sudden|suddenly)\\M', 'hotat'),
      (E'\\m(barbar|bar-bar|frequent|frequently)\\M', 'bar bar'),
      (E'\\m(kortese|kortesee|korse|korche|hocche|hoitese|hoche|hoytese)\\M', 'hocche')
    ) as aliases(pattern, replacement)
  loop
    normalized := regexp_replace(normalized, item.pattern, item.replacement, 'g');
  end loop;

  normalized := trim(regexp_replace(normalized, E'\\s+', ' ', 'g'));
  return normalized;
end;
$$;

revoke all on function public.normalize_symptom_phrase(text) from public;
grant execute on function public.normalize_symptom_phrase(text) to authenticated;

commit;
