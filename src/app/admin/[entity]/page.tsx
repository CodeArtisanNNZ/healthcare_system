import { requireUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { entities, type Row } from "@/lib/entities";
import { directory, lookups, queryParams, type Params } from "@/lib/data";
import { Heading, Search, Fields, Empty, Pager } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { saveEntity, deleteEntity, manageUser } from "@/app/actions";
import { supabase } from "@/lib/supabase/server";
import { z } from "zod";
import { DoctorAutofill } from "@/components/doctor-autofill";
export default async function AdminEntity({
  params,
  searchParams,
}: {
  params: Promise<{ entity: string }>;
  searchParams: Promise<Params>;
}) {
  await requireUser("admin");
  const { entity: key } = await params;
  const filters = await searchParams;
  const { q, page } = queryParams(filters);
  const db = await supabase();
  if (key === "dashboard") redirect("/admin");
  if (key === "users") {
    let query = db
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * 24, page * 24 - 1);
    if (q) {
      const term = q.replace(/[,().%_\\"]/g, " ").trim();
      if (term)
        query = query.or(
          ["full_name", "email", "phone", "address"]
            .map((k) => `${k}.ilike.%${term}%`)
            .join(","),
        );
    }
    if (["patient", "doctor", "admin"].includes(String(filters.role)))
      query = query.eq("role", String(filters.role));
    if (["Active", "Inactive"].includes(String(filters.status)))
      query = query.eq("status", String(filters.status));
    const { data: users, error } = await query;
    if (error) throw new Error(error.message);
    return (
      <>
        <Heading title="User accounts">
          Manage profiles, roles, access and passwords.
        </Heading>
        <Search
          q={q}
          placeholder="Search name, email, phone or address"
          extras={
            <>
              <select
                name="role"
                aria-label="Role"
                defaultValue={String(filters.role || "")}
              >
                <option value="">All roles</option>
                {["patient", "doctor", "admin"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <select
                name="status"
                aria-label="Status"
                defaultValue={String(filters.status || "")}
              >
                <option value="">All statuses</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </>
          }
        />
        <div className="stack">
          {users?.map((u) => (
            <details className="card" key={u.id}>
              <summary>
                <strong>{u.full_name}</strong> · {u.email} · {u.role} ·{" "}
                {u.status}
              </summary>
              <p className="muted">Account UUID: {u.id}</p>
              <ActionForm action={manageUser} label="Save account">
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="operation" value="update" />
                <div className="form-grid">
                  {["full_name", "email", "phone", "address"].map((f) => (
                    <label key={f}>
                      {f.replaceAll("_", " ")}
                      <input
                        name={f}
                        type={f === "email" ? "email" : "text"}
                        defaultValue={u[f] || ""}
                        required={["full_name", "email"].includes(f)}
                      />
                    </label>
                  ))}
                  <label>
                    Role
                    <select name="role" defaultValue={u.role}>
                      <option>patient</option>
                      <option>doctor</option>
                      <option>admin</option>
                    </select>
                  </label>
                  <label>
                    Status
                    <select name="status" defaultValue={u.status}>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </label>
                  <label>
                    New password (leave blank to keep)
                    <input
                      name="password"
                      type="password"
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </label>
                </div>
              </ActionForm>
              <ActionForm
                action={manageUser}
                label="Delete account"
                confirm="Delete this account and its personal records permanently?"
              >
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="operation" value="delete" />
              </ActionForm>
            </details>
          ))}
        </div>
        {!users?.length && <Empty />}
        <Pager q={q} page={page} hasNext={users?.length === 24} />
      </>
    );
  }
  const entity = entities[key];
  if (!entity) notFound();
  const rows = await directory(key, q, page);
  const specialties = entity.fields.some((f) => f.key === "specialty_id")
    ? await lookups("specialties")
    : [];
  const medicines = key === "medicine_offers" ? await lookups("medicines") : [];
  let edit: Row | undefined;
  if (typeof filters.edit === "string") {
    const id = z.uuid().safeParse(filters.edit);
    if (!id.success) notFound();
    const { data, error } = await db
      .from(key)
      .select("*")
      .eq("id", id.data)
      .single();
    if (error || !data) notFound();
    edit = data as Row;
  }
  return (
    <>
      <Heading title={entity.title}>{entity.description}</Heading>
      <details className="card editor" open={!!edit}>
        <summary>
          {edit ? "Edit " + entity.singular : "Add " + entity.singular}
        </summary>
        <ActionForm
          key={edit?.id || "new"}
          action={saveEntity}
          label={edit ? "Save changes" : "Add " + entity.singular}
        >
          <input type="hidden" name="entity" value={key} />
          {key === "doctors" && <DoctorAutofill />}
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <Fields
            entity={entity}
            row={edit}
            specialties={specialties}
            medicines={medicines}
          />
          {[
            "doctors",
            "hospitals",
            "caregivers",
            "ambulances",
            "lab_tests",
            "medicines",
          ].includes(key) && (
            <label>
              Image (PNG/JPEG; up to 3 MB)
              <input name="image" type="file" accept="image/jpeg,image/png" />
            </label>
          )}
        </ActionForm>
        {edit && <Link href={"/admin/" + key}>Finish editing</Link>}
      </details>
      <Search q={q} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status / detail</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <strong>{String(r[entity.nameKey])}</strong>
                  <small>
                    {String(r.location || r.email || r.strength || "")}
                  </small>
                </td>
                <td>{String(r.status || r.price || r.priority || "—")}</td>
                <td>
                  <div className="actions">
                    <Link
                      className="button secondary"
                      href={"/admin/" + key + "?edit=" + r.id}
                    >
                      Edit
                    </Link>
                    <ActionForm
                      action={deleteEntity}
                      label="Delete"
                      confirm={
                        "Permanently delete this " +
                        entity.singular.toLowerCase() +
                        "?"
                      }
                      className="inline"
                    >
                      <input type="hidden" name="entity" value={key} />
                      <input type="hidden" name="id" value={r.id} />
                    </ActionForm>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <Empty>No entries yet. Add one above.</Empty>}
      <Pager q={q} page={page} hasNext={rows.length === 24} />
    </>
  );
}
