"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./service-carousel.module.css";

type Language = "en" | "bn";

type Service = {
  id: string;
  number: string;
  title: string;
  titleBn: string;
  short: string;
  shortBn: string;
  details: string;
  detailsBn: string;
  tone: string;
};

const services: Service[] = [
  {
    id: "doctor",
    number: "01",
    title: "Doctor",
    titleBn: "ডাক্তার",
    short: "Find the right specialty",
    shortBn: "সঠিক বিশেষজ্ঞ খুঁজুন",
    details:
      "Search by symptoms, specialty or doctor name, understand which type of doctor may fit your need, and narrow available options by location before choosing where to continue.",
    detailsBn:
      "উপসর্গ, বিশেষত্ব বা ডাক্তারের নাম দিয়ে খুঁজুন, কোন ধরনের বিশেষজ্ঞ আপনার প্রয়োজনের সঙ্গে মেলে তা বুঝুন এবং লোকেশন অনুযায়ী অপশন সীমিত করে পরবর্তী ধাপ বেছে নিন।",
    tone: "butter",
  },
  {
    id: "medicine",
    number: "02",
    title: "Medicine",
    titleBn: "ওষুধ",
    short: "Compare seller options",
    shortBn: "বিক্রেতার অপশন তুলনা করুন",
    details:
      "Search a medicine once, see several online pharmacy options together, then continue to the original seller website to confirm current price, stock and purchase information.",
    detailsBn:
      "একবার ওষুধ সার্চ করে একসাথে কয়েকটি অনলাইন ফার্মেসির অপশন দেখুন, তারপর বর্তমান মূল্য, স্টক ও কেনার তথ্য নিশ্চিত করতে মূল বিক্রেতার ওয়েবসাইটে যান।",
    tone: "rose",
  },
  {
    id: "hospital",
    number: "03",
    title: "Hospital",
    titleBn: "হাসপাতাল",
    short: "Explore care locations",
    shortBn: "সেবার স্থান খুঁজুন",
    details:
      "Find hospitals by location, review available departments and services, and use the listed information to understand which facility may be more relevant to your care needs.",
    detailsBn:
      "লোকেশন অনুযায়ী হাসপাতাল খুঁজুন, উপলব্ধ বিভাগ ও সেবাগুলো দেখুন এবং আপনার প্রয়োজনের জন্য কোন প্রতিষ্ঠান বেশি প্রাসঙ্গিক হতে পারে তা বুঝতে তালিকাভুক্ত তথ্য ব্যবহার করুন।",
    tone: "blue",
  },
  {
    id: "lab-test",
    number: "04",
    title: "Lab Test",
    titleBn: "ল্যাব টেস্ট",
    short: "Find tests and labs",
    shortBn: "টেস্ট ও ল্যাব খুঁজুন",
    details:
      "Look up diagnostic tests, review available centres and locations, compare listed test information and prices when available, and keep the search process in one place.",
    detailsBn:
      "ডায়াগনস্টিক টেস্ট খুঁজুন, উপলব্ধ সেন্টার ও লোকেশন দেখুন, তথ্য ও মূল্য থাকলে তুলনা করুন এবং পুরো খোঁজার প্রক্রিয়াটি এক জায়গা থেকে করুন।",
    tone: "sage",
  },
  {
    id: "caregiver",
    number: "05",
    title: "Caregiver",
    titleBn: "কেয়ারগিভার",
    short: "Support for everyday care",
    shortBn: "দৈনন্দিন যত্নের সহায়তা",
    details:
      "Explore caregiver and nursing-support options for home and everyday care, then review available experience, service details and location information before deciding whom to contact.",
    detailsBn:
      "বাসা ও দৈনন্দিন যত্নের জন্য কেয়ারগিভার ও নার্সিং সাপোর্টের অপশন দেখুন, তারপর যোগাযোগের আগে অভিজ্ঞতা, সেবার তথ্য ও লোকেশন পর্যালোচনা করুন।",
    tone: "lavender",
  },
  {
    id: "ambulance",
    number: "06",
    title: "Ambulance",
    titleBn: "অ্যাম্বুলেন্স",
    short: "Emergency contacts, quickly",
    shortBn: "দ্রুত জরুরি যোগাযোগ",
    details:
      "Reach ambulance and emergency contacts quickly without searching through multiple pages, with location-based options shown whenever that information is available.",
    detailsBn:
      "একাধিক পেজ ঘাঁটা ছাড়াই দ্রুত অ্যাম্বুলেন্স ও জরুরি যোগাযোগ দেখুন এবং তথ্য উপলব্ধ থাকলে লোকেশনভিত্তিক অপশন ব্যবহার করুন।",
    tone: "clay",
  },
];

function TapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="7" r="3.25" />
      <path d="M12 10.5v7.2M12 13.5l-2.1-1.25c-1.15-.68-2.35.65-1.62 1.78l2.75 4.22c.48.74 1.3 1.19 2.18 1.19h3.15c1.42 0 2.58-1.15 2.58-2.58v-3.32c0-1.06-.86-1.92-1.92-1.92-.35 0-.69.1-.98.27a1.9 1.9 0 0 0-1.64-.94c-.48 0-.92.18-1.26.47A1.9 1.9 0 0 0 12 10.5Z" />
    </svg>
  );
}

export function ServiceCarousel({ language }: { language: Language }) {
  const bn = language === "bn";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef(0);
  const [flipped, setFlipped] = useState<string | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) return;

    const cruiseSpeed = 0.034;
    let currentSpeed = cruiseSpeed;
    let frame = 0;
    let previous = performance.now();

    const move = (now: number) => {
      const elapsed = Math.min(now - previous, 28);
      previous = now;

      const targetSpeed = now > pauseUntilRef.current ? cruiseSpeed : 0;
      const easing = Math.min(1, elapsed / 280);
      currentSpeed += (targetSpeed - currentSpeed) * easing;

      scroller.scrollLeft += elapsed * currentSpeed;

      const loopPoint = scroller.scrollWidth / 2;
      if (loopPoint > 0 && scroller.scrollLeft >= loopPoint) {
        scroller.scrollLeft -= loopPoint;
      }

      frame = requestAnimationFrame(move);
    };

    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, []);

  function pauseFor(ms = 220) {
    pauseUntilRef.current = performance.now() + ms;
  }

  const repeated = [...services, ...services];

  return (
    <div className={styles.carouselShell}>
      <div
        ref={scrollerRef}
        className={styles.scroller}
        onPointerDown={() => pauseFor(260)}
        onTouchStart={() => pauseFor(260)}
        onWheel={() => pauseFor(300)}
        aria-label={bn ? "স্বাস্থ্যসেবা কার্ড" : "Healthcare service cards"}
      >
        <div className={styles.track}>
          {repeated.map((service, index) => {
            const isFlipped = flipped === service.id;

            return (
              <button
                key={`${service.id}-${index}`}
                type="button"
                className={`${styles.card} ${styles[service.tone]} ${
                  isFlipped ? styles.flipped : ""
                }`}
                onClick={() => {
                  pauseFor(360);
                  setFlipped((current) =>
                    current === service.id ? null : service.id,
                  );
                }}
                aria-pressed={isFlipped}
                aria-label={`${bn ? service.titleBn : service.title}. ${
                  isFlipped
                    ? bn
                      ? "সামনের অংশ দেখুন"
                      : "Show front"
                    : bn
                      ? "সেবার বিস্তারিত দেখুন"
                      : "Show service details"
                }`}
              >
                <span className={styles.cardInner}>
                  <span className={styles.cardFace}>
                    <span className={styles.cardTopline}>
                      <span>{service.number}</span>
                      <span>{bn ? "সেবা" : "Service"}</span>
                    </span>

                    <span className={styles.cardTitle}>
                      {bn ? service.titleBn : service.title}
                    </span>

                    <span className={styles.cardShort}>
                      {bn ? service.shortBn : service.short}
                    </span>

                    <span className={styles.tapIcon} aria-hidden="true">
                      <TapIcon />
                    </span>
                  </span>

                  <span className={`${styles.cardFace} ${styles.cardBack}`}>
                    <span className={styles.cardTopline}>
                      <span>{service.number}</span>
                      <span>{bn ? "যা পাবেন" : "What you get"}</span>
                    </span>

                    <span className={styles.backTitle}>
                      {bn ? service.titleBn : service.title}
                    </span>

                    <span className={styles.cardDetails}>
                      {bn ? service.detailsBn : service.details}
                    </span>

                    <span className={styles.tapIcon} aria-hidden="true">
                      <TapIcon />
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
