import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { fileUrl } from "@/lib/storage";
import { Heading, Empty, Pager } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import {
  saveProfile,
  changeEmail,
  uploadRecord,
  deleteRecord,
} from "@/app/actions";
import { queryParams, type Params } from "@/lib/data";
export default async function PatientSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Params>;
}) {
  const user = await requireUser("patient");
  const { section } = await params;
  const routes: Record<string, string> = {
    search: "/doctors",
    hospitals: "/hospitals",
    ambulances: "/ambulances",
    caregivers: "/caregivers",
    lab_tests: "/lab-tests",
    dashboard: "/patient",
  };
  if (routes[section]) {
    const { q } = queryParams(await searchParams);
    redirect(routes[section] + (q ? "?q=" + encodeURIComponent(q) : ""));
  }
  if (section === "profile") {
    const avatar = await fileUrl("avatars", user.avatar_path);
    return (
      <>
        <Heading title="My profile">
          Keep your personal details up to date.
        </Heading>
        <div className="split">
          <div className="card">
            {avatar && (
              <img className="avatar" src={avatar} alt="Your profile" />
            )}
            <ActionForm action={saveProfile} label="Save profile">
              <div className="form-grid">
                <label>
                  Full name
                  <input
                    name="full_name"
                    required
                    defaultValue={user.full_name}
                  />
                </label>
                <label>
                  Phone
                  <input name="phone" defaultValue={user.phone || ""} />
                </label>
                <label>
                  Address
                  <textarea name="address" defaultValue={user.address || ""} />
                </label>
                <label>
                  Date of birth
                  <input
                    type="date"
                    name="date_of_birth"
                    defaultValue={user.date_of_birth || ""}
                  />
                </label>
                <label>
                  Gender
                  <select name="gender" defaultValue={user.gender || ""}>
                    {["", "Female", "Male", "Other"].map((v) => (
                      <option key={v} value={v}>
                        {v || "Select…"}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Blood group
                  <select
                    name="blood_group"
                    defaultValue={user.blood_group || ""}
                  >
                    {["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (v) => (
                        <option key={v} value={v}>
                          {v || "Select…"}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Profile photo (PNG/JPEG, up to 3 MB)
                  <input
                    type="file"
                    name="avatar"
                    accept="image/jpeg,image/png"
                  />
                </label>
              </div>
            </ActionForm>
          </div>
          <div className="card">
            <h2>Account email</h2>
            <ActionForm action={changeEmail} label="Change email">
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={user.email}
                />
              </label>
            </ActionForm>
            <p className="muted">Confirm the change using the email link.</p>
          </div>
        </div>
      </>
    );
  }
  if (!["prescriptions", "reports"].includes(section)) notFound();
  const kind = section === "prescriptions" ? "prescription" : "report";
  const { page } = queryParams(await searchParams);
  const db = await supabase();
  const { data, error } = await db
    .from("health_records")
    .select("*")
    .eq("user_id", user.id)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .range((page - 1) * 24, page * 24 - 1);
  if (error) throw new Error(error.message);
  const records = await Promise.all(
    (data || []).map(async (r) => ({
      ...r,
      url: await fileUrl("health-records", r.path),
    })),
  );
  return (
    <>
      <Heading
        title={kind === "prescription" ? "My prescriptions" : "My lab reports"}
      >
        Files in this account are private to you.
      </Heading>
      <div className="card">
        <h2>Upload a {kind}</h2>
        <ActionForm action={uploadRecord} label="Upload file">
          <input type="hidden" name="kind" value={kind} />
          <label>
            Description
            <textarea name="description" maxLength={4000} />
          </label>
          <label>
            File (PDF, JPEG or PNG; up to 3 MB)
            <input
              name="file"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              required
            />
          </label>
        </ActionForm>
      </div>
      <div className="cards section">
        {records.map((r) => (
          <article className="card" key={r.id}>
            <h2>{r.file_name}</h2>
            <p>{r.description}</p>
            <p className="muted">
              Uploaded{" "}
              {new Date(r.created_at).toLocaleDateString("en-GB", {
                timeZone: "UTC",
              })}
            </p>
            {r.url ? (
              <a
                className="button secondary"
                href={r.url}
                target="_blank"
                rel="noreferrer"
              >
                Open file ↗
              </a>
            ) : (
              <p className="notice error">
                File unavailable. Refresh or contact support.
              </p>
            )}
            <ActionForm
              action={deleteRecord}
              label="Delete file"
              confirm="Permanently delete this file?"
            >
              <input type="hidden" name="id" value={r.id} />
            </ActionForm>
          </article>
        ))}
      </div>
      {!records.length && <Empty>No files uploaded yet.</Empty>}
      <Pager page={page} hasNext={records.length === 24} />
    </>
  );
}
