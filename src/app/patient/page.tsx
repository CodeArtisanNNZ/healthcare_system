import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLanguage } from "@/lib/language";
import { HealthcareAssistant } from "@/components/healthcare-assistant";
import styles from "./patient.module.css";

function QuickIcon({ kind }: { kind: "prescription" | "report" | "profile" }) {
  if (kind === "prescription") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3.5h7.5L18 7v13.5H7z" />
        <path d="M14.5 3.5V7H18M9.5 11h6M9.5 14h6M9.5 17h4" />
      </svg>
    );
  }

  if (kind === "report") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 4h14v16H5z" />
        <path d="M8 16v-3M12 16V9M16 16v-5M8 7h8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20c.65-4.15 2.85-6.2 6.5-6.2s5.85 2.05 6.5 6.2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 12h12M13 7l5 5-5 5" />
    </svg>
  );
}

export default async function Patient({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await requireUser();

  if (!["patient", "admin"].includes(user.role)) {
    redirect("/dashboard");
  }

  const language = await getLanguage(searchParams);
  const bn = language === "bn";

  return (
    <div className={styles.page}>
      <section className={styles.top}>
        <div>
          <p className={styles.kicker}>
            {bn ? "রোগীর ড্যাশবোর্ড" : "PATIENT DASHBOARD"}
          </p>

          <h1>
            {bn ? `স্বাগতম, ${user.full_name}` : `Welcome, ${user.full_name}.`}
          </h1>

          <p>
            {bn
              ? "প্রয়োজনীয় স্বাস্থ্যসেবা খুঁজুন এবং আপনার অ্যাকাউন্ট পরিচালনা করুন।"
              : "Find the healthcare service you need and manage your account."}
          </p>
        </div>
      </section>

      <section className={styles.dashboardGrid}>
        <HealthcareAssistant language={language} />

        <aside className={styles.accountPanel}>
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.kicker}>
                {bn ? "আমার অ্যাকাউন্ট" : "MY ACCOUNT"}
              </p>
              <h2>{bn ? "দ্রুত অ্যাক্সেস" : "Quick access"}</h2>
            </div>
            <span className={styles.liveDot} aria-hidden="true" />
          </div>

          <nav>
            <Link href="/patient/prescriptions" className={styles.quickCard}>
              <span className={styles.quickIcon}>
                <QuickIcon kind="prescription" />
              </span>
              <span className={styles.quickCopy}>
                <strong>{bn ? "প্রেসক্রিপশন" : "Prescriptions"}</strong>
                <span>
                  {bn ? "সংরক্ষিত প্রেসক্রিপশন দেখুন" : "View saved prescriptions"}
                </span>
              </span>
              <span className={styles.quickArrow}>
                <ArrowIcon />
              </span>
            </Link>

            <Link href="/patient/reports" className={styles.quickCard}>
              <span className={styles.quickIcon}>
                <QuickIcon kind="report" />
              </span>
              <span className={styles.quickCopy}>
                <strong>{bn ? "ল্যাব রিপোর্ট" : "Lab reports"}</strong>
                <span>{bn ? "সংরক্ষিত রিপোর্ট দেখুন" : "View saved reports"}</span>
              </span>
              <span className={styles.quickArrow}>
                <ArrowIcon />
              </span>
            </Link>

            <Link href="/patient/profile" className={styles.quickCard}>
              <span className={styles.quickIcon}>
                <QuickIcon kind="profile" />
              </span>
              <span className={styles.quickCopy}>
                <strong>{bn ? "প্রোফাইল" : "Profile"}</strong>
                <span>
                  {bn ? "অ্যাকাউন্টের তথ্য পরিবর্তন করুন" : "Update account information"}
                </span>
              </span>
              <span className={styles.quickArrow}>
                <ArrowIcon />
              </span>
            </Link>
          </nav>
        </aside>
      </section>

      <section className={styles.emergencyStrip}>
        <div>
          <p>{bn ? "জরুরি সহায়তা" : "Emergency"}</p>
          <h2>
            {bn
              ? "দ্রুত অ্যাম্বুলেন্স ও জরুরি যোগাযোগ খুঁজুন।"
              : "Find ambulance and emergency contacts quickly."}
          </h2>
        </div>
        <Link href="/emergency">
          {bn ? "জরুরি সহায়তা" : "Emergency Help"}
        </Link>
      </section>
    </div>
  );
}
