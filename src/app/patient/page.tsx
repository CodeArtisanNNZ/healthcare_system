import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLanguage } from "@/lib/language";
import { HealthcareAssistant } from "@/components/healthcare-assistant";
import { NewConversationLink } from "@/components/new-conversation-link";
import { fileUrl } from "@/lib/storage";
import styles from "./patient.module.css";

function NavIcon({ kind }: { kind: "chat" | "doctor" | "medicine" | "hospital" | "file" | "profile" }) {
  if (kind === "chat") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 5.5h14v10H9l-4 3v-13Z" />
        <path d="M8.5 9h7M8.5 12h4.5" />
      </svg>
    );
  }

  if (kind === "doctor") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c.6-4.1 2.8-6.2 6.5-6.2s5.9 2.1 6.5 6.2M18 5v4M16 7h4" />
      </svg>
    );
  }

  if (kind === "medicine") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m8 16 8-8a3.5 3.5 0 0 1 5 5l-8 8a3.5 3.5 0 0 1-5-5Z" />
        <path d="m11 13 5 5" />
      </svg>
    );
  }

  if (kind === "hospital") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 21V5h14v16M9 21v-4h6v4M9 9h6M12 6v6M8 14h2M14 14h2" />
      </svg>
    );
  }

  if (kind === "file") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 3.5h7.5L18 7v13.5H7z" />
        <path d="M14.5 3.5V7H18M9.5 11h6M9.5 14h6M9.5 17h4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20c.65-4.15 2.85-6.2 6.5-6.2s5.85 2.05 6.5 6.2" />
    </svg>
  );
}

export default async function Patient({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await requireUser();

  if (!["patient", "admin"].includes(user.role)) {
    redirect("/dashboard");
  }

  const language = await getLanguage(searchParams);
  const bn = language === "bn";
  const avatar = await fileUrl("avatars", user.avatar_path);

  const navItems = [
    {
      href: "/patient",
      label: bn ? "সহকারী" : "Assistant",
      icon: "chat" as const,
      active: true,
    },
    {
      href: "/patient/search",
      label: bn ? "ডাক্তার খুঁজুন" : "Find a doctor",
      icon: "doctor" as const,
    },
    {
      href: "/medicines",
      label: bn ? "ওষুধ" : "Medicines",
      icon: "medicine" as const,
    },
    {
      href: "/patient/hospitals",
      label: bn ? "হাসপাতাল" : "Hospitals",
      icon: "hospital" as const,
    },
    {
      href: "/patient/prescriptions",
      label: bn ? "প্রেসক্রিপশন" : "Prescriptions",
      icon: "file" as const,
    },
    {
      href: "/patient/reports",
      label: bn ? "ল্যাব রিপোর্ট" : "Lab reports",
      icon: "file" as const,
    },
    {
      href: "/patient/profile",
      label: bn ? "আমার প্রোফাইল" : "My profile",
      icon: "profile" as const,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.workspace}>
        <aside className={styles.sidebar} aria-label={bn ? "ড্যাশবোর্ড নেভিগেশন" : "Dashboard navigation"}>
          <div className={styles.sideBrand}>
            <img src="/images/logo.png" width={34} height={34} alt="" />
            <div>
              <strong>Healthcare Central</strong>
              <span>{bn ? "আপনার স্বাস্থ্য সহকারী" : "Your health assistant"}</span>
            </div>
          </div>

          <NewConversationLink
            className={styles.newChat}
            iconClassName={styles.newChatIcon}
            label={bn ? "নতুন কথোপকথন" : "New conversation"}
          />

          <nav className={styles.sideNav}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.active ? styles.sideLinkActive : styles.sideLink}
                aria-current={item.active ? "page" : undefined}
              >
                <span className={styles.sideIcon}>
                  <NavIcon kind={item.icon} />
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className={styles.sideBottom}>
            <Link className={styles.emergencyLink} href="/emergency">
              <span className={styles.emergencyDot} aria-hidden="true" />
              {bn ? "জরুরি সহায়তা" : "Emergency help"}
            </Link>
          </div>
        </aside>

        <main className={styles.conversation}>
          <header className={styles.conversationHeader}>
            <div>
              <strong>{bn ? "Healthcare Central সহকারী" : "Healthcare Central Assistant"}</strong>
              <span>
                {bn
                  ? `স্বাগতম, ${user.full_name}`
                  : `Welcome, ${user.full_name}`}
              </span>
            </div>

            <Link className={styles.profileLink} href="/patient/profile">
              {avatar ? (
                <img
                  className={styles.profileAvatar}
                  src={avatar}
                  alt={`${user.full_name} profile photo`}
                />
              ) : (
                <span>{user.full_name.slice(0, 1).toUpperCase()}</span>
              )}
              <span className={styles.profileName}>{user.full_name}</span>
            </Link>
          </header>

          <div className={styles.assistantWrap}>
            <HealthcareAssistant language={language} />
          </div>
        </main>
      </div>
    </div>
  );
}
