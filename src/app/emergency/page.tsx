import Link from "next/link";
import { configured, supabase } from "@/lib/supabase/server";
import { healthcareLocations } from "@/lib/locations";
import styles from "./emergency.module.css";

type EmergencyRow = {
  id: string;
  service_name: string;
  driver_phone: string | null;
  location: string | null;
  city: string | null;
  hospital_name: string | null;
  availability: string | null;
};

function normalizeLocation(value: unknown) {
  if (typeof value !== "string") return "";

  return (
    healthcareLocations.find(
      (item) => item.toLowerCase() === value.trim().toLowerCase(),
    ) || ""
  );
}

function phoneHref(value: string) {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

export default async function EmergencyPage({
  searchParams,
}: {
  searchParams: Promise<{
    location?: string;
    lang?: string;
  }>;
}) {
  const params = await searchParams;

  const location = normalizeLocation(params.location);
  const bn = params.lang === "bn";

  let rows: EmergencyRow[] = [];
  let lookupAvailable = true;

  if (location && configured()) {
    const db = await supabase();

    const { data, error } = await db.rpc(
      "search_public_ambulances",
      {
        location_filter: location,
      },
    );

    if (error) {
      lookupAvailable = false;
    } else {
      rows = (data || []) as EmergencyRow[];
    }
  }

  return (
    <div className={styles.page}>
      {/* =========================
          EMERGENCY HERO
         ========================= */}

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.kicker}>
              {bn
                ? "জরুরি সহায়তা"
                : "EMERGENCY / জরুরি সহায়তা"}
            </p>

            <h1>
              {bn
                ? "জরুরি সহায়তা প্রয়োজন?"
                : "Need urgent help?"}
            </h1>

            <p>
              {bn
                ? "এলাকা নির্বাচন করে তালিকাভুক্ত অ্যাম্বুলেন্স যোগাযোগ দেখুন। লগ ইন প্রয়োজন নেই।"
                : "Choose your area to see listed ambulance contacts. No login required."}
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          MAIN CONTENT
         ========================= */}

      <section className={styles.content}>
        {/* =========================
            NATIONAL HOTLINES
           ========================= */}

        <div className={styles.hotlines}>
          <article>
            <strong>999</strong>

            <span>
              {bn
                ? "জাতীয় জরুরি সেবা — জীবন-ঝুঁকিপূর্ণ জরুরি অবস্থার জন্য"
                : "National emergency service — for life-threatening emergencies"}
            </span>

            <a href="tel:999">
              {bn ? "৯৯৯ নম্বরে কল করুন" : "Call 999"}
            </a>
          </article>

          <article>
            <strong>16263</strong>

            <span>
              {bn
                ? "স্বাস্থ্য বাতায়ন — স্বাস্থ্য পরামর্শের জন্য"
                : "Shasthyo Batayon — for health advice"}
            </span>

            <a href="tel:16263">
              {bn ? "১৬২৬৩ নম্বরে কল করুন" : "Call 16263"}
            </a>
          </article>
        </div>

        {/* =========================
            LOCATION SEARCH
           ========================= */}

        <form
          className={styles.locationCard}
          method="get"
        >
          {bn && (
            <input
              type="hidden"
              name="lang"
              value="bn"
            />
          )}

          <div>
            <p className={styles.smallLabel}>
              {bn
                ? "এলাকা নির্বাচন"
                : "SELECT YOUR AREA"}
            </p>

            <h2>
              {bn
                ? "কাছাকাছি অ্যাম্বুলেন্স যোগাযোগ খুঁজুন"
                : "Find ambulance contacts near you"}
            </h2>
          </div>

          <label>
            <span className={styles.srOnly}>
              {bn ? "এলাকা" : "Location"}
            </span>

            <select
              name="location"
              defaultValue={location}
            >
              <option value="">
                {bn
                  ? "এলাকা নির্বাচন করুন"
                  : "Choose a location"}
              </option>

              {healthcareLocations.map((item) => (
                <option
                  value={item}
                  key={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button type="submit">
            {bn
              ? "যোগাযোগ খুঁজুন"
              : "Find contacts"}
          </button>
        </form>

        {/* =========================
            DATABASE ERROR
           ========================= */}

        {location && !lookupAvailable && (
          <div className={styles.guidance}>
            <strong>
              {bn
                ? "অ্যাম্বুলেন্স তালিকা এখন পাওয়া যাচ্ছে না।"
                : "Ambulance lookup is unavailable."}
            </strong>

            <span>
              Run migration
              {" "}
              <code>
                003_public_emergency_directory.sql
              </code>
              {" "}
              in Supabase.
            </span>
          </div>
        )}

        {/* =========================
            RESULTS
           ========================= */}

        {location && lookupAvailable && (
          <section className={styles.resultsSection}>
            <div className={styles.resultsHeading}>
              <div>
                <p className={styles.smallLabel}>
                  {bn
                    ? "অ্যাম্বুলেন্স যোগাযোগ"
                    : "AMBULANCE CONTACTS"}
                </p>

                <h2>{location}</h2>
              </div>

              <Link href={bn ? "/?lang=bn" : "/"}>
                {bn
                  ? "হোমপেজে ফিরুন"
                  : "Back to homepage"}
              </Link>
            </div>

            {rows.length ? (
              <div className={styles.resultsGrid}>
                {rows.map((row) => (
                  <article
                    className={styles.resultCard}
                    key={row.id}
                  >
                    <div className={styles.resultTop}>
                      <div>
                        <h3>{row.service_name}</h3>

                        <p>
                          {[row.location, row.city]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>

                    {row.hospital_name && (
                      <p className={styles.meta}>
                        <strong>
                          {bn
                            ? "হাসপাতাল:"
                            : "Hospital:"}
                        </strong>
                        {" "}
                        {row.hospital_name}
                      </p>
                    )}

                    {row.availability && (
                      <p className={styles.meta}>
                        <strong>
                          {bn
                            ? "সময়:"
                            : "Availability:"}
                        </strong>
                        {" "}
                        {row.availability}
                      </p>
                    )}

                    {row.driver_phone ? (
                      <a
                        className={styles.callButton}
                        href={phoneHref(
                          row.driver_phone,
                        )}
                      >
                        {bn
                          ? `কল করুন ${row.driver_phone}`
                          : `Call ${row.driver_phone}`}
                      </a>
                    ) : (
                      <span
                        className={
                          styles.noPhone
                        }
                      >
                        {bn
                          ? "ফোন নম্বর দেওয়া নেই"
                          : "Phone not listed"}
                      </span>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <h3>
                  {bn
                    ? "এই এলাকায় বর্তমানে কোনো অ্যাম্বুলেন্স যোগাযোগ তালিকাভুক্ত নেই।"
                    : "No ambulance contact is currently listed for this area."}
                </h3>

                <a href="tel:999">
                  {bn
                    ? "৯৯৯ নম্বরে কল করুন"
                    : "Call 999"}
                </a>
              </div>
            )}
          </section>
        )}
      </section>
    </div>
  );
}
