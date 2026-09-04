import { notFound } from "next/navigation";
import Link from "next/link";
import { entities, publicEntities } from "@/lib/entities";
import { directory, lookups, queryParams, type Params } from "@/lib/data";
import { Heading, Search, DirectoryCard, Empty, Pager } from "@/components/ui";
import { supabase, configured } from "@/lib/supabase/server";
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
    const { q, page } = queryParams(await searchParams);
    const rows = await directory(key, q, page);
    const specialties = key === "doctors" ? await lookups("specialties") : [];
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
              (r) =>
                q.toLowerCase().includes(String(r.keyword).toLowerCase()) ||
                String(r.keyword).toLowerCase().includes(q.toLowerCase()),
            )
            .map((r) => String(r.emergency_notice))
            .filter(Boolean),
        ),
      ];
    }
    return (
      <div className="container section">
        <Heading
          title={
            service === "emergency"
              ? "Find emergency support"
              : entities[key].title
          }
        >
          {entities[key].description}
        </Heading>
        {key === "doctors" && (
          <p className="notice">
            Symptom matching is a directory aid, not a diagnosis. Contact a
            healthcare professional for medical advice.
          </p>
        )}
        {notices.map((n) => (
          <p className="notice error" key={n}>
            {n}
          </p>
        ))}
        <Search q={q} placeholder={entities[key].description} />
        {rows.length ? (
          <div className="cards directory">
            {rows.map((row) => (
              <DirectoryCard
                key={row.id}
                row={row}
                kind={key}
                specialty={String(
                  specialties.find((s) => s.id === row.specialty_id)?.name ||
                    "",
                )}
              />
            ))}
          </div>
        ) : (
          <Empty />
        )}
        <Pager q={q} page={page} hasNext={rows.length === 24} />
      </div>
    );
  }
  const info: Record<
    string,
    { title: string; text: string; href: string; cta: string; image?: string }
  > = {
    about: {
      title: "One account. Total well-being.",
      text: "Healthcare Central brings patient accounts, healthcare directories, medicine comparisons and personal records into one connected experience.",
      href: "/register",
      cta: "Get started",
      image: "logo.png",
    },
    appointments: {
      title: "Your care, your schedule.",
      text: "Find doctors, review their consultation hours and contact them directly to arrange an appointment. Online appointment booking is not available in this version.",
      href: "/doctors",
      cta: "Find a doctor",
      image: "doc.png",
    },
    "health-records": {
      title: "Your health information, organized.",
      text: "Keep prescriptions and lab reports in your patient account. Upload a PDF or image, add a description, and access your files when you need them.",
      href: "/patient/prescriptions",
      cta: "Open my records",
    },
    "doctor-portal": {
      title: "A dedicated space for doctors.",
      text: "Sign in with an administrator-approved doctor account to view your linked professional listing. Contact your administrator for directory changes.",
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
        {item.image ? (
          <img src={"/images/" + item.image} alt="" />
        ) : (
          <span>▤</span>
        )}
      </div>
    </section>
  );
}
