import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getLanguage } from "@/lib/language";
import styles from "./home.module.css";

const services = [
  ["doctor", "Doctor", "ডাক্তার", "Find the right type of doctor for your needs.", "আপনার প্রয়োজন অনুযায়ী উপযুক্ত ধরনের ডাক্তার খোঁজার উপায় জানুন।"],
  ["medicine", "Medicine", "ওষুধ", "Compare medicine sellers before you continue to buy.", "কেনার আগে বিভিন্ন অনলাইন ফার্মেসির অপশন দেখুন।"],
  ["hospital", "Hospital", "হাসপাতাল", "Explore hospital services and departments.", "হাসপাতাল, বিভাগ এবং সেবাগুলো কীভাবে খুঁজবেন জানুন।"],
  ["lab-test", "Lab Test", "ল্যাব টেস্ট", "Understand how lab test search and comparison works.", "ল্যাব টেস্ট ও ডায়াগনস্টিক সেন্টার খোঁজার সুবিধা জানুন।"],
  ["caregiver", "Caregiver", "কেয়ারগিভার", "Find support for home and everyday care.", "বাসা ও দৈনন্দিন যত্নের জন্য সহায়তা খোঁজার সুবিধা জানুন।"],
  ["ambulance", "Ambulance", "অ্যাম্বুলেন্স", "Learn how ambulance and emergency support works.", "অ্যাম্বুলেন্স ও জরুরি সহায়তা কীভাবে পাওয়া যায় জানুন।"],
] as const;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const [user, language] = await Promise.all([
    currentUser(),
    getLanguage(searchParams),
  ]);
  const bn = language === "bn";

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
        {/* 3D HUMAN ANATOMY */}
<section className={styles.anatomySection}>
  <div className={styles.anatomyHeading}>
    <p>
      {bn ? "মানবদেহ অন্বেষণ করুন" : "Explore the human body"}
    </p>

    <h2>
      {bn
        ? "শরীরকে ভেতর থেকে দেখুন"
        : "See the body from the inside"}
    </h2>

    <span>
      {bn
        ? "মানবদেহ ঘোরান, জুম করুন এবং প্রধান অঙ্গগুলোতে চাপ দিয়ে তাদের কাজ সম্পর্কে জানুন।"
        : "Rotate the body, zoom in, and select major organs to understand what they do."}
    </span>
  </div>

  <div className={styles.anatomyFrameWrap}>
    <iframe
      className={styles.anatomyFrame}
      src={`/anatomy-explorer.html?lang=${language}`}
      title={
        bn
          ? "ইন্টারঅ্যাকটিভ ৩ডি মানবদেহ"
          : "Interactive 3D human anatomy"
      }
      loading="lazy"
      allow="fullscreen"
    />
  </div>
</section>
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
          {services.map(([slug, title, titleBn, description, descriptionBn]) => (
            <Link
              key={slug}
              href={`/services/${slug}`}
              className={`${styles.serviceCard} ${
                slug === "ambulance" ? styles.emergencyServiceCard : ""
              }`}
            >
              <div>
                <h3>{bn ? titleBn : title}</h3>
                <p>{bn ? descriptionBn : description}</p>
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
              ? bn ? "Assistant খুলুন" : "Open Assistant"
              : bn ? "লগ ইন" : "Log in"}
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
