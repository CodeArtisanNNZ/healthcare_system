"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ActionGlyph } from "@/components/action-glyph";
import styles from "./live-medicines.module.css";

type Language = "en" | "bn";

type MedicineItem = {
  query: string;
  platform: string;
  found: boolean;
  title?: string;
  description?: string;
  price?: number | null;
  currency?: string;
  url?: string;
  source?: string;
};

type SellerBundle = {
  platform: string;
  sellerUrl: string;
  items: MedicineItem[];
  totalPrice: number | null;
  knownTotal: number;
  pricedCount: number;
  itemCount: number;
  currency: "BDT";
  totalComplete: boolean;
  cartHandoffAvailable: boolean;
  cartNote: string;
};

type SearchResponse = {
  queries?: string[];
  bundles?: SellerBundle[];
  error?: string;
};

function medicineCount(raw: string) {
  return raw
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10).length;
}

function money(value: number) {
  return new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: value % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function LiveMedicines({
  initialQuery = "",
  language = "en",
}: {
  initialQuery?: string;
  language?: Language;
}) {
  const bn = language === "bn";
  const [query, setQuery] = useState(initialQuery);
  const [searchedQueries, setSearchedQueries] = useState<string[]>([]);
  const [bundles, setBundles] = useState<SellerBundle[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const initialSearchDone = useRef(false);

  const runSearch = useCallback(
    async (rawQuery: string) => {
      const q = rawQuery.trim();
      const count = medicineCount(q);

      if (!count) {
        setError(
          bn
            ? "কমপক্ষে একটি ওষুধের নাম লিখুন।"
            : "Enter at least one medicine name.",
        );
        setBundles(null);
        return;
      }

      setBusy(true);
      setError("");
      setBundles(null);

      try {
        const response = await fetch("/api/medicines/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q }),
        });

        const data = (await response.json()) as SearchResponse;

        if (!response.ok) {
          throw new Error(
            data.error || (bn ? "সার্চ করা যায়নি।" : "Medicine search failed."),
          );
        }

        setSearchedQueries(Array.isArray(data.queries) ? data.queries : []);
        setBundles(Array.isArray(data.bundles) ? data.bundles : []);
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

  const count = medicineCount(query);

  return (
    <section className={styles.section}>
      <form onSubmit={submit} className={styles.search}>
        <div className={styles.searchHeading}>
          <div>
            <label className={styles.searchLabel} htmlFor="medicine-seller-q">
              {bn ? "ওষুধের তালিকা" : "Medicine list"}
            </label>
            <p>
              {bn
                ? "কমা দিয়ে বা নতুন লাইনে সর্বোচ্চ ১০টি ওষুধ লিখুন।"
                : "Enter up to 10 medicines, separated by commas or new lines."}
            </p>
          </div>
          <span className={styles.counter}>{count}/10</span>
        </div>

        <textarea
          id="medicine-seller-q"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value.slice(0, 1_000))}
          required
          maxLength={1_000}
          rows={4}
          placeholder={
            bn
              ? "যেমন:\nNapa 500\nFexo 120\nMonas 10"
              : "e.g.\nNapa 500\nFexo 120\nMonas 10"
          }
        />

        <div className={styles.searchActions}>
          <span>
            {bn
              ? "মোট হিসাব এক প্যাক/লিস্টিং করে দেখানো হয় যখন লাইভ মূল্য নির্ভরযোগ্যভাবে পাওয়া যায়।"
              : "Totals use one listed pack per medicine when a live seller price can be read reliably."}
          </span>

          <button
            className="hc-action-button"
            data-action="search"
            type="submit"
            disabled={busy}
          >
            <span>
              {busy
                ? bn
                  ? "মূল্য খোঁজা হচ্ছে"
                  : "Checking prices"
                : bn
                  ? "সব ফার্মেসি তুলনা করুন"
                  : "Compare pharmacies"}
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

      {busy && (
        <div className={styles.loading} aria-live="polite">
          <span className={styles.loadingDot} />
          <div>
            <strong>{bn ? "ফার্মেসিগুলো দেখা হচ্ছে" : "Checking pharmacies"}</strong>
            <p>
              {bn
                ? "প্রতিটি ওষুধের বর্তমান লিস্টিং ও মূল্য মিলিয়ে দেখা হচ্ছে।"
                : "Matching each medicine with current seller listings and readable prices."}
            </p>
          </div>
        </div>
      )}

      {bundles && !busy && (
        <div className={styles.resultsSection} aria-live="polite">
          <div className={styles.resultsHeading}>
            <p className={styles.kicker}>
              {bn ? "ফার্মেসি তুলনা" : "PHARMACY COMPARISON"}
            </p>
            <h2>
              {bn
                ? `${searchedQueries.length}টি ওষুধ · ${bundles.length}টি ফার্মেসি`
                : `${searchedQueries.length} medicines · ${bundles.length} pharmacies`}
            </h2>
            <p>
              {bn
                ? "যেখানে লাইভ মূল্য পাওয়া গেছে সেখানে একসাথে মোট দেখানো হয়েছে।"
                : "A combined total is shown when every requested medicine has a readable live price on that seller."}
            </p>
          </div>

          <div className={styles.results}>
            {bundles.map((bundle) => (
              <article className={styles.sellerCard} key={bundle.platform}>
                <div className={styles.sellerHeader}>
                  <div>
                    <p className={styles.platform}>{bundle.platform}</p>
                    <h3>
                      {bundle.totalComplete && bundle.totalPrice !== null
                        ? `${bundle.currency} ${money(bundle.totalPrice)}`
                        : bundle.pricedCount
                          ? bn
                            ? `পাওয়া মূল্যের যোগফল: ${bundle.currency} ${money(bundle.knownTotal)}`
                            : `Known prices: ${bundle.currency} ${money(bundle.knownTotal)}`
                          : bn
                            ? "লাইভ মোট মূল্য পাওয়া যায়নি"
                            : "Live total unavailable"}
                    </h3>
                  </div>

                  <span
                    className={`${styles.priceStatus} ${
                      bundle.totalComplete ? styles.complete : ""
                    }`}
                  >
                    {bundle.totalComplete
                      ? bn
                        ? "সম্পূর্ণ মোট"
                        : "Complete total"
                      : `${bundle.pricedCount}/${bundle.itemCount} ${
                          bn ? "মূল্য" : "priced"
                        }`}
                  </span>
                </div>

                <div className={styles.medicineList}>
                  {bundle.items.map((item) => (
                    <div className={styles.medicineRow} key={`${bundle.platform}-${item.query}`}>
                      <div>
                        <strong>{item.query}</strong>
                        <span>
                          {typeof item.price === "number"
                            ? bn
                              ? "লাইভ লিস্টিং মূল্য"
                              : "Live listed price"
                            : bn
                              ? "বিক্রেতার ওয়েবসাইটে নিশ্চিত করুন"
                              : "Confirm on seller website"}
                        </span>
                      </div>

                      <div className={styles.itemPrice}>
                        <strong>
                          {typeof item.price === "number"
                            ? `${item.currency || "BDT"} ${money(item.price)}`
                            : "—"}
                        </strong>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {bn ? "লিস্টিং" : "Listing"}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.sellerFooter}>
                  <p>
                    {bundle.cartHandoffAvailable
                      ? bn
                        ? "তালিকার ওষুধগুলো কার্টে পাঠিয়ে বিক্রেতার ওয়েবসাইট খোলা হবে।"
                        : "The requested medicines will be handed to the seller cart before redirecting."
                      : bn
                        ? "এই ফার্মেসি এখনো অন্য ওয়েবসাইট থেকে কার্টে ওষুধ যোগ করার সমর্থিত লিংক/API দেয় না। তাই ভুয়া cart action না করে সরাসরি বিক্রেতার সাইট খোলা হচ্ছে।"
                        : "This pharmacy does not currently expose a supported cross-site cart link/API. Healthcare Central therefore opens the seller instead of pretending items were added to its cart."}
                  </p>

                  <a
                    className="hc-action-button"
                    data-action="arrow"
                    href={bundle.sellerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{bn ? "ওয়েবসাইট দেখুন" : "Visit website"}</span>
                    <ActionGlyph kind="arrow" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          <p className={styles.disclaimer}>
            {bn
              ? "Healthcare Central ওষুধ বিক্রি করে না এবং মূল্য বা স্টক নিয়ন্ত্রণ করে না। অর্ডারের আগে নাম, strength, dosage form, pack size, prescription requirement, stock এবং final checkout price অবশ্যই মূল ফার্মেসিতে নিশ্চিত করুন।"
              : "Healthcare Central does not sell medicines or control seller price/stock. Before ordering, confirm the exact name, strength, dosage form, pack size, prescription requirement, stock and final checkout price on the pharmacy website."}
          </p>
        </div>
      )}
    </section>
  );
}
