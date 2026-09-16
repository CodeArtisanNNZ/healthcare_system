import { requireUser } from "@/lib/auth";
import { directory, queryParams, type Params } from "@/lib/data";
import { healthcareLocations } from "@/lib/locations";
import { DirectoryCard, Empty, Heading, Pager, Search } from "@/components/ui";

const hospitalCategories = [
  "General / Multidisciplinary",
  "Medical College / Teaching",
  "Specialized",
  "Cardiac",
  "Cancer",
  "Eye",
  "ENT",
  "Kidney & Urology",
  "Children & Paediatrics",
  "Women & Maternity",
  "Orthopaedic & Trauma",
  "Mental Health",
  "Chest & Respiratory",
  "Dental",
] as const;

export default async function HospitalsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireUser("patient");

  const { q, location, category, page } = queryParams(await searchParams);
  const rows = await directory("hospitals", q, page, location, { category });

  return (
    <div className="container section">
      <Heading title="Hospitals" eyebrow="HEALTHCARE DIRECTORY">
        Hospitals are listed A–Z by default. Search by hospital name, category, department or Dhaka area; close spellings are matched automatically.
      </Heading>

      <Search
        q={q}
        placeholder="Hospital name, department or service"
        extras={
          <>
            <input
              name="location"
              defaultValue={location}
              placeholder="Area, e.g. Dhanmondi, Mirpur"
              maxLength={100}
              aria-label="Location"
              list="hospital-location-options"
            />
            <datalist id="hospital-location-options">
              {healthcareLocations.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <select name="category" defaultValue={category} aria-label="Hospital category">
              <option value="">All hospital categories</option>
              {hospitalCategories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </>
        }
      />

      {rows.length ? (
        <div className="cards directory">
          {rows.map((row) => (
            <DirectoryCard key={String(row.id)} kind="hospitals" row={row} />
          ))}
        </div>
      ) : (
        <Empty>No hospitals found. Try the full or partial hospital name, another category or a nearby Dhaka area.</Empty>
      )}

      <Pager
        page={page}
        hasNext={rows.length === 24}
        q={q}
        location={location}
        path="/hospitals"
        filters={{ category }}
      />
    </div>
  );
}
