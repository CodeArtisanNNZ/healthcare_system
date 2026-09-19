"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { healthcareLocations } from "@/lib/locations";
import { ActionGlyph } from "@/components/action-glyph";
import styles from "./healthcare-assistant.module.css";

const categories = [
  ["doctor", "Doctor help"],
  ["medicine", "Medicine"],
  ["hospital", "Hospital"],
  ["lab-test", "Lab test"],
  ["caregiver", "Caregiver"],
  ["ambulance", "Ambulance"],
] as const;

type Category = (typeof categories)[number][0];

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  details: Array<{ label: string; value: string }>;
  phone?: string;
  secondaryPhone?: string;
  href?: string;
};

type TriageSuggestion = {
  specialty_id: string;
  specialty_name: string;
  matched_count?: number;
  matched_symptoms?: Array<{ phrase: string; strength?: number }>;
};

type DoctorTriage = {
  urgent: boolean;
  emergency_notice: string | null;
  patient_guidance: string | null;
  primary_specialty_id: string | null;
  primary_specialty_name: string | null;
  suggestions: TriageSuggestion[];
};

type AssistantResponse = {
  category: Category;
  requestedCategory?: Category;
  location: string;
  urgent: boolean;
  title: string;
  context: string;
  reply: string;
  triage?: DoctorTriage | null;
  results: SearchResult[];
  emergencyNumber?: string | null;
  emergencyHospitals?: SearchResult[];
  emergencyAmbulances?: SearchResult[];
  emergencyMatchedArea?: string;
  clinicalState?: {
    engine: string;
    concepts: Array<{
      code: string;
      name: string;
      score: number;
      matchedAlias: string;
    }>;
    evidence: Array<{
      key: string;
      value: string;
      source: "message" | "follow-up";
    }>;
    needsMoreInfo: boolean;
  };
  followUp?: {
    attributeKey: string;
    question: string;
    answerType: "choice" | "text";
    options: string[];
  } | null;
  directoryUrl: string;
  directoryLabel: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AssistantResponse;
};

function callHref(phone: string) {
  return "tel:" + phone.replace(/[^+\d]/g, "");
}

function messageId(prefix: string) {
  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

export function HealthcareAssistant({
  language = "en",
}: {
  language?: "en" | "bn";
}) {
  const bn = language === "bn";
  const [category, setCategory] = useState<Category>("doctor");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);

  async function sendMessage(rawMessage: string) {
    if (busy) return;

    const message = rawMessage.trim();

    if (!message) {
      setError(
        bn
          ? "আপনার সমস্যা বা কী খুঁজছেন সেটা লিখুন।"
          : "Tell me what is happening or what you are looking for.",
      );
      return;
    }

    const userMessage: ChatMessage = {
      id: messageId("user"),
      role: "user",
      content: message,
    };

    const history = messages
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setQuery("");
    setBusy(true);
    setError("");

    try {
      const request = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          category,
          location,
          history,
        }),
      });

      const data = (await request.json()) as AssistantResponse & {
        error?: string;
      };

      if (!request.ok) {
        throw new Error(data.error || "Assistant request failed.");
      }

      setMessages((current) => [
        ...current,
        {
          id: messageId("assistant"),
          role: "assistant",
          content: data.reply,
          response: data,
        },
      ]);

      if (!location && data.location) {
        setLocation(data.location);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : bn
            ? "এখন উত্তর দেওয়া যাচ্ছে না। আবার চেষ্টা করুন।"
            : "I cannot answer right now. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage(query);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const quickPrompts = bn
    ? [
        "আমার মাথা ব্যথা আর বমি হচ্ছে, কোন ডাক্তার দেখাব?",
        "আমার দাঁতে ব্যথা, কী করা উচিত?",
        "কয়েকদিন ধরে কাশি ও শ্বাস নিতে কষ্ট হচ্ছে",
      ]
    : [
        "Amar matha betha ar bomi hocche, kon doctor dekhabo?",
        "My tooth hurts. What kind of doctor should I see?",
        "I have had cough and breathing trouble for a few days.",
      ];

  return (
    <section
      className={styles.shell}
      data-hc-assistant="true"
      data-empty={messages.length === 0 ? "true" : "false"}
      aria-labelledby="assistant-title"
    >
      <div className={styles.heading} data-hc-assistant-heading="true">
        <span className={styles.label}>
          {bn ? "Healthcare Central সহকারী" : "Healthcare Central Assistant"}
        </span>
        <h2 id="assistant-title">
          {bn ? "কীভাবে সাহায্য করতে পারি?" : "How can I help?"}
        </h2>
        <p className={styles.headingCopy}>
          {bn
            ? "আপনার সমস্যা নিজের ভাষায় লিখুন—বাংলা, English বা Banglish যেকোনোভাবে।"
            : "Describe what you need in English, Bangla or Banglish."}
        </p>
      </div>

      <div className={styles.chatWindow} data-hc-chat="true" aria-live="polite">
        {messages.length === 0 && (
          <div className={styles.quickPrompts} data-hc-quick-prompts="true">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                data-hc-quick-prompt="true"
                onClick={() => setQuery(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) => {
          const response = message.response;

          if (message.role === "user") {
            return (
              <div className={styles.userRow} key={message.id}>
                <div className={styles.userBubble}>{message.content}</div>
              </div>
            );
          }

          return (
            <div className={styles.assistantRow} key={message.id}>
              <div className={styles.assistantBubble}>
                <p className={styles.replyText}>{message.content}</p>

                {response?.followUp?.options?.length ? (
                  <div className={styles.followUpOptions}>
                    {response.followUp.options.map((option) => {
                      const labels: Record<string, string> = {
                        Yes: bn ? "হ্যাঁ" : "Yes",
                        No: bn ? "না" : "No",
                        "Not sure": bn ? "নিশ্চিত নই" : "Not sure",
                        Today: bn ? "আজ" : "Today",
                        "Just now": bn ? "এইমাত্র" : "Just now",
                        "1–3 days": bn ? "১–৩ দিন" : "1–3 days",
                        "1–3 days ago": bn ? "১–৩ দিন আগে" : "1–3 days ago",
                        "4–7 days": bn ? "৪–৭ দিন" : "4–7 days",
                        "More than a week": bn ? "এক সপ্তাহের বেশি" : "More than a week",
                        "More than 3 days": bn ? "৩ দিনের বেশি" : "More than 3 days",
                        "Less than 1 hour": bn ? "১ ঘণ্টার কম" : "Less than 1 hour",
                        "Less than 6 hours": bn ? "৬ ঘণ্টার কম" : "Less than 6 hours",
                        Longer: bn ? "আরও আগে থেকে" : "Longer",
                        "Longer ago": bn ? "আরও আগে" : "Longer ago",
                        "Upper abdomen": bn ? "পেটের উপরের অংশ" : "Upper abdomen",
                        "Lower abdomen": bn ? "তলপেট" : "Lower abdomen",
                        "Right side": bn ? "ডান পাশে" : "Right side",
                        "Left side": bn ? "বাম পাশে" : "Left side",
                        "All over": bn ? "সারা পেটে" : "All over",
                      };

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => void sendMessage(option)}
                          disabled={busy}
                        >
                          {labels[option] || option}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {response?.urgent && (
                  <>
                    <div className={styles.urgent}>
                      <div>
                        <strong>
                          {bn
                            ? "জরুরি মূল্যায়ন প্রয়োজন হতে পারে"
                            : "Urgent assessment may be needed"}
                        </strong>
                        <span>
                          {response.triage?.emergency_notice ||
                            (bn
                              ? "গুরুতর বা দ্রুত খারাপ হওয়া উপসর্গ হলে সরাসরি জরুরি চিকিৎসা নিন।"
                              : "Seek emergency care for severe or rapidly worsening symptoms.")}
                        </span>
                      </div>
                      <div className={styles.urgentActions}>
                        <a
                          className="hc-action-button"
                          data-action="emergency"
                          href={"tel:" + (response.emergencyNumber || "16263")}
                        >
                          <span>
                            {bn
                              ? "স্বাস্থ্য হটলাইন ১৬২৬৩"
                              : `Health hotline ${response.emergencyNumber || "16263"}`}
                          </span>
                          <ActionGlyph kind="emergency" />
                        </a>
                        <Link
                          className="hc-action-button"
                          data-action="emergency"
                          href="/emergency"
                        >
                          <span>{bn ? "সব জরুরি নম্বর" : "Emergency directory"}</span>
                          <ActionGlyph kind="emergency" />
                        </Link>
                      </div>
                    </div>

                    {(response.emergencyHospitals?.length ||
                      response.emergencyAmbulances?.length) && (
                      <div className={styles.emergencyResources}>
                        {response.emergencyHospitals?.length ? (
                          <section>
                            <div className={styles.resourceHeading}>
                              <strong>
                                {bn
                                  ? "জরুরি হাসপাতাল / ইমার্জেন্সি সেন্টার"
                                  : "Emergency hospitals / centres"}
                              </strong>
                              <span>
                                {response.location
                                  ? bn
                                    ? `${response.location} ও কাছাকাছি`
                                    : `${response.location} and nearby`
                                  : bn
                                    ? "Location দিলে কাছাকাছি ফলাফল দেখাবে"
                                    : "Choose a location for closer matches"}
                              </span>
                            </div>
                            <div className={styles.results}>
                              {response.emergencyHospitals.map((result) => (
                                <article
                                  className={styles.resultCard}
                                  key={"hospital-" + result.id}
                                >
                                  <div className={styles.resultMain}>
                                    <h4>
                                      {result.href ? (
                                        <Link href={result.href}>{result.title}</Link>
                                      ) : (
                                        result.title
                                      )}
                                    </h4>
                                    {result.subtitle && (
                                      <p className={styles.subtitle}>{result.subtitle}</p>
                                    )}
                                    {result.details.length > 0 && (
                                      <dl>
                                        {result.details.slice(0, 4).map((item) => (
                                          <div key={result.id + "-h-" + item.label}>
                                            <dt>{item.label}</dt>
                                            <dd>{item.value}</dd>
                                          </div>
                                        ))}
                                      </dl>
                                    )}
                                  </div>
                                  <div className={styles.resultActions}>
                                    {result.secondaryPhone && (
                                      <a href={callHref(result.secondaryPhone)}>
                                        {bn ? "ইমার্জেন্সি কল" : "Emergency call"}
                                      </a>
                                    )}
                                    {result.phone && (
                                      <a href={callHref(result.phone)}>
                                        {bn ? "কল করুন" : "Call hospital"}
                                      </a>
                                    )}
                                    {result.href && (
                                      <Link href={result.href}>
                                        {bn ? "বিস্তারিত" : "View details"}
                                      </Link>
                                    )}
                                  </div>
                                </article>
                              ))}
                            </div>
                          </section>
                        ) : null}

                        {response.emergencyAmbulances?.length ? (
                          <section>
                            <div className={styles.resourceHeading}>
                              <strong>{bn ? "অ্যাম্বুলেন্স" : "Ambulance options"}</strong>
                              <span>
                                {bn
                                  ? "উপলভ্য নম্বরে সরাসরি কল করুন"
                                  : "Call an available service directly"}
                              </span>
                            </div>
                            <div className={styles.results}>
                              {response.emergencyAmbulances.map((result) => (
                                <article
                                  className={styles.resultCard}
                                  key={"ambulance-" + result.id}
                                >
                                  <div className={styles.resultMain}>
                                    <h4>{result.title}</h4>
                                    {result.subtitle && (
                                      <p className={styles.subtitle}>{result.subtitle}</p>
                                    )}
                                    {result.details.length > 0 && (
                                      <dl>
                                        {result.details.slice(0, 4).map((item) => (
                                          <div key={result.id + "-a-" + item.label}>
                                            <dt>{item.label}</dt>
                                            <dd>{item.value}</dd>
                                          </div>
                                        ))}
                                      </dl>
                                    )}
                                  </div>
                                  <div className={styles.resultActions}>
                                    {result.phone && (
                                      <a href={callHref(result.phone)}>
                                        {bn ? "অ্যাম্বুলেন্স কল" : "Call ambulance"}
                                      </a>
                                    )}
                                    {result.secondaryPhone && (
                                      <a href={callHref(result.secondaryPhone)}>
                                        {bn ? "বিকল্প নম্বর" : "Alternate number"}
                                      </a>
                                    )}
                                  </div>
                                </article>
                              ))}
                            </div>
                          </section>
                        ) : null}
                      </div>
                    )}
                  </>
                )}

                {!response?.urgent && response?.results.length ? (
                  <div className={styles.results}>
                    {response.results.map((result) => (
                      <article className={styles.resultCard} key={result.id}>
                        <div className={styles.resultMain}>
                          <h4>
                            {result.href ? (
                              <Link href={result.href}>{result.title}</Link>
                            ) : (
                              result.title
                            )}
                          </h4>

                          {result.subtitle && (
                            <p className={styles.subtitle}>{result.subtitle}</p>
                          )}

                          {result.details.length > 0 && (
                            <dl>
                              {result.details.slice(0, 4).map((item) => (
                                <div key={result.id + "-" + item.label}>
                                  <dt>{item.label}</dt>
                                  <dd>{item.value}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </div>

                        <div className={styles.resultActions}>
                          {result.phone && (
                            <a href={callHref(result.phone)}>
                              {bn ? "কল করুন" : "Call"}
                            </a>
                          )}

                          {result.secondaryPhone && (
                            <a href={callHref(result.secondaryPhone)}>
                              {response.category === "ambulance"
                                ? bn
                                  ? "বিকল্প নম্বর"
                                  : "Alternate number"
                                : bn
                                  ? "জরুরি কল"
                                  : "Emergency call"}
                            </a>
                          )}

                          {result.href && (
                            <Link href={result.href}>
                              {bn ? "বিস্তারিত" : "View details"}
                            </Link>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                {response && (
                  <div className={styles.answerActions}>
                    <Link href={response.directoryUrl}>
                      {bn ? "আরও ফলাফল দেখুন" : response.directoryLabel}
                    </Link>
                    {response.requestedCategory === "doctor" &&
                      !response.urgent &&
                      response.triage?.primary_specialty_name && (
                        <span>
                          {"Suggested: " +
                            response.triage.primary_specialty_name}
                        </span>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className={styles.assistantRow}>
            <div
              className={[
                styles.assistantBubble,
                styles.typingBubble,
              ].join(" ")}
            >
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <form className={styles.composer} data-hc-composer="true" onSubmit={submit}>
        <div className={styles.modeRow}>
          <div className={styles.categoryRow} data-hc-categories="true" aria-label="Service type">
            {categories.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={
                  id === category ? styles.activeCategory : styles.category
                }
                onClick={() => {
                  setCategory(id);
                  setError("");
                }}
                aria-pressed={id === category}
              >
                {bn
                  ? id === "doctor"
                    ? "ডাক্তার পরামর্শ"
                    : id === "medicine"
                      ? "ওষুধ"
                      : label
                  : label}
              </button>
            ))}
          </div>

          <label className={styles.locationField} data-hc-location="true">
            <span>{bn ? "এলাকা" : "Location"}</span>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={category === "medicine"}
            >
              <option value="">
                {category === "medicine"
                  ? bn
                    ? "প্রযোজ্য নয়"
                    : "Not required"
                  : bn
                    ? "সব এলাকা"
                    : "All locations"}
              </option>
              {healthcareLocations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.inputRow} data-hc-input-row="true">
          <textarea
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
            rows={2}
            placeholder={
              bn
                ? "যেমন: Amar 3 din dhore matha betha, bomi bomi lage. Amar ki kora uchit?"
                : "Example: Amar 3 din dhore matha betha, bomi bomi lage. Kon doctor dekhabo?"
            }
          />

          <button
            className={[styles.sendButton, "hc-action-button"].join(" ")}
            data-action="assistant"
            type="submit"
            disabled={busy || !query.trim()}
            aria-label={bn ? "বার্তা পাঠান" : "Send message"}
          >
            <span>{bn ? "পাঠান" : "Send"}</span>
            <ActionGlyph kind="assistant" />
          </button>
        </div>

        <p className={styles.inputHint}>
          {bn
            ? "Enter = পাঠান · Shift + Enter = নতুন লাইন"
            : "Enter to send · Shift + Enter for a new line"}
        </p>
      </form>

      <p className={styles.disclaimer}>
        {bn
          ? "Healthcare Central উপসর্গ থেকে উপযুক্ত সেবার ধরন খুঁজতে সাহায্য করে। এটি রোগ নির্ণয় করে না এবং চিকিৎসকের বিকল্প নয়। জরুরি লক্ষণ হলে সরাসরি জরুরি চিকিৎসা নিন। আপনার chat account-এর সাথে সংরক্ষিত হয় এবং support-এর প্রয়োজনে Healthcare Central administrator দেখতে পারেন।"
          : "Healthcare Central helps route symptoms to an appropriate type of care. It does not diagnose conditions or replace a clinician. Seek emergency care for urgent symptoms. Your chat is saved to your account and may be reviewed by Healthcare Central administrators for support."}
      </p>
    </section>
  );
}
