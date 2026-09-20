import "server-only";

import { z } from "zod";

export type LlmClinicalLanguage = "en" | "bn" | "banglish";

const symptomSchema = z.object({
  source_text: z.string().min(1).max(180),
  name: z.string().min(1).max(120),
  canonical_hint: z.string().min(1).max(120),
  polarity: z.enum(["present", "absent", "uncertain"]),
  severity: z.enum(["mild", "moderate", "severe", "unknown"]),
  body_site: z.string().max(120).nullable(),
  laterality: z.enum(["left", "right", "bilateral", "midline", "unknown"]),
  onset: z.string().max(120).nullable(),
  duration: z.string().max(120).nullable(),
  modifiers: z.array(z.string().max(120)).max(8),
});

const safetySignalSchema = z.object({
  source_text: z.string().min(1).max(180),
  canonical_signal: z.string().min(1).max(140),
});

const extractionSchema = z.object({
  language: z.enum(["en", "bn", "banglish"]),
  intent: z.enum(["symptom_help", "medicine_help", "other"]),
  new_episode: z.boolean(),
  new_episode_confidence: z.number().min(0).max(1),
  normalized_summary: z.string().max(800),
  answers_previous_question: z.boolean(),
  previous_answer_polarity: z.enum(["yes", "no", "uncertain", "other", "none"]),
  answer_summary: z.string().max(300),
  symptoms: z.array(symptomSchema).max(20),
  safety_signals: z.array(safetySignalSchema).max(10),
  contextual_notes: z.array(z.string().max(180)).max(10),
});

export type LlmClinicalExtraction = z.infer<typeof extractionSchema>;

const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "language",
    "intent",
    "new_episode",
    "new_episode_confidence",
    "normalized_summary",
    "answers_previous_question",
    "previous_answer_polarity",
    "answer_summary",
    "symptoms",
    "safety_signals",
    "contextual_notes",
  ],
  properties: {
    language: {
      type: "string",
      enum: ["en", "bn", "banglish"],
    },
    intent: {
      type: "string",
      enum: ["symptom_help", "medicine_help", "other"],
    },
    new_episode: { type: "boolean" },
    new_episode_confidence: {
      type: "number",
      minimum: 0,
      maximum: 1,
    },
    normalized_summary: { type: "string" },
    answers_previous_question: { type: "boolean" },
    previous_answer_polarity: {
      type: "string",
      enum: ["yes", "no", "uncertain", "other", "none"],
    },
    answer_summary: { type: "string" },
    symptoms: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "source_text",
          "name",
          "canonical_hint",
          "polarity",
          "severity",
          "body_site",
          "laterality",
          "onset",
          "duration",
          "modifiers",
        ],
        properties: {
          source_text: { type: "string" },
          name: { type: "string" },
          canonical_hint: { type: "string" },
          polarity: {
            type: "string",
            enum: ["present", "absent", "uncertain"],
          },
          severity: {
            type: "string",
            enum: ["mild", "moderate", "severe", "unknown"],
          },
          body_site: {
            type: ["string", "null"],
          },
          laterality: {
            type: "string",
            enum: ["left", "right", "bilateral", "midline", "unknown"],
          },
          onset: {
            type: ["string", "null"],
          },
          duration: {
            type: ["string", "null"],
          },
          modifiers: {
            type: "array",
            maxItems: 8,
            items: { type: "string" },
          },
        },
      },
    },
    safety_signals: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["source_text", "canonical_signal"],
        properties: {
          source_text: { type: "string" },
          canonical_signal: { type: "string" },
        },
      },
    },
    contextual_notes: {
      type: "array",
      maxItems: 10,
      items: { type: "string" },
    },
  },
} as const;

const replySchema = z.object({
  reply: z.string().min(1).max(1200),
});

const replyJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply"],
  properties: {
    reply: { type: "string" },
  },
} as const;

type ResponsePayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function configured() {
  return (
    process.env.HCC_LLM_ENABLED?.trim().toLowerCase() !== "false" &&
    Boolean(process.env.OPENAI_API_KEY?.trim())
  );
}

function extractionModel() {
  return process.env.OPENAI_CLINICAL_MODEL?.trim() || "gpt-5.6-terra";
}

function replyModel() {
  return process.env.OPENAI_REPLY_MODEL?.trim() || "gpt-5.6-luna";
}

function responseText(payload: ResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  for (const item of payload.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text?.trim()) {
        return content.text.trim();
      }
    }
  }

  return "";
}

async function openAiStructured<T>({
  schemaName,
  schema,
  system,
  user,
  maxOutputTokens,
  modelId,
}: {
  schemaName: string;
  schema: Record<string, unknown>;
  system: string;
  user: string;
  maxOutputTokens: number;
  modelId: string;
}): Promise<T | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        store: false,
        reasoning: { effort: "low" },
        max_output_tokens: maxOutputTokens,
        input: [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: user,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: schemaName,
            strict: true,
            schema,
          },
        },
      }),
      signal: AbortSignal.timeout(8500),
    });

    const payload = (await response.json()) as ResponsePayload;

    if (!response.ok) {
      console.error(
        "Clinical LLM request failed",
        response.status,
        payload.error?.message || "Unknown OpenAI API error",
      );
      return null;
    }

    const text = responseText(payload);
    if (!text) return null;

    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Clinical LLM request error", error);
    return null;
  }
}

function compactHistory(
  history: Array<{ role: "user" | "assistant"; content: string }>,
) {
  return history
    .slice(-6)
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 420),
    }));
}

export async function extractClinicalMessage({
  message,
  history,
  activeEpisodeSummary,
  pendingQuestion,
}: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  activeEpisodeSummary?: string | null;
  pendingQuestion?: string | null;
}) {
  if (!configured()) return null;

  const result = await openAiStructured<LlmClinicalExtraction>({
    schemaName: "hcc_clinical_extraction",
    schema: extractionJsonSchema,
    maxOutputTokens: 1100,
    modelId: extractionModel(),
    system: `
You are the language-understanding layer for Healthcare Central, a patient-facing healthcare navigation system in Bangladesh.

Your job is ONLY to convert the patient's language into structured facts. You do not diagnose, choose a doctor, prescribe treatment, or decide urgency.

Rules:
- Understand English, Bangla script, and Banglish/transliterated Bangla, including misspellings and colloquial wording.
- Extract only symptoms or facts that the patient actually states or strongly and unambiguously implies.
- source_text MUST be an exact short substring copied from the CURRENT patient message. Never invent source text.
- Preserve negation: "jor nai" means fever is absent, not present.
- Preserve uncertainty: "mone hoy", "maybe", "not sure" means uncertain.
- Distinguish a reply to the current complaint from a clearly different/new complaint.
- normalized_summary should be a concise English clinical-language paraphrase of the current message only. It may normalize wording but must not add facts.
- safety_signals may contain only safety-relevant facts explicitly stated in the current message; each must include exact source_text.
- Do not infer diagnoses such as appendicitis, heart attack, infection, or cancer.
- Do not infer pregnancy, age, sex, medication use, or medical history unless explicitly stated.
- If pending_question is present, decide whether the CURRENT message is answering it. Set answers_previous_question accordingly.
- For an answer to the pending question, previous_answer_polarity must be yes, no, uncertain, or other. Use none when it is not an answer.
- answer_summary should restate only the answer in a short neutral phrase; use an empty string when it is not an answer.
- If the message is merely "yes", "no", a duration, location, or another short follow-up answer, keep symptoms empty unless the answer itself names a symptom.
- Language must reflect the CURRENT patient message: en for English, bn for Bangla script, banglish for transliterated Bangla/mixed Bangla-English.
`.trim(),
    user: JSON.stringify({
      current_message: message,
      recent_conversation: compactHistory(history),
      active_episode_summary: activeEpisodeSummary || null,
      pending_question: pendingQuestion || null,
    }),
  });

  const parsed = extractionSchema.safeParse(result);
  return parsed.success ? parsed.data : null;
}

function normalizedSource(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function sourceAppearsInMessage(message: string, sourceText: string) {
  const messageNorm = normalizedSource(message);
  const sourceNorm = normalizedSource(sourceText);
  return Boolean(sourceNorm && messageNorm.includes(sourceNorm));
}

export function validatedLlmFacts(
  message: string,
  extraction: LlmClinicalExtraction | null,
) {
  if (!extraction) {
    return {
      canonicalQuery: "",
      symptoms: [] as LlmClinicalExtraction["symptoms"],
      safetySignals: [] as LlmClinicalExtraction["safety_signals"],
    };
  }

  const symptoms = extraction.symptoms.filter((item) =>
    sourceAppearsInMessage(message, item.source_text),
  );
  const safetySignals = extraction.safety_signals.filter((item) =>
    sourceAppearsInMessage(message, item.source_text),
  );

  const canonicalParts = symptoms.flatMap((item) => {
    const parts = [
      item.canonical_hint,
      item.body_site,
      item.laterality !== "unknown" ? item.laterality : null,
      item.severity !== "unknown" ? item.severity : null,
      item.duration,
      item.onset,
      ...item.modifiers,
    ].filter(Boolean);

    const prefix =
      item.polarity === "absent"
        ? "no "
        : item.polarity === "uncertain"
          ? "possible "
          : "";

    return [prefix + parts.join(" ")];
  });

  return {
    canonicalQuery: canonicalParts.join(" ").slice(0, 900),
    symptoms,
    safetySignals,
  };
}

export async function naturalizeClinicalReply({
  language,
  decision,
  knownFacts,
  requiredMessage,
  followUpQuestion,
}: {
  language: LlmClinicalLanguage;
  decision: "ask_followup" | "urgent" | "recommend";
  knownFacts: string[];
  requiredMessage: string;
  followUpQuestion?: string | null;
}) {
  if (!configured()) return null;

  const result = await openAiStructured<z.infer<typeof replySchema>>({
    schemaName: "hcc_patient_reply",
    schema: replyJsonSchema,
    maxOutputTokens: 350,
    modelId: replyModel(),
    system: `
You write the final conversational wording for Healthcare Central.

The clinical/safety engine has ALREADY made the decision. You must not change it.

Rules:
- Never diagnose or name a probable disease unless it is explicitly included in required_message.
- Never prescribe medication, dosage, tests, or treatment.
- Never downgrade or upgrade urgency.
- Do not add symptoms, history, risk factors, or facts.
- If a follow_up_question is supplied, ask exactly that clinical topic, but phrase it naturally rather than like a form.
- If decision is urgent, preserve every concrete action or hotline instruction in required_message.
- If decision is recommend, preserve the recommended specialty/care type in required_message.
- Be warm, concise, human, and non-robotic.
- Reply in the requested language: English for en, Bangla script for bn, natural Banglish for banglish.
- Avoid repetitive disclaimers and phrases like "Based on your symptoms".
- Keep the reply under 120 words.
`.trim(),
    user: JSON.stringify({
      language,
      decision,
      known_facts: knownFacts.slice(0, 12),
      required_message: requiredMessage,
      follow_up_question: followUpQuestion || null,
    }),
  });

  const parsed = replySchema.safeParse(result);
  return parsed.success ? parsed.data.reply.trim() : null;
}

export function clinicalLlmEnabled() {
  return configured();
}
