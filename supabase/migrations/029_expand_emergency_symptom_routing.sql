-- Expand high-specificity emergency symptom routing for English, Bangla and Banglish.
-- The emergency categories are intentionally conservative: these phrases describe
-- potentially life-threatening patterns that warrant immediate in-person care.
-- Clinical basis reviewed against CDC stroke guidance and emergency-medicine guidance
-- from Mayo Clinic; Bangladesh emergency number 999 is confirmed by the national portal.

begin;

with emergency_specialty as (
  select id
  from public.specialties
  where lower(name) = 'emergency medicine specialist'
  limit 1
),
seed(keyword, priority, emergency_notice, patient_guidance) as (
  values
    -- Major bleeding / trauma / head injury
    ('matha diye rokto porche', 145, 'Head bleeding after an injury can need emergency assessment. If bleeding is heavy, does not stop, or there was loss of consciousness, call emergency help now.', 'Apply firm pressure with a clean cloth if safe. Do not delay emergency care for heavy or persistent bleeding.'),
    ('matha theke rokto porche', 145, 'Head bleeding after an injury can need emergency assessment. If bleeding is heavy, does not stop, or there was loss of consciousness, call emergency help now.', null),
    ('matha kete rokto porche', 145, 'A head wound with active bleeding can need emergency assessment, especially after a fall or impact.', null),
    ('head bleeding', 145, 'Active bleeding from a head injury can need emergency assessment.', null),
    ('bleeding from head', 145, 'Active bleeding from a head injury can need emergency assessment.', null),
    ('head injury bleeding', 145, 'A head injury with bleeding can be serious. Seek emergency assessment now.', null),
    ('severe head injury', 145, 'A severe head injury needs emergency assessment now.', null),
    ('head injury unconscious', 150, 'Loss of consciousness after a head injury is an emergency. Seek emergency help now.', null),
    ('uncontrolled bleeding', 150, 'Severe or uncontrolled bleeding needs emergency care now.', null),
    ('heavy bleeding wont stop', 150, 'Bleeding that will not stop needs emergency care now.', null),
    ('rokto bondho hocche na', 150, 'Bleeding that will not stop needs emergency care now.', null),
    ('onek rokto porche', 145, 'Heavy bleeding can be life-threatening and needs emergency care now.', null),
    ('রক্ত বন্ধ হচ্ছে না', 150, 'যে রক্তপাত বন্ধ হচ্ছে না তা জরুরি চিকিৎসার প্রয়োজন হতে পারে। এখনই জরুরি সহায়তা নিন।', null),
    ('অনেক রক্ত পড়ছে', 145, 'অতিরিক্ত রক্তপাত জরুরি চিকিৎসার প্রয়োজন হতে পারে।', null),
    ('মাথা থেকে রক্ত পড়ছে', 145, 'মাথায় আঘাতের পর রক্তপাত হলে জরুরি মূল্যায়ন প্রয়োজন হতে পারে।', null),
    ('মাথা কেটে রক্ত পড়ছে', 145, 'মাথায় কাটা ও সক্রিয় রক্তপাত হলে জরুরি মূল্যায়ন প্রয়োজন হতে পারে।', null),

    -- Breathing / choking / cyanosis
    ('cannot breathe', 150, 'Severe breathing difficulty is an emergency. Call emergency help now.', null),
    ('cant breathe', 150, 'Severe breathing difficulty is an emergency. Call emergency help now.', null),
    ('not breathing', 150, 'Not breathing is a life-threatening emergency. Call emergency help now.', null),
    ('gasping for breath', 150, 'Gasping or severe breathing difficulty needs emergency care now.', null),
    ('severe breathing difficulty', 150, 'Severe breathing difficulty needs emergency care now.', null),
    ('choking cannot breathe', 150, 'Choking with inability to breathe is an emergency. Call emergency help now.', null),
    ('blue lips breathing', 150, 'Blue lips with breathing difficulty can indicate dangerously low oxygen and needs emergency care now.', null),
    ('shash nite parchi na', 150, 'Severe breathing difficulty is an emergency. Seek emergency help now.', null),
    ('shash bondho', 150, 'Not breathing is a life-threatening emergency. Seek emergency help now.', null),
    ('dom nite parchi na', 150, 'Severe breathing difficulty needs emergency care now.', null),
    ('গুরুতর শ্বাসকষ্ট', 150, 'গুরুতর শ্বাসকষ্ট জরুরি অবস্থা হতে পারে। এখনই জরুরি সহায়তা নিন।', null),
    ('শ্বাস নিতে পারছি না', 150, 'শ্বাস নিতে না পারা জরুরি অবস্থা। এখনই জরুরি সহায়তা নিন।', null),
    ('শ্বাস বন্ধ', 150, 'শ্বাস বন্ধ হয়ে যাওয়া জীবন-হুমকির জরুরি অবস্থা। এখনই জরুরি সহায়তা নিন।', null),
    ('ঠোঁট নীল শ্বাসকষ্ট', 150, 'ঠোঁট নীল হওয়া ও শ্বাসকষ্ট গুরুতর অক্সিজেন ঘাটতির লক্ষণ হতে পারে।', null),

    -- Chest pain / cardiac collapse
    ('severe chest pain', 150, 'Sudden or severe chest pain can be an emergency. Seek emergency care now.', null),
    ('chest pressure breathing trouble', 150, 'Chest pressure with breathing difficulty needs emergency assessment now.', null),
    ('chest pain sweating', 150, 'Chest pain with sweating, weakness, faintness or breathing difficulty needs emergency assessment now.', null),
    ('buk e tibro betha', 150, 'Severe chest pain can be an emergency. Seek emergency care now.', null),
    ('buk betha shash kosto', 150, 'Chest pain with breathing difficulty needs emergency assessment now.', null),
    ('বুকে তীব্র ব্যথা', 150, 'হঠাৎ বা তীব্র বুকব্যথা জরুরি অবস্থা হতে পারে। এখনই জরুরি চিকিৎসা নিন।', null),
    ('বুক ব্যথা শ্বাসকষ্ট', 150, 'বুকব্যথার সাথে শ্বাসকষ্ট হলে জরুরি মূল্যায়ন প্রয়োজন।', null),

    -- Stroke / sudden neurologic deficit
    ('face droop', 150, 'Sudden facial droop can be a stroke sign. Seek emergency care now.', null),
    ('one sided weakness', 150, 'Sudden one-sided weakness can be a stroke sign. Seek emergency care now.', null),
    ('slurred speech sudden', 150, 'Sudden slurred or abnormal speech can be a stroke sign. Seek emergency care now.', null),
    ('sudden vision loss weakness', 150, 'Sudden vision loss with weakness or speech difficulty can be a stroke sign. Seek emergency care now.', null),
    ('mukh beke geche', 150, 'Sudden facial droop can be a stroke sign. Seek emergency care now.', null),
    ('ek pashe obosh', 150, 'Sudden one-sided numbness or weakness can be a stroke sign. Seek emergency care now.', null),
    ('kotha joriye jacche ek pashe durbol', 150, 'Sudden speech difficulty with one-sided weakness can be a stroke sign. Seek emergency care now.', null),
    ('মুখ বেঁকে গেছে', 150, 'হঠাৎ মুখ বেঁকে যাওয়া স্ট্রোকের লক্ষণ হতে পারে। এখনই জরুরি চিকিৎসা নিন।', null),
    ('এক পাশ অবশ', 150, 'হঠাৎ শরীরের এক পাশ অবশ বা দুর্বল হওয়া স্ট্রোকের লক্ষণ হতে পারে।', null),
    ('কথা জড়িয়ে যাচ্ছে এক পাশ দুর্বল', 150, 'হঠাৎ কথা জড়িয়ে যাওয়া ও এক পাশ দুর্বল হওয়া স্ট্রোকের লক্ষণ হতে পারে।', null),

    -- Consciousness / seizure
    ('unconscious', 150, 'Unconsciousness or unresponsiveness is an emergency. Seek emergency help now.', null),
    ('not waking up', 150, 'Not waking up or being unresponsive is an emergency. Seek emergency help now.', null),
    ('fainted not waking', 150, 'Loss of consciousness without quick recovery needs emergency assessment.', null),
    ('ojnan', 145, 'Loss of consciousness can be an emergency, especially if the person is not waking normally.', null),
    ('gian nai', 150, 'Unresponsiveness is an emergency. Seek emergency help now.', null),
    ('অজ্ঞান', 145, 'অজ্ঞান হয়ে যাওয়া জরুরি মূল্যায়নের প্রয়োজন হতে পারে।', null),
    ('জ্ঞান নেই', 150, 'সাড়া না দেওয়া বা জ্ঞান না থাকা জরুরি অবস্থা। এখনই জরুরি সহায়তা নিন।', null),
    ('seizure 5 minutes', 150, 'A seizure lasting about 5 minutes or longer needs emergency care now.', null),
    ('repeated seizure no recovery', 150, 'Repeated seizures without recovery between them need emergency care now.', null),
    ('khichuni 5 minute', 150, 'A prolonged seizure needs emergency care now.', null),
    ('khichuni thamche na', 150, 'A seizure that is not stopping needs emergency care now.', null),
    ('খিঁচুনি ৫ মিনিট', 150, '৫ মিনিট বা তার বেশি সময় ধরে খিঁচুনি হলে জরুরি চিকিৎসা প্রয়োজন।', null),
    ('খিঁচুনি থামছে না', 150, 'খিঁচুনি থামছে না হলে এখনই জরুরি চিকিৎসা নিন।', null),

    -- Severe allergy / airway swelling
    ('throat swelling breathing trouble', 150, 'Throat or tongue swelling with breathing difficulty can be anaphylaxis. Seek emergency help now.', null),
    ('tongue swelling breathing trouble', 150, 'Tongue swelling with breathing difficulty can be anaphylaxis. Seek emergency help now.', null),
    ('allergy cant breathe', 150, 'A severe allergic reaction with breathing difficulty is an emergency.', null),
    ('gola fule shash kosto', 150, 'Throat swelling with breathing difficulty can be a severe allergic reaction. Seek emergency help now.', null),
    ('জিহ্বা ফুলে শ্বাসকষ্ট', 150, 'জিহ্বা বা গলা ফুলে শ্বাসকষ্ট হলে তীব্র অ্যালার্জিক প্রতিক্রিয়া হতে পারে। এখনই জরুরি সহায়তা নিন।', null),
    ('গলা ফুলে শ্বাসকষ্ট', 150, 'গলা ফুলে শ্বাসকষ্ট হলে তীব্র অ্যালার্জিক প্রতিক্রিয়া হতে পারে। এখনই জরুরি সহায়তা নিন।', null),

    -- Poisoning / overdose / burns / electrical / drowning
    ('poisoning', 150, 'Possible poisoning needs immediate medical help.', null),
    ('medicine overdose', 150, 'A medicine overdose can be life-threatening. Seek emergency help now.', null),
    ('drug overdose', 150, 'A drug overdose can be life-threatening. Seek emergency help now.', null),
    ('bish kheyeche', 150, 'Possible poisoning needs immediate emergency care.', null),
    ('oshudh beshi kheyeche', 150, 'A possible medicine overdose needs emergency care now.', null),
    ('বিষ খেয়েছে', 150, 'বিষক্রিয়ার সন্দেহ হলে এখনই জরুরি চিকিৎসা নিন।', null),
    ('ওষুধ বেশি খেয়েছে', 150, 'ওষুধের অতিরিক্ত মাত্রা জীবন-হুমকির হতে পারে। এখনই জরুরি চিকিৎসা নিন।', null),
    ('severe burn', 145, 'A severe or extensive burn needs urgent emergency assessment.', null),
    ('electric shock unconscious', 150, 'Loss of consciousness after electric shock is an emergency.', null),
    ('drowning not breathing', 150, 'Not breathing after drowning is a life-threatening emergency.', null),
    ('agun e onek pure geche', 145, 'A severe burn needs urgent emergency assessment.', null),
    ('current lege ojnan', 150, 'Loss of consciousness after electric shock is an emergency.', null),
    ('গুরুতর পোড়া', 145, 'গুরুতর বা বিস্তৃত পোড়া হলে জরুরি চিকিৎসা প্রয়োজন।', null),
    ('বিদ্যুৎস্পৃষ্ট অজ্ঞান', 150, 'বিদ্যুৎস্পৃষ্ট হওয়ার পর অজ্ঞান হলে এটি জরুরি অবস্থা।', null),

    -- GI bleeding / major internal bleeding clues
    ('vomiting blood', 150, 'Vomiting blood can indicate serious internal bleeding and needs emergency assessment.', null),
    ('blood vomit', 150, 'Vomiting blood can indicate serious internal bleeding and needs emergency assessment.', null),
    ('bomi te rokto', 150, 'Vomiting blood can indicate serious internal bleeding and needs emergency assessment.', null),
    ('বমিতে রক্ত', 150, 'বমিতে রক্ত দেখা গুরুতর অভ্যন্তরীণ রক্তপাতের লক্ষণ হতে পারে। জরুরি চিকিৎসা নিন।', null),
    ('black stool fainting', 150, 'Black stool with fainting or severe weakness can indicate significant bleeding and needs emergency assessment.', null),

    -- Pregnancy / postpartum emergencies
    ('pregnant heavy bleeding', 150, 'Heavy bleeding during pregnancy needs emergency maternity assessment now.', null),
    ('pregnancy bleeding fainting', 150, 'Bleeding during pregnancy with fainting or severe weakness needs emergency assessment now.', null),
    ('pregnancy seizure', 150, 'A seizure during pregnancy is an emergency. Seek emergency maternity care now.', null),
    ('delivery heavy bleeding', 150, 'Heavy bleeding during or after delivery is an emergency. Seek emergency care now.', null),
    ('pregnant onek rokto', 150, 'Heavy bleeding during pregnancy needs emergency maternity assessment now.', null),
    ('pregnancy khichuni', 150, 'A seizure during pregnancy is an emergency. Seek emergency maternity care now.', null),
    ('গর্ভাবস্থায় অতিরিক্ত রক্তপাত', 150, 'গর্ভাবস্থায় অতিরিক্ত রক্তপাত হলে এখনই জরুরি মাতৃত্বসেবা নিন।', null),
    ('গর্ভাবস্থায় খিঁচুনি', 150, 'গর্ভাবস্থায় খিঁচুনি জরুরি অবস্থা। এখনই জরুরি মাতৃত্বসেবা নিন।', null),
    ('প্রসবের পর অতিরিক্ত রক্তপাত', 150, 'প্রসবের পর অতিরিক্ত রক্তপাত জরুরি অবস্থা। এখনই জরুরি চিকিৎসা নিন।', null)
),
updated as (
  update public.symptom_rules r
  set specialty_id = es.id,
      priority = s.priority,
      emergency_notice = s.emergency_notice,
      patient_guidance = coalesce(s.patient_guidance, r.patient_guidance)
  from seed s
  cross join emergency_specialty es
  where lower(trim(r.keyword)) = lower(trim(s.keyword))
  returning r.id
)
insert into public.symptom_rules (
  keyword, specialty_id, priority, emergency_notice, patient_guidance
)
select
  s.keyword, es.id, s.priority, s.emergency_notice, s.patient_guidance
from seed s
cross join emergency_specialty es
where not exists (
  select 1 from public.symptom_rules r
  where lower(trim(r.keyword)) = lower(trim(s.keyword))
);

commit;
