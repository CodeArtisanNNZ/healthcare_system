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
  searchParams: Promise<{ location?: string }>;
}) {
  const params = await searchParams;
  const location = normalizeLocation(params.location);
  let rows: EmergencyRow[] = [];
  let lookupAvailable = true;

  if (location && configured()) {
    const db = await supabase();
    const { data, error } = await db.rpc("search_public_ambulances", {
      location_filter: location,
    });

    if (error) {
      lookupAvailable = false;
    } else {
      rows = (data || []) as EmergencyRow[];
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <p className={styles.kicker}>EMERGENCY</p>
            <h1>
              Need an ambulance
              <br />
              right now?
            </h1>
            <p>
              Find public ambulance contact numbers for your selected area.
              No login required.
            </p>
          </div>

          <div className={styles.heroAction}>
            <span>National emergency service</span>
            <a href="tel:16263">Call 16263</a>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <form className={styles.locationCard} method="get">
          <div>
            <p className={styles.smallLabel}>SELECT YOUR AREA</p>
            <h2>Show ambulance contacts near you</h2>
          </div>

          <label>
            <span className={styles.srOnly}>Location</span>
            <select name="location" defaultValue={location}>
              <option value="">Choose a location</option>
              {healthcareLocations.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button type="submit">Find ambulance contacts →</button>
        </form>

        {!location && (
          <div className={styles.guidance}>
            <strong>Select your area above.</strong>
            <span>
              We will show active ambulance contacts listed for that location.
            </span>
          </div>
        )}

        {location && !lookupAvailable && (
          <div className={styles.guidance}>
            <strong>Public ambulance lookup is not installed yet.</strong>
            <span>
              Run <code>003_public_emergency_directory.sql</code> in Supabase.
              National emergency service 16263 remains available.
            </span>
          </div>
        )}

        {location && lookupAvailable && (
          <section className={styles.resultsSection}>
            <div className={styles.resultsHeading}>
              <div>
                <p className={styles.smallLabel}>AMBULANCE CONTACTS</p>
                <h2>{location}</h2>
              </div>
              <Link href="/">Back to Healthcare Central</Link>
            </div>

            {rows.length ? (
              <div className={styles.resultsGrid}>
                {rows.map((row) => (
                  <article className={styles.resultCard} key={row.id}>
                    <div className={styles.resultTop}>
                      <span className={styles.ambulanceIcon} aria-hidden="true">
                        +
                      </span>
                      <div>
                        <h3>{row.service_name}</h3>
                        <p>
                          {[row.location, row.city].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>

                    {row.hospital_name && (
                      <p className={styles.meta}>
                        <strong>Hospital:</strong> {row.hospital_name}
                      </p>
                    )}

                    {row.availability && (
                      <p className={styles.meta}>
                        <strong>Availability:</strong> {row.availability}
                      </p>
                    )}

                    {row.driver_phone ? (
                      <a
                        className={styles.callButton}
                        href={phoneHref(row.driver_phone)}
                      >
                        Call {row.driver_phone}
                      </a>
                    ) : (
                      <span className={styles.noPhone}>Phone not listed</span>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <h3>No ambulance contact is currently listed for this area.</h3>
                <p>
                  For a life-threatening emergency, use the national emergency
                  number.
                </p>
                <a href="tel:16263">Call 16263</a>
              </div>
            )}
          </section>
        )}

        <div className={styles.bottomBar}>
          <div>
            <strong>Life-threatening emergency?</strong>
            <span>Call the national emergency service immediately.</span>
          </div>
          <a href="tel:16263">Call 16263</a>
        </div>
      </section>
    </div>
  );
}
