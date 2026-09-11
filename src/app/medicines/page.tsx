import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Heading, Search, Empty, Pager } from "@/components/ui";
import { directory, queryParams, type Params } from "@/lib/data";
import { LiveMedicines } from "@/components/live-medicines";

export default async function Medicines({ searchParams }: { searchParams: Promise<Params> }) {
  await requireUser();

  const { q, page } = queryParams(await searchParams);
  const rows = await directory("medicines", q, page);

  return (
    <div className="container section">
      <Heading title="Find your medicine.">
        Search the Healthcare Central medicine catalog or compare available pharmacy listings.
      </Heading>
      <Search q={q} placeholder="Search medicine name, generic or strength" />
      <div className="cards">
        {rows.map((row) => (
          <Link className="card service-card" href={"/medicines/" + row.id} key={row.id}>
            <span className="icon">◒</span>
            <h2>{String(row.name)}</h2>
            <p>{String(row.generic || "")} · {String(row.strength || "")}</p>
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
