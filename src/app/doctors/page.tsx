import { requireUser } from "@/lib/auth";
import { directory, lookups, queryParams, type Params } from "@/lib/data";
import { DirectoryCard, Empty, Heading, Pager, Search } from "@/components/ui";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireUser("patient");

  const { q, location, page } = queryParams(await searchParams);
  const [rows, specialties] = await Promise.all([
    directory("doctors", q, page, location),
    lookups("specialties"),
  ]);
  const specialtyNames = new Map(
    specialties.map((item) => [String(item.id), String(item.name)]),
  );

  return (
    <div className="container section">
      <Heading title="Doctors" eyebrow="HEALTHCARE DIRECTORY">
        Browse the doctor directory, or narrow it by doctor name, specialty, care need or location.
      </Heading>

      <Search q={q} placeholder="Search doctors, specialties or care needs">
        <input
          name="location"
          defaultValue={location}
          placeholder="Location, e.g. Dhaka or Mirpur"
          maxLength={100}
          aria-label="Location"
        />
      </Search>

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
        <Empty>No doctors found. Try a broader name, specialty or location.</Empty>
      )}

      <Pager
        page={page}
        hasNext={rows.length === 24}
        q={q}
        location={location}
        path="/doctors"
      />
    </div>
  );
}
