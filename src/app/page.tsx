import Link from "next/link";
import { currentUser } from "@/lib/auth";
import styles from "./home.module.css";

const services = [
  ["doctor", "Doctor", "Find the right type of doctor for your needs."],
  ["medicine", "Medicine", "Compare medicine sellers before you continue to buy."],
  ["hospital", "Hospital", "Explore hospital services and departments."],
  ["lab-test", "Lab Test", "Understand how lab test search and comparison works."],
  ["caregiver", "Caregiver", "Find support for home and everyday care."],
  ["ambulance", "Ambulance", "Learn how ambulance and emergency support works."],
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
                ? "ডাক্তার, হাসপাতাল, ওষুধ, ল্যাব টেস্ট, কেয়ারগিভার ও জরুরি সেবা—এক জায়গা থেকে শুরু করুন।"
                : "Doctors, hospitals, medicines, lab tests, caregivers and urgent support — start from one place."}
            </p>

            <div className={styles.heroActions}>
              {user ? (
                <Link className={styles.primaryButton} href="/patient">
                  {bn ? "ড্যাশবোর্ড খুলুন" : "Open dashboard"}
                </Link>
              ) : (
                <Link className={styles.primaryButton} href="/login">
                  {bn ? "লগ ইন" : "Log in"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.servicesSection} id="services">
        <div className={styles.sectionHeading}>
          <p>{bn ? "সেবা" : "Services"}</p>
          <h2>{bn ? "একটি সেবা বেছে নিন" : "Start with a service"}</h2>
          <span>
            {bn
              ? "প্রথমে সেবাটি সম্পর্কে জানুন। ব্যবহার করতে চাইলে পরে লগ ইন করুন।"
              : "See what each service offers first. Sign in only when you want to use it."}
          </span>
        </div>

        <div className={styles.serviceGrid}>
          {services.map(([slug, title, description]) => (
            <Link
              key={slug}
              href={`/services/${slug}${bn ? "?lang=bn" : ""}`}
              className={`${styles.serviceCard} ${
                slug === "ambulance" ? styles.emergencyServiceCard : ""
              }`}
            >
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.bottomRow}>
        <article className={styles.assistantCard}>
          <div>
            <span>{bn ? "সহকারী" : "Assistant"}</span>
            <h2>
              {bn
                ? "লগ ইন করে Healthcare Central Assistant ব্যবহার করুন"
                : "Use Healthcare Central Assistant after you sign in"}
            </h2>
          </div>

          <Link href={user ? "/patient" : "/login"}>
            {user
              ? bn
                ? "Assistant খুলুন"
                : "Open Assistant"
              : bn
                ? "লগ ইন"
                : "Log in"}
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
