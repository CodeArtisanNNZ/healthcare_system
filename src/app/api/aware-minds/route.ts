import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { directory, lookups } from "@/lib/data";
import type { Row } from "@/lib/entities";
import { healthcareLocations } from "@/lib/locations";
import { supabase } from "@/lib/supabase/server";
import { fileUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

const categorySchema = z.enum([
  "doctor",
  "medicine",
  "caregiver",
  "lab-test",
  "ambulance",
  "hospital",
]);

type Category = z.infer<typeof categorySchema>;

const requestSchema = z
  .object({
    message: z.string().trim().max(500),
    category: categorySchema,
    location: z.string().trim().max(100),
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().max(600),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();

const interpretationSchema = z
  .object({
    category: categorySchema,
    language: z.enum(["English", "Bangla", "Banglish", "Mixed", "Unknown"]),
    normalized_query: z.string().max(160),
    search_term: z.string().max(120),
    specialty: z.string().max(120).nullable(),
    symptoms: z.array(z.string().max(80)).max(8),
    inferred_location: z.string().max(100).nullable(),
    urgent: z.boolean(),
    should_search: z.boolean(),
    assistant_message: z.string().max(700),
  })
  .strict();

type Interpretation = z.infer<typeof interpretationSchema>;

type ResultDetail = { label: string; value: string };

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  details: ResultDetail[];
  phone?: string;
  secondaryPhone?: string;
  href?: string;
  imageUrl?: string | null;
};

const entityByCategory: Record<Category, string> = {
  doctor: "doctors",
  medicine: "medicines",
  caregiver: "caregivers",
  "lab-test": "lab_tests",
  ambulance: "ambulances",
  hospital: "hospitals",
};

const directoryByCategory: Record<Category, string> = {
  doctor: "/doctors",
  medicine: "/medicines",
  caregiver: "/caregivers",
  "lab-test": "/lab-tests",
  ambulance: "/emergency",
  hospital: "/hospitals",
};

const labelByCategory: Record<Category, string> = {
  doctor: "doctors",
  medicine: "medicines",
  caregiver: "caregivers",
  "lab-test": "lab tests",
  ambulance: "ambulance services",
  hospital: "hospitals",
};

function clean(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function detail(label: string, value: unknown): ResultDetail | null {
  const text = clean(value);
  return text ? { label, value: text } : null;
}

function compactDetails(items: Array<ResultDetail | null>) {
  return items.filter((item): item is ResultDetail => Boolean(item));
}

function canonicalLocation(value: string | null | undefined) {
  const target = clean(value).toLowerCase();
  if (!target) return "";
  return (
    healthcareLocations.find((location) => location.toLowerCase() === target) || ""
  );
}

function hasEmergencySignals(text: string) {
  const value = text.toLowerCase();
  const patterns = [
    /\b(can(?:not|'t) breathe|unable to breathe|severe difficulty breathing)\b/i,
    /\b(severe chest pain|crushing chest pain|chest pressure)\b/i,
    /\b(unconscious|not waking up|unresponsive)\b/i,
    /\b(severe bleeding|bleeding won(?:'t| not) stop)\b/i,
    /\b(face droop|slurred speech|one[- ]sided weakness)\b/i,
    /শ্বাস.{0,12}(কষ্ট|নিতে পারছি না|নিতে সমস্যা)/i,
    /বুকে.{0,12}(তীব্র ব্যথা|চাপ)/i,
    /অজ্ঞান|জ্ঞান নেই/i,
    /\bshash.{0,15}(kosto|nite parchi na|problem)\b/i,
    /\bbuke.{0,12}(onek betha|tibro betha|chap)\b/i,
  ];
  return patterns.some((pattern) => pattern.test(value));
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as {
    output?: Array<{
      type?: string;
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };
  for (const item of data.output || []) {
    if (item.type !== "message") continue;
    for (const part of item.content || []) {
      if (part.type === "output_text" && typeof part.text === "string") {
        return part.text;
      }
    }
  }
  return "";
}

async function interpretQuery(args: {
  message: string;
  category: Category;
  location: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  specialties: string[];
  symptomMappings: string[];
}): Promise<Interpretation> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Aware Minds AI is not configured. Add OPENAI_API_KEY in your Vercel environment variables.",
    );
  }

  const model = process.env.OPENAI_AWARE_MINDS_MODEL || "gpt-5.4-nano";
  const historyText = args.history.length
    ? args.history
        .map((item) => `${item.role === "user" ? "Patient" : "Aware Minds"}: ${item.content}`)
        .join("\n")
    : "No previous conversation.";

  const instructions = `You are Aware Minds, a healthcare navigation classifier for Healthcare Central in Bangladesh.

Your job is ONLY to understand a patient's natural-language request and turn it into safe structured search intent. The user may write English, বাংলা, Banglish, mixed language, abbreviations, or misspellings.

Critical rules:
- Never diagnose a disease.
- Never prescribe, recommend, or calculate medication doses.
- Never invent a doctor, hospital, medicine, caregiver, ambulance, lab, price, availability, or location.
- You may route symptoms to an appropriate broad medical specialty for navigation, but phrase the patient-facing message as a possibility, not a diagnosis.
- Prefer the UI-selected category unless the patient's text clearly requests a different service.
- If there are red-flag emergency symptoms, set urgent=true and route to hospital, or ambulance when transport is explicitly needed.
- For a doctor request based on symptoms, specialty must be either one exact name from AVAILABLE SPECIALTIES or null.
- search_term must be a short canonical English database search phrase. Correct obvious Bangla/Banglish/misspellings semantically. Examples: "matha betha" -> "headache"; "dater betha" -> "tooth pain". Do not invent medical facts.
- For a generic request such as "show hospitals" or "need ambulance", search_term may be an empty string so the database can list results.
- inferred_location must be one exact value from AVAILABLE LOCATIONS or null. If a location was selected in the UI, do not replace it.
- assistant_message should be concise and should match the user's language style when practical. It should explain what Aware Minds understood and what type of service it will search, without diagnosing.
- should_search=false only when the request is unrelated to healthcare navigation or too unclear to search safely.

AVAILABLE SPECIALTIES:
${args.specialties.length ? args.specialties.join(", ") : "No specialties are configured."}

REVIEWED SYMPTOM ROUTING EXAMPLES FROM THE DATABASE:
${args.symptomMappings.length ? args.symptomMappings.join("; ") : "No reviewed mappings are configured."}

AVAILABLE LOCATIONS:
${healthcareLocations.join(", ")}`;

  const input = `Preferred category selected in the UI: ${args.category}
Selected location: ${args.location || "none"}

Recent conversation:
${historyText}

Current patient message:
${args.message}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      reasoning: { effort: "none" },
      instructions,
      input,
      max_output_tokens: 700,
      text: {
        format: {
          type: "json_schema",
          name: "aware_minds_search_intent",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: {
                type: "string",
                enum: [
                  "doctor",
                  "medicine",
                  "caregiver",
                  "lab-test",
                  "ambulance",
                  "hospital",
                ],
              },
              language: {
                type: "string",
                enum: ["English", "Bangla", "Banglish", "Mixed", "Unknown"],
              },
              normalized_query: { type: "string" },
              search_term: { type: "string" },
              specialty: { type: ["string", "null"] },
              symptoms: {
                type: "array",
                items: { type: "string" },
                maxItems: 8,
              },
              inferred_location: { type: ["string", "null"] },
              urgent: { type: "boolean" },
              should_search: { type: "boolean" },
              assistant_message: { type: "string" },
            },
            required: [
              "category",
              "language",
              "normalized_query",
              "search_term",
              "specialty",
              "symptoms",
              "inferred_location",
              "urgent",
              "should_search",
              "assistant_message",
            ],
          },
        },
      },
    }),
  });

  const payload = (await response.json()) as unknown;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? clean((payload as { error?: { message?: string } }).error?.message)
        : "";
    throw new Error(message || "Aware Minds AI request failed.");
  }

  const text = extractOutputText(payload);
  if (!text) throw new Error("Aware Minds AI returned no usable response.");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new Error("Aware Minds AI returned invalid structured data.");
  }

  const parsed = interpretationSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error("Aware Minds AI returned an unexpected response format.");
  }
  return parsed.data;
}

async function makeResult(
  category: Category,
  row: Row,
  specialtyNames: Map<string, string>,
): Promise<SearchResult> {
  const imageUrl = row.image_path
    ? await fileUrl("directory-images", clean(row.image_path))
    : null;

  if (category === "doctor") {
    return {
      id: row.id,
      title: clean(row.full_name) || "Doctor",
      subtitle:
        specialtyNames.get(clean(row.specialty_id)) || clean(row.specialization),
      details: compactDetails([
        detail("Qualification", row.qualification),
        detail("Specialization", row.specialization),
        detail("Experience", row.experience ? `${row.experience} years` : ""),
        detail("Location", row.location),
        detail(
          "Consultation fee",
          row.consultation_fee ? `৳${row.consultation_fee}` : "",
        ),
        detail("Available", row.available_time),
      ]),
      phone: clean(row.phone) || undefined,
      imageUrl,
    };
  }

  if (category === "medicine") {
    const subtitle = [clean(row.generic), clean(row.strength)]
      .filter(Boolean)
      .join(" · ");
    return {
      id: row.id,
      title: clean(row.name) || "Medicine",
      subtitle: subtitle || undefined,
      details: [],
      href: `/medicines/${row.id}`,
      imageUrl,
    };
  }

  if (category === "caregiver") {
    return {
      id: row.id,
      title: clean(row.full_name) || "Caregiver",
      subtitle: clean(row.qualification) || undefined,
      details: compactDetails([
        detail("Services", row.services),
        detail("Experience", row.experience ? `${row.experience} years` : ""),
        detail("Location", row.location),
        detail("Daily fee", row.fee_per_day ? `৳${row.fee_per_day}` : ""),
        detail("Availability", row.availability),
      ]),
      phone: clean(row.phone) || undefined,
      imageUrl,
    };
  }

  if (category === "lab-test") {
    return {
      id: row.id,
      title: clean(row.test_name) || "Lab test",
      subtitle: clean(row.laboratory_name) || clean(row.category) || undefined,
      details: compactDetails([
        detail("Category", row.category),
        detail("Price", row.price ? `৳${row.price}` : ""),
        detail("Location", row.location),
        detail("Address", row.address),
      ]),
      phone: clean(row.contact) || undefined,
      imageUrl,
    };
  }

  if (category === "ambulance") {
    return {
      id: row.id,
      title: clean(row.service_name) || "Ambulance service",
      subtitle: clean(row.ambulance_type) || undefined,
      details: compactDetails([
        detail("Location", row.location || row.city),
        detail("Hospital", row.hospital_name),
        detail("Availability", row.availability),
        detail("Rate", row.rate ? `৳${row.rate}` : ""),
        detail("Vehicle", row.vehicle_number),
      ]),
      phone: clean(row.driver_phone) || undefined,
      imageUrl,
    };
  }

  return {
    id: row.id,
    title: clean(row.name) || "Hospital",
    subtitle: clean(row.departments) || undefined,
    details: compactDetails([
      detail("Location", row.location),
      detail("Address", row.address),
      detail("Departments", row.departments),
    ]),
    phone: clean(row.phone) || undefined,
    secondaryPhone: clean(row.emergency_phone) || undefined,
    imageUrl,
  };
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in to use Aware Minds AI." },
        { status: 401 },
      );
    }
    if (user.status !== "Active" || user.role !== "patient") {
      return NextResponse.json(
        { error: "Aware Minds AI is available to active patient accounts." },
        { status: 403 },
      );
    }

    const body = requestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: "Please send a valid healthcare search request." },
        { status: 400 },
      );
    }

    const selectedLocation = body.data.location
      ? canonicalLocation(body.data.location)
      : "";
    if (body.data.location && !selectedLocation) {
      return NextResponse.json(
        { error: "Choose a location from the available location list." },
        { status: 400 },
      );
    }

    const db = await supabase();
    const { data: allowed, error: quotaError } = await db.rpc(
      "consume_search_quota",
    );
    if (quotaError) {
      throw new Error("Aware Minds rate limiting is unavailable.");
    }
    if (!allowed) {
      return NextResponse.json(
        { error: "Aware Minds is limited to five requests per minute. Please try again shortly." },
        { status: 429 },
      );
    }

    const specialties = await lookups("specialties");
    const specialtyNames = new Map(
      specialties.map((item) => [clean(item.id), clean(item.name)]),
    );
    const specialtyList = specialties.map((item) => clean(item.name)).filter(Boolean);

    const { data: routingRules, error: routingError } = await db
      .from("symptom_rules")
      .select("keyword,specialty_id,priority,emergency_notice")
      .order("priority", { ascending: false })
      .limit(80);
    if (routingError) throw new Error(routingError.message);

    const symptomMappings = (routingRules || [])
      .map((rule) => {
        const specialty = specialtyNames.get(clean(rule.specialty_id));
        const keyword = clean(rule.keyword);
        return keyword && specialty ? `${keyword} -> ${specialty}` : "";
      })
      .filter(Boolean);

    const interpretation = await interpretQuery({
      message: body.data.message,
      category: body.data.category,
      location: selectedLocation,
      history: body.data.history,
      specialties: specialtyList,
      symptomMappings,
    });

    const inferredLocation = canonicalLocation(interpretation.inferred_location);
    const effectiveLocation = selectedLocation || inferredLocation;

    const combinedText = [
      body.data.message,
      interpretation.normalized_query,
      interpretation.search_term,
      ...interpretation.symptoms,
    ]
      .join(" ")
      .toLowerCase();

    const reviewedNotices = [
      ...new Set(
        (routingRules || [])
          .filter((rule) => {
            const keyword = clean(rule.keyword).toLowerCase();
            return keyword && combinedText.includes(keyword) && rule.emergency_notice;
          })
          .map((rule) => clean(rule.emergency_notice))
          .filter(Boolean),
      ),
    ];

    const urgent =
      interpretation.urgent ||
      reviewedNotices.length > 0 ||
      hasEmergencySignals(body.data.message);

    let finalCategory: Category = interpretation.category;
    if (urgent && finalCategory !== "hospital" && finalCategory !== "ambulance") {
      finalCategory = "hospital";
    }

    const matchedSpecialty = interpretation.specialty
      ? specialtyList.find(
          (name) => name.toLowerCase() === interpretation.specialty!.toLowerCase(),
        ) || null
      : null;

    let searchTerm = interpretation.search_term.trim();
    if (finalCategory === "doctor" && matchedSpecialty) {
      searchTerm = matchedSpecialty;
    }
    if (urgent && finalCategory === "hospital") {
      searchTerm = "";
    }

    let rows: Row[] = [];
    if (interpretation.should_search || urgent) {
      rows = await directory(
        entityByCategory[finalCategory],
        searchTerm,
        1,
        finalCategory === "medicine" ? "" : effectiveLocation,
      );
    }

    const results = await Promise.all(
      rows.slice(0, 6).map((row) => makeResult(finalCategory, row, specialtyNames)),
    );

    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (effectiveLocation && finalCategory !== "medicine") {
      params.set("location", effectiveLocation);
    }
    const directoryUrl = `${directoryByCategory[finalCategory]}${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    return NextResponse.json(
      {
        category: finalCategory,
        location: effectiveLocation,
        urgent,
        safetyNotices: reviewedNotices,
        message: interpretation.assistant_message,
        understood: {
          language: interpretation.language,
          normalizedQuery: interpretation.normalized_query,
          specialty: matchedSpecialty,
          symptoms: interpretation.symptoms,
        },
        results,
        directoryUrl,
        directoryLabel: `Open all ${labelByCategory[finalCategory]}`,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Aware Minds is temporarily unavailable.",
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
