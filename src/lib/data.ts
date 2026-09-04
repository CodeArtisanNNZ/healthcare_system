import "server-only";
import { supabase, configured } from "./supabase/server";
import type { Row } from "./entities";
export type Params = Record<string, string | string[] | undefined>;
export function queryParams(params: Params) {
  return {
    q: typeof params.q === "string" ? params.q.slice(0, 160) : "",
    page: Math.max(1, Math.min(10000, Number(params.page) || 1)),
  };
}
export async function directory(
  entity: string,
  q = "",
  page = 1,
): Promise<Row[]> {
  if (!configured()) return [];
  const db = await supabase();
  const { data, error } = await db.rpc("search_directory", {
    entity,
    q,
    page_number: Math.floor(page),
  });
  if (error) throw new Error("Directory could not be loaded. " + error.message);
  return (data || []) as Row[];
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
