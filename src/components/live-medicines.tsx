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
  const completeTotals = (bundles || [])
    .filter(
      (bundle) =>
        bundle.totalComplete &&
        typeof bundle.totalPrice === "number" &&
        Number.isFinite(bundle.totalPrice),
    )
    .map((bundle) => bundle.totalPrice as number);
  const lowestComparableTotal = completeTotals.length
    ? Math.min(...completeTotals)
    : null;

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
              ? "Healthcare Central প্রতিটি ফার্মেসিতে পাওয়া লাইভ মূল্য আলাদা করে দেখায়। সব ওষুধের মূল্য পাওয়া গেলে তুলনার জন্য subtotal হিসাব করা হয়।"
              : "Healthcare Central shows every live pharmacy price it can read. When all requested prices are available for a seller, a comparable subtotal is calculated here."}
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
                  ? "ফার্মেসি তুলনা করুন"
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
              {bn ? "মূল্য তুলনা" : "PRICE COMPARISON"}
            </p>
            <h2>
              {bn
                ? `${searchedQueries.length}টি ওষুধ · ফার্মেসি অনুযায়ী মূল্য`
                : `${searchedQueries.length} medicines · prices by pharmacy`}
            </h2>
            <p>
              {bn
                ? "প্রতিটি ওষুধের মূল্য আলাদা করে দেখুন। Healthcare Central কোনো মূল্য বানিয়ে দেখায় না—লাইভ মূল্য নির্ভরযোগ্যভাবে পাওয়া না গেলে সরাসরি লিস্টিং খুলুন।"
                : "See each medicine price separately. Healthcare Central never invents a price; when a live price cannot be read reliably, open the original listing to check it."}
            </p>
          </div>

          <div className={styles.results}>
            {bundles.map((bundle) => {
              const hasComparableTotal =
                bundle.totalComplete && bundle.totalPrice !== null;
              const isLowest =
                hasComparableTotal &&
                lowestComparableTotal !== null &&
                bundle.totalPrice === lowestComparableTotal;

              return (
                <article className={styles.sellerCard} key={bundle.platform}>
                  <div className={styles.sellerHeader}>
                    <div>
                      <p className={styles.platform}>{bundle.platform}</p>
                      <h3>
                        {hasComparableTotal
                          ? `${bn ? "তুলনাযোগ্য subtotal" : "Comparable subtotal"}: ${bundle.currency} ${money(bundle.totalPrice as number)}`
                          : bn
                            ? "প্রতিটি ওষুধের মূল্য নিচে দেখুন"
                            : "See individual prices below"}
                      </h3>
                    </div>

                    {isLowest && (
                      <span className={`${styles.priceStatus} ${styles.complete}`}>
                        {bn ? "সর্বনিম্ন সম্পূর্ণ subtotal" : "Lowest complete subtotal"}
                      </span>
                    )}
                  </div>

                  <div className={styles.medicineList}>
                    {bundle.items.map((item) => (
                      <div className={styles.medicineRow} key={`${bundle.platform}-${item.query}`}>
                        <div>
                          <strong>{item.query}</strong>
                          <span>
                            {typeof item.price === "number"
                              ? bn
                                ? "বর্তমান পাওয়া লিস্টিং মূল্য"
                                : "Current readable listing price"
                              : bn
                                ? "স্বয়ংক্রিয়ভাবে মূল্য পাওয়া যায়নি"
                                : "Price not readable automatically"}
                          </span>
                        </div>

                        <div className={styles.itemPrice}>
                          <strong className={typeof item.price === "number" ? styles.livePrice : styles.missingPrice}>
                            {typeof item.price === "number"
                              ? `${item.currency || "BDT"} ${money(item.price)}`
                              : bn
                                ? "ওয়েবসাইটে দেখুন"
                                : "Check website"}
                          </strong>
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              {bn ? "এই ওষুধের লিস্টিং খুলুন" : "Open this medicine listing"}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.sellerFooter}>
                    <p>
                      {hasComparableTotal
                        ? bn
                          ? "উপরের subtotal শুধুমাত্র এই ফার্মেসিতে পাওয়া প্রতিটি অনুরোধকৃত ওষুধের বর্তমান readable price যোগ করে হিসাব করা হয়েছে। Checkout price, discount ও delivery charge পরিবর্তিত হতে পারে।"
                          : "This subtotal is calculated only from the readable current price of every requested medicine on this pharmacy. Checkout price, discounts and delivery fees may differ."
                        : bn
                          ? "যে মূল্যগুলো পাওয়া গেছে সেগুলো আলাদাভাবে দেখানো হয়েছে। তুলনামূলক subtotal দেখানো হয়নি, কারণ সব ওষুধের নির্ভরযোগ্য live price পাওয়া যায়নি।"
                          : "Readable prices are shown individually. No comparison subtotal is shown because not every requested medicine has a reliable live price on this seller."}
                    </p>

                    <a
                      className="hc-action-button"
                      data-action="arrow"
                      href={bundle.sellerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{bn ? "ফার্মেসি ওয়েবসাইট খুলুন" : "Visit pharmacy website"}</span>
                      <ActionGlyph kind="arrow" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          <p className={styles.disclaimer}>
            {bn
              ? "Healthcare Central ওষুধ বিক্রি করে না এবং মূল্য বা স্টক নিয়ন্ত্রণ করে না। অর্ডারের আগে নাম, strength, dosage form, pack size, prescription requirement, stock এবং final checkout price মূল ফার্মেসিতে নিশ্চিত করুন।"
              : "Healthcare Central does not sell medicines or control seller price/stock. Before ordering, confirm the exact name, strength, dosage form, pack size, prescription requirement, stock and final checkout price on the pharmacy website."}
          </p>
        </div>
      )}
    </section>
  );
}
