"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { healthcareLocations } from "@/lib/locations";
import styles from "./aware-minds.module.css";

const categories = [
  { id: "doctor", label: "Doctor", icon: "✚" },
  { id: "medicine", label: "Medicine", icon: "◒" },
  { id: "caregiver", label: "Caregiver", icon: "♡" },
  { id: "lab-test", label: "Lab test", icon: "⌁" },
  { id: "ambulance", label: "Ambulance", icon: "✚" },
  { id: "hospital", label: "Hospital", icon: "▦" },
] as const;

type Category = (typeof categories)[number]["id"];
type Role = "user" | "assistant";

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  details: Array<{ label: string; value: string }>;
  phone?: string;
  secondaryPhone?: string;
  href?: string;
  imageUrl?: string | null;
};

type AwareResponse = {
  category: Category;
  location: string;
  urgent: boolean;
  safetyNotices: string[];
  message: string;
  understood: {
    language: string;
    normalizedQuery: string;
    specialty: string | null;
    symptoms: string[];
  };
  results: SearchResult[];
  directoryUrl: string;
  directoryLabel: string;
};

type ChatTurn = {
  id: string;
  role: Role;
  content: string;
  response?: AwareResponse;
};

const examples: Record<Category, string> = {
  doctor: "e.g. matha betha kore, skin rash, or I need a heart doctor",
  medicine: "e.g. Napa Extra, napa exra, or paracetamol 500 mg",
  caregiver: "e.g. elderly caregiver for home care",
  "lab-test": "e.g. CBC test or thyroid test",
  ambulance: "e.g. need an ambulance in Mirpur",
  hospital: "e.g. heart hospital or emergency hospital",
};

function callHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export function AwareMinds() {
  const [category, setCategory] = useState<Category>("doctor");
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I’m Aware Minds. Tell me what you need in English, বাংলা or Banglish. I’ll help you navigate Healthcare Central services.",
    },
  ]);

  const selectedLabel = useMemo(
    () => categories.find((item) => item.id === category)?.label || "Service",
    [category],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const message =
      query.trim() ||
      `Show me ${selectedLabel.toLowerCase()}${location ? ` in ${location}` : ""}.`;

    const userTurn: ChatTurn = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };

    const history = turns
      .filter((turn) => turn.id !== "welcome")
      .slice(-8)
      .map((turn) => ({ role: turn.role, content: turn.content }));

    setTurns((current) => [...current, userTurn]);
    setQuery("");
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/aware-minds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, category, location, history }),
      });
      const data = (await response.json()) as AwareResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Aware Minds search failed.");
      }

      setCategory(data.category);
      if (!location && data.location) setLocation(data.location);
      setTurns((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          response: data,
        },
      ]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Aware Minds is temporarily unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.shell} aria-labelledby="aware-minds-title">
      <div className={styles.header}>
        <div className={styles.mark} aria-hidden="true">
          AM
        </div>
        <div>
          <p className="eyebrow">AWARE MINDS AI</p>
          <h1 id="aware-minds-title">How can I help you today?</h1>
          <p className="muted">
            Healthcare navigation in English, বাংলা and Banglish. Results come
            from Healthcare Central’s own database.
          </p>
        </div>
      </div>

      <div className={styles.categoryRow} aria-label="Healthcare search category">
        {categories.map((item) => (
          <button
            type="button"
            key={item.id}
            className={
              item.id === category
                ? `${styles.category} ${styles.categoryActive}`
                : styles.category
            }
            onClick={() => setCategory(item.id)}
            aria-pressed={item.id === category}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.chat} aria-live="polite">
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={
              turn.role === "user"
                ? `${styles.turn} ${styles.userTurn}`
                : `${styles.turn} ${styles.assistantTurn}`
            }
          >
            <div className={styles.bubble}>{turn.content}</div>

            {turn.response && (
              <div className={styles.responsePanel}>
                {turn.response.urgent && (
                  <div className={styles.urgent} role="alert">
                    <strong>Urgent care may be needed.</strong>
                    <span>
                      If symptoms are severe, worsening, or life-threatening,
                      seek emergency medical care immediately.
                    </span>
                  </div>
                )}

                {turn.response.safetyNotices.map((notice) => (
                  <div className={styles.safetyNotice} key={notice} role="alert">
                    {notice}
                  </div>
                ))}

                <div className={styles.understood}>
                  <span>Understood as</span>
                  {turn.response.understood.normalizedQuery && (
                    <strong>{turn.response.understood.normalizedQuery}</strong>
                  )}
                  {turn.response.understood.specialty && (
                    <span>{turn.response.understood.specialty}</span>
                  )}
                  {turn.response.location && <span>{turn.response.location}</span>}
                  <span>{turn.response.understood.language}</span>
                </div>

                {turn.response.results.length ? (
                  <div className={styles.results}>
                    {turn.response.results.map((result) => (
                      <article className={styles.resultCard} key={result.id}>
                        {result.imageUrl && (
                          <img
                            className={styles.resultImage}
                            src={result.imageUrl}
                            alt=""
                          />
                        )}
                        <div className={styles.resultBody}>
                          <h3>{result.title}</h3>
                          {result.subtitle && (
                            <p className={styles.subtitle}>{result.subtitle}</p>
                          )}

                          {result.details.length > 0 && (
                            <dl className={styles.details}>
                              {result.details.map((item) => (
                                <div key={`${result.id}-${item.label}`}>
                                  <dt>{item.label}</dt>
                                  <dd>{item.value}</dd>
                                </div>
                              ))}
                            </dl>
                          )}

                          <div className={styles.resultActions}>
                            {result.phone && (
                              <a className="button secondary" href={callHref(result.phone)}>
                                Call
                              </a>
                            )}
                            {result.secondaryPhone && (
                              <a
                                className="button secondary"
                                href={callHref(result.secondaryPhone)}
                              >
                                Emergency call
                              </a>
                            )}
                            {result.href && (
                              <Link className="button secondary" href={result.href}>
                                View details
                              </Link>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noResults}>
                    No matching entries are currently listed in Healthcare
                    Central for this search. Try another wording or location.
                  </div>
                )}

                <Link className={styles.directoryLink} href={turn.response.directoryUrl}>
                  {turn.response.directoryLabel} →
                </Link>
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className={`${styles.turn} ${styles.assistantTurn}`}>
            <div className={`${styles.bubble} ${styles.thinking}`}>
              Aware Minds is understanding your request…
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      <form className={styles.composer} onSubmit={submit}>
        <div className={styles.locationBox}>
          <label htmlFor="aware-location">Location</label>
          <select
            id="aware-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            disabled={category === "medicine"}
          >
            <option value="">
              {category === "medicine" ? "Not needed" : "All locations"}
            </option>
            {healthcareLocations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputBox}>
          <label className="sr-only" htmlFor="aware-query">
            Describe what you need
          </label>
          <textarea
            id="aware-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={500}
            placeholder={`Ask naturally — ${examples[category]}`}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className={styles.composerFooter}>
            <span>
              {selectedLabel}
              {category !== "medicine" && location ? ` · ${location}` : ""}
            </span>
            <button type="submit" disabled={busy}>
              {busy ? "Thinking…" : "Send ↑"}
            </button>
          </div>
        </div>
      </form>

      <p className={styles.disclaimer}>
        Aware Minds helps with healthcare navigation, not diagnosis or treatment.
        For emergencies, seek urgent professional care.
      </p>
    </section>
  );
}
