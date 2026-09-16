import { requireUser } from "@/lib/auth";
import { directory, queryParams, type Params } from "@/lib/data";
import { DirectoryCard, Empty, Heading, Pager, Search } from "@/components/ui";

export default async function CaregiversPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireUser("patient");

  const { q, location, page } = queryParams(await searchParams);
  const rows = await directory("caregivers", q, page, location);

  return (
    <div className="container section">
      <Heading title="Caregivers & nurses" eyebrow="HEALTHCARE DIRECTORY">
        Browse caregiver and nursing-support profiles, or search by service, qualification or location.
      </Heading>

      <Search
        q={q}
        placeholder="Search caregivers or services"
        extras={
          <input
            name="location"
            defaultValue={location}
            placeholder="Location, e.g. Dhaka or Uttara"
            maxLength={100}
            aria-label="Location"
          />
        }
      />

      {rows.length ? (
        <div className="cards directory">
          {rows.map((row) => (
            <DirectoryCard key={String(row.id)} kind="caregivers" row={row} />
          ))}
        </div>
      ) : (
        <Empty>No caregivers found. Try a broader service or location.</Empty>
      )}

      <Pager
        page={page}
        hasNext={rows.length === 24}
        q={q}
        location={location}
        path="/caregivers"
      />
    </div>
  );
}
