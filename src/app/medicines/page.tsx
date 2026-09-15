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
    typeof params.q === "string" ? params.q.trim().slice(0, 1_000) : "";

  return (
    <div className={`container section ${styles.page}`}>
      <Link className={styles.back} href="/patient">
        ← {bn ? "ড্যাশবোর্ডে ফিরুন" : "Back to dashboard"}
      </Link>

      <section className={styles.intro}>
        <p className={styles.label}>{bn ? "ওষুধ" : "MEDICINE"}</p>

        <h1>
          {bn
            ? "একসাথে একাধিক ওষুধের ফার্মেসি অপশন তুলনা করুন।"
            : "Compare a full medicine list across pharmacies."}
        </h1>

        <p>
          {bn
            ? "একবারে সর্বোচ্চ ১০টি ওষুধ লিখুন। Healthcare Central প্রতিটি ফার্মেসিতে আলাদা করে তালিকা মিলিয়ে যেখানে নির্ভরযোগ্য লাইভ মূল্য পাওয়া যায় সেখানে ওষুধভিত্তিক মূল্য ও মোট দেখাবে।"
            : "Enter up to 10 medicines at once. Healthcare Central checks each seller separately and shows item prices plus a combined total wherever a reliable live listing price can be read."}
        </p>
      </section>

      <LiveMedicines initialQuery={initialQuery} language={language} />
    </div>
  );
}
