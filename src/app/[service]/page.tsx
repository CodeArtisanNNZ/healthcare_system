import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { entities, publicEntities } from "@/lib/entities";
import { directory, lookups, queryParams, type Params } from "@/lib/data";
import { Heading, Search, DirectoryCard, Empty, Pager } from "@/components/ui";
import { supabase, configured } from "@/lib/supabase/server";
import { healthcareLocations } from "@/lib/locations";

export default async function Service({
  params,
  searchParams,
}: {
  params: Promise<{ service: string }>;
  searchParams: Promise<Params>;
}) {
  const { service } = await params;
  const key =
    service === "lab-tests"
      ? "lab_tests"
      : service === "emergency"
        ? "ambulances"
        : service;

  if (publicEntities.includes(key)) {
    await requireUser();

    const { q, location, page } = queryParams(await searchParams);
    const rows = await directory(key, q, page, location);
    const specialties = key === "doctors" ? await lookups("specialties") : [];
    const locationEnabled = [
      "doctors",
      "hospitals",
      "caregivers",
      "ambulances",
      "lab_tests",
    ].includes(key);

    let notices: string[] = [];

    if (key === "doctors" && q && configured()) {
      const db = await supabase();
      const { data, error } = await db
        .from("symptom_rules")
        .select("keyword,emergency_notice")
        .not("emergency_notice", "is", null);

      if (error) throw new Error(error.message);

      notices = [
        ...new Set(
          (data || [])
            .filter(
              (rule) =>
                q.toLowerCase().includes(String(rule.keyword).toLowerCase()) ||
                String(rule.keyword).toLowerCase().includes(q.toLowerCase()),
            )
            .map((rule) => String(rule.emergency_notice))
            .filter(Boolean),
        ),
      ];
    }

    return (
      <div className="container section">
        <p>
          <Link href="/patient">← Back to dashboard</Link>
        </p>

        <Heading
          title={
            service === "emergency"
              ? "Find ambulance support"
              : entities[key].title
          }
        >
          {entities[key].description}
        </Heading>

        {key === "doctors" && (
          <p className="notice">
            Symptom matching is a healthcare navigation aid, not a diagnosis.
            Contact a qualified healthcare professional for medical advice.
          </p>
        )}

        {notices.map((notice) => (
          <p className="notice error" key={notice}>
            {notice}
          </p>
        ))}

        <Search
          q={q}
          placeholder={
            key === "doctors"
              ? "Symptom, specialty or doctor name"
              : entities[key].description
          }
          extras={
            locationEnabled ? (
              <select
                name="location"
                defaultValue={location}
                aria-label="Filter by location"
              >
                <option value="">All locations</option>
                {healthcareLocations.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            ) : null
          }
        />

        {location && (
          <p className="filter-summary">
            Location filter: <strong>{location}</strong>
          </p>
        )}

        {rows.length ? (
          <div className="cards directory">
            {rows.map((row) => (
              <DirectoryCard
                key={row.id}
                row={row}
                kind={key}
                specialty={String(
                  specialties.find(
                    (specialty) => specialty.id === row.specialty_id,
                  )?.name || "",
                )}
              />
            ))}
          </div>
        ) : (
          <Empty />
        )}

        <Pager
          q={q}
          location={location}
          page={page}
          hasNext={rows.length === 24}
        />
      </div>
    );
  }

  const info: Record<
    string,
    { title: string; text: string; href: string; cta: string; image?: string }
  > = {
    about: {
      title: "Healthcare Central",
      text: "Healthcare Central connects patients with healthcare directories, medicine comparison and private health records through one account.",
      href: "/register",
      cta: "Get started",
      image: "logo.png",
    },
    appointments: {
      title: "Find the right doctor.",
      text: "Search doctors and review their consultation information.",
      href: "/doctors",
      cta: "Find a doctor",
      image: "doc.png",
    },
    "health-records": {
      title: "Your health information, organized.",
      text: "Keep prescriptions and lab reports in your private patient account.",
      href: "/patient/prescriptions",
      cta: "Open my records",
    },
    "doctor-portal": {
      title: "Doctor portal",
      text: "Approved doctor accounts can view their linked professional listing.",
      href: "/doctor",
      cta: "Open doctor portal",
      image: "doc.png",
    },
  };

  const item = info[service];
  if (!item) notFound();

  return (
    <section className="container hero">
      <div>
        <Heading title={item.title}>{item.text}</Heading>
        <Link className="button" href={item.href}>
          {item.cta} →
        </Link>
      </div>
      <div className="feature-art">
        {item.image ? <img src={`/images/${item.image}`} alt="" /> : null}
      </div>
    </section>
  );
}
