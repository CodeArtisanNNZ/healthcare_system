import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLanguage } from "@/lib/language";
import { LiveMedicines } from "@/components/live-medicines";
import styles from "./medicines.module.css";

export default async function Medicines({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; lang?: string }>;
}) {
  await requireUser();

  const params = await searchParams;
  const language = await getLanguage(params);
  const bn = language === "bn";

  const initialQuery =
    typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";

  return (
    <div className={`container section ${styles.page}`}>
      <Link className={styles.back} href="/patient">
        ← {bn ? "ড্যাশবোর্ডে ফিরুন" : "Back to dashboard"}
      </Link>

      <section className={styles.intro}>
        <p className={styles.label}>{bn ? "ওষুধ" : "MEDICINE"}</p>

        <h1>
          {bn
            ? "অনলাইন ফার্মেসির অপশন দেখুন।"
            : "Compare medicine sellers."}
        </h1>

        <p>
          {bn
            ? "একবার সার্চ করে একাধিক অনলাইন ফার্মেসির অপশন দেখুন। বর্তমান ওষুধ, strength, pack size, মূল্য ও প্রাপ্যতা মূল বিক্রেতার ওয়েবসাইটে নিশ্চিত করুন।"
            : "Search once, review several pharmacy websites, then continue to the original seller to confirm the current medicine, strength, pack size, price and availability."}
        </p>
      </section>

      <LiveMedicines initialQuery={initialQuery} language={language} />
    </div>
  );
}
