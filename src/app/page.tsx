import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getLanguage } from "@/lib/language";
import { ServiceCarousel } from "@/components/service-carousel";
import { ActionGlyph } from "@/components/action-glyph";
import styles from "./home.module.css";

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
              {bn
                ? "প্রয়োজনীয় স্বাস্থ্যসেবা খুঁজুন।"
                : "Find the care you need."}
            </h1>

            <p className={styles.heroText}>
              {bn
                ? "ডাক্তার, হাসপাতাল, ওষুধ, ল্যাব টেস্ট, কেয়ারগিভার ও জরুরি সেবা—এক জায়গা থেকে শুরু করুন।"
                : "Doctors, hospitals, medicines, lab tests, caregivers and urgent support — start from one place."}
            </p>

            <div className={styles.heroActions}>
              {user ? (
                <Link
                  className={`${styles.primaryButton} hc-action-button`}
                  data-action="dashboard"
                  href="/patient"
                >
                  <span>{bn ? "ড্যাশবোর্ড খুলুন" : "Open dashboard"}</span>
                  <ActionGlyph kind="dashboard" />
                </Link>
              ) : (
                <Link
                  className={`${styles.primaryButton} hc-action-button`}
                  data-action="login"
                  href="/login"
                >
                  <span>{bn ? "লগ ইন" : "Log in"}</span>
                  <ActionGlyph kind="login" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.servicesSection} id="services">
        <div className={styles.sectionHeading}>
          <p>{bn ? "সেবা" : "Services"}</p>

          <h2>
            {bn ? "আমাদের সেবাগুলো দেখুন" : "Explore our services"}
          </h2>

          <span>
            {bn
              ? "কার্ডগুলো পাশে সরান। কোনো কার্ডে চাপ দিলে সেটি ঘুরে সেবাটির সংক্ষিপ্ত বিবরণ দেখাবে।"
              : "Slide through the cards. Tap any service to flip it and see a short overview of what it provides."}
          </span>
        </div>

        <ServiceCarousel language={language} />
      </section>

      <section className={styles.anatomySection}>
        <div className={styles.anatomyCard}>
          <div className={styles.anatomyHeading}>
            <p>
              {bn
                ? "মানবদেহ অন্বেষণ করুন"
                : "Explore the human body"}
            </p>

            <h2>
              {bn
                ? "শরীরকে ভেতর থেকে দেখুন"
                : "See the body from the inside"}
            </h2>

            <span>
              {bn
                ? "চোখ, মস্তিষ্ক, থাইরয়েড, ফুসফুস, হৃদ্‌যন্ত্রসহ প্রধান অঙ্গগুলো একটি ইন্টারঅ্যাকটিভ ৩ডি ভিউতে দেখুন। এক্সপ্লোরার খুলে স্পর্শ বা ড্র্যাগ করে ঘোরাতে ও জুম করতে পারবেন।"
                : "Explore the eyes, brain, thyroid, lungs, heart and other major structures in an interactive 3D view. Open the explorer, then touch or drag to rotate and zoom."}
            </span>
          </div>

          <details className={styles.anatomyDetails}>
            <summary
              className={`${styles.anatomyOpenButton} hc-action-button`}
              data-action="arrow"
            >
              <span className={styles.openLabel}>
                {bn ? "৩ডি বডি এক্সপ্লোরার খুলুন" : "Open 3D body explorer"}
              </span>
              <span className={styles.closeLabel}>
                {bn ? "৩ডি বডি এক্সপ্লোরার বন্ধ করুন" : "Close 3D body explorer"}
              </span>
              <ActionGlyph kind="arrow" />
            </summary>

            <div className={styles.anatomyFrameWrap}>
              <iframe
                className={styles.anatomyFrame}
                src={`/anatomy-explorer-v4.html?lang=${language}`}
                title={
                  bn
                    ? "ইন্টারঅ্যাকটিভ ৩ডি মানবদেহ"
                    : "Interactive 3D human anatomy"
                }
                loading="lazy"
                allowFullScreen
              />
            </div>
          </details>
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

          <Link
            className="hc-action-button"
            data-action={user ? "assistant" : "login"}
            href={user ? "/patient" : "/login"}
          >
            <span>
              {user
                ? bn
                  ? "Assistant খুলুন"
                  : "Open Assistant"
                : bn
                  ? "লগ ইন"
                  : "Log in"}
            </span>
            <ActionGlyph kind={user ? "assistant" : "login"} />
          </Link>
        </article>

        <article className={styles.emergencyCard}>
          <div>
            <span>{bn ? "জরুরি" : "Emergency"}</span>

            <h2>
              {bn
                ? "দ্রুত সহায়তা প্রয়োজন?"
                : "Need urgent help?"}
            </h2>
          </div>

          <Link className="hc-action-button" data-action="emergency" href="/emergency">
            <span>{bn ? "জরুরি সহায়তা" : "Emergency Help"}</span>
            <ActionGlyph kind="emergency" />
          </Link>
        </article>
      </section>
    </div>
  );
}
