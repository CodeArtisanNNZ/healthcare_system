import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { healthcareLocations } from "@/lib/locations";
import { ActionForm } from "@/components/action-form";
import { Heading } from "@/components/ui";
import { requestAppointment } from "@/app/actions";
import { z } from "zod";

export default async function AppointmentRequest({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  await requireUser("patient");

  const selected = (await searchParams).doctor || "";
  const doctorId = z.uuid().safeParse(selected).success ? selected : "";
  const db = await supabase();

  const { data: primary, error } = doctorId
    ? await db
        .from("doctors")
        .select("id,full_name,specialty_id,specialization,location,hospital_name")
        .eq("id", doctorId)
        .eq("status", "Active")
        .maybeSingle()
    : { data: null, error: null };

  if (error) throw new Error(error.message);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <div className="container section">
      <Heading eyebrow="PATIENT REQUEST" title="Request an appointment">
        Tell us your symptoms or reason for the visit, where you can visit and
        when you are available. Your selected doctor will be saved with the
        request.
      </Heading>

      <div className="card">
        <ActionForm
          action={requestAppointment}
          label="Request appointment"
          pendingLabel="Sending request…"
        >
          <input type="hidden" name="doctor_id" value={primary?.id || ""} />
          <input
            type="hidden"
            name="specialty_id"
            value={primary?.specialty_id || ""}
          />

          {primary && (
            <p>
              <strong>Selected doctor:</strong> {primary.full_name}
              {primary.specialization ? ` — ${primary.specialization}` : ""}
              {primary.hospital_name ? ` · ${primary.hospital_name}` : ""}
              <br />
              <span className="muted">
                We will keep this doctor recorded as your choice. If the doctor
                does not serve your selected area, the administrator can assign a
                suitable nearby doctor in the same specialty.
              </span>
            </p>
          )}

          <label>
            Symptoms / reason for visit
            <textarea
              name="concern_summary"
              required
              maxLength={1200}
              placeholder="For example: tooth pain for 3 days, fever and cough, skin rash, pelvic pain, or a routine follow-up"
            />
          </label>

          <div className="form-grid">
            <label>
              Your area
              <select name="area" required defaultValue="">
                <option value="" disabled>
                  Choose your area…
                </option>
                {healthcareLocations
                  .filter((area) => area !== "Dhaka")
                  .map((area) => (
                    <option key={area}>{area}</option>
                  ))}
              </select>
            </label>

            <label>
              Preferred date
              <input
                name="preferred_date"
                type="date"
                min={tomorrow}
                required
              />
            </label>

            <label>
              Preferred time
              <select name="time_period" required defaultValue="">
                <option value="" disabled>
                  Choose a time…
                </option>
                <option value="morning">Morning · 9 AM–12 PM</option>
                <option value="afternoon">Afternoon · 12–4 PM</option>
                <option value="evening">Evening · 4–8 PM</option>
                <option value="anytime">Any time</option>
              </select>
            </label>

            <label>
              Maximum consultation budget
              <select name="budget" required defaultValue="1500">
                <option value="800">Up to ৳800</option>
                <option value="1500">Up to ৳1,500</option>
                <option value="2500">Up to ৳2,500</option>
                <option value="flexible">Flexible</option>
              </select>
            </label>
          </div>

          <p className="muted">
            The administrator will see your selected doctor and symptoms, then
            confirm the final doctor, exact time, fee and contact details.
          </p>
        </ActionForm>
      </div>
    </div>
  );
}
