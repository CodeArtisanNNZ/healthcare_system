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
  const { data: primary, error } = doctorId
    ? await db.from("doctors").select("id,full_name,specialty_id,specialization,location").eq("id", doctorId).eq("status", "Active").maybeSingle()
    : { data: null, error: null };
  if (error) throw new Error(error.message);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return <div className="container section">
    <Heading eyebrow="PATIENT REQUEST" title="Request an appointment">Tell us where and when you can visit. We will match a suitable doctor in your chosen area and confirm the details.</Heading>
    <div className="card">
      <ActionForm action={requestAppointment} label="Request appointment" pendingLabel="Sending request…">
        <input type="hidden" name="doctor_id" value={primary?.id || ""} />
        <input type="hidden" name="specialty_id" value={primary?.specialty_id || ""} />
        {primary && <p><strong>Requested specialty:</strong> {primary.specialization || "Doctor"}<br /><span className="muted">We will keep {primary.full_name} only if the doctor serves your selected area. Otherwise, we will match another doctor of the same specialty nearby.</span></p>}
        <div className="form-grid">
          <label>Your area<select name="area" required><option value="">Choose your area…</option>{healthcareLocations.filter((area) => area !== "Dhaka").map((area) => <option key={area}>{area}</option>)}</select></label>
          <label>Preferred date<input name="preferred_date" type="date" min={tomorrow} required /></label>
          <label>Preferred time<select name="time_period" required defaultValue=""><option value="" disabled>Choose a time…</option><option value="morning">Morning · 9 AM–12 PM</option><option value="afternoon">Afternoon · 12–4 PM</option><option value="evening">Evening · 4–8 PM</option><option value="anytime">Any time</option></select></label>
          <label>Maximum consultation budget<select name="budget" required defaultValue="1500"><option value="800">Up to ৳800</option><option value="1500">Up to ৳1,500</option><option value="2500">Up to ৳2,500</option><option value="flexible">Flexible</option></select></label>
        </div>
        <label>Anything we should know? <span className="muted">(optional)</span><textarea name="concern_summary" maxLength={1200} placeholder="For example: wheelchair access or preferred hospital" /></label>
        <p className="muted">No calls are needed now. The administrator will confirm the local doctor, exact time, fee and contact details.</p>
      </ActionForm>
    </div>
  </div>;
}
