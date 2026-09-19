import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { Heading, Empty } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { reviewAppointment } from "@/app/actions";

function value(value: unknown, fallback = "Not available") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function money(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not available";
  return `৳${value}`;
}

export default async function AdminAppointments() {
  await requireUser("admin");
  const db = await supabase();

  const [{ data: requests, error }, { data: doctors, error: doctorError }] =
    await Promise.all([
      db
        .from("appointment_requests")
        .select(
          "*,patient:profiles!appointment_requests_patient_id_fkey(full_name,email,phone),appointment_request_candidates(preference_rank,doctor:doctors(id,full_name,location,hospital_name,specialization))",
        )
        .order("created_at", { ascending: false }),
      db
        .from("doctors")
        .select(
          "id,full_name,specialty_id,specialization,location,hospital_name,consultation_fee,available_days,available_time",
        )
        .eq("status", "Active")
        .order("full_name"),
    ]);

  if (error || doctorError) {
    throw new Error(error?.message || doctorError!.message);
  }

  const selectedDoctorIds = [
    ...new Set(
      (requests || [])
        .map((request) => request.requested_doctor_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  let selectedDoctors: any[] = [];
  let selectedContacts: any[] = [];
  let selectedLocations: any[] = [];
  let specialties: any[] = [];

  if (selectedDoctorIds.length) {
    const [
      { data: doctorProfiles, error: profileError },
      { data: contacts, error: contactError },
      { data: locations, error: locationError },
      { data: specialtyRows, error: specialtyError },
    ] = await Promise.all([
      db.from("doctors").select("*").in("id", selectedDoctorIds),
      db
        .from("doctor_private_contacts")
        .select("doctor_id,phone,email,updated_at")
        .in("doctor_id", selectedDoctorIds),
      db
        .from("doctor_locations")
        .select("*")
        .in("doctor_id", selectedDoctorIds)
        .order("is_primary", { ascending: false })
        .order("area"),
      db.from("specialties").select("id,name"),
    ]);

    if (profileError || contactError || locationError || specialtyError) {
      throw new Error(
        profileError?.message ||
          contactError?.message ||
          locationError?.message ||
          specialtyError!.message,
      );
    }

    selectedDoctors = doctorProfiles || [];
    selectedContacts = contacts || [];
    selectedLocations = locations || [];
    specialties = specialtyRows || [];
  }

  const selectedDoctorById = new Map(
    selectedDoctors.map((doctor) => [doctor.id, doctor]),
  );
  const contactByDoctorId = new Map(
    selectedContacts.map((contact) => [contact.doctor_id, contact]),
  );
  const specialtyById = new Map(
    specialties.map((specialty) => [specialty.id, specialty.name]),
  );
  const locationsByDoctorId = new Map<string, any[]>();

  for (const location of selectedLocations) {
    const current = locationsByDoctorId.get(location.doctor_id) || [];
    current.push(location);
    locationsByDoctorId.set(location.doctor_id, current);
  }

  const clean = (input: unknown) =>
    String(input || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const matches = (location: unknown, area: string) => {
    const doctorLocation = clean(location);
    const selectedArea = clean(area);
    return Boolean(
      doctorLocation &&
        selectedArea &&
        (doctorLocation.includes(selectedArea) ||
          selectedArea.includes(doctorLocation)),
    );
  };

  return (
    <>
      <Heading eyebrow="ADMIN QUEUE" title="Appointment requests">
        Review the patient request, the exact doctor they selected, the doctor&apos;s
        full admin profile and private contact details, then confirm the final
        appointment.
      </Heading>

      <div className="stack">
        {requests?.map((request) => {
          const localDoctors =
            doctors?.filter(
              (doctor) =>
                matches(doctor.location, request.area) &&
                (!request.specialty_id ||
                  doctor.specialty_id === request.specialty_id),
            ) || [];

          const selectedDoctor = request.requested_doctor_id
            ? selectedDoctorById.get(request.requested_doctor_id)
            : null;
          const selectedContact = selectedDoctor
            ? contactByDoctorId.get(selectedDoctor.id)
            : null;
          const doctorLocations = selectedDoctor
            ? locationsByDoctorId.get(selectedDoctor.id) || []
            : [];
          const specialtyName = selectedDoctor?.specialty_id
            ? specialtyById.get(selectedDoctor.specialty_id)
            : null;
          const selectedDoctorServesArea = selectedDoctor
            ? matches(
                [
                  selectedDoctor.location,
                  selectedDoctor.area,
                  ...doctorLocations.map((item) => item.area),
                ]
                  .filter(Boolean)
                  .join(" "),
                request.area,
              )
            : false;

          return (
            <details
              className="card"
              key={request.id}
              open={request.status === "Requested"}
            >
              <summary>
                <strong>
                  {request.patient?.full_name ||
                    request.patient?.email ||
                    "Patient"}
                </strong>{" "}
                · {request.status} · {request.preferred_date} · {request.area}
              </summary>

              <p>
                <strong>Patient:</strong> {request.patient?.email} ·{" "}
                {request.patient?.phone || "No phone"}
              </p>

              <p>
                <strong>Customer selected doctor:</strong>{" "}
                {selectedDoctor?.full_name || "No specific doctor selected"}
                {selectedDoctor?.specialization
                  ? ` — ${selectedDoctor.specialization}`
                  : ""}
                {selectedDoctor?.hospital_name
                  ? ` · ${selectedDoctor.hospital_name}`
                  : ""}
              </p>

              {selectedDoctor && (
                <details
                  open
                  style={{
                    border: "1px solid rgba(16, 72, 68, 0.18)",
                    borderRadius: "16px",
                    padding: "1rem",
                    margin: "1rem 0",
                    background: "rgba(255,255,255,0.42)",
                  }}
                >
                  <summary>
                    <strong>Selected doctor — full admin profile</strong>
                  </summary>

                  <div
                    className="form-grid"
                    style={{ marginTop: "1rem", alignItems: "start" }}
                  >
                    <div>
                      <p>
                        <strong>Full name</strong>
                        <br />
                        {value(selectedDoctor.full_name)}
                      </p>
                      <p>
                        <strong>Specialty</strong>
                        <br />
                        {value(
                          specialtyName || selectedDoctor.specialization,
                        )}
                      </p>
                      <p>
                        <strong>Specialization</strong>
                        <br />
                        {value(selectedDoctor.specialization)}
                      </p>
                      <p>
                        <strong>Sub-specialty</strong>
                        <br />
                        {value(selectedDoctor.sub_specialty)}
                      </p>
                      <p>
                        <strong>Qualification</strong>
                        <br />
                        {value(selectedDoctor.qualification)}
                      </p>
                      <p>
                        <strong>BMDC registration number</strong>
                        <br />
                        {value(selectedDoctor.registration_no)}
                      </p>
                      <p>
                        <strong>Gender</strong>
                        <br />
                        {value(selectedDoctor.gender)}
                      </p>
                      <p>
                        <strong>Experience</strong>
                        <br />
                        {selectedDoctor.experience !== null &&
                        selectedDoctor.experience !== undefined
                          ? `${selectedDoctor.experience} years`
                          : "Not available"}
                      </p>
                    </div>

                    <div>
                      <p>
                        <strong>Admin-only phone</strong>
                        <br />
                        {value(selectedContact?.phone, "No private phone stored")}
                      </p>
                      <p>
                        <strong>Admin-only email</strong>
                        <br />
                        {value(selectedContact?.email, "No private email stored")}
                      </p>
                      <p>
                        <strong>Hospital / workplace</strong>
                        <br />
                        {value(selectedDoctor.hospital_name)}
                      </p>
                      <p>
                        <strong>Primary chamber / clinic</strong>
                        <br />
                        {value(selectedDoctor.chamber_name)}
                      </p>
                      <p>
                        <strong>Chamber address</strong>
                        <br />
                        {value(selectedDoctor.chamber_address)}
                      </p>
                      <p>
                        <strong>Location</strong>
                        <br />
                        {value(selectedDoctor.location)}
                      </p>
                      <p>
                        <strong>Area / district</strong>
                        <br />
                        {value(
                          [selectedDoctor.area, selectedDoctor.district]
                            .filter(Boolean)
                            .join(", "),
                        )}
                      </p>
                    </div>

                    <div>
                      <p>
                        <strong>Consultation type</strong>
                        <br />
                        {value(selectedDoctor.consultation_type)}
                      </p>
                      <p>
                        <strong>Consultation fee</strong>
                        <br />
                        {money(selectedDoctor.consultation_fee)}
                      </p>
                      <p>
                        <strong>Follow-up fee</strong>
                        <br />
                        {money(selectedDoctor.follow_up_fee)}
                      </p>
                      <p>
                        <strong>Available days</strong>
                        <br />
                        {value(selectedDoctor.available_days)}
                      </p>
                      <p>
                        <strong>Available time</strong>
                        <br />
                        {value(selectedDoctor.available_time)}
                      </p>
                      <p>
                        <strong>Status</strong>
                        <br />
                        {value(selectedDoctor.status)}
                      </p>
                      <p>
                        <strong>Verification</strong>
                        <br />
                        {value(selectedDoctor.verification_status)}
                        {selectedDoctor.verified_on
                          ? ` · ${selectedDoctor.verified_on}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {selectedDoctor.conditions_treated && (
                    <p>
                      <strong>Conditions / problems treated:</strong>{" "}
                      {selectedDoctor.conditions_treated}
                    </p>
                  )}

                  {selectedDoctor.bio && (
                    <p>
                      <strong>Profile / bio:</strong> {selectedDoctor.bio}
                    </p>
                  )}

                  {doctorLocations.length > 0 && (
                    <div style={{ marginTop: "1rem" }}>
                      <strong>
                        Chamber / location records ({doctorLocations.length})
                      </strong>
                      <div
                        style={{
                          display: "grid",
                          gap: "0.65rem",
                          marginTop: "0.65rem",
                        }}
                      >
                        {doctorLocations.map((location) => (
                          <div
                            key={location.id}
                            style={{
                              border: "1px solid rgba(16, 72, 68, 0.14)",
                              borderRadius: "12px",
                              padding: "0.75rem",
                            }}
                          >
                            <strong>
                              {value(
                                location.chamber_name,
                                location.is_primary
                                  ? "Primary location"
                                  : "Doctor location",
                              )}
                            </strong>
                            <p style={{ marginBottom: 0 }}>
                              {[location.address, location.area, location.district]
                                .filter(Boolean)
                                .join(" · ") || "Address not available"}
                              <br />
                              {location.available_days ||
                              location.available_time
                                ? `Availability: ${[
                                    location.available_days,
                                    location.available_time,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}`
                                : "Availability not available"}
                              <br />
                              Fee: {money(location.consultation_fee)}
                              {" · "}
                              {value(
                                location.verification_status,
                                "Verification not available",
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                      marginTop: "1rem",
                    }}
                  >
                    <Link
                      className="button secondary"
                      href={`/admin/doctors?edit=${selectedDoctor.id}`}
                    >
                      Open / edit full doctor record
                    </Link>

                    {selectedDoctor.source_url && (
                      <a
                        className="button secondary"
                        href={selectedDoctor.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open official source
                      </a>
                    )}
                  </div>

                  <p className="muted" style={{ marginBottom: 0 }}>
                    Doctor record ID: {selectedDoctor.id}
                  </p>
                </details>
              )}

              {selectedDoctor && !selectedDoctorServesArea && (
                <p className="muted">
                  The patient selected this doctor, but the doctor does not appear
                  to serve {request.area}. Keep the original selection visible and
                  assign a suitable local doctor below if needed.
                </p>
              )}

              <p>
                <strong>Symptoms / reason for visit:</strong>{" "}
                {request.concern_summary || "Not provided"}
              </p>

              <p>
                <strong>Preferred:</strong> {request.preferred_date}{" "}
                {String(request.preferred_time_start).slice(0, 5)}–
                {String(request.preferred_time_end).slice(0, 5)} · maximum budget
                ৳{request.budget_max}
              </p>

              <ActionForm action={reviewAppointment} label="Save decision">
                <input type="hidden" name="id" value={request.id} />

                <div className="form-grid">
                  <label>
                    Status
                    <select
                      name="status"
                      defaultValue={
                        request.status === "Requested"
                          ? "Reviewing"
                          : request.status
                      }
                    >
                      <option>Reviewing</option>
                      <option>Confirmed</option>
                      <option>Declined</option>
                      <option>Completed</option>
                    </select>
                  </label>

                  <label>
                    Assign / confirm doctor in {request.area}
                    <select
                      name="assigned_doctor_id"
                      defaultValue={request.assigned_doctor_id || ""}
                    >
                      <option value="">Not selected</option>
                      {localDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.full_name}
                          {doctor.specialization
                            ? ` — ${doctor.specialization}`
                            : ""}
                          {doctor.hospital_name
                            ? ` · ${doctor.hospital_name}`
                            : ""}
                          {doctor.location ? ` · ${doctor.location}` : ""}
                          {doctor.consultation_fee !== null &&
                          doctor.consultation_fee !== undefined
                            ? ` · ৳${doctor.consultation_fee}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Final date and time (Dhaka)
                    <input type="datetime-local" name="confirmed_time" />
                  </label>

                  <label>
                    Contact / arrival instructions
                    <textarea
                      name="contact_info"
                      defaultValue={request.contact_info || ""}
                    />
                  </label>

                  <label>
                    Admin note
                    <textarea
                      name="admin_note"
                      defaultValue={request.admin_note || ""}
                    />
                  </label>
                </div>
              </ActionForm>
            </details>
          );
        })}
      </div>

      {!requests?.length && <Empty />}
    </>
  );
}
