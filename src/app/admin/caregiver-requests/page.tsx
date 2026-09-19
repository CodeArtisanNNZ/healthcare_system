import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { ActionForm } from "@/components/action-form";
import { Empty, Heading } from "@/components/ui";
import { reviewCaregiverRequest } from "@/app/actions";

function normal(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesText(haystack: unknown, needle: unknown) {
  const h = normal(haystack);
  const n = normal(needle);
  return Boolean(h && n && (h.includes(n) || n.includes(h)));
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

function defaultStart(date: string, period: string) {
  const times: Record<string, string> = {
    morning: "09:00",
    afternoon: "13:00",
    evening: "17:00",
    overnight: "20:00",
    "24-hour": "09:00",
    anytime: "09:00",
  };
  return date + "T" + (times[period] || "09:00");
}

function candidateMatch(caregiver: any, request: any) {
  let score = 0;
  const reasons: string[] = [];

  const isOrganization = caregiver.provider_type === "Organization";

  if (
    isOrganization ||
    request.caregiver_gender_preference === "Any" ||
    caregiver.gender === request.caregiver_gender_preference
  ) {
    score += isOrganization ? 1 : 3;
    if (isOrganization) {
      reasons.push("provider can confirm gender");
    } else if (request.caregiver_gender_preference !== "Any") {
      reasons.push("gender");
    }
  } else {
    score -= 12;
  }

  if (
    includesText(caregiver.service_areas, request.area) ||
    includesText(caregiver.location, request.area) ||
    (isOrganization && normal(caregiver.location).includes("dhaka"))
  ) {
    score += isOrganization ? 3 : 5;
    reasons.push(isOrganization ? "Dhaka provider" : "area");
  }

  const careText = [
    caregiver.care_type,
    caregiver.patient_types,
    caregiver.services,
  ].join(" ");

  if (includesText(careText, request.care_type)) {
    score += 5;
    reasons.push("care type");
  }

  if (includesText(careText, request.patient_type)) {
    score += 3;
    reasons.push("patient type");
  }

  const shiftText = [caregiver.shift_types, caregiver.availability].join(" ");
  const shiftNeedles: Record<string, string[]> = {
    morning: ["morning", "day"],
    afternoon: ["afternoon", "day"],
    evening: ["evening"],
    overnight: ["night", "overnight"],
    "24-hour": ["24 hour", "24-hour", "day and night"],
    anytime: [],
  };

  const shiftMatch =
    request.time_period === "anytime" ||
    (shiftNeedles[request.time_period] || []).some((term) =>
      normal(shiftText).includes(normal(term)),
    );

  if (shiftMatch) {
    score += 2;
    if (request.time_period !== "anytime") reasons.push("shift");
  }

  const fee = Number(caregiver.fee_per_day || 0);
  const budget = Number(request.budget_max || 0);
  if (!fee || budget >= 100000 || fee <= budget) {
    score += 2;
    reasons.push("budget");
  } else {
    score -= 2;
  }

  if (caregiver.verification_status === "Verified") {
    score += 1;
    reasons.push("verified");
  }

  return { score, reasons };
}

export default async function AdminCaregiverRequests() {
  await requireUser("admin");
  const db = await supabase();

  const [
    { data: requests, error: requestError },
    { data: caregivers, error: caregiverError },
    { data: contacts, error: contactError },
  ] = await Promise.all([
    db
      .from("caregiver_requests")
      .select(
        "*,patient:profiles!caregiver_requests_patient_id_fkey(full_name,email,phone)",
      )
      .order("created_at", { ascending: false }),
    db
      .from("caregivers")
      .select(
        "id,full_name,provider_type,gender,supplied_genders,experience,qualification,care_type,patient_types,services,shift_types,availability,location,provider_address,service_areas,fee_per_day,languages,verification_status,verified_on,source_or_agency,status",
      )
      .eq("status", "Active")
      .order("full_name"),
    db
      .from("caregiver_private_contacts")
      .select("caregiver_id,phone,email,internal_notes"),
  ]);

  if (requestError || caregiverError || contactError) {
    throw new Error(
      requestError?.message ||
        caregiverError?.message ||
        contactError?.message ||
        "Could not load caregiver requests.",
    );
  }

  const contactById = new Map(
    (contacts || []).map((contact) => [contact.caregiver_id, contact]),
  );

  return (
    <>
      <Heading eyebrow="HOME CARE ADMIN" title="Caregiver requests">
        Patient needs and caregiver profile fields are shown together so you can
        choose a suitable person quickly. Matching suggestions are based only on
        stored profile information and still require administrator review.
      </Heading>

      <p>
        <Link className="button secondary" href="/admin/caregivers">
          Manage caregiver profiles
        </Link>
      </p>

      <div className="stack">
        {requests?.map((request) => {
          const ranked = (caregivers || [])
            .map((caregiver) => ({
              caregiver,
              ...candidateMatch(caregiver, request),
            }))
            .sort((a, b) => b.score - a.score);

          const topMatches = ranked
            .filter(
              (item) =>
                item.caregiver.provider_type === "Organization" ||
                request.caregiver_gender_preference === "Any" ||
                item.caregiver.gender === request.caregiver_gender_preference,
            )
            .slice(0, 5);

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
                </strong>
                {" · "}
                {request.status}
                {" · "}
                {request.care_type}
                {" · "}
                {request.area}
              </summary>

              <div className="form-grid" style={{ marginTop: "1rem" }}>
                <p>
                  <strong>Patient contact</strong>
                  <br />
                  {request.patient?.email || "No email"}
                  {request.patient?.phone
                    ? " · " + request.patient.phone
                    : ""}
                </p>
                <p>
                  <strong>Care needed</strong>
                  <br />
                  {request.care_type}
                </p>
                <p>
                  <strong>Patient type</strong>
                  <br />
                  {request.patient_type || "Not specified"} ·{" "}
                  {request.patient_age_group || "Age not specified"}
                </p>
                <p>
                  <strong>Mobility</strong>
                  <br />
                  {request.mobility_level || "Not specified"}
                </p>
                <p>
                  <strong>Caregiver gender</strong>
                  <br />
                  {request.caregiver_gender_preference || "Any"}
                </p>
                <p>
                  <strong>Schedule</strong>
                  <br />
                  {request.preferred_date} · {shiftLabel(request.time_period)} ·{" "}
                  {request.duration}
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
                  <strong>Budget</strong>
                  <br />
                  {Number(request.budget_max) >= 100000
                    ? "Flexible"
                    : "Up to ৳" + request.budget_max + "/day"}
                </p>
              </div>

              {request.care_notes && (
                <p>
                  <strong>Care notes:</strong> {request.care_notes}
                </p>
              )}

              <div
                style={{
                  margin: "1rem 0",
                  padding: "1rem",
                  border: "1px solid rgba(16,72,68,.16)",
                  borderRadius: "16px",
                }}
              >
                <p className="eyebrow">PROFILE-FIELD MATCHES</p>

                {!topMatches.length ? (
                  <p className="muted">
                    No active caregiver profile matches the requested gender yet.
                    Add or verify caregivers in the caregiver manager.
                  </p>
                ) : (
                  <div className="stack">
                    {topMatches.map((item, index) => {
                      const caregiver = item.caregiver;
                      const contact = contactById.get(caregiver.id);

                      return (
                        <div
                          key={caregiver.id}
                          style={{
                            padding: "0.85rem 0",
                            borderBottom:
                              index === topMatches.length - 1
                                ? "none"
                                : "1px solid rgba(16,72,68,.12)",
                          }}
                        >
                          <strong>
                            {index + 1}. {caregiver.full_name}
                          </strong>
                          <p className="muted" style={{ margin: "0.3rem 0" }}>
                            {[
                              caregiver.provider_type,
                              caregiver.gender,
                              caregiver.care_type,
                              caregiver.location,
                              caregiver.fee_per_day
                                ? "৳" + caregiver.fee_per_day + "/day"
                                : null,
                              caregiver.verification_status,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <p style={{ margin: "0.3rem 0" }}>
                            <strong>Matched on:</strong>{" "}
                            {item.reasons.length
                              ? item.reasons.join(", ")
                              : "manual review needed"}
                          </p>
                          <p style={{ margin: "0.3rem 0" }}>
                            <strong>Patients:</strong>{" "}
                            {caregiver.patient_types || "Not specified"}
                            {" · "}
                            <strong>Shifts:</strong>{" "}
                            {caregiver.shift_types ||
                              caregiver.availability ||
                              "Not specified"}
                          </p>
                          {caregiver.provider_type === "Organization" && (
                            <p style={{ margin: "0.3rem 0" }}>
                              <strong>Provider office:</strong>{" "}
                              {caregiver.provider_address || caregiver.location || "Not specified"}
                              <br />
                              <strong>Gender supply:</strong>{" "}
                              {caregiver.supplied_genders || "Confirm with provider"}
                              <br />
                              <strong>Service areas:</strong>{" "}
                              {caregiver.service_areas || "Confirm with provider"}
                            </p>
                          )}
                          <p style={{ margin: "0.3rem 0" }}>
                            <strong>Experience / qualification:</strong>{" "}
                            {[
                              caregiver.experience !== null &&
                              caregiver.experience !== undefined
                                ? String(caregiver.experience) + " years"
                                : null,
                              caregiver.qualification,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Not specified"}
                          </p>
                          <p style={{ margin: "0.3rem 0" }}>
                            <strong>Languages / source:</strong>{" "}
                            {[caregiver.languages, caregiver.source_or_agency]
                              .filter(Boolean)
                              .join(" · ") || "Not specified"}
                          </p>
                          <p style={{ margin: "0.3rem 0" }}>
                            <strong>Admin contact:</strong>{" "}
                            {contact?.phone || contact?.email
                              ? [contact?.phone, contact?.email]
                                  .filter(Boolean)
                                  .join(" · ")
                              : "No contact stored"}
                          </p>
                          {contact?.internal_notes && (
                            <p style={{ margin: "0.3rem 0" }}>
                              <strong>Internal note:</strong>{" "}
                              {contact.internal_notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <ActionForm
                action={reviewCaregiverRequest}
                label="Save caregiver decision"
              >
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
                    Assign caregiver
                    <select
                      name="assigned_caregiver_id"
                      defaultValue={request.assigned_caregiver_id || ""}
                    >
                      <option value="">Not selected</option>
                      {ranked.map((item) => (
                        <option
                          key={item.caregiver.id}
                          value={item.caregiver.id}
                        >
                          {item.caregiver.full_name}
                          {" — "}
                          {item.caregiver.provider_type === "Organization"
                            ? "Provider organization"
                            : item.caregiver.gender || "Gender n/a"}
                          {" · "}
                          {item.caregiver.location || "Location n/a"}
                          {item.caregiver.fee_per_day
                            ? " · ৳" + item.caregiver.fee_per_day + "/day"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Confirmed start date and time
                    <input
                      type="datetime-local"
                      name="confirmed_time"
                      defaultValue={
                        request.confirmed_time
                          ? new Date(request.confirmed_time)
                              .toLocaleString("sv-SE", {
                                timeZone: "Asia/Dhaka",
                              })
                              .slice(0, 16)
                              .replace(" ", "T")
                          : defaultStart(
                              request.preferred_date,
                              request.time_period,
                            )
                      }
                    />
                  </label>

                  <label>
                    Contact / arrival instructions
                    <textarea
                      name="contact_info"
                      defaultValue={request.contact_info || ""}
                      placeholder="Optional if the assigned caregiver already has a stored phone/email."
                    />
                  </label>

                  <label>
                    Admin note
                    <textarea
                      name="admin_note"
                      defaultValue={request.admin_note || ""}
                      placeholder="Internal note about matching, verification or follow-up."
                    />
                  </label>
                </div>
              </ActionForm>
            </details>
          );
        })}
      </div>

      {!requests?.length && (
        <Empty>No caregiver requests have been submitted yet.</Empty>
      )}
    </>
  );
}
