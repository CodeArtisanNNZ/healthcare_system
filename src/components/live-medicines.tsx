"use client";

import { useState, type FormEvent } from "react";
import type { Offer } from "@/lib/medicine-utils";
import styles from "./live-medicines.module.css";

export function LiveMedicines() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sortLow, setSortLow] = useState(true);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("q");

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
        throw new Error(data.error || "Search failed");
      }

      setOffers(Array.isArray(data.offers) ? data.offers : []);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Search unavailable",
      );
    } finally {
      setBusy(false);
    }
  }

  const sorted =
    offers &&
    [...offers].sort((a, b) => {
      if (!sortLow) return 0;

      const left =
        a.currency === "BDT" && typeof a.price === "number"
          ? a.price
          : Infinity;

      const right =
        b.currency === "BDT" && typeof b.price === "number"
          ? b.price
          : Infinity;

      return left - right;
    });

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>LIVE SELLER SEARCH</p>
          <h2>Compare pharmacy websites</h2>
        </div>

        {offers && (
          <button
            className={styles.sortButton}
            type="button"
            onClick={() => setSortLow((current) => !current)}
          >
            {sortLow ? "Original order" : "Lowest listed price"}
          </button>
        )}
      </div>

      <p className={styles.intro}>
        Search participating seller websites. Healthcare Central does not sell
        the medicine; the purchase is completed on the original seller website.
      </p>

      <form onSubmit={search} className={styles.search}>
        <label className="sr-only" htmlFor="live-medicine-q">
          Medicine
        </label>

        <input
          id="live-medicine-q"
          name="q"
          required
          minLength={2}
          maxLength={100}
          placeholder="Medicine name and strength"
        />

        <button disabled={busy}>
          {busy ? "Checking sellers..." : "Compare sellers"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {sorted && (
        <div className={styles.results} aria-live="polite">
          {sorted.map((offer) => (
            <article className={styles.offer} key={offer.platform}>
              <div>
                <p className={styles.platform}>{offer.platform}</p>

                {offer.found ? (
                  <>
                    <h3>{offer.title || "Medicine listing"}</h3>
                    {offer.description && (
                      <p className={styles.description}>
                        {offer.description}
                      </p>
                    )}
                  </>
                ) : (
                  <p className={styles.description}>
                    {offer.error || "No matching listing found."}
                  </p>
                )}
              </div>

              {offer.found && (
                <div className={styles.offerAction}>
                  <strong>
                    {typeof offer.price === "number"
                      ? `${offer.currency || "BDT"} ${offer.price}`
                      : "Price unavailable"}
                  </strong>

                  {offer.url ? (
                    <a href={offer.url} target="_blank" rel="noreferrer">
                      Buy on {offer.platform} ↗
                    </a>
                  ) : (
                    <span>Seller link unavailable</span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {offers && (
        <p className={styles.disclaimer}>
          Prices may refer to different pack sizes. Confirm product, pack size,
          availability, delivery charge and final price on the seller website.
        </p>
      )}
    </section>
  );
}
