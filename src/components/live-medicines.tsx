"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Offer } from "@/lib/medicine-utils";
type Language = "en" | "bn";
import styles from "./live-medicines.module.css";

export function LiveMedicines({
  initialQuery = "",
  language = "en",
}: {
  initialQuery?: string;
  language?: Language;
}) {
  const bn = language === "bn";
  const [query, setQuery] = useState(initialQuery);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const initialSearchDone = useRef(false);

  const runSearch = useCallback(
    async (rawQuery: string) => {
      const q = rawQuery.trim();

      if (q.length < 2) {
        setError(
          bn
            ? "কমপক্ষে ২ অক্ষরের ওষুধের নাম লিখুন।"
            : "Enter a medicine name of at least 2 characters.",
        );
        setOffers(null);
        return;
      }

      setBusy(true);
      setError("");
      setOffers(null);

      try {
        const response = await fetch("/api/medicines/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || (bn ? "সার্চ করা যায়নি।" : "Medicine search failed."),
          );
        }

        setOffers(Array.isArray(data.offers) ? data.offers : []);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : bn
              ? "এই মুহূর্তে ফার্মেসি অপশন দেখানো যাচ্ছে না।"
              : "Medicine seller search is temporarily unavailable.",
        );
      } finally {
        setBusy(false);
      }
    },
    [bn],
  );

  useEffect(() => {
    if (initialSearchDone.current || initialQuery.trim().length < 2) return;
    initialSearchDone.current = true;
    void runSearch(initialQuery);
  }, [initialQuery, runSearch]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch(query);
  }

  return (
    <section className={styles.section}>
      <form onSubmit={submit} className={styles.search}>
        <label className={styles.searchLabel} htmlFor="medicine-seller-q">
          {bn ? "ওষুধের নাম বা strength" : "Medicine name or strength"}
        </label>

        <div className={styles.searchRow}>
          <input
            id="medicine-seller-q"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            required
            minLength={2}
            maxLength={100}
            placeholder={bn ? "যেমন: Napa 500" : "e.g. Napa 500"}
          />

          <button type="submit" disabled={busy}>
            {busy
              ? bn ? "সার্চ হচ্ছে…" : "Searching..."
              : bn ? "ফার্মেসি দেখুন" : "Search sellers"}
          </button>
        </div>
      </form>

      {error && <p className={styles.error} role="alert">{error}</p>}

      {busy && (
        <div className={styles.loading} aria-live="polite">
          {bn ? "ফার্মেসি অপশন খোঁজা হচ্ছে…" : "Checking pharmacy options…"}
        </div>
      )}

      {offers && !busy && (
        <div className={styles.resultsSection} aria-live="polite">
          <div className={styles.resultsHeading}>
            <p className={styles.kicker}>
              {bn ? "ফার্মেসি অপশন" : "SELLER OPTIONS"}
            </p>
            <h2>
              {bn
                ? `“${query.trim()}” এর জন্য ${offers.length}টি অপশন`
                : `${offers.length} pharmacy options for “${query.trim()}”`}
            </h2>
          </div>

          <div className={styles.results}>
            {offers.map((offer) => (
              <article className={styles.offer} key={offer.platform}>
                <div className={styles.offerInfo}>
                  <p className={styles.platform}>{offer.platform}</p>
                  <h3>{offer.title || query.trim()}</h3>
                  <p className={styles.description}>
                    {bn
                      ? "মূল বিক্রেতার ওয়েবসাইট খুলে বর্তমান তথ্য নিশ্চিত করুন।"
                      : offer.description ||
                        "Open the seller website to check the current listing."}
                  </p>
                </div>

                <div className={styles.offerAction}>
                  <strong>
                    {typeof offer.price === "number"
                      ? `${offer.currency || "BDT"} ${offer.price}`
                      : bn ? "বর্তমান মূল্য দেখুন" : "Check live price"}
                  </strong>

                  {offer.url ? (
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {bn ? "বিক্রেতার ওয়েবসাইট খুলুন" : "Open seller website"}
                    </a>
                  ) : (
                    <span>{bn ? "লিংক পাওয়া যায়নি" : "Seller link unavailable"}</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          <p className={styles.disclaimer}>
            {bn
              ? "Healthcare Central ওষুধ বিক্রি করে না। কেনার আগে মূল ওয়েবসাইটে ওষুধ, strength, pack size, prescription requirement, availability এবং final price নিশ্চিত করুন।"
              : "Healthcare Central does not sell medicine. Always confirm the exact medicine, strength, pack size, prescription requirements, availability and final price on the seller website."}
          </p>
        </div>
      )}
    </section>
  );
}
