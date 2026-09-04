import Link from "next/link";
import type { ReactNode } from "react";
import { entities, type Row, type Entity } from "@/lib/entities";
import { fileUrl } from "@/lib/storage";
export function Heading({
  eyebrow = "HEALTHCARE CENTRAL",
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}
export function Search({
  q = "",
  placeholder = "Search",
  extras,
}: {
  q?: string;
  placeholder?: string;
  extras?: ReactNode;
}) {
  return (
    <form className="search" method="get">
      <label className="sr-only" htmlFor="q">
        {placeholder}
      </label>
      <input
        id="q"
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        maxLength={160}
      />
      {extras}
      <button>Search</button>
    </form>
  );
}
export function Pager({
  page,
  hasNext,
  q = "",
  path = "",
}: {
  page: number;
  hasNext: boolean;
  q?: string;
  path?: string;
}) {
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 && (
        <Link
          className="button secondary"
          href={`${path}?q=${encodeURIComponent(q)}&page=${page - 1}`}
        >
          ← Previous
        </Link>
      )}
      <span>Page {page}</span>
      {hasNext && (
        <Link
          className="button secondary"
          href={`${path}?q=${encodeURIComponent(q)}&page=${page + 1}`}
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
export function Empty({
  children = "No results found. Try another search.",
}: {
  children?: ReactNode;
}) {
  return <div className="empty">{children}</div>;
}
export function Fields({
  entity,
  row = {},
  specialties = [],
  medicines = [],
}: {
  entity: Entity;
  row?: Partial<Row>;
  specialties?: Row[];
  medicines?: Row[];
}) {
  return (
    <div className="form-grid">
      {entity.fields.map((f) => {
        const options =
          f.key === "specialty_id"
            ? specialties.map((s) => ({ value: s.id, label: String(s.name) }))
            : f.key === "medicine_id"
              ? medicines.map((s) => ({ value: s.id, label: String(s.name) }))
              : f.options?.map((s) => ({ value: s, label: s }));
        return (
          <label key={f.key}>
            {f.label}
            {f.required ? " *" : ""}
            {f.type === "textarea" ? (
              <textarea
                name={f.key}
                defaultValue={String(row[f.key] ?? "")}
                maxLength={4000}
              />
            ) : options ? (
              <select
                name={f.key}
                defaultValue={String(
                  row[f.key] ?? (f.key === "status" ? "Active" : ""),
                )}
                required={f.required}
              >
                <option value="">Select…</option>
                {options.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={f.key}
                type={
                  f.type === "number"
                    ? "number"
                    : f.type === "email"
                      ? "email"
                      : f.type === "date"
                        ? "date"
                        : "text"
                }
                min={f.type === "number" ? 0 : undefined}
                step={f.type === "number" ? "any" : undefined}
                required={f.required}
                maxLength={300}
                defaultValue={String(row[f.key] ?? "")}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}
export async function DirectoryCard({
  kind,
  row,
  specialty,
}: {
  kind: string;
  row: Row;
  specialty?: string;
}) {
  const entity = entities[kind];
  const image = await fileUrl("directory-images", row.image_path);
  return (
    <article className="card directory-card">
      {image && (
        <img
          className="directory-image"
          src={image}
          alt={String(row[entity.nameKey])}
        />
      )}
      <div>
        <p className="eyebrow">{specialty || entity.singular}</p>
        <h2>{String(row[entity.nameKey])}</h2>
        <dl>
          {entity.fields
            .filter(
              (f) =>
                ![entity.nameKey, "user_id", "specialty_id", "status"].includes(
                  f.key,
                ),
            )
            .map((f) =>
              row[f.key] !== null &&
              row[f.key] !== undefined &&
              row[f.key] !== "" ? (
                <div key={f.key}>
                  <dt>{f.label}</dt>
                  <dd>{String(row[f.key])}</dd>
                </div>
              ) : null,
            )}
        </dl>
        {row.phone && (
          <a
            className="button secondary"
            href={"tel:" + String(row.phone).replace(/[^+\d]/g, "")}
          >
            Call
          </a>
        )}
        {row.driver_phone && (
          <a
            className="button secondary"
            href={"tel:" + String(row.driver_phone).replace(/[^+\d]/g, "")}
          >
            Call service
          </a>
        )}
      </div>
    </article>
  );
}
