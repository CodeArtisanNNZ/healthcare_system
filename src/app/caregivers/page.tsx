import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import styles from "./caregivers.module.css";

const situations = [
  {
    title: "An older parent needs daily help",
    description: "Companionship, meals, personal care and support with everyday routines.",
    tag: "Elder care",
    href: "/caregivers/request?care_type=Elder%20companion&patient_type=Older%20adult",
  },
  {
    title: "There are memory or dementia concerns",
    description: "Supervision, familiar routines and support for confusion or memory loss.",
    tag: "Dementia support",
    href: "/caregivers/request?care_type=Dementia%20support&patient_type=Dementia%20or%20Alzheimer%27s",
  },
  {
    title: "The patient is bedridden or recovering",
    description: "Help with mobility, positioning, feeding and day-to-day comfort at home.",
    tag: "Recovery care",
    href: "/caregivers/request?care_type=Bedridden%20patient%20care&patient_type=Bedridden%20patient",
  },
  {
    title: "Clinical care may be needed at home",
    description: "For needs that may require a trained nurse rather than general daily support.",
    tag: "Home nursing",
    href: "/caregivers/request?care_type=Home%20nursing&patient_type=Chronic%20illness",
  },
];

const scheduleOptions = [
  "A few hours",
  "Day support",
  "Night support",
  "24-hour care",
  "Short-term",
  "Ongoing",
];

function ServiceIcon({ kind }: { kind: "daily" | "memory" | "recovery" | "nursing" }) {
  if (kind === "memory") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 4.8A4.2 4.2 0 0 1 16 8v.7a4 4 0 0 1 2.3 3.6 4 4 0 0 1-2.8 3.8A4.2 4.2 0 0 1 8 17.8 4 4 0 0 1 5.7 14 4 4 0 0 1 8 10.4V8.8A4 4 0 0 1 9 4.8Z" />
        <path d="M10 8.5c1.7.2 2.8 1.1 3.3 2.7M9.5 14c1-.9 2.2-1.2 3.7-.8" />
      </svg>
    );
  }

  if (kind === "recovery") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12h4l2-4 3 8 2-4h3" />
        <path d="M12 21s-7-4.3-7-10.3A4.7 4.7 0 0 1 13 7a4.7 4.7 0 0 1 8 3.7C21 16.7 14 21 12 21Z" />
      </svg>
    );
  }

  if (kind === "nursing") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 4h8v16H8zM5 8h14" />
        <path d="M12 10v6M9 13h6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 20c.7-4 2.8-6 6.5-6s5.8 2 6.5 6" />
      <path d="M19 6.5h3M20.5 5v3" />
    </svg>
  );
}

export default async function CaregiversPage() {
  await requireUser("patient");
  const db = await supabase();

  const { data: providers } = await db
    .from("caregivers")
    .select("id,full_name,services,location,verification_status,provider_type")
    .eq("status", "Active")
    .eq("provider_type", "Organization")
    .order("full_name")
    .limit(4);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>HOME CARE</span>
          <h1>Find the right care for someone you love.</h1>
          <p>
            Explore the type of support that may fit the situation. When you are
            ready, tell Healthcare Central what is needed and an administrator
            will review suitable caregivers or care providers.
          </p>

          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/caregivers/request">
              I know what I need
            </Link>
            <a className={styles.secondaryAction} href="#choose-care">
              Help me choose
            </a>
          </div>

          <Link className={styles.historyLink} href="/patient/caregiver-requests">
            View my caregiver requests →
          </Link>
        </div>

        <div className={styles.heroGuide}>
          <div className={styles.guideTop}>
            <span className={styles.guideBadge}>START HERE</span>
            <strong>What do you need help with?</strong>
          </div>

          <div className={styles.quickChoices}>
            <a href="#situations">
              <span className={styles.quickNumber}>01</span>
              <span>
                <strong>Explore care options</strong>
                <small>See common situations and support types</small>
              </span>
            </a>
            <Link href="/caregivers/request">
              <span className={styles.quickNumber}>02</span>
              <span>
                <strong>Request a caregiver</strong>
                <small>Share patient, schedule and location needs</small>
              </span>
            </Link>
            <a href="#choose-care">
              <span className={styles.quickNumber}>03</span>
              <span>
                <strong>Not sure what you need?</strong>
                <small>Compare caregiver support with nursing care</small>
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className={styles.section} id="situations">
        <div className={styles.sectionHeading}>
          <span>WHAT IS HAPPENING AT HOME?</span>
          <h2>Start with the situation, not a medical label.</h2>
          <p>
            Choose the closest match. You can change the details before sending
            the request.
          </p>
        </div>

        <div className={styles.situationGrid}>
          {situations.map((item, index) => (
            <Link className={styles.situationCard} href={item.href} key={item.title}>
              <div className={styles.iconBox}>
                <ServiceIcon
                  kind={
                    index === 1
                      ? "memory"
                      : index === 2
                        ? "recovery"
                        : index === 3
                          ? "nursing"
                          : "daily"
                  }
                />
              </div>
              <span className={styles.cardTag}>{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <span className={styles.cardLink}>Use this as a starting point →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.chooseSection} id="choose-care">
        <div className={styles.chooseIntro}>
          <span>CAREGIVER OR NURSE?</span>
          <h2>You do not need to know the terminology first.</h2>
          <p>
            A caregiver mainly supports daily living and supervision. A nurse is
            more appropriate when clinical procedures or skilled nursing are
            required.
          </p>
        </div>

        <div className={styles.compareGrid}>
          <article className={styles.compareCard}>
            <div className={styles.compareHeader}>
              <div className={styles.compareIcon}>
                <ServiceIcon kind="daily" />
              </div>
              <div>
                <span>DAILY SUPPORT</span>
                <h3>Caregiver</h3>
              </div>
            </div>
            <ul>
              <li>Companionship and supervision</li>
              <li>Meals, hygiene and everyday routines</li>
              <li>Mobility and transfer assistance</li>
              <li>Elderly or dementia support</li>
            </ul>
            <Link href="/caregivers/request?care_type=General%20personal%20care">
              Request caregiver support →
            </Link>
          </article>

          <article className={styles.compareCard}>
            <div className={styles.compareHeader}>
              <div className={styles.compareIcon}>
                <ServiceIcon kind="nursing" />
              </div>
              <div>
                <span>CLINICAL SUPPORT</span>
                <h3>Home nurse</h3>
              </div>
            </div>
            <ul>
              <li>Wound or post-operative nursing needs</li>
              <li>Clinical monitoring or procedures</li>
              <li>Care requiring trained nursing skills</li>
              <li>Support directed by a clinician</li>
            </ul>
            <Link href="/caregivers/request?care_type=Home%20nursing">
              Request home nursing →
            </Link>
          </article>
        </div>
      </section>

      <section className={styles.scheduleSection}>
        <div>
          <span>FLEXIBLE AROUND THE FAMILY</span>
          <h2>Care can be arranged around different schedules.</h2>
        </div>
        <div className={styles.scheduleChips}>
          {scheduleOptions.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className={styles.process}>
        <div className={styles.sectionHeading}>
          <span>HOW HEALTHCARE CENTRAL WORKS</span>
          <h2>You describe the need. We coordinate the match.</h2>
        </div>

        <div className={styles.steps}>
          <article>
            <strong>01</strong>
            <h3>Tell us about the care</h3>
            <p>
              Patient situation, preferred gender, area, schedule, duration and
              budget.
            </p>
          </article>
          <article>
            <strong>02</strong>
            <h3>Admin reviews suitable options</h3>
            <p>
              Individual caregivers and provider organizations are compared
              against the request.
            </p>
          </article>
          <article>
            <strong>03</strong>
            <h3>Assignment is confirmed</h3>
            <p>
              The patient receives the confirmed caregiver or provider and
              contact instructions.
            </p>
          </article>
        </div>
      </section>

      {providers?.length ? (
        <section className={styles.providersSection}>
          <div className={styles.sectionHeading}>
            <span>CARE PROVIDERS IN THE DIRECTORY</span>
            <h2>Organizations Healthcare Central can review when matching.</h2>
            <p>
              These are provider-directory records, not individual caregiver
              guarantees. Current staff availability is confirmed during
              matching.
            </p>
          </div>

          <div className={styles.providerGrid}>
            {providers.map((provider) => (
              <article className={styles.providerCard} key={provider.id}>
                <div className={styles.providerInitial}>
                  {provider.full_name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong>{provider.full_name}</strong>
                  <span>
                    {[provider.location, provider.verification_status]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <p>{provider.services || "Home-care provider organization"}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.finalCta}>
        <div>
          <span>READY TO ARRANGE CARE?</span>
          <h2>Tell us what the person needs.</h2>
          <p>
            The detailed request form only opens when you choose to start.
          </p>
        </div>
        <Link className={styles.primaryAction} href="/caregivers/request">
          Request a caregiver
        </Link>
      </section>
    </div>
  );
}
