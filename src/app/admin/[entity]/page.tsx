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

  const specialties = entity.fields.some((f) => f.key === "specialty_id")
    ? await lookups("specialties")
    : [];
  const medicines = key === "medicine_offers" ? await lookups("medicines") : [];

  let rows: Row[] = [];
  let totalRows: number | null = null;
  let doctorAreas: string[] = [];
  let doctorChambers: string[] = [];

  const doctorFilters = {
    location: typeof filters.location === "string" ? filters.location.slice(0, 100) : "",
    specialty: typeof filters.specialty === "string" ? filters.specialty.slice(0, 120) : "",
    chamber: typeof filters.chamber === "string" ? filters.chamber.slice(0, 220) : "",
    verification: typeof filters.verification === "string" ? filters.verification.slice(0, 40) : "",
    status: typeof filters.status === "string" ? filters.status.slice(0, 40) : "",
    gender: typeof filters.gender === "string" ? filters.gender.slice(0, 20) : "",
    consultation: typeof filters.consultation === "string" ? filters.consultation.slice(0, 30) : "",
    sort: typeof filters.sort === "string" ? filters.sort.slice(0, 30) : "name",
  };

  if (key === "doctors") {
    const [
      { data: filterRows, error: filterError },
      { data: locationRows, error: locationError },
    ] = await Promise.all([
      db
        .from("doctors")
        .select("area,chamber_name")
        .order("area")
        .limit(1000),
      db
        .from("doctor_locations")
        .select("doctor_id,area,chamber_name")
        .order("area")
        .limit(2000),
    ]);

    if (filterError) throw new Error(filterError.message);
    if (locationError) throw new Error(locationError.message);

    doctorAreas = [...new Set(
      [...(filterRows || []), ...(locationRows || [])]
        .map((row) => String(row.area || "").trim())
        .filter(Boolean),
    )].sort((a, b) => a.localeCompare(b));

    doctorChambers = [...new Set(
      [...(filterRows || []), ...(locationRows || [])]
        .map((row) => String(row.chamber_name || "").trim())
        .filter(Boolean),
    )].sort((a, b) => a.localeCompare(b));

    let doctorQuery = db
      .from("doctors")
      .select("*", { count: "exact" });

    if (q) {
      const term = q.replace(/[,().%_\\"]/g, " ").replace(/\\s+/g, " ").trim();
      if (term) {
        doctorQuery = doctorQuery.or(
          [
            "full_name",
            "registration_no",
            "specialization",
            "sub_specialty",
            "qualification",
            "hospital_name",
            "chamber_name",
            "chamber_address",
            "location",
            "area",
            "district",
            "conditions_treated",
          ]
            .map((field) => `${field}.ilike.%${term}%`)
            .join(","),
        );
      }
    }

    if (doctorFilters.location || doctorFilters.chamber) {
      let locationQuery = db
        .from("doctor_locations")
        .select("doctor_id");

      if (doctorFilters.location) {
        locationQuery = locationQuery.eq("area", doctorFilters.location);
      }

      if (doctorFilters.chamber) {
        locationQuery = locationQuery.eq("chamber_name", doctorFilters.chamber);
      }

      const { data: matchedLocations, error: matchedLocationError } =
        await locationQuery.limit(2000);

      if (matchedLocationError) throw new Error(matchedLocationError.message);

      let directQuery = db.from("doctors").select("id");

      if (doctorFilters.location) {
        directQuery = directQuery.eq("area", doctorFilters.location);
      }

      if (doctorFilters.chamber) {
        directQuery = directQuery.eq("chamber_name", doctorFilters.chamber);
      }

      const { data: directMatches, error: directMatchError } =
        await directQuery.limit(1000);

      if (directMatchError) throw new Error(directMatchError.message);

      const doctorIds = [...new Set([
        ...(matchedLocations || []).map((row) => String(row.doctor_id)),
        ...(directMatches || []).map((row) => String(row.id)),
      ])];

      if (!doctorIds.length) {
        rows = [];
        totalRows = 0;
      } else {
        doctorQuery = doctorQuery.in("id", doctorIds);
      }
    }

    if (doctorFilters.specialty) {
      doctorQuery = doctorQuery.eq("specialty_id", doctorFilters.specialty);
    }

    if (["Verified", "Needs review", "Unverified"].includes(doctorFilters.verification)) {
      doctorQuery = doctorQuery.eq("verification_status", doctorFilters.verification);
    }

    if (["Active", "Inactive"].includes(doctorFilters.status)) {
      doctorQuery = doctorQuery.eq("status", doctorFilters.status);
    }

    if (["Female", "Male", "Other"].includes(doctorFilters.gender)) {
      doctorQuery = doctorQuery.eq("gender", doctorFilters.gender);
    }

    if (["Online", "Chamber", "Both"].includes(doctorFilters.consultation)) {
      doctorQuery = doctorQuery.eq("consultation_type", doctorFilters.consultation);
    }

    if (doctorFilters.sort === "newest") {
      doctorQuery = doctorQuery.order("created_at", { ascending: false });
    } else if (doctorFilters.sort === "area") {
      doctorQuery = doctorQuery
        .order("area", { ascending: true, nullsFirst: false })
        .order("full_name", { ascending: true });
    } else if (doctorFilters.sort === "verification") {
      doctorQuery = doctorQuery
        .order("verification_status", { ascending: true })
        .order("full_name", { ascending: true });
    } else {
      doctorQuery = doctorQuery.order("full_name", { ascending: true });
    }

    if (totalRows !== 0) {
      const { data, error, count } = await doctorQuery.range(
        (page - 1) * 24,
        page * 24 - 1,
      );

      if (error) throw new Error(error.message);
      rows = (data || []) as Row[];
      totalRows = count;
    }
  } else {
    rows = await directory(key, q, page);
  }
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
    if (key === "doctors") {
      const { data: contact, error: contactError } = await db
        .from("doctor_private_contacts")
        .select("phone,email")
        .eq("doctor_id", id.data)
        .maybeSingle();
      if (contactError) throw new Error(contactError.message);
      edit = { ...edit, phone: contact?.phone || "", email: contact?.email || "" };
    }

    if (key === "caregivers") {
      const { data: contact, error: contactError } = await db
        .from("caregiver_private_contacts")
        .select("phone,email,internal_notes")
        .eq("caregiver_id", id.data)
        .maybeSingle();
      if (contactError) throw new Error(contactError.message);
      edit = {
        ...edit,
        phone: contact?.phone || "",
        email: contact?.email || "",
        internal_notes: contact?.internal_notes || "",
      };
    }
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
      {key === "doctors" ? (
        <>
          <form className="admin-doctor-filters" method="get">
            <div className="admin-doctor-filter-head">
              <div>
                <strong>Filter doctors</strong>
                <small>Combine filters to find exactly the profiles you need.</small>
              </div>
              <Link className="button secondary admin-filter-clear" href="/admin/doctors">
                Clear filters
              </Link>
            </div>

            <div className="admin-doctor-filter-grid">
              <label className="admin-filter-search">
                Search
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Name, BMDC no., qualification, hospital, chamber…"
                  maxLength={160}
                />
              </label>

              <label>
                Area
                <select name="location" defaultValue={doctorFilters.location}>
                  <option value="">All areas</option>
                  {doctorAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </label>

              <label>
                Specialty
                <select name="specialty" defaultValue={doctorFilters.specialty}>
                  <option value="">All specialties</option>
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {String(specialty.name)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Centre / chamber
                <select name="chamber" defaultValue={doctorFilters.chamber}>
                  <option value="">All centres / chambers</option>
                  {doctorChambers.map((chamber) => (
                    <option key={chamber} value={chamber}>{chamber}</option>
                  ))}
                </select>
              </label>

              <label>
                Verification
                <select name="verification" defaultValue={doctorFilters.verification}>
                  <option value="">All verification states</option>
                  <option value="Verified">Verified</option>
                  <option value="Needs review">Needs review</option>
                  <option value="Unverified">Unverified</option>
                </select>
              </label>

              <label>
                Status
                <select name="status" defaultValue={doctorFilters.status}>
                  <option value="">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>

              <label>
                Gender
                <select name="gender" defaultValue={doctorFilters.gender}>
                  <option value="">All genders</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Consultation
                <select name="consultation" defaultValue={doctorFilters.consultation}>
                  <option value="">All consultation types</option>
                  <option value="Chamber">Chamber</option>
                  <option value="Online">Online</option>
                  <option value="Both">Both</option>
                </select>
              </label>

              <label>
                Sort
                <select name="sort" defaultValue={doctorFilters.sort}>
                  <option value="name">Name A–Z</option>
                  <option value="newest">Newest added</option>
                  <option value="area">Area</option>
                  <option value="verification">Verification</option>
                </select>
              </label>
            </div>

            <div className="admin-doctor-filter-actions">
              <button className="hc-action-button" data-action="search" type="submit">
                Apply filters
              </button>
              <span className="muted">
                {totalRows === null
                  ? "Doctor results"
                  : `${totalRows} doctor${totalRows === 1 ? "" : "s"} found`}
              </span>
            </div>
          </form>

          <div className="table-wrap admin-doctor-table">
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialty</th>
                  <th>Location / chamber</th>
                  <th>Verification / status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const specialtyName =
                    specialties.find((specialty) => specialty.id === r.specialty_id)?.name ||
                    r.specialization ||
                    "—";
                  const currentParams = new URLSearchParams();
                  if (q) currentParams.set("q", q);
                  for (const [name, value] of Object.entries(doctorFilters)) {
                    if (value && !(name === "sort" && value === "name")) {
                      currentParams.set(name, value);
                    }
                  }
                  currentParams.set("edit", r.id);

                  return (
                    <tr key={r.id}>
                      <td>
                        <strong>{String(r.full_name)}</strong>
                        <small>
                          {r.registration_no
                            ? `BMDC: ${String(r.registration_no)}`
                            : String(r.qualification || "")}
                        </small>
                      </td>
                      <td>
                        <strong>{String(specialtyName)}</strong>
                        <small>{String(r.specialization || r.sub_specialty || "")}</small>
                      </td>
                      <td>
                        <strong>{String(r.area || r.location || "—")}</strong>
                        <small>{String(r.chamber_name || r.hospital_name || "")}</small>
                      </td>
                      <td>
                        <span className={`admin-status-pill ${r.verification_status === "Verified" ? "verified" : r.verification_status === "Needs review" ? "review" : ""}`}>
                          {String(r.verification_status || "Unverified")}
                        </span>
                        <small>{String(r.status || "—")}</small>
                      </td>
                      <td>
                        <div className="actions">
                          <Link
                            className="button secondary"
                            href={`/admin/doctors?${currentParams.toString()}`}
                          >
                            Edit
                          </Link>
                          <ActionForm
                            action={deleteEntity}
                            label="Delete"
                            confirm="Permanently delete this doctor?"
                            className="inline"
                          >
                            <input type="hidden" name="entity" value="doctors" />
                            <input type="hidden" name="id" value={r.id} />
                          </ActionForm>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!rows.length && (
            <Empty>No doctors match these filters. Clear filters or try another combination.</Empty>
          )}

          <Pager
            q={q}
            page={page}
            hasNext={rows.length === 24 && (totalRows === null || page * 24 < totalRows)}
            path="/admin/doctors"
            filters={{
              location: doctorFilters.location,
              specialty: doctorFilters.specialty,
              chamber: doctorFilters.chamber,
              verification: doctorFilters.verification,
              status: doctorFilters.status,
              gender: doctorFilters.gender,
              consultation: doctorFilters.consultation,
              sort: doctorFilters.sort === "name" ? "" : doctorFilters.sort,
            }}
          />
        </>
      ) : (
        <>
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
      )}
    </>
  );
}
