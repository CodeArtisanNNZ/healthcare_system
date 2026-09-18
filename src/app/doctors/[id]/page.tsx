import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { fileUrl } from "@/lib/storage";
import { Heading } from "@/components/ui";

export default async function DoctorProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("patient");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const db = await supabase();
  const { data: doctor, error } = await db
    .from("doctors")
    .select("*")
    .eq("id", id)
    .eq("status", "Active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!doctor) notFound();

  let specialty = doctor.specialization || "Doctor";
  if (doctor.specialty_id) {
    const { data } = await db
      .from("specialties")
      .select("name")
      .eq("id", doctor.specialty_id)
      .maybeSingle();
    if (data?.name) specialty = data.name;
  }

  const image = await fileUrl("directory-images", doctor.image_path);

  return (
    <div className="container section">
      <Link className="button secondary" href="/doctors">← Back to doctors</Link>
      <Heading eyebrow={specialty} title={doctor.full_name}>
        {doctor.hospital_name || doctor.location || "Healthcare Central doctor profile"}
      </Heading>

      <article className="card directory-card">
        {image && <img className="directory-image" src={image} alt={doctor.full_name} />}
        <div>
          <dl>
            {doctor.qualification && <div><dt>Qualification</dt><dd>{doctor.qualification}</dd></div>}
            {doctor.gender && <div><dt>Gender</dt><dd>{doctor.gender}</dd></div>}
            {doctor.specialization && <div><dt>Specialization</dt><dd>{doctor.specialization}</dd></div>}
            {doctor.sub_specialty && <div><dt>Sub-specialty</dt><dd>{doctor.sub_specialty}</dd></div>}
            {doctor.experience !== null && doctor.experience !== undefined && <div><dt>Experience</dt><dd>{doctor.experience} years</dd></div>}
            {doctor.hospital_name && <div><dt>Hospital / workplace</dt><dd>{doctor.hospital_name}</dd></div>}
            {doctor.chamber_name && <div><dt>Chamber / clinic</dt><dd>{doctor.chamber_name}</dd></div>}
            {doctor.chamber_address && <div><dt>Chamber address</dt><dd>{doctor.chamber_address}</dd></div>}
            {doctor.location && <div><dt>Location</dt><dd>{doctor.location}</dd></div>}
            {(doctor.area || doctor.district) && <div><dt>Area</dt><dd>{[doctor.area, doctor.district].filter(Boolean).join(", ")}</dd></div>}
            {doctor.consultation_type && <div><dt>Consultation type</dt><dd>{doctor.consultation_type}</dd></div>}
            {doctor.consultation_fee !== null && doctor.consultation_fee !== undefined && <div><dt>Consultation fee</dt><dd>৳{doctor.consultation_fee}</dd></div>}
            {doctor.follow_up_fee !== null && doctor.follow_up_fee !== undefined && <div><dt>Follow-up fee</dt><dd>৳{doctor.follow_up_fee}</dd></div>}
            {doctor.available_days && <div><dt>Available days</dt><dd>{doctor.available_days}</dd></div>}
            {doctor.available_time && <div><dt>Available time</dt><dd>{doctor.available_time}</dd></div>}
            {doctor.conditions_treated && <div><dt>Commonly treats</dt><dd>{doctor.conditions_treated}</dd></div>}
            {doctor.registration_no && <div><dt>BMDC registration number</dt><dd>{doctor.registration_no}</dd></div>}
            {doctor.bio && <div><dt>Profile</dt><dd>{doctor.bio}</dd></div>}
            {doctor.verification_status === "Verified" && <div><dt>Data status</dt><dd>Verified from an official provider source</dd></div>}
            {doctor.verified_on && <div><dt>Verified on</dt><dd>{doctor.verified_on}</dd></div>}
          </dl>

          {doctor.source_url && (
            <p><a href={doctor.source_url} target="_blank" rel="noreferrer">View official source</a></p>
          )}

          <Link
            className="button secondary hc-action-button"
            data-action="appointment"
            href={`/appointments/request?doctor=${doctor.id}`}
          >
            Request appointment
          </Link>
        </div>
      </article>
    </div>
  );
}
