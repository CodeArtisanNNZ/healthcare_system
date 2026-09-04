import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { register } from "../actions";
export default function Register() {
  return (
    <section className="auth card">
      <p className="eyebrow">YOUR HEALTHCARE STARTS HERE</p>
      <h1>Create your account.</h1>
      <p className="muted">Register for a patient account.</p>
      <ActionForm action={register} label="Create account">
        <label>
          Full name
          <input
            name="full_name"
            required
            maxLength={300}
            autoComplete="name"
          />
        </label>
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Password
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
          Phone
          <input name="phone" autoComplete="tel" maxLength={100} />
        </label>
        <label>
          Address
          <textarea
            name="address"
            autoComplete="street-address"
            maxLength={4000}
          />
        </label>
      </ActionForm>
      <p>
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </section>
  );
}
