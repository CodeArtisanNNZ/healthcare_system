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

const serviceContent: Record<
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
      en: "Find the right doctor without going through a long, confusing directory.",
      bn: "দীর্ঘ ও জটিল ডিরেক্টরি না ঘেঁটে প্রয়োজন অনুযায়ী ডাক্তার খুঁজুন।",
    },
    points: [
      {
        en: "Search by specialty, doctor name or the kind of care you need.",
        bn: "বিশেষত্ব, ডাক্তারের নাম বা প্রয়োজনীয় সেবার ধরন দিয়ে সার্চ করুন।",
      },
      {
        en: "Choose a location to keep results relevant.",
        bn: "প্রাসঙ্গিক ফলাফলের জন্য এলাকা নির্বাচন করুন।",
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
      en: "Search once and compare pharmacy website options from one place.",
      bn: "একবার সার্চ করে এক জায়গা থেকে একাধিক অনলাইন ফার্মেসির অপশন দেখুন।",
    },
    points: [
      {
        en: "Search by medicine name or strength.",
        bn: "ওষুধের নাম বা strength দিয়ে সার্চ করুন।",
      },
      {
        en: "See several online pharmacy options together.",
        bn: "একসাথে একাধিক অনলাইন ফার্মেসির অপশন দেখুন।",
      },
      {
        en: "Continue to the original seller website to confirm price and availability.",
        bn: "মূল্য ও প্রাপ্যতা নিশ্চিত করতে মূল বিক্রেতার ওয়েবসাইটে যান।",
      },
    ],
  },

  hospital: {
    name: { en: "Hospital", bn: "হাসপাতাল" },
    intro: {
      en: "Explore hospitals, departments and locations from one place.",
      bn: "এক জায়গা থেকে হাসপাতাল, বিভাগ ও লোকেশন দেখুন।",
    },
    points: [
      {
        en: "Search hospitals by name, department or location.",
        bn: "নাম, বিভাগ বা এলাকা দিয়ে হাসপাতাল সার্চ করুন।",
      },
      {
        en: "Review available hospital information.",
        bn: "উপলব্ধ হাসপাতালের তথ্য দেখুন।",
      },
      {
        en: "Use location filters to narrow the results.",
        bn: "ফলাফল সীমিত করতে লোকেশন ফিল্টার ব্যবহার করুন।",
      },
    ],
  },

  "lab-test": {
    name: { en: "Lab Test", bn: "ল্যাব টেস্ট" },
    intro: {
      en: "Find diagnostic tests and laboratories more easily.",
      bn: "ডায়াগনস্টিক টেস্ট ও ল্যাব সহজে খুঁজুন।",
    },
    points: [
      {
        en: "Search by test name.",
        bn: "টেস্টের নাম দিয়ে সার্চ করুন।",
      },
      {
        en: "Review laboratories and locations.",
        bn: "ল্যাব ও লোকেশন দেখুন।",
      },
      {
        en: "See listed prices when available.",
        bn: "উপলব্ধ থাকলে তালিকাভুক্ত মূল্য দেখুন।",
      },
    ],
  },

  caregiver: {
    name: { en: "Caregiver", bn: "কেয়ারগিভার" },
    intro: {
      en: "Explore caregiver and nursing-support options for everyday care.",
      bn: "দৈনন্দিন যত্নের জন্য caregiver ও nursing support-এর অপশন দেখুন।",
    },
    points: [
      {
        en: "Search caregiver profiles and services.",
        bn: "কেয়ারগিভার প্রোফাইল ও সেবা সার্চ করুন।",
      },
      {
        en: "Review experience and location.",
        bn: "অভিজ্ঞতা ও লোকেশন দেখুন।",
      },
      {
        en: "See listed fees when available.",
        bn: "উপলব্ধ থাকলে তালিকাভুক্ত ফি দেখুন।",
      },
    ],
  },

  ambulance: {
    name: { en: "Ambulance", bn: "অ্যাম্বুলেন্স" },
    intro: {
      en: "Emergency ambulance contacts remain available without login.",
      bn: "জরুরি অ্যাম্বুলেন্স যোগাযোগ লগ ইন ছাড়াই পাওয়া যাবে।",
    },
    points: [
      {
        en: "Open Emergency Help without signing in.",
        bn: "লগ ইন ছাড়াই Emergency Help খুলুন।",
      },
      {
        en: "Choose your area.",
        bn: "আপনার এলাকা নির্বাচন করুন।",
      },
      {
        en: "Use the listed ambulance or emergency contact.",
        bn: "তালিকাভুক্ত অ্যাম্বুলেন্স বা জরুরি যোগাযোগ ব্যবহার করুন।",
      },
    ],
  },
};

function isService(value: string): value is ServiceKey {
  return value in serviceContent;
}

export default async function ServiceDetails({
  params,
  searchParams,
}: {
  params: Promise<{ service: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { service } = await params;

  if (!isService(service)) {
    notFound();
  }

  const [user, language] = await Promise.all([
    currentUser(),
    getLanguage(searchParams),
  ]);

  const bn = language === "bn";
  const key = bn ? "bn" : "en";
  const item = serviceContent[service];
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
            className={
              emergency ? styles.emergencyButton : styles.primaryButton
            }
            href={
              emergency
                ? "/emergency"
                : user
                  ? servicePath[service]
                  : "/login"
            }
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
