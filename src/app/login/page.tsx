import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { getLanguage } from "@/lib/language";
import { localizedLogin } from "../auth-actions";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; lang?: string }>;
}) {
  const params = await searchParams;
  const language = await getLanguage(params);
  const bn = language === "bn";

  return (
    <section className="auth card">
      <p className="eyebrow">{bn ? "আবার স্বাগতম" : "WELCOME BACK"}</p>

      <h1>
        {bn ? "আপনার অ্যাকাউন্টে লগ ইন করুন।" : "Sign in to your care."}
      </h1>

      <p className="muted">
        {bn
          ? "রোগী, ডাক্তার ও অ্যাডমিন একই নিরাপদ লগইন ব্যবহার করেন।"
          : "Patients, doctors and administrators use the same secure login."}
      </p>

      {params.error && <p className="notice error">{params.error}</p>}

      <ActionForm
        action={localizedLogin}
        label={bn ? "লগ ইন" : "Sign in"}
        pendingLabel={bn ? "অপেক্ষা করুন…" : "Please wait…"}
      >
        <input type="hidden" name="lang" value={language} />

        <label>
          {bn ? "ইমেইল" : "Email"}
          <input name="email" type="email" required autoComplete="email" />
        </label>

        <label>
          {bn ? "পাসওয়ার্ড" : "Password"}
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
          />
        </label>
      </ActionForm>

      <p>
        <Link href="/forgot-password">
          {bn ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot password?"}
        </Link>
      </p>

      <p>
        {bn ? "নতুন ব্যবহারকারী? " : "New here? "}
        <Link href="/register">
          {bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
