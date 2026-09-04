"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container section">
      <h1>We couldn’t load this page.</h1>
      <p>
        Please try again. If this continues, check the Supabase connection and
        database setup.
      </p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
