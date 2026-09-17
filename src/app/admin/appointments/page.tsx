import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { Heading, Empty } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { reviewAppointment } from "@/app/actions";

export default async function AdminAppointments() {
  await requireUser("admin"); const db = await supabase();
  const [{ data: requests, error }, { data: doctors, error: doctorError }] = await Promise.all([
    db.from("appointment_requests").select("*,patient:profiles!appointment_requests_patient_id_fkey(full_name,email,phone),requested:doctors!appointment_requests_requested_doctor_id_fkey(full_name),appointment_request_candidates(preference_rank,doctor:doctors(full_name))").order("created_at", { ascending: false }),
    db.from("doctors").select("id,full_name,specialization,location,hospital_name").eq("status", "Active").order("full_name")
  ]);
  if (error || doctorError) throw new Error(error?.message || doctorError!.message);
  const clean = (value: unknown) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const matches = (location: unknown, area: string) => {
    const doctorLocation = clean(location); const selectedArea = clean(area);
    return Boolean(doctorLocation && selectedArea && (doctorLocation.includes(selectedArea) || selectedArea.includes(doctorLocation)));
  };
  return <><Heading eyebrow="ADMIN QUEUE" title="Appointment requests">Review the request, then confirm a doctor from the patient’s selected area.</Heading><div className="stack">{requests?.map((request) => {
    const localDoctors = doctors?.filter((doctor) => matches(doctor.location, request.area)) || [];
    return <details className="card" key={request.id} open={request.status === "Requested"}><summary><strong>{request.patient?.full_name}</strong> · {request.status} · {request.preferred_date} · {request.area}</summary><p>Patient: {request.patient?.email} · {request.patient?.phone || "No phone"}</p><p>Preferred: {request.preferred_date} {String(request.preferred_time_start).slice(0,5)}–{String(request.preferred_time_end).slice(0,5)} · maximum budget ৳{request.budget_max}</p><p>Suggested local doctor: {request.requested?.full_name || "No automatic match—review local directory"}</p>{request.concern_summary && <p>Notes: {request.concern_summary}</p>}<ActionForm action={reviewAppointment} label="Save decision"><input type="hidden" name="id" value={request.id} /><div className="form-grid"><label>Status<select name="status" defaultValue={request.status === "Requested" ? "Reviewing" : request.status}><option>Reviewing</option><option>Confirmed</option><option>Declined</option><option>Completed</option></select></label><label>Doctor in {request.area}<select name="assigned_doctor_id" defaultValue={request.assigned_doctor_id || ""}><option value="">Not selected</option>{localDoctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name} — {doctor.location || doctor.hospital_name || doctor.specialization}</option>)}</select></label><label>Final date and time (Dhaka)<input type="datetime-local" name="confirmed_time" /></label><label>Contact / arrival instructions<textarea name="contact_info" defaultValue={request.contact_info || ""} /></label><label>Admin note<textarea name="admin_note" defaultValue={request.admin_note || ""} /></label></div></ActionForm></details>;
  })}</div>{!requests?.length && <Empty />}</>;
}
