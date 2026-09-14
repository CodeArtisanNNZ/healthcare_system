import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { getLanguage } from "@/lib/language";
import { localizedRegister } from "../auth-actions";

export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const language = await getLanguage(searchParams);
  const bn = language === "bn";

  return (
    <section className="auth card">
      <p className="eyebrow">
        {bn ? "আপনার স্বাস্থ্যসেবা এখান থেকে শুরু" : "YOUR HEALTHCARE STARTS HERE"}
      </p>

      <h1>{bn ? "আপনার অ্যাকাউন্ট তৈরি করুন।" : "Create your account."}</h1>

      <p className="muted">
        {bn
          ? "Healthcare Central ব্যবহার করতে একটি রোগী অ্যাকাউন্ট তৈরি করুন।"
          : "Register for a patient account."}
      </p>

      <ActionForm
        action={localizedRegister}
        label={bn ? "অ্যাকাউন্ট তৈরি করুন" : "Create account"}
        pendingLabel={bn ? "অপেক্ষা করুন…" : "Please wait…"}
      >
        <input type="hidden" name="lang" value={language} />

        <label>
          {bn ? "পূর্ণ নাম" : "Full name"}
          <input name="full_name" required maxLength={300} autoComplete="name" />
        </label>

        <label>
          {bn ? "ইমেইল" : "Email"}
          <input type="email" name="email" required autoComplete="email" />
        </label>

        <label>
          {bn ? "পাসওয়ার্ড" : "Password"}
          <input
            type="password"
            name="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>

        <label>
          {bn ? "ফোন" : "Phone"}
          <input name="phone" autoComplete="tel" maxLength={100} />
        </label>

        <label>
          {bn ? "ঠিকানা" : "Address"}
          <textarea
            name="address"
            autoComplete="street-address"
            maxLength={4000}
          />
        </label>
      </ActionForm>

      <p>
        {bn ? "আগে থেকেই অ্যাকাউন্ট আছে? " : "Already registered? "}
        <Link href="/login">{bn ? "লগ ইন করুন" : "Sign in"}</Link>
      </p>
    </section>
  );
}
