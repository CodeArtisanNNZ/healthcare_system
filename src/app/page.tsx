import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getLanguage } from "@/lib/language";
import styles from "./home.module.css";
import { HeroImageRotator } from "@/components/hero-image-rotator";

const serviceCards = [
  { href: "/doctors", icon: "✚", title: "Doctor consultation", bn: "ডাক্তার পরামর্শ", text: "Find the right specialist", bnText: "সঠিক বিশেষজ্ঞ খুঁজুন", tone: "mint" },
  { href: "/caregivers", icon: "⌂", title: "Home care services", bn: "হোম কেয়ার সেবা", text: "Nursing and everyday support", bnText: "নার্সিং ও দৈনন্দিন সহায়তা", tone: "coral" },
  { href: "/lab-tests", icon: "⌁", title: "Diagnostic tests", bn: "ডায়াগনস্টিক টেস্ট", text: "Labs, tests and locations", bnText: "ল্যাব, টেস্ট ও লোকেশন", tone: "mint" },
  { href: "/medicines", icon: "◒", title: "Medicine support", bn: "ওষুধ সহায়তা", text: "Compare available listings", bnText: "উপলব্ধ তালিকা তুলনা করুন", tone: "coral" },
  { href: "/patient/search", icon: "♡", title: "Find a doctor", bn: "ডাক্তার খুঁজুন", text: "Search by symptoms or specialty", bnText: "উপসর্গ বা বিশেষত্ব দিয়ে খুঁজুন", tone: "mint" },
  { href: "/hospitals", icon: "▦", title: "Hospitals nearby", bn: "কাছের হাসপাতাল", text: "Explore departments and locations", bnText: "বিভাগ ও লোকেশন দেখুন", tone: "mint" },
  { href: "/emergency", icon: "!", title: "Urgent care support", bn: "জরুরি সহায়তা", text: "Emergency contacts, quickly", bnText: "দ্রুত জরুরি যোগাযোগ", tone: "coral" },
  { href: "/caregivers", icon: "◌", title: "Care for families", bn: "পরিবারের কেয়ার", text: "Support for parents and loved ones", bnText: "বাবা-মা ও প্রিয়জনের সহায়তা", tone: "mint" },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const [user, language] = await Promise.all([currentUser(), getLanguage(searchParams)]);
  const bn = language === "bn";
  const getCare = user ? "/patient" : "/login";

  const heroCards = [
    { href: "/patient/search", icon: "⌕", title: bn ? "আমার উপসর্গ আছে" : "I have symptoms", text: bn ? "করণীয় বুঝুন ও সঠিক কেয়ার খুঁজুন।" : "Get guidance on what to do next.", tone: "mint" },
    { href: "/doctors", icon: "✚", title: bn ? "আমার ডাক্তার প্রয়োজন" : "I need a doctor", text: bn ? "ঢাকায় বিশেষজ্ঞ ও সেবা খুঁজুন।" : "Find suitable doctors in Dhaka.", tone: "white" },
    { href: "/caregivers", icon: "⌂", title: bn ? "আমার হোম কেয়ার প্রয়োজন" : "I need home care", text: bn ? "প্রিয়জনের জন্য কেয়ার অনুরোধ করুন।" : "Request support for someone you love.", tone: "white" },
    { href: "/emergency", icon: "✦", title: bn ? "আমার জরুরি সহায়তা প্রয়োজন" : "I need urgent help", text: bn ? "দ্রুত জরুরি যোগাযোগ ও নির্দেশনা পান।" : "Get emergency guidance and contacts.", tone: "urgent" },
  ];

  return <main className={styles.page}>
    <section className={styles.hero}>
      <HeroImageRotator className={styles.heroPhoto} />
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{bn ? "আরও সহজ, আরও কাছের কেয়ার" : "BETTER CARE. CLOSER TO HOME."}</p>
          <h1>{bn ? <>আপনার প্রয়োজনের <em>সঠিক কেয়ার</em> খুঁজুন।</> : <>Find the care <em>you need.</em></>}</h1>
          <p className={styles.heroText}>{bn ? "ডাক্তার থেকে হোম কেয়ার—ঢাকার নির্ভরযোগ্য স্বাস্থ্যসেবা এক জায়গা থেকে শুরু করুন।" : "A simpler way to find trusted healthcare support in Dhaka — from doctors to home care, all in one place."}</p>
          <div className={styles.heroActions}>
            <Link className={styles.getCare} href={getCare}>{user ? (bn ? "ড্যাশবোর্ড খুলুন" : "Open dashboard") : (bn ? "শুরু করুন" : "Get started")} <span>→</span></Link>
          </div>
          <div className={styles.heroCards}>
            {heroCards.map((card) => <Link key={card.title} href={card.href} className={`${styles.heroCard} ${styles[card.tone]}`}>
              <span className={styles.cardIcon}>{card.icon}</span>
              <h2>{card.title}</h2><p>{card.text}</p><span className={styles.cardArrow}>→</span>
            </Link>)}
          </div>
        </div>
      </div>
    </section>

    <section className={styles.trustStrip} aria-label={bn ? "বিশ্বাসের তথ্য" : "Trust information"}>
      <div><span>⌖</span><p><strong>{bn ? "ঢাকাকেন্দ্রিক" : "Dhaka-focused"}</strong>{bn ? "ঢাকা ও আশপাশের কেয়ার অপশন।" : "Care options across Dhaka and nearby areas."}</p></div>
      <div><span>✓</span><p><strong>{bn ? "অ্যাডমিন যাচাই করা অনুরোধ" : "Admin-confirmed requests"}</strong>{bn ? "নিরাপত্তা ও মানের জন্য অনুরোধ পর্যালোচনা করা হয়।" : "Requests are reviewed for safety and quality."}</p></div>
      <div><span>⌑</span><p><strong>{bn ? "ব্যক্তিগত ও নিরাপদ" : "Private contact sharing"}</strong>{bn ? "নিশ্চিত হওয়ার পরই যোগাযোগের তথ্য শেয়ার হয়।" : "Contact details are shared after confirmation."}</p></div>
    </section>

    <section className={styles.process}>
      <div className={styles.processIntro}>
        <p className={styles.eyebrow}>{bn ? "এটি যেভাবে কাজ করে" : "HOW IT WORKS"}</p>
        <h2>{bn ? "কয়েকটি সহজ ধাপে সঠিক কেয়ার পান।" : "Get the right care in a few simple steps."}</h2>
        <p>{bn ? "প্রয়োজন জানান, আমরা উপযুক্ত স্থানীয় অপশন পর্যালোচনা করি, তারপর নিশ্চিত তথ্য পাইয়ে দিই।" : "From your first request to confirmed support, we make healthcare easier for you."}</p>
      </div>
      <div className={styles.steps}>
        {[["01",bn ? "আপনার প্রয়োজন জানান" : "Describe your need",bn ? "কয়েকটি সহজ তথ্য দিন।" : "Tell us what you need, in your own words."],["02",bn ? "স্থানীয়ভাবে ম্যাচ করি" : "We match locally",bn ? "উপযুক্ত কেয়ার প্রোভাইডার দেখা হয়।" : "We review suitable care providers nearby."],["03",bn ? "নিশ্চিত তথ্য পান" : "Get confirmed details",bn ? "সময়, অপশন ও যোগাযোগের নির্দেশনা পান।" : "Receive the confirmed plan and contact details."]].map(([number,title,text])=><article key={number}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}
      </div>
    </section>

    <section className={styles.services} id="services">
      <div className={styles.servicesHead}><div><p className={styles.eyebrow}>{bn ? "আমাদের সেবাসমূহ" : "OUR SERVICES"}</p><h2>{bn ? "সব পরিস্থিতির জন্য কেয়ার।" : "Care for every situation."}</h2></div><p>{bn ? "দৈনন্দিন স্বাস্থ্যসেবা থেকে বিশেষজ্ঞ কেয়ার—প্রয়োজনীয় সেবা কাছেই খুঁজুন।" : "From everyday health needs to specialised care, find trusted services near you."}</p></div>
      <div className={styles.serviceGrid}>{serviceCards.map((service)=><Link href={service.href} key={service.title} className={`${styles.serviceCard} ${styles[service.tone]}`}><span className={styles.serviceIcon}>{service.icon}</span><div><h3>{bn ? service.bn : service.title}</h3><p>{bn ? service.bnText : service.text}</p></div><span className={styles.serviceArrow}>→</span></Link>)}</div>
    </section>
  </main>;
}