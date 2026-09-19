import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { Empty, Heading } from "@/components/ui";

function formatDateTime(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shiftLabel(value: string) {
  const labels: Record<string, string> = {
    morning: "Morning / day",
    afternoon: "Afternoon",
    evening: "Evening",
    overnight: "Night / overnight",
    "24-hour": "24-hour support",
    anytime: "Flexible",
  };
  return labels[value] || value;
}

export default async function PatientCaregiverRequests() {
  const user = await requireUser("patient");
  const db = await supabase();

  const { data: requests, error } = await db
    .from("caregiver_requests")
    .select(
      "*,assigned:caregivers!caregiver_requests_assigned_caregiver_id_fkey(id,full_name,provider_type,gender,qualification,care_type,experience,location,fee_per_day,availability)",
    )
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <>
      <Heading eyebrow="HOME CARE" title="My caregiver requests">
        Track your request and see the caregiver assigned by Healthcare Central.
      </Heading>

      <p>
        <Link className="button secondary" href="/caregivers">
          + New caregiver request
        </Link>
      </p>

      <div className="stack">
        {requests?.map((request) => (
          <article className="card" key={request.id}>
            <p className="eyebrow">{request.status}</p>
            <h2>{request.care_type}</h2>

            <div className="form-grid">
              <p>
                <strong>Patient</strong>
                <br />
                {request.patient_type || "Not specified"} ·{" "}
                {request.patient_age_group || "Age not specified"}
              </p>
              <p>
                <strong>Caregiver preference</strong>
                <br />
                {request.caregiver_gender_preference || "Any"} caregiver
              </p>
              <p>
                <strong>Where</strong>
                <br />
                {request.area}
                {request.service_address
                  ? " · " + request.service_address
                  : ""}
              </p>
              <p>
                <strong>When</strong>
                <br />
                {request.preferred_date} · {shiftLabel(request.time_period)} ·{" "}
                {request.duration}
              </p>
              <p>
                <strong>Mobility</strong>
                <br />
                {request.mobility_level || "Not specified"}
              </p>
              <p>
                <strong>Maximum budget</strong>
                <br />
                {Number(request.budget_max) >= 100000
                  ? "Flexible"
                  : "৳" + request.budget_max + "/day"}
              </p>
            </div>

            {request.care_notes && (
              <p>
                <strong>Notes:</strong> {request.care_notes}
              </p>
            )}

            {request.assigned && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  border: "1px solid rgba(16,72,68,.16)",
                  borderRadius: "14px",
                }}
              >
                <p className="eyebrow">
                  {request.assigned.provider_type === "Organization"
                    ? "ASSIGNED CARE PROVIDER"
                    : "ASSIGNED CAREGIVER"}
                </p>
                <h3 style={{ marginTop: 0 }}>{request.assigned.full_name}</h3>
                <p className="muted">
                  {[
                    request.assigned.provider_type === "Organization"
                      ? "Provider organization"
                      : request.assigned.gender,
                    request.assigned.care_type,
                    request.assigned.location,
                    request.assigned.experience !== null &&
                    request.assigned.experience !== undefined
                      ? String(request.assigned.experience) + " years experience"
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {request.assigned.qualification && (
                  <p>{request.assigned.qualification}</p>
                )}
                {request.assigned.provider_type === "Organization" && (
                  <p className="muted">
                    This provider organization is responsible for arranging the
                    individual caregiver. Confirm the caregiver identity and
                    schedule before care begins.
                  </p>
                )}
              </div>
            )}

            {request.confirmed_time && (
              <p>
                <strong>Confirmed start:</strong>{" "}
                {formatDateTime(request.confirmed_time)}
              </p>
            )}

            {request.contact_info && (
              <p>
                <strong>Contact / instructions:</strong> {request.contact_info}
              </p>
            )}

            {request.status === "Requested" || request.status === "Reviewing" ? (
              <p className="muted">
                The administrator is reviewing caregiver profiles against your
                preferences. Contact details are shared after assignment.
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {!requests?.length && (
        <Empty>
          You have not requested a caregiver yet. Start with the short care form.
        </Empty>
      )}
    </>
  );
}
