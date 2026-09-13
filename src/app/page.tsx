import Link from "next/link";
import { currentUser } from "@/lib/auth";
import styles from "./home.module.css";

const services = [
  ["Doctor", "Doctors by specialty and location.", "/doctors"],
  ["Medicine", "Compare medicine listings and sellers.", "/medicines"],
  ["Hospital", "Hospitals, departments and contacts.", "/hospitals"],
  ["Lab Test", "Diagnostic tests and laboratories.", "/lab-tests"],
  ["Caregiver", "Caregiver and nursing support.", "/caregivers"],
  ["Ambulance", "Emergency ambulance contacts.", "/emergency"],
] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await currentUser();
  const { lang } = await searchParams;
  const bn = lang === "bn";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              {bn ? "হেলথকেয়ার সেন্ট্রাল" : "Healthcare Central"}
            </p>

            <h1>
              {bn ? "প্রয়োজনীয় স্বাস্থ্যসেবা খুঁজুন।" : "Find the care you need."}
            </h1>

            <p className={styles.heroText}>
              {bn
                ? "ডাক্তার, হাসপাতাল, ওষুধ, ল্যাব টেস্ট, কেয়ারগিভার ও জরুরি যোগাযোগ এক জায়গায়।"
                : "Doctors, hospitals, medicines, lab tests, caregivers and emergency contacts in one place."}
            </p>

            <div className={styles.heroActions}>
              {user ? (
                <Link className={styles.primaryButton} href="/patient">
                  {bn ? "ড্যাশবোর্ড খুলুন" : "Open dashboard"}
                </Link>
              ) : (
                <>
                  <Link className={styles.primaryButton} href="/register">
                    {bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create account"}
                  </Link>
                  <Link className={styles.secondaryButton} href="/login">
                    {bn ? "লগ ইন" : "Log in"}
                  </Link>
                </>
              )}

              <Link className={styles.emergencyButton} href="/emergency">
                {bn ? "জরুরি সহায়তা" : "Emergency Help"}
              </Link>
            </div>
          </div>

          <aside className={styles.quickPanel}>
            <div className={styles.quickHeading}>
              <span>{bn ? "দ্রুত অ্যাক্সেস" : "Quick access"}</span>
              <strong>
                {bn ? "আপনার প্রয়োজন বেছে নিন" : "Choose a service"}
              </strong>
            </div>

            <div className={styles.quickGrid}>
              {services.map(([title, , href]) => (
                <Link
                  key={title}
                  href={href === "/emergency" || user ? href : "/login"}
                  className={href === "/emergency" ? styles.quickEmergency : ""}
                >
                  {title}
                </Link>
              ))}
            </div>

            <Link
              className={styles.assistantLink}
              href={user ? "/patient" : "/login"}
            >
              {bn
                ? "Healthcare Central Assistant খুলুন"
                : "Open Healthcare Central Assistant"}
            </Link>
          </aside>
        </div>
      </section>

      <section className={styles.servicesSection} id="services">
        <div className={styles.sectionHeading}>
          <p>{bn ? "সেবা" : "Services"}</p>
          <h2>{bn ? "এক জায়গা থেকে শুরু করুন" : "Start with a service"}</h2>
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
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <span aria-hidden="true">→</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.bottomRow}>
        <article className={styles.assistantCard}>
          <div>
            <span>{bn ? "সহকারী" : "Assistant"}</span>
            <h2>
              {bn ? "এক জায়গা থেকে সেবা খুঁজুন" : "Search across Healthcare Central"}
            </h2>
          </div>

          <Link href={user ? "/patient" : "/login"}>
            {bn ? "খুলুন" : "Open Assistant"}
          </Link>
        </article>

        <article className={styles.emergencyCard}>
          <div>
            <span>{bn ? "জরুরি" : "Emergency"}</span>
            <h2>{bn ? "দ্রুত সহায়তা প্রয়োজন?" : "Need urgent help?"}</h2>
          </div>

          <Link href="/emergency">
            {bn ? "জরুরি সহায়তা" : "Emergency Help"}
          </Link>
        </article>
      </section>
    </div>
  );
}
