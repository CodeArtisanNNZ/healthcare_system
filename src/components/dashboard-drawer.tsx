"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LanguageToggle } from "@/components/language-toggle";
import styles from "@/app/layout.module.css";

type LogoutAction = (formData: FormData) => void | Promise<void>;

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12.8 19.8 19.8 0 0 1 2.08 4.2 2 2 0 0 1 4.07 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.68a16 16 0 0 0 6.3 6.3l1.23-1.23a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

export function DashboardDrawer({
  bn,
  logoutAction,
}: {
  bn: boolean;
  logoutAction: LogoutAction;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const links = [
    ["/", bn ? "হোম" : "Home"],
    ["/patient", bn ? "ড্যাশবোর্ড" : "Dashboard"],
    ["/patient/search", bn ? "ডাক্তার খুঁজুন" : "Find a doctor"],
    ["/medicines", bn ? "ওষুধ" : "Medicines"],
    ["/patient/hospitals", bn ? "হাসপাতাল" : "Hospitals"],
    ["/patient/lab_tests", bn ? "ল্যাব টেস্ট" : "Lab tests"],
    ["/patient/caregivers", bn ? "কেয়ারগিভার" : "Caregivers"],
    ["/emergency", bn ? "অ্যাম্বুলেন্স" : "Ambulances"],
    ["/patient/prescriptions", bn ? "প্রেসক্রিপশন" : "Prescriptions"],
    ["/patient/reports", bn ? "ল্যাব রিপোর্ট" : "Lab reports"],
    ["/patient/profile", bn ? "আমার প্রোফাইল" : "My profile"],
    ["/about", bn ? "আমাদের সম্পর্কে" : "About"],
  ] as const;

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        aria-label={bn ? "মেনু খুলুন" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="dashboard-drawer"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>

      {open && (
        <button
          type="button"
          className={styles.drawerBackdrop}
          aria-label={bn ? "মেনু বন্ধ করুন" : "Close navigation menu"}
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id="dashboard-drawer"
        className={`${styles.menuPanel} ${open ? styles.menuPanelOpen : ""}`}
        aria-hidden={!open}
      >
        <div className={styles.menuHeader}>
          <div className={styles.menuIdentity}>
            <img src="/images/logo.png" width={42} height={42} alt="" />
            <div>
              <strong>Healthcare Central</strong>
              <span>{bn ? "নেভিগেশন" : "Navigation"}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            aria-label={bn ? "মেনু বন্ধ করুন" : "Close menu"}
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.drawerUtilities}>
          <Link className={styles.drawerEmergency} href="/emergency" onClick={() => setOpen(false)}>
            <PhoneIcon />
            {bn ? "জরুরি সহায়তা" : "Emergency Help"}
          </Link>
          <LanguageToggle />
        </div>

        <nav className={styles.drawerNav} aria-label={bn ? "ড্যাশবোর্ড নেভিগেশন" : "Dashboard navigation"}>
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.menuFooter}>
          <form action={logoutAction}>
            <button className={styles.menuLogout}>
              {bn ? "সাইন আউট" : "Sign out"}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
