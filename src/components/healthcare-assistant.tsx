"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { healthcareLocations } from "@/lib/locations";
import styles from "./healthcare-assistant.module.css";

const categories = [
  ["doctor", "Doctor"],
  ["medicine", "Medicine"],
  ["hospital", "Hospital"],
  ["lab-test", "Lab Test"],
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

type AssistantResponse = {
  category: Category;
  location: string;
  urgent: boolean;
  message: string;
  matched: {
    canonical: string;
    specialty: string | null;
    language: string;
  };
  results: SearchResult[];
  directoryUrl: string;
  directoryLabel: string;
};

function callHref(phone: string) {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
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
  const [response, setResponse] = useState<AssistantResponse | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const message = query.trim();
    if (!message) {
      setError(bn ? "কী খুঁজছেন তা লিখুন।" : "Enter what you are looking for.");
      return;
    }

    setBusy(true);
    setError("");
    setResponse(null);

    try {
      const result = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, category, location }),
      });

      const data = (await result.json()) as AssistantResponse & { error?: string };
      if (!result.ok) throw new Error(data.error || "Search failed.");

      setResponse(data);
      setCategory(data.category);
      if (!location && data.location) setLocation(data.location);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : bn
            ? "সার্চ এখন পাওয়া যাচ্ছে না।"
            : "Search is temporarily unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.shell} aria-labelledby="assistant-title">
      <div className={styles.heading}>
        <p className={styles.kicker}>HEALTHCARE CENTRAL ASSISTANT</p>
        <h1 id="assistant-title">
          {bn ? "সঠিক স্বাস্থ্যসেবা খুঁজুন।" : "Find the right care."}
        </h1>
        <p>
          {bn
            ? "English, বাংলা বা Banglish লিখুন। ফলাফল Healthcare Central-এর নিজস্ব ডেটাবেস থেকে আসে।"
            : "Search in English, বাংলা or Banglish. Results come directly from Healthcare Central’s database."}
        </p>
      </div>

      <form className={styles.searchPanel} onSubmit={submit}>
        <div className={styles.categoryRow} aria-label="Service">
          {categories.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={id === category ? styles.activeCategory : styles.category}
              onClick={() => setCategory(id)}
              aria-pressed={id === category}
            >
              {label}
            </button>
          ))}
        </div>

        <label className={styles.queryLabel}>
          <span>{bn ? "কী খুঁজছেন?" : "What are you looking for?"}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={160}
            placeholder={
              bn
                ? "ডাক্তার, হাসপাতাল, ওষুধ বা সেবা লিখুন"
                : "Search doctors, medicines, hospitals or services"
            }
          />
        </label>

        <div className={styles.searchFooter}>
          <label className={styles.locationField}>
            <span>{bn ? "এলাকা" : "Location"}</span>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={category === "medicine"}
            >
              <option value="">
                {category === "medicine"
                  ? bn
                    ? "প্রয়োজন নেই"
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

          <button className={styles.searchButton} type="submit" disabled={busy}>
            {busy
              ? bn
                ? "খোঁজা হচ্ছে..."
                : "Searching..."
              : bn
                ? "সার্চ করুন"
                : "Search"}
          </button>
        </div>
      </form>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {response && (
        <div className={styles.response} aria-live="polite">
          {response.urgent && (
            <div className={styles.urgent}>
              <strong>
                {bn
                  ? "জরুরি চিকিৎসা প্রয়োজন হতে পারে।"
                  : "Urgent care may be needed."}
              </strong>
              <Link href="/emergency">
                {bn ? "জরুরি সহায়তা খুলুন" : "Open Emergency Help"}
              </Link>
            </div>
          )}

          <div className={styles.responseHeading}>
            <div>
              <h2>{response.message}</h2>
              {(response.matched.specialty || response.matched.canonical) && (
                <p>
                  {response.matched.specialty || response.matched.canonical}
                  {response.location ? ` · ${response.location}` : ""}
                </p>
              )}
            </div>
            <Link href={response.directoryUrl}>{response.directoryLabel}</Link>
          </div>

          {response.results.length ? (
            <div className={styles.results}>
              {response.results.map((result) => (
                <article className={styles.resultCard} key={result.id}>
                  <div className={styles.resultMain}>
                    <div>
                      <h3>{result.title}</h3>
                      {result.subtitle && (
                        <p className={styles.subtitle}>{result.subtitle}</p>
                      )}
                    </div>

                    {result.details.length > 0 && (
                      <dl>
                        {result.details.slice(0, 4).map((item) => (
                          <div key={`${result.id}-${item.label}`}>
                            <dt>{item.label}</dt>
                            <dd>{item.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>

                  <div className={styles.resultActions}>
                    {result.phone && <a href={callHref(result.phone)}>Call</a>}
                    {result.secondaryPhone && (
                      <a href={callHref(result.secondaryPhone)}>Emergency call</a>
                    )}
                    {result.href && <Link href={result.href}>View</Link>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              {bn
                ? "এই সার্চের জন্য Healthcare Central-এ কোনো মিল পাওয়া যায়নি।"
                : "No matching Healthcare Central entries were found for this search."}
            </div>
          )}
        </div>
      )}

      <p className={styles.disclaimer}>
        {bn
          ? "Assistant সেবা খুঁজতে সাহায্য করে; এটি রোগ নির্ণয় বা চিকিৎসা দেয় না।"
          : "The Assistant helps you find healthcare services. It does not diagnose or provide treatment."}
      </p>
    </section>
  );
}
