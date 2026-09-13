import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { LiveMedicines } from "@/components/live-medicines";
import styles from "./medicines.module.css";

export default async function Medicines({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  await requireUser();

  const params = await searchParams;
  const initialQuery =
    typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";

  return (
    <div className={`container section ${styles.page}`}>
      <Link className={styles.back} href="/patient">
        ← Back to dashboard
      </Link>

      <section className={styles.intro}>
        <p className={styles.label}>MEDICINE</p>
        <h1>Compare medicine sellers.</h1>
        <p>
          Search once, review several pharmacy websites, then continue to the
          original seller to confirm the current medicine, strength, pack size,
          price and availability.
        </p>
      </section>

      <LiveMedicines initialQuery={initialQuery} />
    </div>
  );
}
