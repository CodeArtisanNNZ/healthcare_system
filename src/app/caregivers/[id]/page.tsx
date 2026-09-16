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

export default async function CaregiverProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("patient");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const db = await supabase();
  const { data: caregiver, error } = await db
    .from("caregivers")
    .select("*")
    .eq("id", id)
    .eq("status", "Active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!caregiver) notFound();

  const image = await fileUrl("directory-images", caregiver.image_path);

  return (
    <div className="container section">
      <Link className="button secondary" href="/caregivers">← Back to caregivers</Link>
      <Heading eyebrow="CAREGIVER" title={caregiver.full_name}>
        {caregiver.location || caregiver.qualification || "Healthcare Central caregiver profile"}
      </Heading>

      <article className="card directory-card">
        {image && <img className="directory-image" src={image} alt={caregiver.full_name} />}
        <div>
          <dl>
            {caregiver.qualification && <div><dt>Qualification</dt><dd>{caregiver.qualification}</dd></div>}
            {caregiver.services && <div><dt>Services</dt><dd>{caregiver.services}</dd></div>}
            {caregiver.experience !== null && caregiver.experience !== undefined && <div><dt>Experience</dt><dd>{caregiver.experience} years</dd></div>}
            {caregiver.location && <div><dt>Location</dt><dd>{caregiver.location}</dd></div>}
            {caregiver.availability && <div><dt>Availability</dt><dd>{caregiver.availability}</dd></div>}
            {caregiver.fee_per_day !== null && caregiver.fee_per_day !== undefined && <div><dt>Daily fee</dt><dd>৳{caregiver.fee_per_day}</dd></div>}
            {caregiver.phone && <div><dt>Phone</dt><dd>{caregiver.phone}</dd></div>}
            {caregiver.email && <div><dt>Email</dt><dd>{caregiver.email}</dd></div>}
          </dl>

          {caregiver.phone && <a className="button secondary" href={phoneHref(caregiver.phone)}>Call caregiver</a>}
        </div>
      </article>
    </div>
  );
}
