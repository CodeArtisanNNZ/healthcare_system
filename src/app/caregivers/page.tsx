import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLanguage } from "@/lib/language";
import { supabase } from "@/lib/supabase/server";
import styles from "./caregivers.module.css";

const situations = [
  {
    en: {
      title: "An older parent needs daily help",
      description: "Companionship, meals, personal care and support with everyday routines.",
      tag: "Elder care",
    },
    bn: {
      title: "বয়স্ক বাবা-মায়ের দৈনন্দিন সহায়তা প্রয়োজন",
      description: "সঙ্গ দেওয়া, খাবার, ব্যক্তিগত পরিচর্যা ও প্রতিদিনের কাজে সহায়তা।",
      tag: "বয়স্কদের যত্ন",
    },
    careType: "Elder companion",
    patientType: "Older adult",
  },
  {
    en: {
      title: "There are memory or dementia concerns",
      description: "Supervision, familiar routines and support for confusion or memory loss.",
      tag: "Dementia support",
    },
    bn: {
      title: "স্মৃতিভ্রংশ বা ডিমেনশিয়ার সমস্যা আছে",
      description: "নজরদারি, পরিচিত রুটিন বজায় রাখা এবং বিভ্রান্তি বা স্মৃতিভ্রংশে সহায়তা।",
      tag: "ডিমেনশিয়া সহায়তা",
    },
    careType: "Dementia support",
    patientType: "Dementia or Alzheimer's",
  },
  {
    en: {
      title: "The patient is bedridden or recovering",
      description: "Help with mobility, positioning, feeding and day-to-day comfort at home.",
      tag: "Recovery care",
    },
    bn: {
      title: "রোগী শয্যাশায়ী বা সুস্থ হওয়ার পর্যায়ে আছেন",
      description: "চলাফেরা, অবস্থান পরিবর্তন, খাওয়ানো ও দৈনন্দিন আরামে সহায়তা।",
      tag: "রিকভারি কেয়ার",
    },
    careType: "Bedridden patient care",
    patientType: "Bedridden patient",
  },
  {
    en: {
      title: "Clinical care may be needed at home",
      description: "For needs that may require a trained nurse rather than general daily support.",
      tag: "Home nursing",
    },
    bn: {
      title: "বাড়িতে ক্লিনিক্যাল কেয়ার প্রয়োজন হতে পারে",
      description: "যেখানে সাধারণ সহায়তার বদলে প্রশিক্ষিত নার্সের প্রয়োজন হতে পারে।",
      tag: "হোম নার্সিং",
    },
    careType: "Home nursing",
    patientType: "Chronic illness",
  },
];

const scheduleOptions = [
  ["A few hours", "কয়েক ঘণ্টা"],
  ["Day support", "দিনের সহায়তা"],
  ["Night support", "রাতের সহায়তা"],
  ["24-hour care", "২৪ ঘণ্টার কেয়ার"],
  ["Short-term", "স্বল্পমেয়াদি"],
  ["Ongoing", "দীর্ঘমেয়াদি"],
] as const;

function ServiceIcon({ kind }: { kind: "daily" | "memory" | "recovery" | "nursing" }) {
  if (kind === "memory") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 4.8A4.2 4.2 0 0 1 16 8v.7a4 4 0 0 1 2.3 3.6 4 4 0 0 1-2.8 3.8A4.2 4.2 0 0 1 8 17.8 4 4 0 0 1 5.7 14 4 4 0 0 1 8 10.4V8.8A4 4 0 0 1 9 4.8Z" />
        <path d="M10 8.5c1.7.2 2.8 1.1 3.3 2.7M9.5 14c1-.9 2.2-1.2 3.7-.8" />
      </svg>
    );
  }

  if (kind === "recovery") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12h4l2-4 3 8 2-4h3" />
        <path d="M12 21s-7-4.3-7-10.3A4.7 4.7 0 0 1 13 7a4.7 4.7 0 0 1 8 3.7C21 16.7 14 21 12 21Z" />
      </svg>
    );
  }

  if (kind === "nursing") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 4h8v16H8zM5 8h14" />
        <path d="M12 10v6M9 13h6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 20c.7-4 2.8-6 6.5-6s5.8 2 6.5 6" />
      <path d="M19 6.5h3M20.5 5v3" />
    </svg>
  );
}

export default async function CaregiversPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  await requireUser("patient");
  const language = await getLanguage(searchParams);
  const bn = language === "bn";
  const db = await supabase();

  const requestHref = (careType?: string, patientType?: string) => {
    const params = new URLSearchParams({ lang: language });
    if (careType) params.set("care_type", careType);
    if (patientType) params.set("patient_type", patientType);
    return `/caregivers/request?${params.toString()}`;
  };

  const { data: providers } = await db
    .from("caregivers")
    .select("id,full_name,services,location,verification_status,provider_type")
    .eq("status", "Active")
    .eq("provider_type", "Organization")
    .order("full_name")
    .limit(4);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>
            {bn ? "হোম কেয়ার" : "HOME CARE"}
          </span>
          <h1>
            {bn
              ? "আপনার প্রিয়জনের জন্য সঠিক কেয়ার খুঁজুন।"
              : "Find the right care for someone you love."}
          </h1>
          <p>
            {bn
              ? "পরিস্থিতির জন্য কোন ধরনের সহায়তা উপযুক্ত হতে পারে তা আগে দেখে নিন। প্রস্তুত হলে প্রয়োজনগুলো জানান—Healthcare Central-এর অ্যাডমিন উপযুক্ত কেয়ারগিভার বা কেয়ার প্রোভাইডার পর্যালোচনা করবে।"
              : "Explore the type of support that may fit the situation. When you are ready, tell Healthcare Central what is needed and an administrator will review suitable caregivers or care providers."}
          </p>

          <div className={styles.actions}>
            <Link className={styles.primaryAction} href={requestHref()}>
              {bn ? "আমি জানি কী প্রয়োজন" : "I know what I need"}
            </Link>
            <a className={styles.secondaryAction} href="#choose-care">
              {bn ? "বেছে নিতে সাহায্য করুন" : "Help me choose"}
            </a>
          </div>

          <Link
            className={styles.historyLink}
            href={`/patient/caregiver-requests?lang=${language}`}
          >
            {bn ? "আমার কেয়ারগিভার অনুরোধগুলো দেখুন →" : "View my caregiver requests →"}
          </Link>
        </div>

        <div className={styles.heroGuide}>
          <div className={styles.guideTop}>
            <span className={styles.guideBadge}>
              {bn ? "এখান থেকে শুরু করুন" : "START HERE"}
            </span>
            <strong>
              {bn ? "কী ধরনের সাহায্য প্রয়োজন?" : "What do you need help with?"}
            </strong>
          </div>

          <div className={styles.quickChoices}>
            <a href="#situations">
              <span className={styles.quickNumber}>01</span>
              <span>
                <strong>{bn ? "কেয়ারের ধরন দেখুন" : "Explore care options"}</strong>
                <small>
                  {bn
                    ? "সাধারণ পরিস্থিতি ও সহায়তার ধরন দেখুন"
                    : "See common situations and support types"}
                </small>
              </span>
            </a>
            <Link href={requestHref()}>
              <span className={styles.quickNumber}>02</span>
              <span>
                <strong>{bn ? "কেয়ারগিভারের জন্য অনুরোধ করুন" : "Request a caregiver"}</strong>
                <small>
                  {bn
                    ? "রোগী, সময়সূচি ও লোকেশনের প্রয়োজন জানান"
                    : "Share patient, schedule and location needs"}
                </small>
              </span>
            </Link>
            <a href="#choose-care">
              <span className={styles.quickNumber}>03</span>
              <span>
                <strong>
                  {bn ? "কী প্রয়োজন বুঝতে পারছেন না?" : "Not sure what you need?"}
                </strong>
                <small>
                  {bn
                    ? "কেয়ারগিভার ও নার্সিং কেয়ারের পার্থক্য দেখুন"
                    : "Compare caregiver support with nursing care"}
                </small>
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className={styles.section} id="situations">
        <div className={styles.sectionHeading}>
          <span>{bn ? "বাড়িতে কী পরিস্থিতি চলছে?" : "WHAT IS HAPPENING AT HOME?"}</span>
          <h2>
            {bn
              ? "মেডিক্যাল নাম নয়, পরিস্থিতি দিয়ে শুরু করুন।"
              : "Start with the situation, not a medical label."}
          </h2>
          <p>
            {bn
              ? "সবচেয়ে কাছাকাছি পরিস্থিতিটি বেছে নিন। অনুরোধ পাঠানোর আগে সব তথ্য পরিবর্তন করতে পারবেন।"
              : "Choose the closest match. You can change the details before sending the request."}
          </p>
        </div>

        <div className={styles.situationGrid}>
          {situations.map((item, index) => {
            const copy = bn ? item.bn : item.en;
            return (
              <Link
                className={styles.situationCard}
                href={requestHref(item.careType, item.patientType)}
                key={item.en.title}
              >
                <div className={styles.iconBox}>
                  <ServiceIcon
                    kind={
                      index === 1
                        ? "memory"
                        : index === 2
                          ? "recovery"
                          : index === 3
                            ? "nursing"
                            : "daily"
                    }
                  />
                </div>
                <span className={styles.cardTag}>{copy.tag}</span>
                <h3>{copy.title}</h3>
                <p>{copy.description}</p>
                <span className={styles.cardLink}>
                  {bn ? "এটি দিয়ে শুরু করুন →" : "Use this as a starting point →"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.chooseSection} id="choose-care">
        <div className={styles.chooseIntro}>
          <span>{bn ? "কেয়ারগিভার নাকি নার্স?" : "CAREGIVER OR NURSE?"}</span>
          <h2>
            {bn
              ? "শুরুতেই সব টার্ম জানা জরুরি নয়।"
              : "You do not need to know the terminology first."}
          </h2>
          <p>
            {bn
              ? "কেয়ারগিভার মূলত দৈনন্দিন জীবন ও নজরদারিতে সহায়তা করে। ক্লিনিক্যাল প্রক্রিয়া বা দক্ষ নার্সিং প্রয়োজন হলে নার্স বেশি উপযুক্ত।"
              : "A caregiver mainly supports daily living and supervision. A nurse is more appropriate when clinical procedures or skilled nursing are required."}
          </p>
        </div>

        <div className={styles.compareGrid}>
          <article className={styles.compareCard}>
            <div className={styles.compareHeader}>
              <div className={styles.compareIcon}>
                <ServiceIcon kind="daily" />
              </div>
              <div>
                <span>{bn ? "দৈনন্দিন সহায়তা" : "DAILY SUPPORT"}</span>
                <h3>{bn ? "কেয়ারগিভার" : "Caregiver"}</h3>
              </div>
            </div>
            <ul>
              <li>{bn ? "সঙ্গ দেওয়া ও নজরদারি" : "Companionship and supervision"}</li>
              <li>{bn ? "খাবার, পরিচ্ছন্নতা ও দৈনন্দিন রুটিন" : "Meals, hygiene and everyday routines"}</li>
              <li>{bn ? "চলাফেরা ও স্থানান্তরে সহায়তা" : "Mobility and transfer assistance"}</li>
              <li>{bn ? "বয়স্ক বা ডিমেনশিয়া সহায়তা" : "Elderly or dementia support"}</li>
            </ul>
            <Link href={requestHref("General personal care")}>
              {bn ? "কেয়ারগিভার সহায়তার অনুরোধ করুন →" : "Request caregiver support →"}
            </Link>
          </article>

          <article className={styles.compareCard}>
            <div className={styles.compareHeader}>
              <div className={styles.compareIcon}>
                <ServiceIcon kind="nursing" />
              </div>
              <div>
                <span>{bn ? "ক্লিনিক্যাল সহায়তা" : "CLINICAL SUPPORT"}</span>
                <h3>{bn ? "হোম নার্স" : "Home nurse"}</h3>
              </div>
            </div>
            <ul>
              <li>{bn ? "ক্ষত বা অপারেশন-পরবর্তী নার্সিং প্রয়োজন" : "Wound or post-operative nursing needs"}</li>
              <li>{bn ? "ক্লিনিক্যাল পর্যবেক্ষণ বা প্রক্রিয়া" : "Clinical monitoring or procedures"}</li>
              <li>{bn ? "প্রশিক্ষিত নার্সিং দক্ষতা প্রয়োজন এমন কেয়ার" : "Care requiring trained nursing skills"}</li>
              <li>{bn ? "চিকিৎসকের নির্দেশনায় সহায়তা" : "Support directed by a clinician"}</li>
            </ul>
            <Link href={requestHref("Home nursing")}>
              {bn ? "হোম নার্সিংয়ের অনুরোধ করুন →" : "Request home nursing →"}
            </Link>
          </article>
        </div>
      </section>

      <section className={styles.scheduleSection}>
        <div>
          <span>{bn ? "পরিবারের সময় অনুযায়ী নমনীয়" : "FLEXIBLE AROUND THE FAMILY"}</span>
          <h2>
            {bn
              ? "বিভিন্ন সময়সূচি অনুযায়ী কেয়ার সাজানো যেতে পারে।"
              : "Care can be arranged around different schedules."}
          </h2>
        </div>
        <div className={styles.scheduleChips}>
          {scheduleOptions.map(([en, bnLabel]) => (
            <span key={en}>{bn ? bnLabel : en}</span>
          ))}
        </div>
      </section>

      <section className={styles.process}>
        <div className={styles.sectionHeading}>
          <span>{bn ? "HEALTHCARE CENTRAL যেভাবে কাজ করে" : "HOW HEALTHCARE CENTRAL WORKS"}</span>
          <h2>
            {bn
              ? "আপনি প্রয়োজন বলুন। আমরা ম্যাচ সমন্বয় করি।"
              : "You describe the need. We coordinate the match."}
          </h2>
        </div>

        <div className={styles.steps}>
          <article>
            <strong>01</strong>
            <h3>{bn ? "কেয়ারের প্রয়োজন জানান" : "Tell us about the care"}</h3>
            <p>
              {bn
                ? "রোগীর পরিস্থিতি, পছন্দের জেন্ডার, এলাকা, সময়সূচি, মেয়াদ ও বাজেট।"
                : "Patient situation, preferred gender, area, schedule, duration and budget."}
            </p>
          </article>
          <article>
            <strong>02</strong>
            <h3>{bn ? "অ্যাডমিন উপযুক্ত অপশন পর্যালোচনা করে" : "Admin reviews suitable options"}</h3>
            <p>
              {bn
                ? "অনুরোধের সাথে ব্যক্তিগত কেয়ারগিভার ও প্রোভাইডার প্রতিষ্ঠান মিলিয়ে দেখা হয়।"
                : "Individual caregivers and provider organizations are compared against the request."}
            </p>
          </article>
          <article>
            <strong>03</strong>
            <h3>{bn ? "অ্যাসাইনমেন্ট নিশ্চিত করা হয়" : "Assignment is confirmed"}</h3>
            <p>
              {bn
                ? "রোগী নিশ্চিত কেয়ারগিভার বা প্রোভাইডার এবং যোগাযোগের নির্দেশনা পায়।"
                : "The patient receives the confirmed caregiver or provider and contact instructions."}
            </p>
          </article>
        </div>
      </section>

      {providers?.length ? (
        <section className={styles.providersSection}>
          <div className={styles.sectionHeading}>
            <span>{bn ? "ডিরেক্টরিতে থাকা কেয়ার প্রোভাইডার" : "CARE PROVIDERS IN THE DIRECTORY"}</span>
            <h2>
              {bn
                ? "ম্যাচিংয়ের সময় Healthcare Central যেসব প্রতিষ্ঠান পর্যালোচনা করতে পারে।"
                : "Organizations Healthcare Central can review when matching."}
            </h2>
            <p>
              {bn
                ? "এগুলো প্রোভাইডার ডিরেক্টরির রেকর্ড—নির্দিষ্ট ব্যক্তিগত কেয়ারগিভারের নিশ্চয়তা নয়। ম্যাচিংয়ের সময় বর্তমান স্টাফের প্রাপ্যতা নিশ্চিত করা হয়।"
                : "These are provider-directory records, not individual caregiver guarantees. Current staff availability is confirmed during matching."}
            </p>
          </div>

          <div className={styles.providerGrid}>
            {providers.map((provider) => (
              <article className={styles.providerCard} key={provider.id}>
                <div className={styles.providerInitial}>
                  {provider.full_name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong>{provider.full_name}</strong>
                  <span>
                    {[
                      bn && provider.location === "Dhaka" ? "ঢাকা" : provider.location,
                      bn && provider.verification_status === "Directory checked"
                        ? "ডিরেক্টরি যাচাই করা"
                        : provider.verification_status,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <p>
                    {bn
                      ? "হোম কেয়ার সেবা প্রদানকারী প্রতিষ্ঠান"
                      : provider.services || "Home-care provider organization"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.finalCta}>
        <div>
          <span>{bn ? "কেয়ারের ব্যবস্থা করতে প্রস্তুত?" : "READY TO ARRANGE CARE?"}</span>
          <h2>{bn ? "রোগীর কী প্রয়োজন তা আমাদের জানান।" : "Tell us what the person needs."}</h2>
          <p>
            {bn
              ? "আপনি শুরু করতে চাইলে তবেই বিস্তারিত অনুরোধের ফর্মটি খুলবে।"
              : "The detailed request form only opens when you choose to start."}
          </p>
        </div>
        <Link className={styles.primaryAction} href={requestHref()}>
          {bn ? "কেয়ারগিভারের জন্য অনুরোধ করুন" : "Request a caregiver"}
        </Link>
      </section>
    </div>
  );
}
