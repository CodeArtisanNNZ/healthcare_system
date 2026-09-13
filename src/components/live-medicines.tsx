"use client";

import { useState, type FormEvent } from "react";
import type { Offer } from "@/lib/medicine-utils";
import styles from "./live-medicines.module.css";

export function LiveMedicines() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const q = String(form.get("q") || "").trim();

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
        throw new Error(data.error || "Search failed.");
      }

      setOffers(Array.isArray(data.offers) ? data.offers : []);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Medicine seller search is unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>SELLER COMPARISON</p>
          <h2>Check the medicine across pharmacy websites</h2>
        </div>
      </div>

      <p className={styles.intro}>
        Search once and open several Bangladesh pharmacy websites from the same
        place. Final price, pack size and availability must be confirmed on the
        original seller website.
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
          {busy ? "Finding sellers..." : "Show seller options"}
        </button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {offers && (
        <div className={styles.results} aria-live="polite">
          {offers.map((offer) => (
            <article className={styles.offer} key={offer.platform}>
              <div>
                <p className={styles.platform}>{offer.platform}</p>
                <h3>{offer.title || "Medicine search"}</h3>
                <p className={styles.description}>
                  {offer.description || "Open the seller website to continue."}
                </p>
              </div>

              <div className={styles.offerAction}>
                <strong>
                  {typeof offer.price === "number"
                    ? `${offer.currency || "BDT"} ${offer.price}`
                    : "Check live price"}
                </strong>

                {offer.url && (
                  <a href={offer.url} target="_blank" rel="noreferrer">
                    Check price &amp; buy
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {offers && (
        <p className={styles.disclaimer}>
          Healthcare Central does not sell medicine. Confirm the exact medicine,
          strength, pack size, prescription requirements, availability and final
          price with the seller before purchase.
        </p>
      )}
    </section>
  );
}
