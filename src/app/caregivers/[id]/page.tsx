import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { fileUrl } from "@/lib/storage";
import { Heading } from "@/components/ui";

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
      <Link className="button secondary" href="/caregivers">
        ← Back to caregiver support
      </Link>

      <Heading eyebrow="CAREGIVER" title={caregiver.full_name}>
        {caregiver.location ||
          caregiver.qualification ||
          "Healthcare Central caregiver profile"}
      </Heading>

      <article className="card directory-card">
        {image && (
          <img
            className="directory-image"
            src={image}
            alt={caregiver.full_name}
          />
        )}

        <div>
          <dl>
            {caregiver.gender && (
              <div><dt>Gender</dt><dd>{caregiver.gender}</dd></div>
            )}
            {caregiver.qualification && (
              <div><dt>Qualification</dt><dd>{caregiver.qualification}</dd></div>
            )}
            {caregiver.care_type && (
              <div><dt>Primary care type</dt><dd>{caregiver.care_type}</dd></div>
            )}
            {caregiver.patient_types && (
              <div><dt>Suitable patient types</dt><dd>{caregiver.patient_types}</dd></div>
            )}
            {caregiver.services && (
              <div><dt>Skills / services</dt><dd>{caregiver.services}</dd></div>
            )}
            {caregiver.experience !== null &&
              caregiver.experience !== undefined && (
                <div>
                  <dt>Experience</dt>
                  <dd>{caregiver.experience} years</dd>
                </div>
              )}
            {caregiver.location && (
              <div><dt>Service area</dt><dd>{caregiver.location}</dd></div>
            )}
            {caregiver.shift_types && (
              <div><dt>Shift types</dt><dd>{caregiver.shift_types}</dd></div>
            )}
            {caregiver.availability && (
              <div><dt>Availability</dt><dd>{caregiver.availability}</dd></div>
            )}
            {caregiver.fee_per_day !== null &&
              caregiver.fee_per_day !== undefined && (
                <div>
                  <dt>Daily fee</dt>
                  <dd>৳{caregiver.fee_per_day}</dd>
                </div>
              )}
            {caregiver.languages && (
              <div><dt>Languages</dt><dd>{caregiver.languages}</dd></div>
            )}
            {caregiver.verification_status === "Verified" && (
              <div><dt>Profile status</dt><dd>Verified by Healthcare Central</dd></div>
            )}
          </dl>

          <p className="muted">
            Personal phone and email are kept private until an administrator
            confirms a caregiver assignment.
          </p>

          <Link className="button secondary" href="/caregivers">
            Request caregiver support
          </Link>
        </div>
      </article>
    </div>
  );
}
