"use client";
import { useActionState } from "react";
import type { ReactNode } from "react";
import type { FormAction } from "@/lib/form-state";
export function ActionForm({
  action,
  children,
  label = "Save",
  confirm,
  className = "stack",
}: {
  action: FormAction;
  children: ReactNode;
  label?: string;
  confirm?: string;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form
      action={submit}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <div aria-live="polite">
        {state.error && (
          <p className="notice error" role="alert">
            {state.error}
          </p>
        )}
        {state.success && <p className="notice success">{state.success}</p>}
      </div>
      <button disabled={pending} type="submit">
        {pending ? "Please wait…" : label}
      </button>
    </form>
  );
}
