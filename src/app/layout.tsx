import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { configured } from "@/lib/supabase/server";
import { LanguageToggle } from "@/components/language-toggle";
import { logout } from "./actions";
import styles from "./layout.module.css";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  title: { default: "Healthcare Central", template: "%s | Healthcare Central" },
  description:
    "Healthcare Central helps people find doctors, hospitals, medicines, caregivers, lab tests and emergency ambulance contacts in Bangladesh.",
};

function PhoneIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12.8 19.8 19.8 0 0 1 2.08 4.2 2 2 0 0 1 4.07 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.68a16 16 0 0 0 6.3 6.3l1.23-1.23a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

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

        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="Healthcare Central home">
            <img src="/images/logo.png" width={54} height={54} alt="" />
            <span>
              Healthcare <strong>Central</strong>
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Main navigation">
            <Link className={styles.desktopLink} href="/">
              Home
            </Link>
            <Link className={styles.desktopLink} href="/#services">
              Services
            </Link>
            <Link className={styles.desktopLink} href="/about">
              About
            </Link>

            {user && (
              <Link className={styles.desktopLink} href="/dashboard">
                My dashboard
              </Link>
            )}

            <Link className={styles.emergencyButton} href="/emergency">
              <PhoneIcon />
              <span className={styles.emergencyFull}>Emergency Help</span>
              <span className={styles.emergencyShort}>Emergency</span>
            </Link>

            <LanguageToggle />

            {user ? (
              <form action={logout}>
                <button className={styles.accountButton}>Sign out</button>
              </form>
            ) : (
              <Link className={styles.accountButton} href="/login">
                Log in
              </Link>
            )}
          </nav>
        </header>

        {!configured() && (
          <div className="setup">
            Setup needed: add the Supabase environment variables and run the SQL
            migrations in README.md.
          </div>
        )}

        <main id="main">{children}</main>

        <footer className={styles.footer}>
          <div className={styles.footerBrand}>
            <img src="/images/logo.png" width={38} height={38} alt="" />
            <div>
              <strong>Healthcare Central</strong>
              <p>Healthcare services in one connected platform.</p>
            </div>
          </div>

          <nav aria-label="Footer navigation">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href={user ? "/patient" : "/login"}>Assistant</Link>
            <Link href="/emergency">Emergency</Link>
            <Link href="/doctor-portal">Doctor portal</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
