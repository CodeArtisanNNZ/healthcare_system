import "server-only";
import { supabase, configured } from "./supabase/server";
import type { Row } from "./entities";

export type Params = Record<string, string | string[] | undefined>;
export type DirectoryFilters = {
  specialty?: string;
  category?: string;
};

export function queryParams(params: Params) {
  return {
    q: typeof params.q === "string" ? params.q.slice(0, 160) : "",
    location:
      typeof params.location === "string" ? params.location.slice(0, 100) : "",
    specialty:
      typeof params.specialty === "string" ? params.specialty.slice(0, 120) : "",
    category:
      typeof params.category === "string" ? params.category.slice(0, 100) : "",
    page: Math.max(1, Math.min(10000, Number(params.page) || 1)),
  };
}

export async function directory(
  entity: string,
  q = "",
  page = 1,
  location = "",
  filters: DirectoryFilters = {},
): Promise<Row[]> {
  if (!configured()) return [];

  const db = await supabase();
  const safePage = Math.floor(page);

  // Dedicated RPCs rank exact names first, support typo-tolerant fuzzy matching,
  // and apply the filters inside Postgres instead of filtering a partial page
  // in the browser.
  if (entity === "doctors") {
    const smart = await db.rpc("search_doctors_directory_v3", {
      query_text: q,
      location_filter: location,
      specialty_filter: filters.specialty || "",
      page_number: safePage,
    });
    if (!smart.error) return (smart.data || []) as Row[];
  }

  if (entity === "hospitals") {
    const smart = await db.rpc("search_hospitals_directory_v2", {
      query_text: q,
      location_filter: location,
      category_filter: filters.category || "",
      page_number: safePage,
    });
    if (!smart.error) return (smart.data || []) as Row[];
  }

  if (entity === "caregivers") {
    const smart = await db.rpc("search_caregivers_directory_v2", {
      query_text: q,
      location_filter: location,
      page_number: safePage,
    });
    if (!smart.error) return (smart.data || []) as Row[];
  }

  const { data, error } = await db.rpc("search_directory_filtered", {
    entity,
    q,
    location_filter: location,
    page_number: safePage,
  });

  if (!error) return (data || []) as Row[];

  if (location) {
    throw new Error("Location search is temporarily unavailable. " + error.message);
  }

  const fallback = await db.rpc("search_directory", {
    entity,
    q,
    page_number: safePage,
  });

  if (fallback.error) {
    throw new Error("Directory could not be loaded. " + fallback.error.message);
  }

  return (fallback.data || []) as Row[];
}

export async function lookups(
  table: "specialties" | "medicines",
): Promise<Row[]> {
  if (!configured()) return [];

  const db = await supabase();
  const rows: Row[] = [];

  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from(table)
      .select("*")
      .order("name")
      .range(from, from + 999);

    if (error) throw new Error(error.message);
    rows.push(...(data as Row[]));
    if (data.length < 1000) break;
  }

  return rows;
}
