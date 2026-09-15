import type { Metadata } from "next";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { configured } from "@/lib/supabase/server";
import { getLanguage } from "@/lib/language";
import { LanguageToggle } from "@/components/language-toggle";
import { DashboardDrawer } from "@/components/dashboard-drawer";
import { ActionGlyph } from "@/components/action-glyph";
import { logout } from "./actions";
import styles from "./layout.module.css";
import "./globals.css";
import "./interaction-effects.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  icons: { icon: "/images/logo.png", apple: "/images/logo.png" },
  title: { default: "Healthcare Central", template: "%s | Healthcare Central" },
  description:
    "Healthcare Central helps people find doctors, hospitals, medicines, caregivers, lab tests and emergency ambulance contacts in Bangladesh.",
};

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
              <DashboardDrawer bn={bn} logoutAction={logout} />
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

                <Link
                  className={`${styles.emergencyButton} hc-action-button`}
                  data-action="emergency"
                  href="/emergency"
                >
                  <ActionGlyph kind="emergency" />
                  <span className={styles.emergencyFull}>
                    {bn ? "জরুরি সহায়তা" : "Emergency Help"}
                  </span>
                  <span className={styles.emergencyShort}>
                    {bn ? "জরুরি" : "Emergency"}
                  </span>
                </Link>

                <LanguageToggle />

                <Link
                  className={`${styles.accountButton} hc-action-button`}
                  data-action="login"
                  href="/login"
                >
                  <span>{bn ? "লগ ইন" : "Log in"}</span>
                  <ActionGlyph kind="login" />
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
