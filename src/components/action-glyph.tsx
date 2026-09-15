type ActionGlyphKind =
  | "dashboard"
  | "search"
  | "login"
  | "assistant"
  | "emergency"
  | "arrow";

export function ActionGlyph({ kind }: { kind: ActionGlyphKind }) {
  if (kind === "search") {
    return (
      <span className="hc-action-glyph hc-action-glyph--search" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle className="hc-glyph-lens" cx="10.7" cy="10.7" r="5.2" />
          <path className="hc-glyph-handle" d="m14.6 14.6 4.3 4.3" />
        </svg>
      </span>
    );
  }

  if (kind === "dashboard") {
    return (
      <span className="hc-action-glyph hc-action-glyph--dashboard" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <rect className="hc-glyph-panel" x="4.5" y="5" width="11" height="14" rx="2.2" />
          <path className="hc-glyph-arrow" d="M11.5 12h7m-2.6-2.6 2.6 2.6-2.6 2.6" />
        </svg>
      </span>
    );
  }

  if (kind === "login") {
    return (
      <span className="hc-action-glyph hc-action-glyph--login" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path className="hc-glyph-door" d="M5.5 4.5h8v15h-8z" />
          <path className="hc-glyph-arrow" d="M10 12h8m-2.8-2.8L18 12l-2.8 2.8" />
        </svg>
      </span>
    );
  }

  if (kind === "assistant") {
    return (
      <span className="hc-action-glyph hc-action-glyph--assistant" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path className="hc-glyph-chat" d="M5 6.5h14v9H11l-4.2 3v-3H5z" />
          <path className="hc-glyph-spark" d="M12 8.6v4.8M9.6 11h4.8" />
        </svg>
      </span>
    );
  }

  if (kind === "emergency") {
    return (
      <span className="hc-action-glyph hc-action-glyph--emergency" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path className="hc-glyph-pulse" d="M3.8 12h4l1.6-3.1 2.8 6.2 2-3.1h6" />
        </svg>
      </span>
    );
  }

  return (
    <span className="hc-action-glyph hc-action-glyph--arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path className="hc-glyph-arrow" d="M5 12h13m-4-4 4 4-4 4" />
      </svg>
    </span>
  );
}
