import "server-only";
import { supabase, configured } from "./supabase/server";
import type { Row } from "./entities";

export type Params = Record<string, string | string[] | undefined>;

export function queryParams(params: Params) {
  return {
    q: typeof params.q === "string" ? params.q.slice(0, 160) : "",
    location: typeof params.location === "string" ? params.location.slice(0, 100) : "",
    page: Math.max(1, Math.min(10000, Number(params.page) || 1)),
  };
}

export async function directory(
  entity: string,
  q = "",
  page = 1,
  location = "",
): Promise<Row[]> {
  if (!configured()) return [];

  const db = await supabase();

  // Doctor search gets a dedicated conservative symptom/specialty resolver.
  // If the migration has not reached an environment yet, fall back to the
  // existing directory RPC instead of breaking the directory.
  if (entity === "doctors") {
    const smart = await db.rpc("search_doctors_smart", {
      query_text: q,
      location_filter: location,
      page_number: Math.floor(page),
    });

    if (!smart.error) return (smart.data || []) as Row[];
  }

  const { data, error } = await db.rpc("search_directory_filtered", {
    entity,
    q,
    location_filter: location,
    page_number: Math.floor(page),
  });

  if (!error) return (data || []) as Row[];

  if (location) {
    throw new Error(
      "Location search is not installed yet. Run supabase/migrations/002_private_directories_location_search.sql. " +
        error.message,
    );
  }

  const fallback = await db.rpc("search_directory", {
    entity,
    q,
    page_number: Math.floor(page),
  });

  if (fallback.error) {
    throw new Error("Directory could not be loaded. " + fallback.error.message);
  }

  return (fallback.data || []) as Row[];
}

export async function lookups(table: "specialties" | "medicines"): Promise<Row[]> {
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
