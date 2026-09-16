import { requireUser } from "@/lib/auth";
import { directory, queryParams, type Params } from "@/lib/data";
import { DirectoryCard, Empty, Heading, Pager, Search } from "@/components/ui";

export default async function LabTestsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  await requireUser("patient");

  const { q, location, page } = queryParams(await searchParams);
  const rows = await directory("lab_tests", q, page, location);

  return (
    <div className="container section">
      <Heading title="Lab tests & diagnostic centres" eyebrow="HEALTHCARE DIRECTORY">
        Browse available diagnostic tests and the centres that provide them, or search by test, laboratory or location.
      </Heading>

      <Search
        q={q}
        placeholder="Search tests or laboratories"
        extras={
          <input
            name="location"
            defaultValue={location}
            placeholder="Location, e.g. Dhaka or Mirpur"
            maxLength={100}
            aria-label="Location"
          />
        }
      />

      {rows.length ? (
        <div className="cards directory">
          {rows.map((row) => (
            <DirectoryCard key={String(row.id)} kind="lab_tests" row={row} />
          ))}
        </div>
      ) : (
        <Empty>No lab tests found. Try a broader test, laboratory or location.</Empty>
      )}

      <Pager
        page={page}
        hasNext={rows.length === 24}
        q={q}
        location={location}
        path="/lab-tests"
      />
    </div>
  );
}
