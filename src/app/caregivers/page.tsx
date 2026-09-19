import Link from "next/link";
import { requireUser } from "@/lib/auth";
import styles from "./caregivers.module.css";

const careTypes = [
  ["Older adult care", "Companionship, daily support and help with routines."],
  ["Dementia support", "Care for memory loss, confusion and supervision needs."],
  ["Recovery care", "Support after surgery, stroke or reduced mobility."],
  ["Bedridden care", "Help with positioning, hygiene, feeding and daily comfort."],
  ["Home nursing", "For needs that may require a trained nurse at home."],
  ["Mother & newborn", "Short-term support for mother and baby at home."],
];

export default async function CaregiversPage() {
  await requireUser("patient");

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>HEALTHCARE CENTRAL HOME CARE</span>
          <h1>Care at home, matched around the person.</h1>
          <p>
            Explore the kinds of support available, then request a caregiver
            when you are ready. Healthcare Central reviews the request before
            confirming a caregiver or care provider.
          </p>

          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/caregivers/request">
              Request a caregiver
            </Link>
            <Link
              className={styles.secondaryAction}
              href="/patient/caregiver-requests"
            >
              My caregiver requests
            </Link>
          </div>
        </div>

        <div className={styles.heroPanel} aria-hidden="true">
          <div className={styles.personMark}>
            <span className={styles.head} />
            <span className={styles.body} />
          </div>
          <div className={styles.careRing}>
            <span />
            <span />
            <span />
          </div>
          <div className={styles.heroNote}>
            <strong>Home care</strong>
            <span>Flexible support for different needs and schedules.</span>
          </div>
        </div>
      </section>

      <section className={styles.section} id="support">
        <div className={styles.sectionHeading}>
          <span>CARE OPTIONS</span>
          <h2>Different situations need different kinds of support.</h2>
          <p>
            These are examples only. You can choose the exact care need later
            when you start a request.
          </p>
        </div>

        <div className={styles.careGrid}>
          {careTypes.map(([title, description]) => (
            <article className={styles.careCard} key={title}>
              <span className={styles.cardDot} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.process}>
        <div className={styles.sectionHeading}>
          <span>HOW IT WORKS</span>
          <h2>Simple for the patient. Clear for the admin.</h2>
        </div>

        <div className={styles.steps}>
          <article>
            <strong>01</strong>
            <h3>Tell us what is needed</h3>
            <p>
              Share the care type, preferred gender, schedule, duration,
              location and important patient details.
            </p>
          </article>
          <article>
            <strong>02</strong>
            <h3>Healthcare Central reviews</h3>
            <p>
              The admin compares the request with available caregivers and
              provider organizations.
            </p>
          </article>
          <article>
            <strong>03</strong>
            <h3>Care is confirmed</h3>
            <p>
              You receive the assigned caregiver or provider details after the
              match is reviewed and confirmed.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span>READY WHEN YOU ARE</span>
          <h2>Start only when you want to request care.</h2>
          <p>
            You can explore this page first. The request form stays separate.
          </p>
        </div>
        <Link className={styles.primaryAction} href="/caregivers/request">
          Start caregiver request
        </Link>
      </section>
    </div>
  );
}
