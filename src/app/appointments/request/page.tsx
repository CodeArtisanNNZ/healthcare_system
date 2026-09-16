import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { healthcareLocations } from "@/lib/locations";
import { ActionForm } from "@/components/action-form";
import { Heading } from "@/components/ui";
import { requestAppointment } from "@/app/actions";
import { z } from "zod";

export default async function AppointmentRequest({ searchParams }: { searchParams: Promise<{ doctor?: string }> }) {
  await requireUser("patient");
  const selected = (await searchParams).doctor || "";
  const doctorId = z.uuid().safeParse(selected).success ? selected : "";
  const db = await supabase();
  const { data: doctors, error } = await db.from("doctors").select("id,full_name,specialty_id,specialization,experience,location,consultation_fee,hospital_name").eq("status", "Active").order("experience", { ascending: false }).limit(250);
  if (error) throw new Error(error.message);
  const primary = doctors?.find((doctor) => doctor.id === doctorId);
  const candidates = primary?.specialty_id ? doctors?.filter((doctor) => doctor.specialty_id === primary.specialty_id) : doctors;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return <div className="container section">
    <Heading eyebrow="PATIENT REQUEST" title="Request an appointment">Choose up to three preferred doctors and a time window. An administrator will verify availability and confirm one doctor, the final time and contact details.</Heading>
    <div className="card">
      <ActionForm action={requestAppointment} label="Request appointment" pendingLabel="Sending request…">
        <input type="hidden" name="doctor_id" value={doctorId} />
        <input type="hidden" name="specialty_id" value={primary?.specialty_id || ""} />
        <div className="form-grid">
          <label>Preferred date<input name="preferred_date" type="date" min={tomorrow} required /></label>
          <label>From<input name="preferred_time_start" type="time" required /></label>
          <label>To<input name="preferred_time_end" type="time" required /></label>
          <label>Alternate date (optional)<input name="alternate_date" type="date" min={tomorrow} /></label>
          <label>Alternate from<input name="alternate_time_start" type="time" /></label>
          <label>Alternate to<input name="alternate_time_end" type="time" /></label>
          <label>Area<select name="area" required><option value="">Select area…</option>{healthcareLocations.map((area) => <option key={area}>{area}</option>)}</select></label>
          <label>Minimum budget (BDT)<input name="budget_min" type="number" min="0" step="100" defaultValue="500" required /></label>
          <label>Maximum budget (BDT)<input name="budget_max" type="number" min="0" step="100" defaultValue="1500" required /></label>
        </div>
        <fieldset><legend>Preferred doctors (choose up to 3)</legend><div className="stack">{(candidates || []).slice(0, 30).map((doctor) => <label key={doctor.id}><input type="checkbox" name="candidate_doctor_id" value={doctor.id} defaultChecked={doctor.id === doctorId} /> <strong>{doctor.full_name}</strong> — {doctor.specialization || "Doctor"}{doctor.location ? ` · ${doctor.location}` : ""}{doctor.consultation_fee ? ` · ৳${doctor.consultation_fee}` : ""}</label>)}</div></fieldset>
        <label>Reason or access needs (optional)<textarea name="concern_summary" maxLength={1200} placeholder="Brief concern, preferred hospital, accessibility or language needs" /></label>
        <p className="muted">Listed fees and schedules may change. The administrator will confirm the actual fee and availability before the appointment is final.</p>
      </ActionForm>
    </div>
  </div>;
}
