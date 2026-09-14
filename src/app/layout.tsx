import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { configured } from "@/lib/supabase/server";
import { getLanguage } from "@/lib/language";
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

function MenuIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, language] = await Promise.all([currentUser(), getLanguage()]);
  const bn = language === "bn";

  return (
    <html lang={language}>
      <body>
        <a className="skip-link" href="#main">
          {bn ? "মূল কনটেন্টে যান" : "Skip to content"}
        </a>

        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="Healthcare Central home">
            <img src="/images/logo.png" width={54} height={54} alt="" />
            <span>
              Healthcare <strong>Central</strong>
            </span>
          </Link>

          <nav
            className={styles.nav}
            aria-label={bn ? "প্রধান নেভিগেশন" : "Main navigation"}
          >
            {user ? (
              <>
                <Link className={styles.emergencyButton} href="/emergency">
                  <PhoneIcon />
                  <span className={styles.emergencyFull}>
                    {bn ? "জরুরি সহায়তা" : "Emergency Help"}
                  </span>
                  <span className={styles.emergencyShort}>
                    {bn ? "জরুরি" : "Emergency"}
                  </span>
                </Link>

                <LanguageToggle />

                <details className={styles.menuDropdown}>
                  <summary className={styles.menuButton}>
                    <MenuIcon />
                    <span>{bn ? "মেনু" : "Menu"}</span>
                  </summary>

                  <div className={styles.menuPanel}>
                    <Link href="/">{bn ? "হোম" : "Home"}</Link>
                    <Link href="/#services">{bn ? "সেবা" : "Services"}</Link>
                    <Link href="/patient">
                      {bn ? "আমার ড্যাশবোর্ড" : "My dashboard"}
                    </Link>
                    <Link href="/patient/profile">
                      {bn ? "প্রোফাইল" : "Profile"}
                    </Link>
                    <Link href="/patient/prescriptions">
                      {bn ? "প্রেসক্রিপশন" : "Prescriptions"}
                    </Link>
                    <Link href="/patient/reports">
                      {bn ? "ল্যাব রিপোর্ট" : "Lab reports"}
                    </Link>
                    <Link href="/about">
                      {bn ? "আমাদের সম্পর্কে" : "About"}
                    </Link>

                    <div className={styles.menuDivider} />

                    <form action={logout}>
                      <button className={styles.menuLogout}>
                        {bn ? "সাইন আউট" : "Sign out"}
                      </button>
                    </form>
                  </div>
                </details>
              </>
            ) : (
              <>
                <Link className={styles.desktopLink} href="/">
                  {bn ? "হোম" : "Home"}
                </Link>
                <Link className={styles.desktopLink} href="/#services">
                  {bn ? "সেবা" : "Services"}
                </Link>
                <Link className={styles.desktopLink} href="/about">
                  {bn ? "আমাদের সম্পর্কে" : "About"}
                </Link>

                <Link className={styles.emergencyButton} href="/emergency">
                  <PhoneIcon />
                  <span className={styles.emergencyFull}>
                    {bn ? "জরুরি সহায়তা" : "Emergency Help"}
                  </span>
                  <span className={styles.emergencyShort}>
                    {bn ? "জরুরি" : "Emergency"}
                  </span>
                </Link>

                <LanguageToggle />

                <Link className={styles.accountButton} href="/login">
                  {bn ? "লগ ইন" : "Log in"}
                </Link>
              </>
            )}
          </nav>
        </header>

        {!configured() && (
          <div className="setup">
            {bn
              ? "সেটআপ প্রয়োজন: Supabase environment variables যোগ করুন এবং README-এর SQL migrations চালান।"
              : "Setup needed: add the Supabase environment variables and run the SQL migrations in README.md."}
          </div>
        )}

        <main id="main">{children}</main>

        <footer className={styles.footer}>
          <div className={styles.footerBrand}>
            <img src="/images/logo.png" width={38} height={38} alt="" />
            <div>
              <strong>Healthcare Central</strong>
              <p>
                {bn
                  ? "এক প্ল্যাটফর্মে প্রয়োজনীয় স্বাস্থ্যসেবা।"
                  : "Healthcare services in one connected platform."}
              </p>
            </div>
          </div>

          <nav aria-label={bn ? "ফুটার নেভিগেশন" : "Footer navigation"}>
            <Link href="/">{bn ? "হোম" : "Home"}</Link>
            <Link href="/about">{bn ? "আমাদের সম্পর্কে" : "About"}</Link>
            <Link href={user ? "/patient" : "/login"}>
              {bn ? "সহকারী" : "Assistant"}
            </Link>
            <Link href="/emergency">{bn ? "জরুরি" : "Emergency"}</Link>
            <Link href="/doctor-portal">
              {bn ? "ডাক্তার পোর্টাল" : "Doctor portal"}
            </Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
