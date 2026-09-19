export type ConversationLanguage = "bn" | "banglish" | "en";

export type HistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export type ClinicalConceptMatch = {
  concept_id: string;
  code: string;
  canonical_name: string;
  canonical_bn: string | null;
  matched_alias: string;
  score: number;
  normalized_query: string;
};

export type FollowUpQuestion = {
  id: string;
  concept_id: string;
  attribute_key: string;
  question_en: string;
  question_bn: string;
  question_banglish: string;
  answer_type: "choice" | "text";
  options: string[];
  priority: number;
  required: boolean;
};

export type ClinicalEvidence = {
  key: string;
  value: string;
  source: "message" | "follow-up";
};

export function questionText(
  question: FollowUpQuestion,
  language: ConversationLanguage,
) {
  if (language === "bn") return question.question_bn;
  if (language === "banglish") return question.question_banglish;
  return question.question_en;
}

function clean(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isYes(value: string) {
  const q = clean(value);
  return /^(yes|yeah|yep|y|ache|hya|haa|ha|হ্যাঁ|হ্যা|আছে|জি)(\b|$)/i.test(q);
}

export function isNo(value: string) {
  const q = clean(value);
  return /^(no|nope|n|nai|nei|na|নাই|নেই|না)(\b|$)/i.test(q);
}

export function extractGenericEvidence(text: string): ClinicalEvidence[] {
  const q = clean(text);
  const evidence: ClinicalEvidence[] = [];

  const durationPatterns: Array<[RegExp, string]> = [
    [/\b(\d+)\s*(hour|hours|hr|hrs|ghonta|ghonta dhore)\b/i, "$1 hour(s)"],
    [/\b(\d+)\s*(day|days|din|din dhore)\b/i, "$1 day(s)"],
    [/\b(\d+)\s*(week|weeks|soptaho|shoptaho)\b/i, "$1 week(s)"],
    [/\b(\d+)\s*(month|months|mas)\b/i, "$1 month(s)"],
    [/(আজ|আজকে|today)/i, "Today"],
    [/(গতকাল|কাল থেকে|yesterday|kal theke)/i, "Since yesterday"],
  ];

  for (const [pattern, label] of durationPatterns) {
    const match = q.match(pattern);
    if (match) {
      evidence.push({
        key: "duration",
        value: label.replace("$1", match[1] || ""),
        source: "message",
      });
      break;
    }
  }

  if (/(just now|right now|ekhoni|ekhon e|এইমাত্র|এখনই)/i.test(q)) {
    evidence.push({ key: "injury_timing", value: "Just now", source: "message" });
  } else if (/(today|aj|আজ|আজকে)/i.test(q)) {
    evidence.push({ key: "injury_timing", value: "Today", source: "message" });
  }

  if (/(khub|onek|tibro|severe|very bad|worst|প্রচণ্ড|তীব্র|খুব|অনেক)/i.test(q)) {
    evidence.push({ key: "severity", value: "Severe", source: "message" });
  } else if (/(mild|halka|kom|হালকা|কম)/i.test(q)) {
    evidence.push({ key: "severity", value: "Mild", source: "message" });
  }

  const locations: Array<[RegExp, string]> = [
    [/(right side|dan pashe|ডান পাশে|ডান দিকে)/i, "Right side"],
    [/(left side|bam pashe|বাম পাশে|বাম দিকে)/i, "Left side"],
    [/(upper abdomen|uporer pet|উপরের পেট)/i, "Upper abdomen"],
    [/(lower abdomen|nicher pet|tolpet|নিচের পেট|তলপেট)/i, "Lower abdomen"],
    [/(all over|shob jaygay|puro pet|সারা পেট|পুরো পেট)/i, "All over"],
  ];

  for (const [pattern, value] of locations) {
    if (pattern.test(q)) {
      evidence.push({ key: "pain_location", value, source: "message" });
      break;
    }
  }

  return dedupeEvidence(evidence);
}

export function answeredFromLastQuestion(
  history: HistoryItem[],
  currentMessage: string,
  questions: FollowUpQuestion[],
): ClinicalEvidence | null {
  const lastAssistant = [...history].reverse().find((item) => item.role === "assistant");
  if (!lastAssistant) return null;

  const assistantText = clean(lastAssistant.content);

  const question = questions.find((item) =>
    [item.question_en, item.question_bn, item.question_banglish]
      .map(clean)
      .some((candidate) => assistantText === candidate || assistantText.includes(candidate)),
  );

  if (!question) return null;

  return {
    key: question.attribute_key,
    value: currentMessage.trim(),
    source: "follow-up",
  };
}

export function isRedFlagAttribute(key: string) {
  return key.endsWith("_red_flags") || key === "breathing_red_flags";
}

export function redFlagAnswerIsPositive(answer: string) {
  return isYes(answer);
}

export function redFlagNotice(
  conceptCode: string,
  language: ConversationLanguage,
) {
  const notices: Record<string, { en: string; bn: string; banglish: string }> = {
    dental_pain: {
      en: "Dental pain with facial swelling, fever, or swallowing/breathing difficulty can need urgent in-person assessment.",
      bn: "দাঁতের ব্যথার সাথে মুখ ফোলা, জ্বর, বা গিলতে/শ্বাস নিতে কষ্ট হলে দ্রুত সরাসরি চিকিৎসা প্রয়োজন হতে পারে।",
      banglish:
        "Dant-er bethar sathe mukh fola, jor, ba gilte/shash nite kosto hole urgent in-person assessment dorkar hote pare.",
    },
    headache: {
      en: "A sudden severe headache or headache with new neurologic symptoms needs urgent assessment.",
      bn: "হঠাৎ তীব্র মাথাব্যথা বা নতুন দুর্বলতা/অবশভাব/কথা বা দৃষ্টির সমস্যা হলে জরুরি মূল্যায়ন প্রয়োজন।",
      banglish:
        "Hotat tibro matha betha ba new weakness/obosh/speech/vision problem hole urgent assessment dorkar.",
    },
    abdominal_pain: {
      en: "Severe or sudden abdominal pain with bleeding, fainting, repeated vomiting, a rigid abdomen, or pregnancy-related severe pain needs urgent assessment.",
      bn: "হঠাৎ বা তীব্র পেটব্যথার সাথে রক্তপাত, অজ্ঞান, বারবার বমি, পেট শক্ত হয়ে যাওয়া বা গর্ভাবস্থাজনিত তীব্র ব্যথা হলে জরুরি মূল্যায়ন প্রয়োজন।",
      banglish:
        "Hotat/tibro pet betha sathe bleeding, ojnan, repeated bomi, pet shokto, ba pregnancy-related severe pain hole urgent assessment dorkar.",
    },
    chest_pain: {
      en: "Chest pain with severe pressure, breathing trouble, sweating, faintness, or spreading pain needs emergency assessment.",
      bn: "তীব্র চাপের মতো বুকব্যথা, শ্বাসকষ্ট, ঘাম, অজ্ঞানভাব বা ছড়িয়ে যাওয়া ব্যথা জরুরি মূল্যায়নের প্রয়োজন হতে পারে।",
      banglish:
        "Severe/pressure-type buk betha sathe shashkosto, gham, ojnan bhab ba spreading pain hole emergency assessment dorkar.",
    },
    breathing_difficulty: {
      en: "Severe breathing difficulty at rest, inability to speak normally, blue lips, fainting, or rapid worsening is an emergency.",
      bn: "বিশ্রামেও গুরুতর শ্বাসকষ্ট, স্বাভাবিকভাবে কথা বলতে না পারা, ঠোঁট নীল হওয়া, অজ্ঞান হওয়া বা দ্রুত খারাপ হওয়া জরুরি অবস্থা।",
      banglish:
        "Rest-e severe shashkosto, normal kotha bolte na para, thot nil, ojnan, ba rapidly worse howa emergency.",
    },
    rash: {
      en: "A rash with breathing difficulty, throat/tongue swelling, faintness, or rapid severe spread can be an emergency.",
      bn: "র‍্যাশের সাথে শ্বাসকষ্ট, গলা/জিহ্বা ফুলে যাওয়া, অজ্ঞানভাব বা দ্রুত গুরুতরভাবে ছড়িয়ে পড়া জরুরি হতে পারে।",
      banglish:
        "Rash sathe shashkosto, gola/jihba fola, ojnan bhab, ba rapid severe spread emergency hote pare.",
    },
    urinary_burning: {
      en: "Urinary symptoms with fever and side/back pain, vomiting, visible blood, pregnancy, or inability to pass urine need prompt in-person assessment.",
      bn: "প্রস্রাবের সমস্যার সাথে জ্বর ও পিঠ/পাশে ব্যথা, বমি, রক্ত, গর্ভাবস্থা, বা প্রস্রাব একেবারে বন্ধ হলে দ্রুত সরাসরি চিকিৎসা প্রয়োজন।",
      banglish:
        "Urinary symptom sathe jor+pith/pash betha, bomi, visible rokto, pregnancy, ba prosab bondho hole prompt in-person care dorkar.",
    },
    fracture_injury: {
      en: "Visible bone, heavy bleeding, major deformity, numbness, a cold/blue limb, or inability to move the limb needs emergency assessment.",
      bn: "হাড় দেখা যাওয়া, প্রচুর রক্তপাত, বড় বিকৃতি, অবশভাব, অঙ্গ ঠান্ডা/নীল হওয়া বা নড়াতে না পারা জরুরি মূল্যায়নের প্রয়োজন।",
      banglish:
        "Haddi visible, heavy bleeding, major deformity, obosh, limb thanda/nil, ba move korte na para hole emergency assessment dorkar.",
    },
  };

  const notice = notices[conceptCode];
  if (!notice) {
    return language === "bn"
      ? "এই উত্তরের ভিত্তিতে দ্রুত সরাসরি চিকিৎসা নেওয়া নিরাপদ।"
      : language === "banglish"
        ? "Ei answer-er base-e urgent in-person assessment neya safer."
        : "Based on this answer, urgent in-person assessment is safer.";
  }

  return notice[language];
}

export function dedupeEvidence(items: ClinicalEvidence[]) {
  const map = new Map<string, ClinicalEvidence>();
  for (const item of items) map.set(item.key, item);
  return [...map.values()];
}

export function chooseNextQuestion(
  questions: FollowUpQuestion[],
  evidence: ClinicalEvidence[],
) {
  const answered = new Set(evidence.map((item) => item.key));
  return [...questions]
    .sort((a, b) => a.priority - b.priority)
    .find((question) => question.required && !answered.has(question.attribute_key)) || null;
}
