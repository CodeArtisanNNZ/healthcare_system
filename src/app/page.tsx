import Link from "next/link";
import { currentUser } from "@/lib/auth";
import styles from "./home.module.css";

const services = [
  ["Doctor", "Find doctors by specialty and location.", "/doctors"],
  ["Medicine", "Search medicines and compare seller offers.", "/medicines"],
  ["Hospital", "Find hospitals and departments.", "/hospitals"],
  ["Lab Test", "Find diagnostic tests and laboratories.", "/lab-tests"],
  ["Caregiver", "Find caregiver and nursing support.", "/caregivers"],
  ["Ambulance", "Open public emergency ambulance contacts.", "/emergency"],
] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await currentUser();
  const { lang } = await searchParams;
  const bn = lang === "bn";

  const copy = bn
    ? {
        kicker: "হেলথকেয়ার সেন্ট্রাল",
        title1: "ডাক্তার খোঁজা থেকে",
        title2: "জরুরি সহায়তা পর্যন্ত —",
        title3: "শুরু করুন এখান থেকে।",
        intro:
          "ডাক্তার, হাসপাতাল, ওষুধ, ল্যাব টেস্ট, কেয়ারগিভার এবং অ্যাম্বুলেন্স সেবা এক জায়গায়।",
        create: "অ্যাকাউন্ট তৈরি করুন",
        login: "লগ ইন",
        services: "সেবা",
        need: "আজ আপনার কী প্রয়োজন?",
        assistant: "Healthcare Central Assistant",
        assistantText:
          "লগ ইন করার পর এক জায়গা থেকে প্রয়োজনীয় স্বাস্থ্যসেবা খুঁজুন।",
        explore: "Assistant খুলুন",
        emergency: "জরুরি সহায়তা",
        emergencyTitle: "এখনই অ্যাম্বুলেন্স প্রয়োজন?",
        emergencyText: "লগ ইন ছাড়াই জরুরি যোগাযোগ দেখুন।",
        emergencyButton: "Emergency Help",
      }
    : {
        kicker: "HEALTHCARE CENTRAL",
        title1: "From finding a doctor",
        title2: "to urgent help —",
        title3: "start here.",
        intro:
          "Doctors, hospitals, medicines, lab tests, caregivers and ambulance support across Bangladesh.",
        create: "Create your account",
        login: "Log in",
        services: "SERVICES",
        need: "What do you need today?",
        assistant: "Healthcare Central Assistant",
        assistantText:
          "After login, search Healthcare Central services from one simple assistant.",
        explore: "Open Assistant",
        emergency: "EMERGENCY",
        emergencyTitle: "Need an ambulance now?",
        emergencyText: "Open emergency contacts without signing in.",
        emergencyButton: "Emergency Help",
      };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>{copy.kicker}</p>
            <h1>
              {copy.title1}
              <br />
              {copy.title2}
              <br />
              <span>{copy.title3}</span>
            </h1>
            <p className={styles.heroText}>{copy.intro}</p>

            <div className={styles.heroActions}>
              {user ? (
                <Link className={styles.primaryButton} href="/dashboard">
                  {bn ? "ড্যাশবোর্ড খুলুন" : "Open my dashboard"}
                </Link>
              ) : (
                <>
                  <Link className={styles.primaryButton} href="/register">
                    {copy.create}
                  </Link>
                  <Link className={styles.secondaryButton} href="/login">
                    {copy.login}
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className={styles.assistantPreview}>
            <p className={styles.previewLabel}>HEALTHCARE CENTRAL</p>
            <h2>{copy.assistant}</h2>
            <p>{copy.assistantText}</p>

            <div className={styles.previewServices}>
              <span>Doctor</span>
              <span>Medicine</span>
              <span>Hospital</span>
              <span>Lab Test</span>
              <span>Caregiver</span>
              <span>Ambulance</span>
            </div>

            <Link href={user ? "/patient" : "/login"}>{copy.explore}</Link>
          </div>
        </div>
      </section>

      <section className={styles.servicesSection} id="services">
        <div className={styles.sectionHeading}>
          <p className={styles.kicker}>{copy.services}</p>
          <h2>{copy.need}</h2>
        </div>

        <div className={styles.serviceGrid}>
          {services.map(([title, description, href]) => {
            const emergency = href === "/emergency";
            const target = emergency || user ? href : "/login";

            return (
              <Link
                key={title}
                href={target}
                className={`${styles.serviceCard} ${
                  emergency ? styles.emergencyServiceCard : ""
                }`}
              >
                <h3>{title}</h3>
                <p>{description}</p>
                <span aria-hidden="true">→</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.lowerGrid}>
        <article className={styles.assistantCard}>
          <div>
            <p className={styles.kicker}>ASSISTANT</p>
            <h2>{copy.assistant}</h2>
            <p>{copy.assistantText}</p>
          </div>
          <Link href={user ? "/patient" : "/login"}>{copy.explore}</Link>
        </article>

        <article className={styles.emergencyCard}>
          <div>
            <p className={styles.emergencyKicker}>{copy.emergency}</p>
            <h2>{copy.emergencyTitle}</h2>
            <p>{copy.emergencyText}</p>
          </div>
          <Link href="/emergency">{copy.emergencyButton}</Link>
        </article>
      </section>
    </div>
  );
}
