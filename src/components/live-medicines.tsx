"use client";
import { useState, type FormEvent } from "react";
import type { Offer } from "@/lib/medicine-utils";
export function LiveMedicines() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState(false);
  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
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
      if (!response.ok) throw new Error(data.error || "Search failed");
      setOffers(data.offers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search unavailable");
    } finally {
      setBusy(false);
    }
  }
  const sorted =
    offers &&
    [...offers].sort((a, b) =>
      sort
        ? ((a.currency === "BDT" ? a.price : null) ?? Infinity) -
          ((b.currency === "BDT" ? b.price : null) ?? Infinity)
        : 0,
    );
  return (
    <section className="section">
      <h2>Compare pharmacy listings</h2>
      <p className="muted">
        Sign in to search the four pharmacy sources from the original
        application. Confirm the exact product, strength, pack size and final
        price on the seller’s website.
      </p>
      <form onSubmit={search} className="search">
        <label className="sr-only" htmlFor="live-q">
          Medicine name
        </label>
        <input
          name="q"
          id="live-q"
          required
          minLength={2}
          maxLength={100}
          placeholder="Medicine name and strength"
        />
        <button disabled={busy}>
          {busy ? "Checking pharmacies…" : "Compare listings"}
        </button>
      </form>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {offers && (
        <>
          <button className="secondary" onClick={() => setSort(!sort)}>
            {sort
              ? "Show original order"
              : "Sort listed BDT prices: low to high"}
          </button>
          <p className="muted">
            Listed prices may refer to different pack sizes and are not
            equivalent per-unit comparisons.
          </p>
        </>
      )}
      <div className="cards" aria-live="polite">
        {sorted?.map((o) => (
          <article className="card" key={o.platform}>
            <p className="eyebrow">{o.platform}</p>
            {o.found ? (
              <>
                <h3>{o.title}</h3>
                <p>{o.description}</p>
                <p>
                  <strong>
                    {o.price !== null && o.price !== undefined
                      ? `${o.currency} ${o.price}`
                      : "Price unavailable"}
                  </strong>
                </p>
                <p className="muted">{o.source}</p>
                <a
                  className="button secondary"
                  href={o.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View seller ↗
                </a>
              </>
            ) : (
              <p>{o.error || "No matching listing found."}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
