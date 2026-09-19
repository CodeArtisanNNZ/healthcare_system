import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { healthcareLocations } from "@/lib/locations";
import { ActionForm } from "@/components/action-form";
import { Heading } from "@/components/ui";
import { requestCaregiver } from "@/app/actions";

export default async function CaregiversPage() {
  await requireUser("patient");

  const dhakaToday = new Date(Date.now() + 6 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="container section">
      <Heading eyebrow="HOME CARE" title="Find the right caregiver">
        Tell us what kind of care is needed. You do not have to search through
        random profiles — an administrator will match your request with a
        suitable verified caregiver.
      </Heading>

      <div className="card">
        <ActionForm
          action={requestCaregiver}
          label="Send caregiver request"
          pendingLabel="Sending request…"
        >
          <div className="form-grid">
            <label>
              What kind of care do you need? *
              <select name="care_type" required defaultValue="">
                <option value="" disabled>Select care type…</option>
                <option>Home nursing</option>
                <option>Elder companion</option>
                <option>Dementia support</option>
                <option>Post-stroke and paralysis support</option>
                <option>Bedridden patient care</option>
                <option>Mobility and transfer assistance</option>
                <option>Post-operative care</option>
                <option>Disability support</option>
                <option>Mother and newborn support</option>
                <option>Palliative comfort support</option>
                <option>General personal care</option>
              </select>
            </label>

            <label>
              Preferred caregiver gender *
              <select
                name="caregiver_gender_preference"
                required
                defaultValue="Any"
              >
                <option>Any</option>
                <option>Female</option>
                <option>Male</option>
              </select>
            </label>

            <label>
              What kind of patient is this for? *
              <select name="patient_type" required defaultValue="">
                <option value="" disabled>Select patient type…</option>
                <option>Older adult</option>
                <option>Dementia or Alzheimer&apos;s</option>
                <option>Stroke or paralysis</option>
                <option>Bedridden patient</option>
                <option>Post-surgery patient</option>
                <option>Person with disability</option>
                <option>Mother and newborn</option>
                <option>Chronic illness</option>
                <option>General support</option>
              </select>
            </label>

            <label>
              Patient age group *
              <select name="patient_age_group" required defaultValue="">
                <option value="" disabled>Select age group…</option>
                <option>Newborn</option>
                <option>Child</option>
                <option>Teen</option>
                <option>Adult</option>
                <option>Older adult</option>
              </select>
            </label>

            <label>
              Mobility *
              <select name="mobility_level" required defaultValue="">
                <option value="" disabled>Select mobility…</option>
                <option>Independent</option>
                <option>Needs some help</option>
                <option>Wheelchair user</option>
                <option>Mostly bedridden</option>
                <option>Fully bedridden</option>
                <option>Not sure</option>
              </select>
            </label>

            <label>
              Area *
              <select name="area" required defaultValue="">
                <option value="" disabled>Select area…</option>
                {healthcareLocations
                  .filter((area) => area !== "Dhaka")
                  .map((area) => (
                    <option key={area}>{area}</option>
                  ))}
              </select>
            </label>

            <label>
              Start date *
              <input
                type="date"
                name="preferred_date"
                min={dhakaToday}
                required
              />
            </label>

            <label>
              Preferred shift *
              <select name="time_period" required defaultValue="">
                <option value="" disabled>Select shift…</option>
                <option value="morning">Morning / day</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="overnight">Night / overnight</option>
                <option value="24-hour">24-hour support</option>
                <option value="anytime">Flexible</option>
              </select>
            </label>

            <label>
              How long do you need care? *
              <select name="duration" required defaultValue="">
                <option value="" disabled>Select duration…</option>
                <option>A few hours</option>
                <option>1 day</option>
                <option>3 days</option>
                <option>1 week</option>
                <option>2 weeks</option>
                <option>1 month</option>
                <option>Ongoing support</option>
              </select>
            </label>

            <label>
              Maximum daily budget *
              <select name="budget" required defaultValue="2000">
                <option value="1200">Up to ৳1,200/day</option>
                <option value="1500">Up to ৳1,500/day</option>
                <option value="2000">Up to ৳2,000/day</option>
                <option value="2500">Up to ৳2,500/day</option>
                <option value="3000">Up to ৳3,000/day</option>
                <option value="flexible">Flexible</option>
              </select>
            </label>
          </div>

          <label>
            Exact service address *
            <textarea
              name="service_address"
              required
              maxLength={500}
              placeholder="House/road, area and any directions the caregiver will need"
            />
          </label>

          <label>
            Anything important the caregiver should know?
            <textarea
              name="care_notes"
              maxLength={1200}
              placeholder="For example: patient uses a wheelchair, needs help with feeding, has dementia, needs lifting assistance, or requires a trained nurse."
            />
          </label>

          <p className="muted">
            Your request goes to the Healthcare Central administrator. They will
            compare gender preference, care needs, patient type, area, shift,
            availability and budget before assigning a caregiver.
          </p>
        </ActionForm>
      </div>

      <p style={{ marginTop: "1rem" }}>
        <Link className="button secondary" href="/patient/caregiver-requests">
          View my caregiver requests
        </Link>
      </p>
    </div>
  );
}
