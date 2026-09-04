import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = request.nextUrl.searchParams.get("next");
  const destination = next === "/reset-password" ? next : "/dashboard";
  if (code) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.redirect(
    new URL(
      "/login?error=Email+link+expired+or+invalid.+Please+request+a+new+link.",
      request.url,
    ),
  );
}
