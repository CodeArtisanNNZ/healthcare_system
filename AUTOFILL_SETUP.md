# Doctor Paste & Autofill update

This ZIP is an update package, not the whole website. Copy its src and tests files into the existing project at the same paths. It changes only the doctor admin form and adds a client-only parser. No database migration, API key or dependency is needed.

Files:
- src/app/admin/[entity]/page.tsx (updated)
- src/components/doctor-autofill.tsx (new)
- src/lib/doctor-autofill.ts (new)
- tests/doctor-autofill.test.ts (new)

If you have edited the admin page since receiving the original project, merge just these two additions instead of replacing that file:
1. Add import { DoctorAutofill } from "@/components/doctor-autofill";
2. Inside the entity ActionForm, just after the hidden entity input, add {key === "doctors" && <DoctorAutofill />}.

Run npm test and npm run build, commit the changed files and push to GitHub. Wait for the new Vercel production deployment to become Ready.

Open /admin/doctors, expand Add Doctor, paste one Label: value per line and click Fill Form. Existing values are preserved unless Replace existing field values is checked. Review everything and click Add Doctor / Save changes yourself. Files and linked user accounts are never populated from pasted text.

Supported labels: Name, Full name, Doctor name, Registration number, Registration no, BMDC, Specialty, Speciality, Specialization, Qualification, Qualifications, Experience, Experience (years), Location, Address, Consultation fee, Consultation fee (BDT), Fee, Available time, Schedule, Visiting hours, Phone, Mobile, Email, Hospital, Hospital name, Bio, Biography.

Specialty must match one existing specialty name (case-insensitive). Missing specialties must be added separately. Unrecognized lines and ambiguous numeric values are reported, not guessed. Free-form paragraphs and screenshots are not automatically interpreted. Paste biography as one Bio: line. Photo upload remains manual. No data is sent to an AI service.

Example (fictional):

Name: Dr. Example
Specialty: Cardiology
Qualification: MBBS, MD
Experience: 10 years
Location: Dhaka
Consultation fee: 1000
Available time: Sunday–Thursday, 5–9 PM
Phone: 01XXXXXXXXX
Hospital: Example Hospital

Local automated tests and production build are checked before delivery. No live database write or GitHub/Vercel deployment is performed by this update package.
