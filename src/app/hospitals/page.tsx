import { requireUser } from "@/lib/auth";
import { directory, queryParams, type Params } from "@/lib/data";
import { DirectoryCard, Empty, Heading, Pager, Search } from "@/components/ui";

export default async function HospitalsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireUser("patient");

  const { q, location, page } = queryParams(await searchParams);
  const rows = await directory("hospitals", q, page, location);

  return (
    <div className="container section">
      <Heading title="Hospitals" eyebrow="HEALTHCARE DIRECTORY">
        Browse hospitals and medical centres, or search by name, department or location.
      </Heading>

      <Search
        q={q}
        placeholder="Search hospitals or departments"
        extras={
          <input
            name="location"
            defaultValue={location}
            placeholder="Location, e.g. Dhaka or Dhanmondi"
            maxLength={100}
            aria-label="Location"
          />
        }
      />

      {rows.length ? (
        <div className="cards directory">
          {rows.map((row) => (
            <DirectoryCard key={String(row.id)} kind="hospitals" row={row} />
          ))}
        </div>
      ) : (
        <Empty>No hospitals found. Try a broader name, department or location.</Empty>
      )}

      <Pager
        page={page}
        hasNext={rows.length === 24}
        q={q}
        location={location}
        path="/hospitals"
      />
    </div>
  );
}
