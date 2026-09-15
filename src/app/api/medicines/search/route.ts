import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import {
  parseMedicineQueries,
  searchMedicineList,
} from "@/lib/medicine-search";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  try {
    const db = await supabase();
    const {
      data: { user },
    } = await db.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in to compare medicine sellers." },
        { status: 401 },
      );
    }

    const input = await request.json();

    if (typeof input.q !== "string" || input.q.length > 1_000) {
      return NextResponse.json(
        { error: "Enter up to 10 medicine names." },
        { status: 400 },
      );
    }

    const queries = parseMedicineQueries(input.q);

    if (!queries.length) {
      return NextResponse.json(
        { error: "Enter at least one medicine name." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        queries,
        bundles: await searchMedicineList(queries),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Medicine seller search is temporarily unavailable." },
      { status: 503 },
    );
  }
}
