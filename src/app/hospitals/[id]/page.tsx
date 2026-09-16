import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { fileUrl } from "@/lib/storage";
import { Heading } from "@/components/ui";

function phoneHref(value: string) {
  return `tel:${value.replace(/[^+\d]/g, "")}`;
}

export default async function HospitalProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("patient");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const db = await supabase();
  const { data: hospital, error } = await db
    .from("hospitals")
    .select("*")
    .eq("id", id)
    .eq("status", "Active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!hospital) notFound();

  const image = await fileUrl("directory-images", hospital.image_path);

  return (
    <div className="container section">
      <Link className="button secondary" href="/hospitals">← Back to hospitals</Link>
      <Heading eyebrow={hospital.category || "HOSPITAL"} title={hospital.name}>
        {hospital.location || hospital.address || "Healthcare Central hospital profile"}
      </Heading>

      <article className="card directory-card">
        {image && <img className="directory-image" src={image} alt={hospital.name} />}
        <div>
          <dl>
            {hospital.category && <div><dt>Category</dt><dd>{hospital.category}</dd></div>}
            {hospital.location && <div><dt>Location</dt><dd>{hospital.location}</dd></div>}
            {hospital.address && <div><dt>Address</dt><dd>{hospital.address}</dd></div>}
            {hospital.departments && <div><dt>Departments</dt><dd>{hospital.departments}</dd></div>}
            {hospital.phone && <div><dt>Phone</dt><dd>{hospital.phone}</dd></div>}
            {hospital.emergency_phone && <div><dt>Emergency phone</dt><dd>{hospital.emergency_phone}</dd></div>}
            {hospital.email && <div><dt>Email</dt><dd>{hospital.email}</dd></div>}
            {hospital.description && <div><dt>About</dt><dd>{hospital.description}</dd></div>}
          </dl>

          <div className="directory-actions">
            {hospital.phone && <a className="button secondary" href={phoneHref(hospital.phone)}>Call hospital</a>}
            {hospital.emergency_phone && <a className="button secondary" href={phoneHref(hospital.emergency_phone)}>Emergency call</a>}
          </div>
        </div>
      </article>
    </div>
  );
}
