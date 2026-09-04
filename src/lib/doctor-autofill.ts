const aliases: Record<string, string> = {
  name: "full_name", "full name": "full_name", "doctor name": "full_name",
  specialty: "specialty_id", speciality: "specialty_id",
  specialization: "specialization", qualification: "qualification", qualifications: "qualification",
  experience: "experience", "experience (years)": "experience",
  location: "location", address: "location", fee: "consultation_fee",
  "consultation fee": "consultation_fee", "consultation fee (bdt)": "consultation_fee",
  "available time": "available_time", schedule: "available_time", "visiting hours": "available_time",
  phone: "phone", mobile: "phone", email: "email", hospital: "hospital_name",
  "hospital name": "hospital_name", bio: "bio", biography: "bio",
  "registration number": "registration_no", "registration no": "registration_no", bmdc: "registration_no",
};
export function parseDoctorInfo(text: string, specialties: { id: string; name: string }[]) {
  const values: Record<string, string> = {};
  const warnings: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^\s*([^:]+):\s*(.*?)\s*$/);
    const field = match && aliases[match[1].trim().toLowerCase()];
    if (!match || !field) { warnings.push(`Not recognized: ${line}`); continue; }
    let value = match[2];
    if (!value) continue;
    if (field === "specialty_id") {
      const matches = specialties.filter(s => s.name.trim().toLowerCase() === value.toLowerCase());
      if (matches.length !== 1) { warnings.push(`Select or add this specialty manually: ${value}`); continue; }
      value = matches[0].id;
    }
    if (field === "experience" || field === "consultation_fee") {
      value = value.replace(/[০-৯]/g, c => String("০১২৩৪৫৬৭৮৯".indexOf(c)));
      value = field === "experience"
        ? value.replace(/\s*(years?|yrs?)\s*$/i, "")
        : value.replace(/^(BDT|Tk\.?|৳)\s*/i, "").replace(/\s*(BDT|Tk\.?)$/i, "");
      value = value.replace(/,/g, "").trim();
      if (!/^\d+(\.\d+)?$/.test(value) || (field === "experience" && !/^\d+$/.test(value))) {
        warnings.push(`Check the numeric value for ${match[1]}.`); continue;
      }
    }
    values[field] = value;
  }
  return { values, warnings };
}
