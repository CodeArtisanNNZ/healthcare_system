import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLanguage } from "@/lib/language";
import { healthcareLocations } from "@/lib/locations";
import { ActionForm } from "@/components/action-form";
import { Heading } from "@/components/ui";
import { requestCaregiver } from "@/app/actions";

const careTypes = [
  ["Home nursing", "হোম নার্সিং"],
  ["Elder companion", "বয়স্কদের সঙ্গ ও সহায়তা"],
  ["Dementia support", "ডিমেনশিয়া সহায়তা"],
  ["Post-stroke and paralysis support", "স্ট্রোক ও পক্ষাঘাত-পরবর্তী সহায়তা"],
  ["Bedridden patient care", "শয্যাশায়ী রোগীর কেয়ার"],
  ["Mobility and transfer assistance", "চলাফেরা ও স্থানান্তরে সহায়তা"],
  ["Post-operative care", "অপারেশন-পরবর্তী কেয়ার"],
  ["Disability support", "প্রতিবন্ধী ব্যক্তির সহায়তা"],
  ["Mother and newborn support", "মা ও নবজাতকের সহায়তা"],
  ["Palliative comfort support", "প্যালিয়েটিভ ও আরামদায়ক কেয়ার"],
  ["General personal care", "সাধারণ ব্যক্তিগত কেয়ার"],
] as const;

const patientTypes = [
  ["Older adult", "বয়স্ক ব্যক্তি"],
  ["Dementia or Alzheimer's", "ডিমেনশিয়া বা আলঝেইমার"],
  ["Stroke or paralysis", "স্ট্রোক বা পক্ষাঘাত"],
  ["Bedridden patient", "শয্যাশায়ী রোগী"],
  ["Post-surgery patient", "অপারেশন-পরবর্তী রোগী"],
  ["Person with disability", "প্রতিবন্ধী ব্যক্তি"],
  ["Mother and newborn", "মা ও নবজাতক"],
  ["Chronic illness", "দীর্ঘমেয়াদি অসুস্থতা"],
  ["General support", "সাধারণ সহায়তা"],
] as const;

export default async function CaregiverRequestPage({
  searchParams,
}: {
  searchParams: Promise<{
    care_type?: string;
    patient_type?: string;
    lang?: string;
  }>;
}) {
  await requireUser("patient");

  const params = await searchParams;
  const language = await getLanguage(params);
  const bn = language === "bn";
  const careValues = careTypes.map(([value]) => value);
  const patientValues = patientTypes.map(([value]) => value);

  const selectedCareType = careValues.includes(
    params.care_type as (typeof careValues)[number],
  )
    ? params.care_type!
    : "";
  const selectedPatientType = patientValues.includes(
    params.patient_type as (typeof patientValues)[number],
  )
    ? params.patient_type!
    : "";

  const dhakaToday = new Date(Date.now() + 6 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="container section">
      <p>
        <Link className="button secondary" href={`/caregivers?lang=${language}`}>
          {bn ? "← কেয়ারগিভার সেবা" : "← Caregiver services"}
        </Link>
      </p>

      <Heading
        eyebrow={bn ? "হোম কেয়ার অনুরোধ" : "HOME CARE REQUEST"}
        title={bn ? "কী ধরনের কেয়ার প্রয়োজন তা জানান" : "Tell us what kind of care is needed"}
      >
        {bn
          ? "প্রয়োজনীয় তথ্য দিন। Healthcare Central উপযুক্ত কেয়ারগিভার বা প্রোভাইডার প্রতিষ্ঠান পর্যালোচনা করবে।"
          : "Share the practical details and Healthcare Central will review suitable caregivers or provider organizations."}
      </Heading>

      <div className="card">
        <ActionForm
          action={requestCaregiver}
          label={bn ? "কেয়ারগিভার অনুরোধ পাঠান" : "Send caregiver request"}
          pendingLabel={bn ? "অনুরোধ পাঠানো হচ্ছে…" : "Sending request…"}
        >
          <div className="form-grid">
            <label>
              {bn ? "কী ধরনের কেয়ার প্রয়োজন? *" : "What kind of care do you need? *"}
              <select name="care_type" required defaultValue={selectedCareType}>
                <option value="" disabled>
                  {bn ? "কেয়ারের ধরন বেছে নিন…" : "Select care type…"}
                </option>
                {careTypes.map(([value, bnLabel]) => (
                  <option value={value} key={value}>
                    {bn ? bnLabel : value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {bn ? "কেয়ারগিভারের পছন্দের জেন্ডার *" : "Preferred caregiver gender *"}
              <select
                name="caregiver_gender_preference"
                required
                defaultValue="Any"
              >
                <option value="Any">{bn ? "যেকোনো" : "Any"}</option>
                <option value="Female">{bn ? "নারী" : "Female"}</option>
                <option value="Male">{bn ? "পুরুষ" : "Male"}</option>
              </select>
            </label>

            <label>
              {bn ? "কার জন্য এই কেয়ার প্রয়োজন? *" : "What kind of patient is this for? *"}
              <select name="patient_type" required defaultValue={selectedPatientType}>
                <option value="" disabled>
                  {bn ? "রোগীর ধরন বেছে নিন…" : "Select patient type…"}
                </option>
                {patientTypes.map(([value, bnLabel]) => (
                  <option value={value} key={value}>
                    {bn ? bnLabel : value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {bn ? "রোগীর বয়সের গ্রুপ *" : "Patient age group *"}
              <select name="patient_age_group" required defaultValue="">
                <option value="" disabled>{bn ? "বয়সের গ্রুপ বেছে নিন…" : "Select age group…"}</option>
                <option value="Newborn">{bn ? "নবজাতক" : "Newborn"}</option>
                <option value="Child">{bn ? "শিশু" : "Child"}</option>
                <option value="Teen">{bn ? "কিশোর/কিশোরী" : "Teen"}</option>
                <option value="Adult">{bn ? "প্রাপ্তবয়স্ক" : "Adult"}</option>
                <option value="Older adult">{bn ? "বয়স্ক" : "Older adult"}</option>
              </select>
            </label>

            <label>
              {bn ? "চলাফেরার অবস্থা *" : "Mobility *"}
              <select name="mobility_level" required defaultValue="">
                <option value="" disabled>{bn ? "চলাফেরার অবস্থা বেছে নিন…" : "Select mobility…"}</option>
                <option value="Independent">{bn ? "নিজে চলাফেরা করতে পারেন" : "Independent"}</option>
                <option value="Needs some help">{bn ? "কিছুটা সহায়তা প্রয়োজন" : "Needs some help"}</option>
                <option value="Wheelchair user">{bn ? "হুইলচেয়ার ব্যবহার করেন" : "Wheelchair user"}</option>
                <option value="Mostly bedridden">{bn ? "বেশিরভাগ সময় শয্যাশায়ী" : "Mostly bedridden"}</option>
                <option value="Fully bedridden">{bn ? "সম্পূর্ণ শয্যাশায়ী" : "Fully bedridden"}</option>
                <option value="Not sure">{bn ? "নিশ্চিত নই" : "Not sure"}</option>
              </select>
            </label>

            <label>
              {bn ? "এলাকা *" : "Area *"}
              <select name="area" required defaultValue="">
                <option value="" disabled>{bn ? "এলাকা বেছে নিন…" : "Select area…"}</option>
                {healthcareLocations
                  .filter((area) => area !== "Dhaka")
                  .map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
              </select>
            </label>

            <label>
              {bn ? "শুরুর তারিখ *" : "Start date *"}
              <input
                type="date"
                name="preferred_date"
                min={dhakaToday}
                required
              />
            </label>

            <label>
              {bn ? "পছন্দের শিফট *" : "Preferred shift *"}
              <select name="time_period" required defaultValue="">
                <option value="" disabled>{bn ? "শিফট বেছে নিন…" : "Select shift…"}</option>
                <option value="morning">{bn ? "সকাল / দিন" : "Morning / day"}</option>
                <option value="afternoon">{bn ? "দুপুর" : "Afternoon"}</option>
                <option value="evening">{bn ? "সন্ধ্যা" : "Evening"}</option>
                <option value="overnight">{bn ? "রাত / রাতভর" : "Night / overnight"}</option>
                <option value="24-hour">{bn ? "২৪ ঘণ্টার সহায়তা" : "24-hour support"}</option>
                <option value="anytime">{bn ? "সময় নমনীয়" : "Flexible"}</option>
              </select>
            </label>

            <label>
              {bn ? "কতদিন কেয়ার প্রয়োজন? *" : "How long do you need care? *"}
              <select name="duration" required defaultValue="">
                <option value="" disabled>{bn ? "মেয়াদ বেছে নিন…" : "Select duration…"}</option>
                <option value="A few hours">{bn ? "কয়েক ঘণ্টা" : "A few hours"}</option>
                <option value="1 day">{bn ? "১ দিন" : "1 day"}</option>
                <option value="3 days">{bn ? "৩ দিন" : "3 days"}</option>
                <option value="1 week">{bn ? "১ সপ্তাহ" : "1 week"}</option>
                <option value="2 weeks">{bn ? "২ সপ্তাহ" : "2 weeks"}</option>
                <option value="1 month">{bn ? "১ মাস" : "1 month"}</option>
                <option value="Ongoing support">{bn ? "চলমান সহায়তা" : "Ongoing support"}</option>
              </select>
            </label>

            <label>
              {bn ? "দৈনিক সর্বোচ্চ বাজেট *" : "Maximum daily budget *"}
              <select name="budget" required defaultValue="2000">
                <option value="1200">{bn ? "সর্বোচ্চ ৳১,২০০/দিন" : "Up to ৳1,200/day"}</option>
                <option value="1500">{bn ? "সর্বোচ্চ ৳১,৫০০/দিন" : "Up to ৳1,500/day"}</option>
                <option value="2000">{bn ? "সর্বোচ্চ ৳২,০০০/দিন" : "Up to ৳2,000/day"}</option>
                <option value="2500">{bn ? "সর্বোচ্চ ৳২,৫০০/দিন" : "Up to ৳2,500/day"}</option>
                <option value="3000">{bn ? "সর্বোচ্চ ৳৩,০০০/দিন" : "Up to ৳3,000/day"}</option>
                <option value="flexible">{bn ? "নমনীয়" : "Flexible"}</option>
              </select>
            </label>
          </div>

          <label>
            {bn ? "সেবার সঠিক ঠিকানা *" : "Exact service address *"}
            <textarea
              name="service_address"
              required
              maxLength={500}
              placeholder={
                bn
                  ? "বাড়ি/রোড, এলাকা এবং কেয়ারগিভারের প্রয়োজনীয় নির্দেশনা"
                  : "House/road, area and any directions the caregiver will need"
              }
            />
          </label>

          <label>
            {bn
              ? "কেয়ারগিভারের আর কী জানা দরকার?"
              : "Anything important the caregiver should know?"}
            <textarea
              name="care_notes"
              maxLength={1200}
              placeholder={
                bn
                  ? "যেমন: রোগী হুইলচেয়ার ব্যবহার করেন, খাওয়াতে সাহায্য লাগে, ডিমেনশিয়া আছে, উঠানো-নামাতে সহায়তা লাগে বা প্রশিক্ষিত নার্স প্রয়োজন।"
                  : "For example: patient uses a wheelchair, needs help with feeding, has dementia, needs lifting assistance, or requires a trained nurse."
              }
            />
          </label>

          <p className="muted">
            {bn
              ? "আপনার অনুরোধ Healthcare Central অ্যাডমিনের কাছে যাবে। কেয়ার নিশ্চিত করার আগে প্রয়োজন, জেন্ডার পছন্দ, এলাকা, শিফট, প্রাপ্যতা ও বাজেট মিলিয়ে দেখা হবে।"
              : "Your request goes to the Healthcare Central administrator. They will compare care needs, gender preference, area, shift, availability and budget before confirming a caregiver or provider."}
          </p>
        </ActionForm>
      </div>

      <p style={{ marginTop: "1rem" }}>
        <Link
          className="button secondary"
          href={`/patient/caregiver-requests?lang=${language}`}
        >
          {bn ? "আমার কেয়ারগিভার অনুরোধগুলো দেখুন" : "View my caregiver requests"}
        </Link>
      </p>
    </div>
  );
}
