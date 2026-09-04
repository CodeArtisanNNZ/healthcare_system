# Healthcare Central — Next.js + Supabase

Converted from the supplied `healthcare_system(5).zip` PHP/MySQL application.

The application uses **Next.js App Router + TypeScript**, **Supabase PostgreSQL**, **Supabase Auth**, **Supabase Storage**, and a **Vercel deployment configuration**. Open this folder in VS Code.

## What is included

- Responsive teal public website using the original logo and supplied illustrations.
- Registration, email confirmation, login, logout, password recovery and confirmed email changes.
- Separate patient, doctor and administrator access with server-side guards and database policies.
- Searchable directories for doctors, hospitals, caregivers, ambulances and lab tests.
- Specialty and symptom keyword matching, including administrator-entered emergency notices.
- Patient profiles, profile photos, prescriptions and lab report uploads/downloads/deletion.
- Administrator create/edit/delete pages for directories, specialties, symptom rules, medicines and offers.
- Administrator user profile, role, status, password and deletion controls.
- Medicine catalog comparisons and optional live listings from the four pharmacy domains used in the PHP application.
- Private records and avatars; public directory images; short-lived private download URLs.
- Legacy PHP URL redirects, SQL migration, data-import preparation scripts and automated tests.

**Scope:** this is a reimplementation of the original workflows with shared React components and updated layouts, not a pixel-for-pixel conversion of every old HTML page. The original appointments page was informational, so this version provides doctor discovery and direct contact, not booking. The original doctor dashboard was minimal; this version adds an authenticated view of an administrator-linked doctor listing. It does not add appointment scheduling, clinical record sharing or online payments.

**Existing data:** the uploaded ZIP contained no MySQL database export. No real users, directory records or medical files were invented. The schema is reconstructed from the PHP queries. Original provider photos are retained in `migration-assets/`; they are not exposed as patient data or assigned to invented profiles. The old hardcoded medicine prices were demonstration values and are not represented as verified/current prices in the new catalog.

## 1. Install and open locally

Use Node.js 22 or later and npm. In the VS Code terminal:

```bash
npm ci
```

Copy `.env.example` to `.env.local` (in Windows PowerShell: `Copy-Item .env.example .env.local`).

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_OR_LEGACY_ANON_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
SERPER_API_KEY=OPTIONAL_LIVE_SEARCH_KEY
```

The service-role key is needed only for administrator Auth-account changes and the manual legacy-upload script. Do not prefix it with `NEXT_PUBLIC_`, commit it, or put it into client components. Leave `SERPER_API_KEY` empty if you only need catalog comparisons. No credentials from the PHP archive were carried over.

## 2. Create the Supabase database and buckets

1. Create a new, empty Supabase project.
2. Open **SQL Editor**.
3. Run the entire `supabase/migrations/001_initial.sql` file once.
4. This creates the tables, Auth profile triggers, permissions, search functions and three Storage buckets. Do not create duplicate buckets manually first.
5. Copy the project URL and publishable/anon key into `.env.local`. Add the server-only service-role key if you want user account administration.

The migration is intended for a fresh project. It is deliberately not a destructive reset script and will fail if its tables already exist. Do not run it on an unrelated populated project.

## 3. Configure authentication

In Supabase Authentication:

- Enable the Email provider and email/password signups.
- Set the Site URL to `http://localhost:3000` for local development.
- Allow `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/callback?next=/reset-password` as redirect destinations (or a local callback wildcard matching both).
- Use the standard PKCE confirmation/recovery links that return an authorization code to the callback. The callback exchanges the code for a cookie session.
- For a public launch, configure your email delivery settings and test confirmation, recovery and email-change delivery using your own project.

Start the application:

```bash
npm run dev
```

Open **http://localhost:3000**. Register a patient account and confirm its email if confirmation is enabled. Use the same browser when following a PKCE confirmation or recovery email started in that browser.

Without environment variables, public pages show a setup message and directories remain empty. Authentication and data operations require a configured Supabase project.

## 4. Make the first administrator

After creating and confirming your own account, run the following in the Supabase SQL Editor. Replace the email with your account email:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_EMAIL_ADDRESS';
```

Sign in and open `/dashboard`; it routes you to `/admin`.

Public registration always creates a patient. Sending `role: admin` in signup metadata does not grant administrator access. Role, account-status and email columns are not writable with the public client key.

### Create a doctor account

1. Register/confirm an account for the doctor using their chosen email.
2. In **Admin → Users**, set its role to `doctor`.
3. Copy that account's UUID displayed in the user editor.
4. Add a specialty under **Admin → Specialties**.
5. Add/edit the doctor directory entry, select the specialty, and enter that UUID in **Linked doctor account UUID**.
6. The doctor can now sign in to `/doctor` and view the linked active listing.

### Populate the directories

Create specialties before doctors and symptom rules. Add medicines before medicine offers. Enter actual directory details and source-checked medicine prices. No sample clinical routing rules are seeded.

## 5. Deploy to Vercel

1. Put this project in your own Git repository. Keep `.env.local`, personal import inputs, `node_modules` and `.next` out of Git.
2. Import that repository into Vercel. If it contains the enclosing ZIP folder, select `healthcare-next` as the project root.
3. Choose the Next.js framework preset. The included `vercel.json` uses `npm ci` and `npm run build`.
4. Add the same environment variable names in Vercel. Set `NEXT_PUBLIC_SITE_URL` to the exact production HTTPS domain.
5. Deploy.
6. Add the production callback URLs to Supabase Auth's redirect allowlist, and set the production Site URL there.
7. Test registration, email confirmation, recovery, admin access and private-file uploads on that deployment.

Use a separate Supabase project for development/staging if those environments should not access production data. If using a Vercel preview domain, explicitly configure the corresponding callback URL and site URL for that environment.

**Deployment status:** no Supabase project or Vercel deployment was created from this environment. Your account credentials and project choices were not provided. The source and deployment configuration are supplied; cloud integration must be connected and tested in your accounts.

## Validation

```bash
npm run typecheck
npm test
npm run build
```

The supplied code passed TypeScript checking, a Next.js production build, and automated tests for:

- Schema execution in embedded PostgreSQL with test Auth/Storage schemas.
- Signup role escalation protection and restricted profile-column updates.
- Patient record and Storage isolation, including attempted cross-user insert/deletion.
- Administrator directory access without blanket access to private medical files.
- Inactive-account access and database-backed medicine search limits.
- Symptom routing and active-only public doctor results.
- Seller URL restrictions, ambiguous-price handling and form validation.

These tests use PGlite to exercise SQL, not a live Supabase Auth or Storage service. They do not verify email delivery, a real Supabase API deployment, real pharmacy responses, Vercel deployment or browser interactions. See `MIGRATION.md` for the source-to-feature mapping and a live integration checklist.

## Project map

```text
src/app/                   Next.js pages, server actions and route handlers
src/components/            Shared forms, directory cards and navigation
src/lib/                   Auth, Supabase clients, validation and medicine search
src/proxy.ts               Cookie-session refresh
supabase/migrations/       PostgreSQL schema, RLS and Storage policies
scripts/                   Optional legacy data/file migration utilities
tests/                     Validation and PostgreSQL permission tests
public/images/             Original brand illustrations
migration-assets/          Original provider photos for controlled import
```

## Implementation notes

- The frontend uses Server Components plus Client Components for forms and live search. Next.js Server Actions handle ordinary writes; `/api/medicines/search` handles live pharmacy search.
- Auth cookies use `@supabase/ssr`. Server-side access checks call `auth.getUser()` and read the current profile from PostgreSQL.
- Regular application operations use the signed-in user's Supabase session and are subject to RLS. Only administrator Auth operations use the server-side service key, after an administrator check.
- Files are limited to 3 MB each in the form handlers and bucket settings. Patient records accept PDF, PNG and JPEG; avatars/directory images accept PNG and JPEG. The server also checks file signatures on application uploads.
- Private links expire after five minutes. They are bearer links: anyone who receives a still-valid link can use it until expiry. Refresh the records page for a new link.
- Deleting an account removes its private files first. If any file deletion fails, the account is retained for retry; already-removed files are not restored automatically. Accounts owning shared directory images must be deactivated or have their image ownership handled separately before deletion.
- Storage and database writes are not a single transaction. New uploads are removed on metadata-save failure where possible. A cleanup failure requires administrator intervention; inspect Storage before deleting any suspected orphan.
- Live medicine search is limited to five requests per minute per active account in PostgreSQL. The search key stays on the server. Each seller is handled independently; missing prices stay unknown. Do not compare different packs as if they were equivalent units.
- Requests to pharmacy pages use fixed pharmacy hosts, HTTPS, checked redirects, timeouts and bounded response sizes. Structured product metadata is preferred; search-snippet prices are labelled unverified. Seller availability and scraping compatibility can change.
- Dependency versions resolved during this conversion are recorded in `package-lock.json`. Use `npm ci` for that exact dependency tree.

## Official references

- [Next.js installation and App Router](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase SSR clients and cookies](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Storage access policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Next.js deployment on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
