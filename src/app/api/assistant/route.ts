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

const labelByCategory: Record<Category, string> = {
  doctor: "doctors",
  medicine: "medicines",
  hospital: "hospitals",
  "lab-test": "lab tests",
  caregiver: "caregivers",
  ambulance: "ambulance services",
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

function detectLanguage(value: string) {
  const hasBangla = /[ঀ-৿]/.test(value);
  const hasLatin = /[A-Za-z]/.test(value);

  if (hasBangla && hasLatin) return "Mixed";
  if (hasBangla) return "Bangla";

  if (hasLatin) {
    const banglishSignals =
      /\b(amar|matha|betha|byatha|datar|dater|chokh|buk|buke|shash|doctor chai|dorkar|kothay|mirpur e)\b/i;
    return banglishSignals.test(value) ? "Banglish" : "English";
  }

  return "Unknown";
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
    /\bbuke.{0,12}(onek betha|tibro betha|chap)\b/i,
  ].some((pattern) => pattern.test(value));
}

function resultFor(
  category: Category,
  row: Row,
  specialtyName: string,
): SearchResult {
  if (category === "doctor") {
    return {
      id: row.id,
      title: text(row.full_name) || "Doctor",
      subtitle: specialtyName || text(row.specialization) || undefined,
      details: compact([
        detail("Qualification", row.qualification),
        detail("Specialization", row.specialization),
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
        detail("Departments", row.departments),
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
        detail("Category", row.category),
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
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in to use the Assistant." },
        { status: 401 },
      );
    }

    if (user.status !== "Active" || !["patient", "admin"].includes(user.role)) {
      return NextResponse.json(
        { error: "The Assistant is available to active accounts." },
        { status: 403 },
      );
    }

    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid Healthcare Central search." },
        { status: 400 },
      );
    }

    const selectedLocation = canonicalLocation(parsed.data.location);

    if (parsed.data.location && !selectedLocation) {
      return NextResponse.json(
        { error: "Choose a location from the available list." },
        { status: 400 },
      );
    }

    const db = await supabase();

    const { data: resolution, error: resolutionError } = await db.rpc(
      "resolve_assistant_query",
      {
        query_text: parsed.data.message,
        category_hint: parsed.data.category,
      },
    );

    if (resolutionError) throw new Error(resolutionError.message);

    const resolved =
      resolution && typeof resolution === "object"
        ? (resolution as {
            canonical_term?: string;
            specialty_id?: string | null;
            specialty_name?: string | null;
          })
        : {};

    const urgent = hasEmergencySignals(parsed.data.message);
    const category: Category = urgent ? "hospital" : parsed.data.category;

    const canonical =
      text(resolved.canonical_term) || parsed.data.message.trim();
    const specialtyId = text(resolved.specialty_id);
    const specialtyName = text(resolved.specialty_name);

    let searchTerm =
      category === "doctor" && specialtyName ? specialtyName : canonical;

    if (urgent && category === "hospital") {
      searchTerm = "";
    }

    const { data: rows, error: searchError } = await db.rpc(
      "assistant_search_directory",
      {
        entity: entityByCategory[category],
        q: searchTerm,
        location_filter: category === "medicine" ? "" : selectedLocation,
        page_number: 1,
      },
    );

    if (searchError) throw new Error(searchError.message);

    const resultRows = ((rows || []) as Row[]).slice(0, 6);

    const results = resultRows.map((row) =>
      resultFor(
        category,
        row,
        category === "doctor" && text(row.specialty_id) === specialtyId
          ? specialtyName
          : "",
      ),
    );

    const params = new URLSearchParams();

    if (searchTerm) params.set("q", searchTerm);

    if (selectedLocation && category !== "medicine") {
      params.set("location", selectedLocation);
    }

    const directoryUrl = `${pathByCategory[category]}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const message = urgent
      ? "Emergency-related results"
      : specialtyName
        ? `Matched to ${specialtyName}`
        : `Search results for ${canonical}`;

    return NextResponse.json(
      {
        category,
        location: selectedLocation,
        urgent,
        message,
        matched: {
          canonical,
          specialty: specialtyName || null,
          language: detectLanguage(parsed.data.message),
        },
        results,
        directoryUrl,
        directoryLabel: `Open all ${labelByCategory[category]}`,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Healthcare Central Assistant is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}
