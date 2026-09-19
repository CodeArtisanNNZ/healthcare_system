"use client";

export function NewConversationLink({
  className,
  iconClassName,
  label,
}: {
  className: string;
  iconClassName: string;
  label: string;
}) {
  return (
    <a
      className={className}
      href="/patient"
      onClick={(event) => {
        event.preventDefault();
        const id = globalThis.crypto.randomUUID();
        globalThis.location.assign("/patient?new=" + id);
      }}
    >
      <span className={iconClassName}>+</span>
      {label}
    </a>
  );
}
