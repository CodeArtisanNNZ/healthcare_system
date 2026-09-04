# Migration map and data transfer

## Original source to new implementation

| Original source                                                              | New route / implementation                                                            |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `index.php`, `style.css`                                                     | `/`, shared `globals.css`, original brand assets                                      |
| `about.php`                                                                  | `/about`                                                                              |
| `feature-showcase.php`                                                       | Shared informational service pages and UI components                                  |
| `appointments.php`                                                           | `/appointments`; informational page, direct doctor contact                            |
| `health-records.php`                                                         | `/health-records`, links into private patient records                                 |
| `doctor-portal.php`                                                          | `/doctor-portal`                                                                      |
| `hospitals.php`, `caregivers.php`                                            | `/hospitals`, `/caregivers`; live directory listings                                  |
| `emergency.php`                                                              | `/emergency`, `/ambulances`; active ambulance search                                  |
| `medicines.php`, `details.php`                                               | `/medicines`, `/medicines/[id]`; database-backed medicine catalog and offers          |
| `medicine_search/index.php`                                                  | Live comparison on `/medicines`, server-only search logic and `/api/medicines/search` |
| `medicine_search/live_search_config.php`                                     | `SERPER_API_KEY` server environment variable                                          |
| `medicine_search/debug_serper.php`                                           | Debug endpoint omitted; errors returned through the live-search UI                    |
| `doctor_search/index.php`                                                    | `/doctors`; active doctor directory                                                   |
| `register.html`, `register.php`                                              | `/register`, Supabase signup and profile trigger                                      |
| `login.html`, `login.php`                                                    | `/login`, Supabase cookie sessions                                                    |
| `logout.php`, `admin/logout.php`                                             | POST logout action; old URLs open `/logout` confirmation                              |
| `patient/_guard.php`                                                         | Server-side role checks plus database RLS                                             |
| `patient/dashboard.php`                                                      | `/patient`, role-aware `/dashboard` entry                                             |
| `patient/search.php`                                                         | `/patient/search` → `/doctors`, specialty/symptom/name search                         |
| `patient/hospitals.php`, `caregivers.php`, `ambulances.php`, `lab_tests.php` | Patient links to the corresponding searchable directories                             |
| `patient/profile.php`                                                        | `/patient/profile`, personal details, private avatar, Auth-confirmed email changes    |
| `patient/prescriptions.php`                                                  | `/patient/prescriptions`, private file upload/open/delete                             |
| `patient/reports.php`                                                        | `/patient/reports`, private file upload/open/delete                                   |
| `doctor/dashboard.php`                                                       | `/doctor`, protected linked directory profile view                                    |
| `admin/dashboard.php`, `admin/admin.css`                                     | `/admin`, database counts and shared admin navigation/styles                          |
| `admin/login.html`, `login.php`, `login_process.php`                         | Common `/login`; role determines the dashboard                                        |
| `admin/_auth.php`, `_helpers.php`                                            | Auth guards, Zod validation, reusable forms, server actions and RLS                   |
| `admin/users.php`                                                            | `/admin/users`, search/edit roles/status/profile/password/delete                      |
| `admin/doctors.php`                                                          | `/admin/doctors`, CRUD and optional linked Auth account                               |
| `admin/hospitals.php`                                                        | `/admin/hospitals`, CRUD and image uploads                                            |
| `admin/caregivers.php`                                                       | `/admin/caregivers`, CRUD and image uploads                                           |
| `admin/ambulance.php`                                                        | `/admin/ambulances`, CRUD and image uploads                                           |
| `admin/lab_tests.php`, `lab_tests.html`                                      | `/admin/lab_tests`, combined functional CRUD form                                     |
| `admin/symptom_rules.php`                                                    | `/admin/symptom_rules`, specialty/priority/notice editing                             |
| `admin/test_password.php`                                                    | Removed; Supabase Auth owns password verification                                     |
| `config.php`                                                                 | Environment variables and server Supabase clients                                     |
| Original upload folders                                                      | Supabase Storage buckets and owned object paths                                       |

New support pages include password recovery/reset, an Auth callback, specialty administration, and medicine catalog/offer administration. Old PHP display URLs redirect to the matching new route. Old form POST payloads are not an API compatibility layer: open the new UI and use its forms. The legacy `details.php?id=<integer>` URL leads to the catalog because database records now have UUIDs and the old hardcoded demo IDs do not identify imported records. Search bookmarks using `q` retain their query; old `search`/`location` parameter names can be re-entered in the new search field.

The multiple distinct legacy page layouts are consolidated into one responsive design. Original static promotional, example and medical instruction copy is not reproduced verbatim. Directory availability is controlled through Active/Inactive status. No emergency telephone number or clinical rule is invented or seeded.

## Database mapping

| Legacy MySQL table                   | PostgreSQL table                       | Key change                                                                 |
| ------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------- |
| `user`                               | `auth.users` + `public.profiles`       | Auth UUID; passwords reside in Supabase Auth                               |
| `admin`                              | `auth.users` + `profiles.role='admin'` | No separate administrator password table                                   |
| `patient_profiles`                   | `profiles`                             | Personal details combined with the account profile                         |
| `specialty`                          | `specialties`                          | UUID primary key; name                                                     |
| `symptom_rule`                       | `symptom_rules`                        | UUID; specialty foreign key; priority and notice                           |
| `doctor`                             | `doctors`                              | Independent directory UUID; optional `user_id` Auth link                   |
| `hospital`                           | `hospitals`                            | UUID; snake_case fields                                                    |
| `caregiver`                          | `caregivers`                           | UUID; snake_case fields                                                    |
| `ambulance`                          | `ambulances`                           | UUID; includes location/address/city used by the original emergency search |
| `lab_tests`                          | `lab_tests`                            | UUID; unifies the fields read by patient/admin pages                       |
| `prescriptions`, `lab_reports`       | `health_records`                       | UUID; `kind` distinguishes prescription/report; private object path        |
| PHP hardcoded medicine/seller arrays | `medicines`, `medicine_offers`         | No real data imported; offers require source URL and checked date          |
| No equivalent                        | `search_limits`                        | Persistent live-search rate limit                                          |

Original schemas, constraints and complete table definitions could not be verified because no SQL dump was supplied. This schema is inferred from the source queries and includes the fields needed by the converted workflows. Verify any future data export against the mappings before importing.

## Importing existing records later

The conversion itself does not require an existing database. To bring old data across:

1. Export your actual MySQL tables. Keep a backup before migration.
2. Normalize the data into a JSON object containing arrays named `user`, `specialty`, `symptom_rule`, `doctor`, `hospital`, `caregiver`, `ambulance`, `lab_tests`, `patient_profiles`, `prescriptions` and `lab_reports` as applicable. Each row uses its original column names. This utility does not parse arbitrary SQL dumps or phpMyAdmin wrapper formats.
3. Create/confirm the corresponding Supabase Auth accounts using an appropriate account migration process. Existing PHP password hashes are not imported by these scripts. Arrange account invitations or password resets through your own Auth workflow.
4. Create `auth-user-map.json`, mapping each legacy `UserID` to its existing Supabase Auth UUID. Make sure each new account's email matches the intended legacy account. This mapping is essential to keep patient ownership correct.
5. Run the offline converter:

```bash
python scripts/prepare_legacy_import.py migration-input/legacy.json migration-input/auth-user-map.json legacy-import
```

Example input **structure only**, using your own values:

```json
{
  "specialty": [{ "SpecialtyID": 1, "SpecialtyName": "YOUR_SPECIALTY_NAME" }]
}
```

The converter writes `legacy-import/legacy-data.sql` and `legacy-import/storage-manifest.json`. It makes no network requests and executes no SQL. Directory IDs are deterministic UUIDs so references remain consistent. Missing required Auth mappings or unrecognized tables stop conversion instead of discarding data silently. Existing rows are not overwritten on directory-ID conflicts. Known mapped columns are transferred; review any extra columns in your export separately. Legacy administrator accounts must be mapped manually to Auth roles; the separate legacy `admin` table intentionally requires review.

6. Inspect the SQL, especially account UUIDs, roles, dates, specialty references and image paths. The default doctor primary-key mapping follows the supplied PHP code's use of `doctor.UserID`; change it if your real schema differs. A directory doctor ID is not automatically evidence of a valid doctor login account.
7. Check the Storage manifest against the original application's files. It expects the original application root containing `uploads/`. This delivered ZIP retains only the provided provider photos under `migration-assets/`; reconstruct their `uploads/doctors` and `uploads/caregivers` locations or use your original application directory. No patient documents were present in the uploaded archive.
8. Validate the local files without uploading:

```bash
node --env-file=.env.local scripts/upload-legacy-files.mjs legacy-import/storage-manifest.json PATH_TO_OLD_HEALTHCARE_ROOT
```

9. Once reviewed, upload them:

```bash
node --env-file=.env.local scripts/upload-legacy-files.mjs legacy-import/storage-manifest.json PATH_TO_OLD_HEALTHCARE_ROOT --apply
```

10. Run the reviewed `legacy-data.sql` in Supabase's SQL Editor. The SQL references the already-uploaded object paths. Check ownership and file access using two different patient accounts.

The upload script skips paths reported as already existing and does not overwrite them. Check any pre-existing object manually. Files larger than 3 MB need preparation or an intentional application/bucket-limit change. Import files contain personal information: keep them outside `public/` and out of Git.

## Live integration checks after connecting your accounts

- Register a patient; verify its role remains patient even if signup metadata includes another role.
- Confirm email, sign in, sign out and use password recovery in the same browser.
- Confirm a change of email; check both the Auth email and profile email.
- Update personal details and upload an avatar.
- With two patients, upload a report/prescription for each and confirm neither can list, download or delete the other's files through Supabase APIs.
- Open a private file link and check expiry/refresh behavior.
- Promote an administrator through the SQL Editor; add a specialty and doctor, then confirm public discovery.
- Add/edit/deactivate/delete each directory type and upload its image.
- Configure a reviewed symptom rule; verify its priority and notice behavior.
- Link a doctor account to a listing and confirm the doctor cannot open the admin portal or other patients' records.
- Change user status and confirm inactive accounts cannot use private records or live search.
- Configure Serper, search a medicine and compare the displayed result with each seller's real product page. Check error handling when the search key is absent or a seller fails.
- Test the same flows on the final Vercel domain after configuring Auth redirect URLs.
