import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { searchMedicines } from "@/lib/medicine-search";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin)
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    const db = await supabase();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user)
      return NextResponse.json(
        { error: "Sign in to use live pharmacy search." },
        { status: 401 },
      );
    const { data: allowed, error } = await db.rpc("consume_search_quota");
    if (error) throw new Error("Search is unavailable. Check database setup.");
    if (!allowed)
      return NextResponse.json(
        {
          error:
            "Live search is limited to five searches per minute for active accounts.",
        },
        { status: 429 },
      );
    const input = await request.json();
    if (
      typeof input.q !== "string" ||
      input.q.trim().length < 2 ||
      input.q.length > 100
    )
      return NextResponse.json(
        { error: "Enter a medicine name between 2 and 100 characters." },
        { status: 400 },
      );
    return NextResponse.json(
      { offers: await searchMedicines(input.q.trim()) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed." },
      { status: 503 },
    );
  }
}
