"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import type { FormAction } from "@/lib/form-state";

export function ActionForm({
  action,
  children,
  label = "Save",
  pendingLabel = "Please wait…",
  confirm,
  className = "stack",
}: {
  action: FormAction;
  children: ReactNode;
  label?: string;
  pendingLabel?: string;
  confirm?: string;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(action, {});

  return (
    <form
      action={submit}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {children}

      <div aria-live="polite">
        {state.error && (
          <p className="notice error" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="notice success">{state.success}</p>
        )}
      </div>

      <button
        className={pending ? "hc-button-pending" : undefined}
        disabled={pending}
        type="submit"
      >
        {pending && <span className="hc-mini-spinner" aria-hidden="true" />}
        <span>{pending ? pendingLabel : label}</span>
      </button>
    </form>
  );
}
