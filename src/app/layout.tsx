import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { configured } from "@/lib/supabase/server";
import { logout } from "./actions";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  title: { default: "Healthcare Central", template: "%s | Healthcare Central" },
  description:
    "Healthcare Central connects patients with doctors, hospitals, medicines, caregivers, lab tests and ambulance services through one secure account.",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <header className="topbar">
          <Link className="brand" href="/">
            <img src="/images/logo.png" width={48} height={48} alt="" />
            <span>Healthcare <strong>Central</strong></span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/#services">Services</Link>
            <Link href="/about">About</Link>
            {user ? (
              <>
                <Link href="/dashboard">Aware Minds</Link>
                <Link href="/dashboard">My dashboard</Link>
                <form action={logout}><button className="secondary">Sign out</button></form>
              </>
            ) : (
              <>
                <Link href="/login">Log in</Link>
                <Link className="button" href="/register">Get started</Link>
              </>
            )}
          </nav>
        </header>

        {!configured() && (
          <div className="setup">
            Setup needed: add the Supabase environment variables and run the SQL migrations in README.md.
          </div>
        )}

        <main id="main">{children}</main>

        <footer>
          <div>
            <strong>Healthcare Central</strong>
            <p>Healthcare, easier to navigate.</p>
          </div>
          <nav>
            <Link href={user ? "/dashboard" : "/login"}>Aware Minds AI</Link>
            <Link href={user ? "/emergency" : "/login"}>Ambulance services</Link>
            <Link href="/doctor-portal">For doctors</Link>
            <Link href="/admin">Administration</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
