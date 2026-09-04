import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { login } from "../actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <section className="auth card">
      <p className="eyebrow">WELCOME BACK</p>
      <h1>Sign in to your care.</h1>
      <p className="muted">
        Patients, doctors and administrators use the same secure login.
      </p>
      {error && <p className="notice error">{error}</p>}
      <ActionForm action={login} label="Sign in">
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
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
        <Link href="/forgot-password">Forgot password?</Link>
      </p>
      <p>
        New here? <Link href="/register">Create an account</Link>
      </p>
    </section>
  );
}
