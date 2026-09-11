"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { healthcareLocations } from "@/lib/locations";

const categories = [
  { id: "doctor", label: "Doctor", icon: "✚", path: "/doctors", supportsLocation: true },
  { id: "medicine", label: "Medicine", icon: "◒", path: "/medicines", supportsLocation: false },
  { id: "caregiver", label: "Caregiver", icon: "♡", path: "/caregivers", supportsLocation: true },
  { id: "lab-test", label: "Lab test", icon: "⌁", path: "/lab-tests", supportsLocation: true },
  { id: "ambulance", label: "Ambulance", icon: "✚", path: "/emergency", supportsLocation: true },
  { id: "hospital", label: "Hospital", icon: "▦", path: "/hospitals", supportsLocation: true },
] as const;

type Category = (typeof categories)[number];

export function AwareMinds() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>(categories[0]);
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const cleanedQuery = query.trim();

    if (cleanedQuery) params.set("q", cleanedQuery);
    if (category.supportsLocation && location) params.set("location", location);

    const suffix = params.toString() ? `?${params.toString()}` : "";
    router.push(`${category.path}${suffix}`);
  }

  return (
    <section className="aware-shell" aria-labelledby="aware-minds-title">
      <div className="aware-header">
        <div className="aware-mark" aria-hidden="true">AM</div>
        <div>
          <p className="eyebrow">AWARE MINDS AI</p>
          <h1 id="aware-minds-title">How can I help you today?</h1>
          <p className="muted">
            Choose what you need, select your location and describe your problem in the way that feels natural to you.
          </p>
        </div>
      </div>

      <div className="aware-category-row" aria-label="Healthcare search category">
        {categories.map((item) => (
          <button
            type="button"
            key={item.id}
            className={item.id === category.id ? "aware-category active" : "aware-category"}
            onClick={() => setCategory(item)}
            aria-pressed={item.id === category.id}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <form className="aware-form" onSubmit={submit}>
        <div className="aware-location">
          <label htmlFor="aware-location">Location</label>
          <select
            id="aware-location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            disabled={!category.supportsLocation}
          >
            <option value="">
              {category.supportsLocation ? "All locations" : "Location not needed"}
            </option>
            {healthcareLocations.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="aware-chat-box">
          <label className="sr-only" htmlFor="aware-query">Describe what you need</label>
          <textarea
            id="aware-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={160}
            placeholder="Describe what you need in English, বাংলা or Banglish..."
          />
          <div className="aware-chat-footer">
            <span>
              Searching: <strong>{category.label}</strong>
              {category.supportsLocation && location ? ` · ${location}` : ""}
            </span>
            <button type="submit">Search →</button>
          </div>
        </div>
      </form>

      <p className="aware-safety">
        Aware Minds is designed to help you navigate healthcare services. It is not a diagnosis tool. For a medical emergency, seek urgent professional care.
      </p>
    </section>
  );
}
