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
      <label className="sr-only" htmlFor="q">{placeholder}</label>
      <input id="q" name="q" defaultValue={q} placeholder={placeholder} maxLength={160} />
      {extras}
      <button>Search</button>
    </form>
  );
}

export function Pager({
  page,
  hasNext,
  q = "",
  location = "",
  path = "",
}: {
  page: number;
  hasNext: boolean;
  q?: string;
  location?: string;
  path?: string;
}) {
  function href(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    params.set("page", String(targetPage));
    return `${path}?${params.toString()}`;
  }

  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 && <Link className="button secondary" href={href(page - 1)}>← Previous</Link>}
      <span>Page {page}</span>
      {hasNext && <Link className="button secondary" href={href(page + 1)}>Next →</Link>}
    </nav>
  );
}

export function Empty({ children = "No results found. Try another search." }: { children?: ReactNode }) {
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
      {entity.fields.map((field) => {
        const options =
          field.key === "specialty_id"
            ? specialties.map((item) => ({ value: item.id, label: String(item.name) }))
            : field.key === "medicine_id"
              ? medicines.map((item) => ({ value: item.id, label: String(item.name) }))
              : field.options?.map((item) => ({ value: item, label: item }));

        return (
          <label key={field.key}>
            {field.label}{field.required ? " *" : ""}
            {field.type === "textarea" ? (
              <textarea name={field.key} defaultValue={String(row[field.key] ?? "")} maxLength={4000} />
            ) : options ? (
              <select
                name={field.key}
                defaultValue={String(row[field.key] ?? (field.key === "status" ? "Active" : ""))}
                required={field.required}
              >
                <option value="">Select…</option>
                {options.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <input
                name={field.key}
                type={
                  field.type === "number"
                    ? "number"
                    : field.type === "email"
                      ? "email"
                      : field.type === "date"
                        ? "date"
                        : "text"
                }
                min={field.type === "number" ? 0 : undefined}
                step={field.type === "number" ? "any" : undefined}
                required={field.required}
                maxLength={300}
                defaultValue={String(row[field.key] ?? "")}
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
      {image && <img className="directory-image" src={image} alt={String(row[entity.nameKey])} />}
      <div>
        <p className="eyebrow">{specialty || entity.singular}</p>
        <h2>{String(row[entity.nameKey])}</h2>
        <dl>
          {entity.fields
            .filter((field) => ![entity.nameKey, "user_id", "specialty_id", "status"].includes(field.key))
            .map((field) =>
              row[field.key] !== null && row[field.key] !== undefined && row[field.key] !== "" ? (
                <div key={field.key}>
                  <dt>{field.label}</dt>
                  <dd>{String(row[field.key])}</dd>
                </div>
              ) : null,
            )}
        </dl>
        {row.phone && (
          <a className="button secondary" href={"tel:" + String(row.phone).replace(/[^+\d]/g, "")}>Call</a>
        )}
        {row.driver_phone && (
          <a className="button secondary" href={"tel:" + String(row.driver_phone).replace(/[^+\d]/g, "")}>Call service</a>
        )}
      </div>
    </article>
  );
}
