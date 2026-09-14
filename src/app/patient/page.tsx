import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLanguage } from "@/lib/language";
import { HealthcareAssistant } from "@/components/healthcare-assistant";
import styles from "./patient.module.css";

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
          <p className={styles.kicker}>
            {bn ? "আমার অ্যাকাউন্ট" : "MY ACCOUNT"}
          </p>
          <h2>{bn ? "দ্রুত অ্যাক্সেস" : "Quick access"}</h2>

          <nav>
            <Link href="/patient/prescriptions">
              <strong>{bn ? "প্রেসক্রিপশন" : "Prescriptions"}</strong>
              <span>
                {bn ? "সংরক্ষিত প্রেসক্রিপশন দেখুন" : "View saved prescriptions"}
              </span>
            </Link>

            <Link href="/patient/reports">
              <strong>{bn ? "ল্যাব রিপোর্ট" : "Lab reports"}</strong>
              <span>{bn ? "সংরক্ষিত রিপোর্ট দেখুন" : "View saved reports"}</span>
            </Link>

            <Link href="/patient/profile">
              <strong>{bn ? "প্রোফাইল" : "Profile"}</strong>
              <span>
                {bn ? "অ্যাকাউন্টের তথ্য পরিবর্তন করুন" : "Update account information"}
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
