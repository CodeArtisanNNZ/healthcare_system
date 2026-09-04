import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container section">
      <h1>Page not found.</h1>
      <p>This page does not exist.</p>
      <Link className="button" href="/">
        Back to home
      </Link>
    </div>
  );
}
