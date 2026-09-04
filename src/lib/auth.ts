import "server-only";
import { redirect } from "next/navigation";
import { supabase, configured } from "./supabase/server";
export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  status: "Active" | "Inactive";
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  avatar_path: string | null;
  created_at: string;
};
export async function currentUser() {
  if (!configured()) return null;
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error)
    throw new Error(
      "Could not load your profile. Check that the database migration is installed.",
    );
  return data as Profile;
}
export async function requireUser(role?: Profile["role"]) {
  const profile = await currentUser();
  if (!profile) redirect("/login");
  if (profile.status !== "Active")
    redirect("/login?error=Your+account+is+inactive.");
  if (role && profile.role !== role) redirect("/dashboard");
  return profile;
}
