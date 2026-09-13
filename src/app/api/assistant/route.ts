import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
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

const requestSchema = z
  .object({
    message: z.string().trim().min(1).max(160),
    category: categorySchema,
    location: z.string().trim().max(100),
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

type AliasRule = {
  phrases: string[];
  canonical: string;
  specialtyHint?: string;
};

const doctorAliases: AliasRule[] = [
  {
    phrases: [
      "matha betha",
      "matha byatha",
      "matha bethaa",
      "mtha betha",
      "মাথা ব্যথা",
      "মাথাব্যথা",
      "head ache",
      "hedache",
      "headache",
    ],
    canonical: "headache",
    specialtyHint: "neuro",
  },
  {
    phrases: [
      "dater betha",
      "datar betha",
      "dat betha",
      "dant betha",
      "দাঁতের ব্যথা",
      "দাতের ব্যথা",
      "tooth ache",
      "tooth pain",
    ],
    canonical: "tooth pain",
    specialtyHint: "dent",
  },
  {
    phrases: [
      "heart doctor",
      "heart er doctor",
      "cardiac doctor",
      "হার্ট ডাক্তার",
      "হৃদরোগ ডাক্তার",
    ],
    canonical: "cardiology",
    specialtyHint: "cardio",
  },
  {
    phrases: [
      "skin doctor",
      "skin er doctor",
      "চর্ম ডাক্তার",
      "চামড়ার ডাক্তার",
      "dermatologist",
    ],
    canonical: "dermatology",
    specialtyHint: "derma",
  },
  {
    phrases: [
      "eye doctor",
      "chokher doctor",
      "chokh doctor",
      "চোখের ডাক্তার",
      "ophthalmologist",
    ],
    canonical: "ophthalmology",
    specialtyHint: "ophthal",
  },
  {
    phrases: [
      "child doctor",
      "bacchar doctor",
      "baby doctor",
      "শিশু ডাক্তার",
      "বাচ্চার ডাক্তার",
      "pediatrician",
    ],
    canonical: "pediatrics",
    specialtyHint: "pedia",
  },
  {
    phrases: [
      "bone doctor",
      "joint pain doctor",
      "haddi doctor",
      "হার ডাক্তার",
      "হাড়ের ডাক্তার",
      "orthopedic",
      "orthopaedic",
    ],
    canonical: "orthopedics",
    specialtyHint: "ortho",
  },
  {
    phrases: [
      "women doctor",
      "gynae doctor",
      "gyne doctor",
      "মহিলা ডাক্তার",
      "গাইনি ডাক্তার",
      "gynecologist",
      "gynaecologist",
    ],
    canonical: "gynecology",
    specialtyHint: "gyn",
  },
  {
    phrases: [
      "ear nose throat",
      "ent doctor",
      "kan nak gola",
      "কান নাক গলা",
      "কান নাক গলার ডাক্তার",
    ],
    canonical: "ENT",
    specialtyHint: "ent",
  },
  {
    phrases: [
      "mental health doctor",
      "psychiatrist",
      "moner doctor",
      "মনের ডাক্তার",
      "মানসিক ডাক্তার",
    ],
    canonical: "psychiatry",
    specialtyHint: "psych",
  },
];

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
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];

    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }

    for (let j = 0; j < current.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function similarity(a: string, b: string) {
  const left = normalize(a);
  const right = normalize(b);

  if (!left || !right) return 0;
  if (left === right) return 1;

  const longest = Math.max(left.length, right.length);
  return 1 - levenshtein(left, right) / longest;
}

function phraseScore(query: string, phrase: string) {
  const normalizedQuery = normalize(query);
  const normalizedPhrase = normalize(phrase);

  if (
    normalizedQuery === normalizedPhrase ||
    normalizedQuery.includes(normalizedPhrase)
  ) {
    return 1;
  }

  const queryWords = normalizedQuery.split(" ").filter(Boolean);
  const phraseWords = normalizedPhrase.split(" ").filter(Boolean);
  const windowSize = phraseWords.length;

  if (!windowSize || !queryWords.length) return 0;

  let best = similarity(normalizedQuery, normalizedPhrase);

  for (let start = 0; start <= queryWords.length - windowSize; start += 1) {
    const window = queryWords.slice(start, start + windowSize).join(" ");
    best = Math.max(best, similarity(window, normalizedPhrase));
  }

  return best;
}

function resolveDoctorAlias(query: string) {
  let best:
    | {
        rule: AliasRule;
        score: number;
      }
    | undefined;

  for (const rule of doctorAliases) {
    for (const phrase of rule.phrases) {
      const score = phraseScore(query, phrase);

      if (!best || score > best.score) {
        best = { rule, score };
      }
    }
  }

  return best && best.score >= 0.72 ? best.rule : null;
}

function hasEmergencySignals(value: string) {
  return [
    /\b(can(?:not|'t) breathe|unable to breathe|severe difficulty breathing)\b/i,
    /\b(severe chest pain|crushing chest pain|chest pressure)\b/i,
    /\b(unconscious|not waking up|unresponsive)\b/i,
    /\b(severe bleeding|bleeding won(?:'t| not) stop)\b/i,
    /শ্বাস.{0,12}(কষ্ট|নিতে পারছি না|নিতে সমস্যা)/i,
    /বুকে.{0,12}(তীব্র ব্যথা|চাপ)/i,
    /অজ্ঞান|জ্ঞান নেই/i,
    /\bshash.{0,15}(kosto|nite parchi na|problem)\b/i,
    /\bbuke.{0,12}(tibro betha|onek beshi betha|chap)\b/i,
  ].some((pattern) => pattern.test(value));
}

function locationText(category: Category, row: Row) {
  if (category === "doctor" || category === "caregiver") {
    return text(row.location);
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
    ]
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function filterByLocation(category: Category, rows: Row[], location: string) {
  if (!location || category === "medicine") return rows;

  const needle = normalize(location);

  return rows.filter((row) =>
    normalize(locationText(category, row)).includes(needle),
  );
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
    q,
    location_filter: category === "medicine" ? "" : location,
    page_number: 1,
  });

  if (!filtered.error) {
    return (filtered.data || []) as Row[];
  }

  const fallback = await db.rpc("search_directory", {
    entity,
    q,
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

async function resolveSpecialtySearch(
  db: Awaited<ReturnType<typeof supabase>>,
  rule: AliasRule | null,
) {
  if (!rule?.specialtyHint) {
    return {
      searchTerm: rule?.canonical || "",
      context: rule?.canonical || "",
    };
  }

  const { data, error } = await db
    .from("specialties")
    .select("name")
    .ilike("name", `%${rule.specialtyHint}%`)
    .order("name")
    .limit(1);

  if (!error && data?.[0]?.name) {
    return {
      searchTerm: String(data[0].name),
      context: String(data[0].name),
    };
  }

  return {
    searchTerm: rule.canonical,
    context: rule.canonical,
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
        detail("Experience", row.experience ? `${row.experience} years` : ""),
        detail("Location", row.location),
        detail(
          "Consultation fee",
          row.consultation_fee ? `৳${row.consultation_fee}` : "",
        ),
      ]),
      phone: text(row.phone) || undefined,
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
      phone: text(row.phone) || undefined,
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
    ]),
    phone: text(row.driver_phone) || undefined,
  };
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
        { error: "Enter a valid search." },
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
    const urgent = hasEmergencySignals(parsed.data.message);
    const category: Category = urgent ? "hospital" : parsed.data.category;

    let searchTerm = parsed.data.message.trim();
    let context = "";

    if (category === "doctor") {
      const alias = resolveDoctorAlias(parsed.data.message);

      if (alias) {
        const resolved = await resolveSpecialtySearch(db, alias);
        searchTerm = resolved.searchTerm;
        context = resolved.context;
      }
    }

    if (urgent) {
      searchTerm = "";
      context = "Urgent care";
    }

    let rows = await searchDirectory(
      db,
      category,
      searchTerm,
      selectedLocation,
    );

    // If normalization was too specific, retry the user's original wording.
    if (
      rows.length === 0 &&
      searchTerm !== parsed.data.message.trim() &&
      !urgent
    ) {
      rows = await searchDirectory(
        db,
        category,
        parsed.data.message.trim(),
        selectedLocation,
      );
    }

    const results = rows.slice(0, 6).map((row) => resultFor(category, row));

    const params = new URLSearchParams();

    if (searchTerm) params.set("q", searchTerm);

    if (selectedLocation && category !== "medicine") {
      params.set("location", selectedLocation);
    }

    const directoryUrl = `${pathByCategory[category]}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    return NextResponse.json(
      {
        category,
        location: selectedLocation,
        urgent,
        title: categoryTitle[category],
        context,
        results,
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
