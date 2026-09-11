import Link from "next/link";
import styles from "./home.module.css";

const services = [
  {
    kind: "doctor",
    title: "Doctors",
    text: "Find doctors by specialty and location.",
    href: "/doctors",
  },
  {
    kind: "medicine",
    title: "Medicines",
    text: "Search the medicine catalog.",
    href: "/medicines",
  },
  {
    kind: "hospital",
    title: "Hospitals",
    text: "Find hospitals and departments.",
    href: "/hospitals",
  },
  {
    kind: "lab",
    title: "Lab tests",
    text: "Find diagnostic tests and labs.",
    href: "/lab-tests",
  },
  {
    kind: "caregiver",
    title: "Caregivers",
    text: "Find caregiver and nursing support.",
    href: "/caregivers",
  },
  {
    kind: "ambulance",
    title: "Ambulance",
    text: "Get emergency ambulance contacts.",
    href: "/emergency",
  },
] as const;

type ServiceKind = (typeof services)[number]["kind"];

function ServiceIcon({ kind }: { kind: ServiceKind }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (kind === "doctor") {
    return (
      <svg {...common}>
        <path d="M6 3v5a6 6 0 0 0 12 0V3" />
        <path d="M6 3H4m14 0h2" />
        <path d="M12 14v3a4 4 0 0 0 4 4h1" />
        <circle cx="19" cy="19" r="2" />
      </svg>
    );
  }

  if (kind === "medicine") {
    return (
      <svg {...common}>
        <path d="M10.5 4.5 4.8 10.2a4.2 4.2 0 0 0 6 6l5.7-5.7a4.2 4.2 0 0 0-6-6Z" />
        <path d="m8 13 3 3" />
      </svg>
    );
  }

  if (kind === "hospital") {
    return (
      <svg {...common}>
        <path d="M4 21V5h16v16" />
        <path d="M8 21v-4h8v4M9 9h6M12 6v6" />
        <path d="M7 13h.01M17 13h.01" />
      </svg>
    );
  }

  if (kind === "lab") {
    return (
      <svg {...common}>
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3" />
        <path d="M7.8 15h8.4" />
      </svg>
    );
  }

  if (kind === "caregiver") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M16 12.5c1.5-1.7 4.5-.6 4.5 1.7 0 2.1-2.3 3.7-4.5 5.3-2.2-1.6-4.5-3.2-4.5-5.3 0-.6.2-1.1.5-1.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M3 16V8h11v8H3Z" />
      <path d="M14 11h3l3 3v2h-6" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M7 10h3M8.5 8.5v3" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>HEALTHCARE CENTRAL</p>
            <h1>
              From finding a doctor
              <br />
              to urgent help —
              <br />
              <span>start here.</span>
            </h1>
            <p className={styles.heroText}>
              Doctors, hospitals, medicines, lab tests, caregivers and ambulance
              support across Bangladesh.
            </p>

            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="/register">
                Create your account
                <span aria-hidden="true">→</span>
              </Link>
              <Link className={styles.secondaryButton} href="/login">
                Log in
              </Link>
            </div>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <img src="/images/home-family.webp" alt="" />
          </div>
        </div>
      </section>

      <section className={styles.servicesSection} id="services">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.kicker}>SERVICES</p>
            <h2>What do you need today?</h2>
          </div>
          <p>
            Browse the service you need. Provider details are available after
            login, except Emergency.
          </p>
        </div>

        <div className={styles.serviceGrid}>
          {services.map((service) => {
            const isEmergency = service.kind === "ambulance";
            return (
              <Link
                key={service.kind}
                href={isEmergency ? "/emergency" : "/login"}
                className={`${styles.serviceCard} ${
                  isEmergency ? styles.emergencyServiceCard : ""
                }`}
              >
                <span className={styles.serviceIcon}>
                  <ServiceIcon kind={service.kind} />
                </span>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
                <span className={styles.cardArrow} aria-hidden="true">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.lowerGrid}>
        <article className={styles.awareCard}>
          <img
            className={styles.awareLogo}
            src="/images/aware-minds.png"
            alt="Aware Minds"
          />
          <div className={styles.awareCopy}>
            <p className={styles.kicker}>AWARE MINDS</p>
            <h2>Explore Aware Minds after login.</h2>
            <p>
              Get guided help choosing the Healthcare Central service that fits
              what you need.
            </p>
          </div>
          <Link className={styles.awareButton} href="/login">
            Log in to explore
            <span aria-hidden="true">→</span>
          </Link>
        </article>

        <article className={styles.emergencyCard}>
          <div className={styles.emergencyIcon} aria-hidden="true">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12.8 19.8 19.8 0 0 1 2.08 4.2 2 2 0 0 1 4.07 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.68a16 16 0 0 0 6.3 6.3l1.23-1.23a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92Z" />
            </svg>
          </div>

          <div className={styles.emergencyCopy}>
            <p className={styles.emergencyKicker}>EMERGENCY</p>
            <h2>Need an ambulance now?</h2>
            <p>Open emergency contacts without signing in.</p>
          </div>

          <Link className={styles.emergencyButton} href="/emergency">
            Emergency help
            <span aria-hidden="true">→</span>
          </Link>
        </article>
      </section>
    </div>
  );
}
