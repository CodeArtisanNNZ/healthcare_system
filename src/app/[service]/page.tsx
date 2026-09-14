import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getLanguage } from "@/lib/language";
import styles from "./service.module.css";

type ServiceKey =
  | "doctor"
  | "medicine"
  | "hospital"
  | "lab-test"
  | "caregiver"
  | "ambulance";

const servicePath: Record<ServiceKey, string> = {
  doctor: "/doctors",
  medicine: "/medicines",
  hospital: "/hospitals",
  "lab-test": "/lab-tests",
  caregiver: "/caregivers",
  ambulance: "/emergency",
};

const content: Record<
  ServiceKey,
  {
    name: { en: string; bn: string };
    intro: { en: string; bn: string };
    points: Array<{ en: string; bn: string }>;
  }
> = {
  doctor: {
    name: { en: "Doctor", bn: "ডাক্তার" },
    intro: {
      en: "Find doctors by specialty, name and location without searching through a long directory.",
      bn: "দীর্ঘ ডিরেক্টরি ঘাঁটা ছাড়াই বিশেষত্ব, নাম ও এলাকা অনুযায়ী ডাক্তার খুঁজুন।",
    },
    points: [
      {
        en: "Search by specialty, doctor name or the type of care you need.",
        bn: "বিশেষত্ব, ডাক্তারের নাম বা প্রয়োজনীয় সেবার ধরন দিয়ে সার্চ করুন।",
      },
      {
        en: "Use location filtering to keep results relevant.",
        bn: "প্রাসঙ্গিক ফলাফলের জন্য এলাকা ফিল্টার ব্যবহার করুন।",
      },
      {
        en: "Review available doctor information before choosing.",
        bn: "বেছে নেওয়ার আগে উপলব্ধ ডাক্তারের তথ্য দেখুন।",
      },
    ],
  },
  medicine: {
    name: { en: "Medicine", bn: "ওষুধ" },
    intro: {
      en: "Search once and open several Bangladesh pharmacy websites from the same place.",
      bn: "একবার সার্চ করে একই জায়গা থেকে বাংলাদেশের একাধিক অনলাইন ফার্মেসি খুলুন।",
    },
    points: [
      {
        en: "Search by medicine name or strength.",
        bn: "ওষুধের নাম বা strength দিয়ে সার্চ করুন।",
      },
      {
        en: "See several pharmacy options together.",
        bn: "একসাথে একাধিক ফার্মেসির অপশন দেখুন।",
      },
      {
        en: "Continue to the original seller website to confirm live details.",
        bn: "বর্তমান তথ্য নিশ্চিত করতে মূল বিক্রেতার ওয়েবসাইটে যান।",
      },
    ],
  },
  hospital: {
    name: { en: "Hospital", bn: "হাসপাতাল" },
    intro: {
      en: "Find hospital information by name, department and location.",
      bn: "নাম, বিভাগ ও এলাকা অনুযায়ী হাসপাতালের তথ্য খুঁজুন।",
    },
    points: [
      { en: "Search hospitals and departments.", bn: "হাসপাতাল ও বিভাগ দিয়ে সার্চ করুন।" },
      { en: "Review available contact information.", bn: "উপলব্ধ যোগাযোগের তথ্য দেখুন।" },
      { en: "Filter by location.", bn: "এলাকা অনুযায়ী ফিল্টার করুন।" },
    ],
  },
  "lab-test": {
    name: { en: "Lab Test", bn: "ল্যাব টেস্ট" },
    intro: {
      en: "Find diagnostic tests and laboratories in one searchable place.",
      bn: "এক জায়গা থেকে ডায়াগনস্টিক টেস্ট ও ল্যাব খুঁজুন।",
    },
    points: [
      { en: "Search by test name.", bn: "টেস্টের নাম দিয়ে সার্চ করুন।" },
      { en: "Review laboratory and location details.", bn: "ল্যাব ও এলাকার তথ্য দেখুন।" },
      { en: "See listed prices when available.", bn: "উপলব্ধ থাকলে তালিকাভুক্ত মূল্য দেখুন।" },
    ],
  },
  caregiver: {
    name: { en: "Caregiver", bn: "কেয়ারগিভার" },
    intro: {
      en: "Explore caregiver and nursing-support listings for home and everyday care.",
      bn: "বাসা ও দৈনন্দিন যত্নের জন্য caregiver ও nursing support-এর তালিকা দেখুন।",
    },
    points: [
      { en: "Search caregiver profiles and services.", bn: "কেয়ারগিভার প্রোফাইল ও সেবা খুঁজুন।" },
      { en: "Review experience and location.", bn: "অভিজ্ঞতা ও এলাকা দেখুন।" },
      { en: "See listed fees when available.", bn: "উপলব্ধ থাকলে তালিকাভুক্ত ফি দেখুন।" },
    ],
  },
  ambulance: {
    name: { en: "Ambulance", bn: "অ্যাম্বুলেন্স" },
    intro: {
      en: "Emergency ambulance contacts remain available without an account.",
      bn: "জরুরি অ্যাম্বুলেন্স যোগাযোগ অ্যাকাউন্ট ছাড়াই পাওয়া যাবে।",
    },
    points: [
      { en: "Open Emergency Help without signing in.", bn: "লগ ইন ছাড়াই Emergency Help খুলুন।" },
      { en: "Choose your area.", bn: "আপনার এলাকা নির্বাচন করুন।" },
      { en: "Call a listed ambulance or emergency number.", bn: "তালিকাভুক্ত অ্যাম্বুলেন্স বা জরুরি নম্বরে কল করুন।" },
    ],
  },
};

function isService(value: string): value is ServiceKey {
  return value in content;
}

export default async function ServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ service: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { service } = await params;
  if (!isService(service)) notFound();

  const [user, language] = await Promise.all([
    currentUser(),
    getLanguage(searchParams),
  ]);

  const bn = language === "bn";
  const key = bn ? "bn" : "en";
  const item = content[service];
  const emergency = service === "ambulance";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Link className={styles.back} href="/#services">
          ← {bn ? "সেবাগুলোতে ফিরুন" : "Back to services"}
        </Link>

        <p className={styles.label}>
          {bn ? "Healthcare Central সেবা" : "Healthcare Central service"}
        </p>

        <h1>{item.name[key]}</h1>
        <p className={styles.intro}>{item.intro[key]}</p>

        <div className={styles.actions}>
          <Link
            className={emergency ? styles.emergencyButton : styles.primaryButton}
            href={emergency ? "/emergency" : user ? servicePath[service] : "/login"}
          >
            {emergency
              ? bn
                ? "জরুরি সহায়তা"
                : "Emergency Help"
              : user
                ? bn
                  ? "সেবা খুলুন"
                  : "Open service"
                : bn
                  ? "ব্যবহার করতে লগ ইন করুন"
                  : "Log in to access"}
          </Link>
        </div>
      </section>

      <section className={styles.content}>
        <p className={styles.blockLabel}>
          {bn ? "আমরা কী দিচ্ছি" : "What we offer"}
        </p>
        <h2>{bn ? "সহজভাবে শুরু করুন" : "A simpler way to start"}</h2>

        <div className={styles.grid}>
          {item.points.map((point, index) => (
            <article key={point.en}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{point[key]}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
