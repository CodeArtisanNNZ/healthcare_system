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
    message: z.string().trim().min(1).max(500),
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
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasEmergencySignals(value: string) {
  return [
    /\b(can(?:not|'t) breathe|unable to breathe|severe difficulty breathing|not breathing)\b/i,
    /\b(severe chest pain|crushing chest pain|chest pressure)\b/i,
    /\b(unconscious|not waking up|unresponsive)\b/i,
    /\b(severe bleeding|bleeding won(?:'t| not) stop|vomiting blood)\b/i,
    /\b(face droop|one sided weakness|slurred speech)\b/i,
    /শ্বাস.{0,16}(কষ্ট|নিতে পারছি না|নিতে সমস্যা)/i,
    /বুকে.{0,14}(তীব্র ব্যথা|চাপ)/i,
    /অজ্ঞান|জ্ঞান নেই/i,
    /রক্ত.{0,12}(বন্ধ হচ্ছে না|বমি)/i,
    /\bshash.{0,18}(kosto|nite parchi na|problem)\b/i,
    /\bbuke.{0,14}(tibro betha|onek beshi betha|chap)\b/i,
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

async function resolveDoctorTriage(
  db: Awaited<ReturnType<typeof supabase>>,
  query: string,
): Promise<DoctorTriage> {
  const { data, error } = await db.rpc("resolve_doctor_triage_multi", {
    query_text: query,
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
        detail("Experience", row.experience ? `${row.experience} years` : ""),
        detail("Location", row.location),
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
      detail("Coverage", row.coverage),
    ]),
    phone: text(row.driver_phone) || undefined,
    secondaryPhone: text(row.alternate_phone) || undefined,
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
    const originalQuery = parsed.data.message.trim();
    const requestedCategory = parsed.data.category;

    let triage: DoctorTriage | null = null;
    let urgent = hasEmergencySignals(originalQuery);

    if (requestedCategory === "doctor") {
      triage = await resolveDoctorTriage(db, originalQuery);
      urgent = urgent || triage.urgent;
    }

    const category: Category = urgent ? "hospital" : requestedCategory;

    let searchTerm = originalQuery.slice(0, 160);
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
      context = triage?.emergency_notice || "Urgent medical assessment may be needed";
    }

    let rows = await searchDirectory(
      db,
      category,
      searchTerm,
      selectedLocation,
    );

    // For names or ordinary directory searches with no symptom match, retry the
    // original wording. For a recognised symptom route we intentionally keep an
    // empty doctor list rather than showing an unrelated specialty.
    if (
      rows.length === 0 &&
      searchTerm !== originalQuery.slice(0, 160) &&
      !urgent &&
      !triage?.primary_specialty_name
    ) {
      rows = await searchDirectory(
        db,
        category,
        originalQuery.slice(0, 160),
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
        requestedCategory,
        location: selectedLocation,
        urgent,
        title: categoryTitle[category],
        context,
        triage,
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
