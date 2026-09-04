import { ActionForm } from "@/components/action-form";
import { resetPassword } from "../actions";
export default function Forgot() {
  return (
    <section className="auth card">
      <h1>Reset your password.</h1>
      <ActionForm action={resetPassword} label="Send reset link">
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
      </ActionForm>
    </section>
  );
}
