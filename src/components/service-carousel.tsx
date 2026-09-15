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
      "Search by symptoms, specialty or doctor name, then narrow the results by location.",
    detailsBn:
      "উপসর্গ, বিশেষত্ব বা ডাক্তারের নাম দিয়ে খুঁজুন এবং লোকেশন অনুযায়ী ফলাফল সীমিত করুন।",
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
      "Search once and continue to trusted pharmacy websites to check current price and availability.",
    detailsBn:
      "একবার সার্চ করে বিশ্বস্ত অনলাইন ফার্মেসিতে গিয়ে বর্তমান মূল্য ও প্রাপ্যতা যাচাই করুন।",
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
      "Find hospitals by location and explore the departments and services listed for each facility.",
    detailsBn:
      "লোকেশন অনুযায়ী হাসপাতাল খুঁজুন এবং প্রতিটি প্রতিষ্ঠানের বিভাগ ও সেবা দেখুন।",
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
      "Look up diagnostic tests, compare available centres and review listed test information.",
    detailsBn:
      "ডায়াগনস্টিক টেস্ট খুঁজুন, সেন্টারগুলোর অপশন দেখুন এবং তালিকাভুক্ত তথ্য তুলনা করুন।",
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
      "Explore caregiver and nursing-support options, including available experience and location details.",
    detailsBn:
      "কেয়ারগিভার ও নার্সিং সাপোর্টের অপশন, অভিজ্ঞতা এবং লোকেশন সম্পর্কিত তথ্য দেখুন।",
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
      "Reach emergency and ambulance contacts quickly, with location-based options where available.",
    detailsBn:
      "দ্রুত জরুরি ও অ্যাম্বুলেন্স যোগাযোগ দেখুন এবং উপলব্ধ থাকলে লোকেশনভিত্তিক অপশন ব্যবহার করুন।",
    tone: "clay",
  },
];

export function ServiceCarousel({ language }: { language: Language }) {
  const bn = language === "bn";
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pauseUntilRef = useRef(0);
  const hoveringRef = useRef(false);
  const [flipped, setFlipped] = useState<string | null>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) return;

    let frame = 0;
    let previous = performance.now();

    const move = (now: number) => {
      const elapsed = Math.min(now - previous, 32);
      previous = now;

      if (!hoveringRef.current && now > pauseUntilRef.current) {
        scroller.scrollLeft += elapsed * 0.022;

        const loopPoint = scroller.scrollWidth / 2;
        if (loopPoint > 0 && scroller.scrollLeft >= loopPoint) {
          scroller.scrollLeft -= loopPoint;
        }
      }

      frame = requestAnimationFrame(move);
    };

    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, []);

  function pauseFor(ms = 2600) {
    pauseUntilRef.current = performance.now() + ms;
  }

  const repeated = [...services, ...services];

  return (
    <div className={styles.carouselShell}>
      <div className={styles.carouselHint} aria-hidden="true">
        <span>{bn ? "টেনে দেখুন" : "Drag to explore"}</span>
        <i />
      </div>

      <div
        ref={scrollerRef}
        className={styles.scroller}
        onPointerDown={() => pauseFor(3600)}
        onTouchStart={() => pauseFor(3600)}
        onWheel={() => pauseFor(3200)}
        onMouseEnter={() => {
          hoveringRef.current = true;
        }}
        onMouseLeave={() => {
          hoveringRef.current = false;
          pauseFor(700);
        }}
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
                  pauseFor(4200);
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
                <span className={styles.gearHalo} aria-hidden="true" />

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

                    <span className={styles.tapLabel}>
                      {bn ? "বিস্তারিত দেখতে চাপুন" : "Tap to see details"}
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

                    <span className={styles.tapLabel}>
                      {bn ? "ফিরতে আবার চাপুন" : "Tap again to flip back"}
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
