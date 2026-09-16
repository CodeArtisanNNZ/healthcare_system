import { requireUser } from "@/lib/auth";
import { directory, lookups, queryParams, type Params } from "@/lib/data";
import { healthcareLocations } from "@/lib/locations";
import { DirectoryCard, Empty, Heading, Pager, Search } from "@/components/ui";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireUser("patient");

  const { q, location, specialty, page } = queryParams(await searchParams);
  const [rows, specialties] = await Promise.all([
    directory("doctors", q, page, location, { specialty }),
    lookups("specialties"),
  ]);
  const specialtyNames = new Map(
    specialties.map((item) => [String(item.id), String(item.name)]),
  );

  return (
    <div className="container section">
      <Heading title="Doctors" eyebrow="HEALTHCARE DIRECTORY">
        Search by doctor name, specialty, symptom or Dhaka area. Exact names are ranked first and close spellings are matched automatically.
      </Heading>

      <Search
        q={q}
        placeholder="Doctor name, specialty or symptom"
        extras={
          <>
            <input
              name="location"
              defaultValue={location}
              placeholder="Area, e.g. Mirpur, Uttara"
              maxLength={100}
              aria-label="Location"
              list="doctor-location-options"
            />
            <datalist id="doctor-location-options">
              {healthcareLocations.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
            <select name="specialty" defaultValue={specialty} aria-label="Specialty">
              <option value="">All specialties</option>
              {specialties.map((item) => (
                <option key={String(item.id)} value={String(item.name)}>
                  {String(item.name)}
                </option>
              ))}
            </select>
          </>
        }
      />

      {rows.length ? (
        <div className="cards directory">
          {rows.map((row) => (
            <DirectoryCard
              key={String(row.id)}
              kind="doctors"
              row={row}
              specialty={
                row.specialty_id
                  ? specialtyNames.get(String(row.specialty_id))
                  : row.specialization
                    ? String(row.specialization)
                    : "Doctor"
              }
            />
          ))}
        </div>
      ) : (
        <Empty>No doctors found. Try the doctor's full or partial name, another specialty, symptom or nearby area.</Empty>
      )}

      <Pager
        page={page}
        hasNext={rows.length === 24}
        q={q}
        location={location}
        path="/doctors"
        filters={{ specialty }}
      />
    </div>
  );
}
