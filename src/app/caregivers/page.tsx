import { requireUser } from "@/lib/auth";
import { directory, queryParams, type Params } from "@/lib/data";
import { healthcareLocations } from "@/lib/locations";
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
        Search by caregiver name, service, qualification or Dhaka area. Partial names and close spellings are matched automatically.
      </Heading>

      <Search
        q={q}
        placeholder="Caregiver name, service or qualification"
        extras={
          <>
            <input
              name="location"
              defaultValue={location}
              placeholder="Area, e.g. Uttara or Mirpur"
              maxLength={100}
              aria-label="Location"
              list="caregiver-location-options"
            />
            <datalist id="caregiver-location-options">
              {healthcareLocations.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </>
        }
      />

      {rows.length ? (
        <div className="cards directory">
          {rows.map((row) => (
            <DirectoryCard key={String(row.id)} kind="caregivers" row={row} />
          ))}
        </div>
      ) : (
        <Empty>No caregivers found. Try a broader name, service or nearby area.</Empty>
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
