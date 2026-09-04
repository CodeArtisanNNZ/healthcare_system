import { ActionForm } from "@/components/action-form";
import { updatePassword } from "../actions";
import { requireUser } from "@/lib/auth";
export default async function Reset() {
  await requireUser();
  return (
    <section className="auth card">
      <h1>Choose a new password.</h1>
      <ActionForm action={updatePassword} label="Update password">
        <label>
          Password
          <input
            name="password"
            type="password"
            minLength={8}
            maxLength={128}
            required
            autoComplete="new-password"
          />
        </label>
      </ActionForm>
    </section>
  );
}
