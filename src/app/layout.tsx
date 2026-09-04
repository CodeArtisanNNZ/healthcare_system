import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { configured } from "@/lib/supabase/server";
import { logout } from "./actions";
import "./globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  title: { default: "Healthcare Central", template: "%s | Healthcare Central" },
  description:
    "One account. Total well-being. Doctors, hospitals, medicines and health records.",
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="topbar">
          <Link className="brand" href="/">
            <img src="/images/logo.png" width={48} height={48} alt="" />
            <span>
              Healthcare <strong>Central</strong>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/doctors">Find care</Link>
            <Link href="/medicines">Medicines</Link>
            <Link href="/about">About</Link>
            {user ? (
              <>
                <Link href="/dashboard">My dashboard</Link>
                <form action={logout}>
                  <button className="secondary">Sign out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">Log in</Link>
                <Link className="button" href="/register">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </header>
        {!configured() && (
          <div className="setup">
            Setup needed: add the Supabase environment variables and run the SQL
            migration in README.md. Public pages can be previewed; account and
            directory features need that connection.
          </div>
        )}
        <main id="main">{children}</main>
        <footer>
          <div>
            <strong>Healthcare Central</strong>
            <p>One account. Total well-being.</p>
          </div>
          <nav>
            <Link href="/emergency">Emergency services</Link>
            <Link href="/doctor-portal">For doctors</Link>
            <Link href="/admin">Administration</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
