import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Heading, Search, Empty, Pager } from "@/components/ui";
import { directory, queryParams, type Params } from "@/lib/data";
import { LiveMedicines } from "@/components/live-medicines";
import styles from "./medicines.module.css";

export default async function Medicines({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireUser();

  const { q, page } = queryParams(await searchParams);
  const rows = await directory("medicines", q, page);

  return (
    <div className={`container section ${styles.page}`}>
      <Link className={styles.back} href="/patient">
        ← Back to dashboard
      </Link>

      <Heading title="Compare medicine options.">
        Search medicines, compare listed prices, then continue to the original
        seller website to complete your purchase.
      </Heading>

      <Search q={q} placeholder="Medicine name, generic or strength" />

      {rows.length > 0 && (
        <div className={styles.catalog}>
          {rows.map((row) => (
            <Link
              className={styles.medicineCard}
              href={`/medicines/${row.id}`}
              key={row.id}
            >
              <div>
                <h2>{String(row.name)}</h2>
                <p>
                  {[row.generic, row.strength]
                    .filter(Boolean)
                    .map(String)
                    .join(" · ")}
                </p>
              </div>
              <span>Compare sellers →</span>
            </Link>
          ))}
        </div>
      )}

      {!rows.length && q && <Empty>No catalog entries match your search.</Empty>}

      {rows.length > 0 && (
        <Pager q={q} page={page} hasNext={rows.length === 24} />
      )}

      <LiveMedicines />
    </div>
  );
}
