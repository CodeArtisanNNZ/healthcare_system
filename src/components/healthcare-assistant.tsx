"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { healthcareLocations } from "@/lib/locations";
import { ActionGlyph } from "@/components/action-glyph";
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
  title: string;
  context: string;
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
  const [response, setResponse] =
    useState<AssistantResponse | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy) return;

    const message = query.trim();

    if (!message) {
      setError(bn ? "কী খুঁজছেন তা লিখুন।" : "Enter a search.");
      return;
    }

    if (category === "medicine") {
      const params = new URLSearchParams({ q: message });

      if (bn) {
        params.set("lang", "bn");
      }

      window.location.href = `/medicines?${params.toString()}`;
      return;
    }

    setBusy(true);
    setError("");
    setResponse(null);

    try {
      const request = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          category,
          location,
        }),
      });

      const data = (await request.json()) as AssistantResponse & {
        error?: string;
      };

      if (!request.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setResponse(data);
      setCategory(data.category);

      if (!location && data.location) {
        setLocation(data.location);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : bn
            ? "সার্চ করা যাচ্ছে না। আবার চেষ্টা করুন।"
            : "Search is unavailable. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.shell} aria-labelledby="assistant-title">
      <div className={styles.heading}>
        <span className={styles.label}>
          {bn ? "সহকারী" : "Assistant"}
        </span>

        <h2 id="assistant-title">
          {bn ? "স্বাস্থ্যসেবা খুঁজুন" : "Search healthcare services"}
        </h2>
      </div>

      <form className={styles.searchPanel} onSubmit={submit}>
        <div className={styles.categoryRow} aria-label="Service type">
          {categories.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={
                id === category
                  ? styles.activeCategory
                  : styles.category
              }
              onClick={() => {
                setCategory(id);
                setResponse(null);
                setError("");
              }}
              aria-pressed={id === category}
            >
              {label}
            </button>
          ))}
        </div>

        <label className={styles.queryLabel}>
          <span>{bn ? "সার্চ" : "Search"}</span>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={160}
            placeholder={
              category === "medicine"
                ? bn
                  ? "ওষুধের নাম বা strength লিখুন"
                  : "Medicine name or strength"
                : bn
                  ? "নাম, বিশেষত্ব বা সেবা লিখুন"
                  : "Name, specialty or service"
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

          <button
            className={`${styles.searchButton} hc-action-button`}
            data-action="search"
            type="submit"
            disabled={busy}
          >
            <span>
              {busy
                ? bn
                  ? "খোঁজা হচ্ছে"
                  : "Searching"
                : bn
                  ? "সার্চ করুন"
                  : "Search"}
            </span>
            <ActionGlyph kind="search" />
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
              <div>
                <strong>
                  {bn
                    ? "জরুরি সহায়তা প্রয়োজন হতে পারে"
                    : "Urgent help may be needed"}
                </strong>

                <span>
                  {bn
                    ? "জরুরি যোগাযোগ ও অ্যাম্বুলেন্স সেবা দেখুন।"
                    : "Open emergency contacts and ambulance support."}
                </span>
              </div>

              <Link className="hc-action-button" data-action="emergency" href="/emergency">
                <span>{bn ? "জরুরি সহায়তা" : "Emergency Help"}</span>
                <ActionGlyph kind="emergency" />
              </Link>
            </div>
          )}

          <div className={styles.responseHeading}>
            <div>
              <h3>{response.title}</h3>

              {(response.context || response.location) && (
                <p>
                  {[response.context, response.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>

            <Link href={response.directoryUrl}>
              {response.directoryLabel}
            </Link>
          </div>

          {response.results.length ? (
            <div className={styles.results}>
              {response.results.map((result) => (
                <article
                  className={styles.resultCard}
                  key={result.id}
                >
                  <div className={styles.resultMain}>
                    <h4>{result.title}</h4>

                    {result.subtitle && (
                      <p className={styles.subtitle}>
                        {result.subtitle}
                      </p>
                    )}

                    {result.details.length > 0 && (
                      <dl>
                        {result.details
                          .slice(0, 4)
                          .map((item) => (
                            <div
                              key={`${result.id}-${item.label}`}
                            >
                              <dt>{item.label}</dt>
                              <dd>{item.value}</dd>
                            </div>
                          ))}
                      </dl>
                    )}
                  </div>

                  <div className={styles.resultActions}>
                    {result.phone && (
                      <a href={callHref(result.phone)}>Call</a>
                    )}

                    {result.secondaryPhone && (
                      <a href={callHref(result.secondaryPhone)}>
                        Emergency call
                      </a>
                    )}

                    {result.href && (
                      <Link href={result.href}>
                        View details
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              {bn
                ? "এই সার্চের জন্য কোনো ফলাফল পাওয়া যায়নি।"
                : "No matching results were found."}
            </div>
          )}
        </div>
      )}

      <p className={styles.disclaimer}>
        {bn
          ? "এই সেবা চিকিৎসা নির্ণয় করে না।"
          : "Search assistance only. This service does not provide a diagnosis."}
      </p>
    </section>
  );
}
