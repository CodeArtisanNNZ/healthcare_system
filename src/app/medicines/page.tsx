import Link from "next/link";
import { Heading, Search, Empty, Pager } from "@/components/ui";
import { directory, queryParams, type Params } from "@/lib/data";
import { LiveMedicines } from "@/components/live-medicines";
export default async function Medicines({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { q, page } = queryParams(await searchParams);
  const rows = await directory("medicines", q, page);
  return (
    <div className="container section">
      <Heading title="Find your medicine.">
        Browse the catalog or compare pharmacy listings.
      </Heading>
      <Search q={q} placeholder="Search the medicine catalog" />
      <div className="cards">
        {rows.map((r) => (
          <Link
            className="card service-card"
            href={"/medicines/" + r.id}
            key={r.id}
          >
            <span className="icon">◒</span>
            <h2>{String(r.name)}</h2>
            <p>
              {String(r.generic || "")} · {String(r.strength || "")}
            </p>
            <span className="text-link">Compare catalog offers →</span>
          </Link>
        ))}
      </div>
      {!rows.length && <Empty>No catalog entries match your search.</Empty>}
      <Pager q={q} page={page} hasNext={rows.length === 24} />
      <LiveMedicines />
    </div>
  );
}
