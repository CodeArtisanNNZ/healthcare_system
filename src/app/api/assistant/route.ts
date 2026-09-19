import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { healthcareLocations } from "@/lib/locations";
import type { Row } from "@/lib/entities";

export const runtime = "nodejs";

const categorySchema = z.enum([
  "doctor",
  "medicine",
  "hospital",
  "lab-test",
  "caregiver",
  "ambulance",
]);

type Category = z.infer<typeof categorySchema>;

const historyItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(900),
});

const requestSchema = z
  .object({
    message: z.string().trim().min(1).max(500),
    category: categorySchema.default("doctor"),
    location: z.string().trim().max(100).default(""),
    history: z.array(historyItemSchema).max(10).optional().default([]),
  })
  .strict();

type ResultDetail = { label: string; value: string };

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  details: ResultDetail[];
  phone?: string;
  secondaryPhone?: string;
  href?: string;
};

type TriageMatchedSymptom = {
  phrase: string;
  strength?: number;
};

type TriageSuggestion = {
  specialty_id: string;
  specialty_name: string;
  score?: number;
  matched_count?: number;
  matched_symptoms?: TriageMatchedSymptom[];
};

type DoctorTriage = {
  urgent: boolean;
  emergency_notice: string | null;
  patient_guidance: string | null;
  primary_specialty_id: string | null;
  primary_specialty_name: string | null;
  suggestions: TriageSuggestion[];
};

type ConversationLanguage = "bn" | "banglish" | "en";

const emptyTriage: DoctorTriage = {
  urgent: false,
  emergency_notice: null,
  patient_guidance: null,
  primary_specialty_id: null,
  primary_specialty_name: null,
  suggestions: [],
};

const entityByCategory: Record<Category, string> = {
  doctor: "doctors",
  medicine: "medicines",
  hospital: "hospitals",
  "lab-test": "lab_tests",
  caregiver: "caregivers",
  ambulance: "ambulances",
};

const pathByCategory: Record<Category, string> = {
  doctor: "/doctors",
  medicine: "/medicines",
  hospital: "/hospitals",
  "lab-test": "/lab-tests",
  caregiver: "/caregivers",
  ambulance: "/emergency",
};

const categoryTitle: Record<Category, string> = {
  doctor: "Doctors",
  medicine: "Medicines",
  hospital: "Hospitals",
  "lab-test": "Lab tests",
  caregiver: "Caregivers",
  ambulance: "Ambulance services",
};

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function detail(label: string, value: unknown): ResultDetail | null {
  const cleaned = text(value);
  return cleaned ? { label, value: cleaned } : null;
}

function compact(items: Array<ResultDetail | null>) {
  return items.filter((item): item is ResultDetail => Boolean(item));
}

function canonicalLocation(value: string) {
  if (!value) return "";

  return (
    healthcareLocations.find(
      (item) => item.toLowerCase() === value.trim().toLowerCase(),
    ) || ""
  );
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_\`~()?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeConversationalText(value: string) {
  return value
    .replace(/(?<=[a-zA-Z])9(?=[a-zA-Z])/g, "o")
    .replace(/(?<=[a-zA-Z])0(?=[a-zA-Z])/g, "o")
    .replace(/\bdoc\b/gi, "doctor")
    .replace(/\bsymtom\b/gi, "symptom")
    .replace(/\bsymtoms\b/gi, "symptoms")
    .replace(/\bmatha\s*beta\b/gi, "matha betha")
    .replace(/\bpet\s*beta\b/gi, "pet betha")
    .replace(/\bbuk\s*beta\b/gi, "buk betha")
    .replace(/\s+/g, " ")
    .trim();
}

function detectLanguage(value: string): ConversationLanguage {
  if (/[\u0980-\u09FF]/.test(value)) return "bn";

  const q = normalize(value);
  const banglishSignals = [
    "amar",
    "ami",
    "amr",
    "ki korbo",
    "ki kora uchit",
    "kon doctor",
    "doctor dekhabo",
    "betha",
    "jor",
    "kashi",
    "bomi",
    "matha",
    "pet",
    "buk",
    "chokh",
    "ghum",
    "somossa",
    "somossha",
    "hocche",
    "hoitese",
    "lagche",
    "dhore",
  ];

  return banglishSignals.some((item) => q.includes(item)) ? "banglish" : "en";
}


function shouldCarryRecentSymptomHistory(value: string) {
  const q = normalizeConversationalText(value).toLowerCase().trim();

  if (!q || q.length > 140) return false;

  const followUpPatterns = [
    /^(আর|আরও|এছাড়া|এছাড়াও|সাথে|তার সাথে|এখন|আজ|কাল থেকে|গতকাল থেকে|হ্যাঁ|না)\b/i,
    /^(also|and|plus|now|yes|no|since|for)\b/i,
    /^(aro|ar|sathe|ekhon|aj|kal theke|hya|na)\b/i,
    /^\d+\s*(din|day|days|week|weeks|mas|month|months|ghonta|hour|hours)\b/i,
    /\b(o hocche|o ache|also|too|aro ache|aro hocche|same problem|ager moto|eita|eta|oi ta)\b/i,
    /(ও হচ্ছে|ও আছে|আরও হচ্ছে|আরও আছে|একই সমস্যা|আগের মতো)/i,
  ];

  return followUpPatterns.some((pattern) => pattern.test(q));
}

function hasEmergencySignals(value: string) {
  const q = normalizeConversationalText(value);

  return [
    // Breathing / choking / severe allergic reaction
    /\b(can(?:not|'t) breathe|unable to breathe|not breathing|gasping for breath|severe difficulty breathing)\b/i,
    /\b(choking.{0,20}(cannot|can't|unable).{0,10}breathe|blue lips.{0,20}breath)\b/i,
    /\b(throat swelling.{0,24}breath|tongue swelling.{0,24}breath|anaphylaxis)\b/i,
    /শ্বাস.{0,18}(বন্ধ|কষ্ট|নিতে পারছি না|নিতে সমস্যা)/i,
    /(গলা|জিহ্বা).{0,14}ফুলে.{0,18}শ্বাসকষ্ট/i,
    /ঠোঁট.{0,12}নীল.{0,18}শ্বাস/i,
    /\b(shash|sas|dom).{0,20}(bondho|nite parchi na|kosto)\b/i,
    /\b(gola|jihba).{0,14}fule.{0,18}shash/i,

    // Chest pain / possible cardiac emergency
    /\b(severe chest pain|crushing chest pain|chest pressure|chest pain.{0,24}(sweating|breath|faint))\b/i,
    /বুকে.{0,16}(তীব্র ব্যথা|চাপ).{0,24}(শ্বাস|ঘাম|অজ্ঞান)?/i,
    /\bbuk(?:e)?\s+(?:e\s+)?(?:tibro\s+)?betha.{0,22}(shash|gham|ojnan)?\b/i,

    // Stroke / sudden neurologic deficit
    /\b(face droop|one sided weakness|one-sided weakness|slurred speech|sudden weakness on one side|sudden vision loss.{0,20}weakness)\b/i,
    /মুখ.{0,12}বেঁকে|এক পাশ.{0,12}(দুর্বল|অবশ)|কথা.{0,12}জড়িয়ে/i,
    /\b(mukh beke|ek pashe (?:durbol|obosh)|kotha joriye).{0,28}/i,

    // Consciousness / seizure
    /\b(unconscious|not waking up|unresponsive|fainted.{0,16}not waking)\b/i,
    /\b(seizure.{0,24}(5 minutes|five minutes|not stopping)|continuous seizure|repeated seizure.{0,24}no recovery)\b/i,
    /অজ্ঞান|জ্ঞান নেই|খিঁচুনি.{0,18}(থামছে না|৫ মিনিট|পাঁচ মিনিট)/i,
    /\b(ojnan|gian nai|khichuni.{0,18}(thamche na|5 minute|pach minute))\b/i,

    // Major bleeding / head injury / internal bleeding
    /\b(severe bleeding|uncontrolled bleeding|heavy bleeding.{0,18}(won't|will not|not) stop|vomiting blood|blood vomit)\b/i,
    /\b(head bleeding|bleeding from head|head injury.{0,20}(bleeding|unconscious)|severe head injury)\b/i,
    /রক্ত.{0,16}(বন্ধ হচ্ছে না|অনেক|বমি)|বমি.{0,10}রক্ত/i,
    /মাথা.{0,14}(থেকে|দিয়ে|কেটে).{0,14}রক্ত/i,
    /\b(matha.{0,14}(diye|theke|kete).{0,14}rokto|rokto bondho hocche na|bomi te rokto)\b/i,

    // Poisoning / overdose / severe burn / electrical injury / drowning
    /\b(poisoning|poison swallowed|medicine overdose|drug overdose|severe burn|electric shock.{0,20}unconscious|drowning.{0,20}not breathing)\b/i,
    /বিষ.{0,12}খেয়েছে|ওষুধ.{0,14}বেশি.{0,10}খেয়েছে|গুরুতর.{0,10}পোড়া|বিদ্যুৎস্পৃষ্ট.{0,14}অজ্ঞান/i,
    /\b(bish kheyeche|oshudh beshi kheyeche|agun e onek pure|current lege ojnan)\b/i,

    // Pregnancy / postpartum emergencies
    /\b(pregnan(?:t|cy).{0,24}(heavy bleeding|seizure|fainting)|delivery.{0,20}heavy bleeding)\b/i,
    /গর্ভাবস্থায়.{0,20}(অতিরিক্ত রক্তপাত|খিঁচুনি)|প্রসবের পর.{0,18}অতিরিক্ত রক্তপাত/i,
    /\b(pregnan(?:t|cy).{0,20}(onek rokto|khichuni)|delivery.{0,18}onek rokto)\b/i,
  ].some((pattern) => pattern.test(q));
}

function locationText(category: Category, row: Row) {
  if (category === "doctor" || category === "caregiver") {
    return [
      text(row.location),
      text(row.area),
      text(row.district),
      text(row.chamber_address),
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (category === "hospital" || category === "lab-test") {
    return [text(row.location), text(row.address)].filter(Boolean).join(" ");
  }

  if (category === "ambulance") {
    return [
      text(row.location),
      text(row.city),
      text(row.address),
      text(row.hospital_name),
      text(row.coverage),
    ]
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function filterByLocation(category: Category, rows: Row[], location: string) {
  if (!location || category === "medicine") return rows;

  const needle = normalize(location);

  return rows.filter((row) => {
    const haystack = normalize(locationText(category, row));
    return (
      haystack.includes(needle) ||
      (category === "ambulance" && haystack.includes("dhaka citywide"))
    );
  });
}

async function searchDirectory(
  db: Awaited<ReturnType<typeof supabase>>,
  category: Category,
  q: string,
  location: string,
) {
  const entity = entityByCategory[category];

  const filtered = await db.rpc("search_directory_filtered", {
    entity,
    q: q.slice(0, 160),
    location_filter: category === "medicine" ? "" : location,
    page_number: 1,
  });

  if (!filtered.error) {
    return (filtered.data || []) as Row[];
  }

  const fallback = await db.rpc("search_directory", {
    entity,
    q: q.slice(0, 160),
    page_number: 1,
  });

  if (fallback.error) {
    console.error("Assistant directory search failed", {
      filtered: filtered.error.message,
      fallback: fallback.error.message,
    });

    throw new Error("Search is temporarily unavailable. Please try again.");
  }

  return filterByLocation(
    category,
    (fallback.data || []) as Row[],
    location,
  );
}

async function emergencyResources(
  db: Awaited<ReturnType<typeof supabase>>,
  location: string,
) {
  const dedupe = (rows: Row[]) => {
    const seen = new Set<string>();
    return rows.filter((row) => {
      const id = String(row.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  let hospitals = await searchDirectory(db, "hospital", "", location);
  let ambulances = await searchDirectory(db, "ambulance", "", location);
  let matchedArea = location;

  if (location && (hospitals.length < 3 || ambulances.length < 3)) {
    const { data: fallback } = await db
      .from("healthcare_area_fallbacks")
      .select("canonical_area,nearby_areas")
      .eq("area", location)
      .maybeSingle();

    const nearby = [
      text(fallback?.canonical_area),
      ...((Array.isArray(fallback?.nearby_areas)
        ? fallback.nearby_areas
        : []) as string[]),
    ]
      .filter(Boolean)
      .filter((area, index, all) => all.indexOf(area) === index)
      .filter((area) => normalize(area) !== normalize(location))
      .slice(0, 4);

    for (const area of nearby) {
      if (hospitals.length < 3) {
        hospitals = dedupe([
          ...hospitals,
          ...(await searchDirectory(db, "hospital", "", area)),
        ]);
      }

      if (ambulances.length < 3) {
        ambulances = dedupe([
          ...ambulances,
          ...(await searchDirectory(db, "ambulance", "", area)),
        ]);
      }

      if ((hospitals.length >= 3 || ambulances.length >= 3) && !matchedArea) {
        matchedArea = area;
      }

      if (hospitals.length >= 3 && ambulances.length >= 3) break;
    }
  }

  // If the directory has no area-specific rows, still show verified emergency
  // options rather than leaving an urgent user with an empty screen.
  if (hospitals.length === 0) {
    hospitals = await searchDirectory(db, "hospital", "", "");
  }

  if (ambulances.length === 0) {
    ambulances = await searchDirectory(db, "ambulance", "", "");
  }

  return {
    hospitals: dedupe(hospitals).slice(0, 4),
    ambulances: dedupe(ambulances).slice(0, 4),
    matchedArea,
  };
}

async function resolveDoctorTriage(
  db: Awaited<ReturnType<typeof supabase>>,
  query: string,
): Promise<DoctorTriage> {
  const { data, error } = await db.rpc("resolve_doctor_triage_multi", {
    query_text: query.slice(-500),
  });

  if (error) {
    console.error("Doctor triage resolver unavailable", error.message);
    return emptyTriage;
  }

  if (!data || typeof data !== "object") return emptyTriage;

  const raw = data as Partial<DoctorTriage>;

  return {
    urgent: Boolean(raw.urgent),
    emergency_notice:
      typeof raw.emergency_notice === "string" ? raw.emergency_notice : null,
    patient_guidance:
      typeof raw.patient_guidance === "string" ? raw.patient_guidance : null,
    primary_specialty_id:
      typeof raw.primary_specialty_id === "string"
        ? raw.primary_specialty_id
        : null,
    primary_specialty_name:
      typeof raw.primary_specialty_name === "string"
        ? raw.primary_specialty_name
        : null,
    suggestions: Array.isArray(raw.suggestions)
      ? (raw.suggestions as TriageSuggestion[]).slice(0, 3)
      : [],
  };
}

function resultFor(category: Category, row: Row): SearchResult {
  if (category === "doctor") {
    return {
      id: row.id,
      title: text(row.full_name) || "Doctor",
      subtitle: text(row.specialization) || undefined,
      details: compact([
        detail("Qualification", row.qualification),
        detail("Hospital", row.hospital_name || row.chamber_name),
        detail("Experience", row.experience ? `${row.experience} years` : ""),
        detail("Location", row.area || row.location),
        detail(
          "Consultation fee",
          row.consultation_fee ? `৳${row.consultation_fee}` : "",
        ),
      ]),
      href: `/doctors/${row.id}`,
    };
  }

  if (category === "medicine") {
    return {
      id: row.id,
      title: text(row.name) || "Medicine",
      subtitle:
        [text(row.generic), text(row.strength)].filter(Boolean).join(" · ") ||
        undefined,
      details: [],
      href: `/medicines/${row.id}`,
    };
  }

  if (category === "hospital") {
    return {
      id: row.id,
      title: text(row.name) || "Hospital",
      subtitle: text(row.departments) || undefined,
      details: compact([
        detail("Location", row.location),
        detail("Address", row.address),
      ]),
      phone: text(row.phone) || undefined,
      secondaryPhone: text(row.emergency_phone) || undefined,
      href: `/hospitals/${row.id}`,
    };
  }

  if (category === "lab-test") {
    return {
      id: row.id,
      title: text(row.test_name) || "Lab test",
      subtitle: text(row.laboratory_name) || undefined,
      details: compact([
        detail("Price", row.price ? `৳${row.price}` : ""),
        detail("Location", row.location),
      ]),
      phone: text(row.contact) || undefined,
    };
  }

  if (category === "caregiver") {
    return {
      id: row.id,
      title: text(row.full_name) || "Caregiver",
      subtitle: text(row.qualification) || undefined,
      details: compact([
        detail("Services", row.services),
        detail("Experience", row.experience ? `${row.experience} years` : ""),
        detail("Location", row.location),
        detail("Daily fee", row.fee_per_day ? `৳${row.fee_per_day}` : ""),
      ]),
    };
  }

  return {
    id: row.id,
    title: text(row.service_name) || "Ambulance service",
    subtitle: text(row.ambulance_type) || undefined,
    details: compact([
      detail("Location", row.location || row.city),
      detail("Hospital", row.hospital_name),
      detail("Availability", row.availability),
      detail("Coverage", row.coverage),
    ]),
    phone: text(row.driver_phone) || undefined,
    secondaryPhone: text(row.alternate_phone) || undefined,
  };
}

function humanReply({
  language,
  requestedCategory,
  category,
  urgent,
  triage,
  resultCount,
  location,
  usedNearby,
  matchedArea,
}: {
  language: ConversationLanguage;
  requestedCategory: Category;
  category: Category;
  urgent: boolean;
  triage: DoctorTriage | null;
  resultCount: number;
  location: string;
  usedNearby: boolean;
  matchedArea: string;
}) {
  if (urgent) {
    const notice = triage?.emergency_notice?.trim();

    if (language === "bn") {
      return [
        "আপনার বর্ণনায় এমন কিছু লক্ষণ আছে যেগুলোর জন্য দ্রুত সরাসরি চিকিৎসা নেওয়া নিরাপদ।",
        notice || "এখনই নিকটস্থ জরুরি বিভাগে যান বা জরুরি সহায়তা নিন।",
        "অ্যাম্বুলেন্স বা জাতীয় জরুরি সহায়তা দরকার হলে বাংলাদেশে ৯৯৯-এ কল করুন।",
        location
          ? `${location} ও কাছাকাছি এলাকার জরুরি হাসপাতাল এবং অ্যাম্বুলেন্স অপশন নিচে দেখানো হচ্ছে।`
          : "নিচে জরুরি হাসপাতাল ও অ্যাম্বুলেন্স অপশন দেখানো হচ্ছে। Location বেছে নিলে কাছাকাছি ফলাফল আরও নির্দিষ্ট হবে।",
        "শুধু অনলাইন উত্তর বা সাধারণ ডাক্তার সার্চের জন্য অপেক্ষা করবেন না।",
      ].join(" ");
    }

    if (language === "banglish") {
      return [
        "Apnar description-e emon symptom ache jeta urgent hote pare.",
        notice || "Ekhon nearest emergency department-e jawa ba emergency help neya safer.",
        "Ambulance ba national emergency help dorkar hole Bangladesh-e 999-e call korun.",
        location
          ? `${location} ebong kacher area-r emergency hospital o ambulance option niche dekhacchi.`
          : "Niche emergency hospital o ambulance option dekhacchi. Location select korle kacher result aro specific hobe.",
        "Sudhu online answer-er jonno wait korben na.",
      ].join(" ");
    }

    return [
      "Some of the symptoms you described may need urgent in-person assessment.",
      notice || "Please seek the nearest emergency department or emergency help now.",
      "For an ambulance or national emergency assistance in Bangladesh, call 999.",
      location
        ? `Emergency hospitals and ambulance options for ${location} and nearby areas are shown below.`
        : "Emergency hospital and ambulance options are shown below. Choose a location to narrow them to your area.",
      "Do not wait for an online answer if the symptoms are severe or worsening.",
    ].join(" ");
  }

  if (requestedCategory === "doctor") {
    const specialty = triage?.primary_specialty_name?.trim();

    if (specialty) {
      const alternatives = (triage?.suggestions || [])
        .map((item) => item.specialty_name)
        .filter((item) => item && item !== specialty)
        .slice(0, 2);

      if (language === "bn") {
        return [
          `আপনার লেখা উপসর্গ অনুযায়ী ${specialty} দেখানো সবচেয়ে relevant হতে পারে।`,
          "প্রথমে এই ধরনের ডাক্তার দেখানো একটি যুক্তিসংগত next step হতে পারে।",
          alternatives.length
            ? `আরও সম্ভাব্য specialist: ${alternatives.join(", ")}।`
            : "",
          triage?.patient_guidance || "",
          resultCount
            ? usedNearby && matchedArea
              ? `${location}-এ এই specialist-এর exact match পাইনি। কাছের ${matchedArea} এলাকার ${resultCount} জন matching doctor দেখাচ্ছি।`
              : `নিচে Healthcare Central-এর ${resultCount} জন matching doctor দেখাচ্ছি${location ? ` (${location})` : ""}।`
            : "এই specialty-তে এখন matching doctor না থাকলে directory থেকে specialty দিয়ে খুঁজতে পারেন।",
          "এটি diagnosis নয়—লক্ষণ বদলালে বা খারাপ হলে সরাসরি চিকিৎসা নিন।",
        ]
          .filter(Boolean)
          .join(" ");
      }

      if (language === "banglish") {
        return [
          `Apnar lekha symptom-gulo onujayi ${specialty} dekhano shobcheye relevant hote pare.`,
          "Prothome ei type-er doctor dekhano reasonable next step hote pare.",
          alternatives.length
            ? `Onno possible specialist: ${alternatives.join(", ")}.`
            : "",
          triage?.patient_guidance || "",
          resultCount
            ? usedNearby && matchedArea
              ? `${location}-e ei specialist-er exact match paini. Kacher ${matchedArea} area-r ${resultCount} jon matching doctor dekhacchi.`
              : `Niche Healthcare Central-er ${resultCount} jon matching doctor dekhacchi${location ? ` (${location})` : ""}.`
            : "Ekhon matching doctor na thakle specialty diye directory-te search korte paren.",
          "Eta diagnosis na; symptom beshi kharap hole in-person medical care nin.",
        ]
          .filter(Boolean)
          .join(" ");
      }

      return [
        `Based on the symptoms you described, ${specialty} is the most relevant specialty to consider.`,
        "Seeing this type of specialist first would be a reasonable next step.",
        alternatives.length
          ? `Other possible specialist routes: ${alternatives.join(", ")}.`
          : "",
        triage?.patient_guidance || "",
        resultCount
          ? usedNearby && matchedArea
            ? `I could not find an exact ${location} match for this specialist, so I am showing ${resultCount} matching doctor${resultCount === 1 ? "" : "s"} from nearby ${matchedArea}.`
            : `I found ${resultCount} matching Healthcare Central doctor${resultCount === 1 ? "" : "s"}${location ? ` in ${location}` : ""} below.`
          : "There is no matching listed doctor in this specialty right now, but you can open the directory and search by specialty.",
        "This is symptom-to-specialist guidance, not a diagnosis.",
      ]
        .filter(Boolean)
        .join(" ");
    }

    if (resultCount > 0) {
      if (language === "bn") {
        return usedNearby && matchedArea
          ? `${location}-এ exact matching doctor না থাকায় কাছের ${matchedArea} এলাকার doctor দেখাচ্ছি। যদি উপসর্গ থেকে specialist জানতে চান, সমস্যাটা নিজের ভাষায় লিখুন।`
          : "আপনার search অনুযায়ী matching doctor পেয়েছি। নিচে সবচেয়ে relevant doctorগুলো দেখুন। যদি আসলে উপসর্গ থেকে কোন specialist দরকার সেটা জানতে চান, তাহলে সমস্যাটা নিজের ভাষায় লিখুন।";
      }

      if (language === "banglish") {
        return usedNearby && matchedArea
          ? `${location}-e exact matching doctor na thakay kacher ${matchedArea} area-r doctor dekhacchi. Symptom theke specialist jante chaile problem-ta nijer vashay likhun.`
          : "Apnar search onujayi matching doctor peyechi. Niche relevant doctor-gulo dekhun. Jodi symptom theke kon specialist dorkar seta jante chan, tahole problem-ta nijer vashay likhun.";
      }

      return usedNearby && matchedArea
        ? `There was no exact matching doctor in ${location}, so I am showing the closest matches from ${matchedArea}. If you want symptom-based specialist guidance, describe what is happening in your own words.`
        : "I found matching doctors for your search. The closest results are below. If you want symptom-based specialist guidance instead, describe what is happening in your own words.";
    }

    if (language === "bn") {
      return "আপনার কথায় এখনো নির্দিষ্ট specialist বেছে নেওয়ার মতো পরিষ্কার উপসর্গ পাওয়া যাচ্ছে না। কী সমস্যা হচ্ছে, শরীরের কোথায়, কতদিন ধরে, ব্যথা/জ্বর/বমি/শ্বাসকষ্ট আছে কি না—এগুলো একসাথে লিখুন। তারপর আমি কোন ধরনের ডাক্তার দেখানো উচিত সেটা মিলিয়ে বলব।";
    }

    if (language === "banglish") {
      return "Ekhono specific specialist choose korar moto clear symptom pacchi na. Ki problem hocche, body-r kothay, koto din dhore, betha/jor/bomi/shashkosto ache kina—egulo ekshathe likhun. Tarpor kon type-er doctor dekhano uchit seta match kore bolbo.";
    }

    return "I do not have enough symptom detail yet to choose a specialist safely. Tell me what is happening, where in your body, how long it has been going on, and whether you have pain, fever, vomiting, breathing trouble, weakness, or another important symptom. Then I can route you to the most relevant type of doctor.";
  }

  const label = categoryTitle[category].toLowerCase();

  if (language === "bn") {
    return resultCount
      ? `আপনার কথার সাথে মিলিয়ে ${resultCount}টি ${label} result পেয়েছি${location ? ` (${location})` : ""}। নিচে সবচেয়ে relevantগুলো দেখুন।`
      : "এই কথার সাথে matching result পাইনি। নাম, সেবা বা জায়গাটা আরেকটু নির্দিষ্ট করে লিখুন।";
  }

  if (language === "banglish") {
    return resultCount
      ? `Apnar query-r sathe ${resultCount}ta ${label} result peyechi${location ? ` (${location})` : ""}. Niche relevant result-gulo dekhun.`
      : "Matching result pacchi na. Naam, service ba location-ta ektu specific kore likhun.";
  }

  return resultCount
    ? `I found ${resultCount} relevant ${label} result${resultCount === 1 ? "" : "s"}${location ? ` in ${location}` : ""}. The closest matches are below.`
    : "I could not find a matching result. Try giving me a more specific name, service, or location.";
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in to use Healthcare Central Assistant." },
        { status: 401 },
      );
    }

    if (user.status !== "Active" || !["patient", "admin"].includes(user.role)) {
      return NextResponse.json(
        { error: "This account cannot use the Assistant." },
        { status: 403 },
      );
    }

    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid message." },
        { status: 400 },
      );
    }

    const selectedLocation = canonicalLocation(parsed.data.location);

    if (parsed.data.location && !selectedLocation) {
      return NextResponse.json(
        { error: "Choose a location from the list." },
        { status: 400 },
      );
    }

    const db = await supabase();
    const originalQuery = parsed.data.message.trim();
    const requestedCategory = parsed.data.category;
    const normalizedCurrent = normalizeConversationalText(originalQuery);
    const carryHistory = shouldCarryRecentSymptomHistory(originalQuery);
    const userHistory = carryHistory
      ? parsed.data.history
          .filter((item) => item.role === "user")
          .slice(-2)
          .map((item) => normalizeConversationalText(item.content))
      : [];
    const conversationQuery = [...userHistory, normalizedCurrent]
      .filter(Boolean)
      .join(" ")
      .slice(-500);
    const language = detectLanguage(originalQuery);

    let triage: DoctorTriage | null = null;
    let urgent = hasEmergencySignals(conversationQuery);

    if (requestedCategory === "doctor") {
      triage = await resolveDoctorTriage(db, conversationQuery);
      urgent = urgent || triage.urgent;
    }

    const category: Category = urgent ? "hospital" : requestedCategory;

    let searchTerm = normalizedCurrent.slice(0, 160);
    let context = "";

    if (
      requestedCategory === "doctor" &&
      triage?.primary_specialty_name &&
      !urgent
    ) {
      searchTerm = triage.primary_specialty_name;
      context = `Suggested specialist: ${triage.primary_specialty_name}`;
    }

    if (urgent) {
      searchTerm = "";
      context =
        triage?.emergency_notice || "Urgent medical assessment may be needed";
    }

    let rows: Row[] = [];
    let emergencyAmbulanceRows: Row[] = [];
    let emergencyMatchedArea = selectedLocation;

    if (urgent) {
      const emergency = await emergencyResources(db, selectedLocation);
      rows = emergency.hospitals;
      emergencyAmbulanceRows = emergency.ambulances;
      emergencyMatchedArea = emergency.matchedArea;
    } else {
      rows = await searchDirectory(
        db,
        category,
        searchTerm,
        selectedLocation,
      );
    }

    if (
      rows.length === 0 &&
      requestedCategory === "doctor" &&
      !urgent &&
      !triage?.primary_specialty_name
    ) {
      rows = await searchDirectory(
        db,
        category,
        normalizedCurrent.slice(0, 160),
        selectedLocation,
      );
    }

    const usedNearby =
      category === "doctor" &&
      rows.length > 0 &&
      Boolean(rows[0]._nearby_fallback);
    const matchedArea =
      category === "doctor" && rows.length > 0
        ? text(rows[0]._matched_area)
        : "";

    if (usedNearby && matchedArea) {
      context = [context, `Nearest available area: ${matchedArea}`]
        .filter(Boolean)
        .join(" · ");
    }

    const results = rows.slice(0, 6).map((row) => resultFor(category, row));
    const emergencyHospitals = urgent ? results.slice(0, 4) : [];
    const emergencyAmbulances = urgent
      ? emergencyAmbulanceRows
          .slice(0, 4)
          .map((row) => resultFor("ambulance", row))
      : [];

    const params = new URLSearchParams();

    if (searchTerm) params.set("q", searchTerm);

    if (selectedLocation && category !== "medicine") {
      params.set("location", selectedLocation);
    }

    const directoryUrl = `${pathByCategory[category]}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const reply = humanReply({
      language,
      requestedCategory,
      category,
      urgent,
      triage,
      resultCount: results.length,
      location: selectedLocation,
      usedNearby,
      matchedArea,
    });

    const chatDb = adminClient();
    const { error: chatSaveError } = await chatDb
      .from("assistant_messages")
      .insert([
        {
          user_id: user.id,
          role: "user",
          content: originalQuery,
          category: requestedCategory,
          requested_category: requestedCategory,
          location: selectedLocation || null,
          urgent,
          metadata: { source: "healthcare-assistant" },
        },
        {
          user_id: user.id,
          role: "assistant",
          content: reply,
          category,
          requested_category: requestedCategory,
          location: selectedLocation || null,
          urgent,
          metadata: {
            context,
            usedNearby,
            matchedArea,
            emergencyMatchedArea,
            emergencyHospitalCount: emergencyHospitals.length,
            emergencyAmbulanceCount: emergencyAmbulances.length,
            primarySpecialty: triage?.primary_specialty_name || null,
          },
        },
      ]);

    if (chatSaveError) {
      console.error("Assistant chat history save failed", chatSaveError);
    }

    return NextResponse.json(
      {
        category,
        requestedCategory,
        location: selectedLocation,
        urgent,
        title: categoryTitle[category],
        context,
        reply,
        triage,
        usedNearby,
        matchedArea,
        results,
        emergencyNumber: urgent ? "999" : null,
        emergencyHospitals,
        emergencyAmbulances,
        emergencyMatchedArea,
        directoryUrl,
        directoryLabel: `View all ${categoryTitle[category].toLowerCase()}`,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Healthcare Central Assistant error", error);

    return NextResponse.json(
      {
        error: "Search is temporarily unavailable. Please try again.",
      },
      { status: 503 },
    );
  }
}
