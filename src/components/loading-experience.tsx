"use client";

import { useEffect, useRef } from "react";
import styles from "./loading-experience.module.css";

type AnimeFn = ((params: Record<string, unknown>) => unknown) & {
  stagger: (value: number) => unknown;
  setDashoffset: (element: SVGPathElement) => number;
};

declare global {
  interface Window {
    anime?: AnimeFn;
  }
}

const ANIME_SRC =
  "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js";

export function LoadingExperience({
  title = "Getting things ready",
  message = "",
  compact = false,
}: {
  title?: string;
  message?: string;
  compact?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (compact) return;

    let cancelled = false;

    const startAnimation = () => {
      if (cancelled || !rootRef.current || !window.anime) return;

      const root = rootRef.current;
      const anime = window.anime;

      anime({
        targets: root.querySelector(`.${styles.stage}`),
        translateY: [0, -7],
        duration: 1900,
        direction: "alternate",
        loop: true,
        easing: "easeInOutSine",
      });

      anime({
        targets: root.querySelector(`.${styles.outerRing}`),
        rotate: "1turn",
        duration: 5200,
        loop: true,
        easing: "linear",
      });

      anime({
        targets: root.querySelectorAll(`.${styles.spark}`),
        scale: [0.55, 1.15],
        opacity: [0.28, 1],
        duration: 900,
        delay: anime.stagger(180),
        direction: "alternate",
        loop: true,
        easing: "easeInOutSine",
      });

      const pulsePath = root.querySelector(
        `.${styles.pulsePath}`,
      ) as SVGPathElement | null;

      if (pulsePath) {
        anime({
          targets: pulsePath,
          strokeDashoffset: [anime.setDashoffset, 0],
          duration: 1500,
          delay: 120,
          loop: true,
          easing: "easeInOutSine",
        });
      }

      anime({
        targets: root.querySelector(`.${styles.scan}`),
        translateX: ["-145%", "145%"],
        duration: 1750,
        delay: 250,
        loop: true,
        easing: "easeInOutQuad",
      });

      anime({
        targets: root.querySelectorAll(`.${styles.intro}`),
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 650,
        delay: anime.stagger(95),
        easing: "easeOutCubic",
      });
    };

    if (window.anime) {
      startAnimation();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-healthcare-anime="true"]',
    );

    const handleLoad = () => startAnimation();

    if (existing) {
      existing.addEventListener("load", handleLoad, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = ANIME_SRC;
      script.async = true;
      script.dataset.healthcareAnime = "true";
      script.addEventListener("load", handleLoad, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      existing?.removeEventListener("load", handleLoad);
    };
  }, [compact]);

  if (compact) {
    return (
      <div className={styles.compact} role="status" aria-live="polite">
        <span className={styles.compactPulse} aria-hidden="true" />
        <div>
          <strong>{title}</strong>
          {message && <span>{message}</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      <div className={styles.ambient} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className={styles.stage} aria-hidden="true">
        <div className={styles.outerRing}>
          <span className={`${styles.spark} ${styles.sparkOne}`} />
          <span className={`${styles.spark} ${styles.sparkTwo}`} />
          <span className={`${styles.spark} ${styles.sparkThree}`} />
        </div>

        <div className={styles.innerDisc}>
          <div className={styles.scan} />
          <svg viewBox="0 0 180 72" fill="none" className={styles.pulse}>
            <path
              className={styles.pulseGhost}
              d="M3 38h38l8-15 12 32 14-43 15 32 10-16 9 10h68"
            />
            <path
              className={styles.pulsePath}
              d="M3 38h38l8-15 12 32 14-43 15 32 10-16 9 10h68"
            />
          </svg>
        </div>
      </div>

      <div className={styles.copy}>
        <span className={`${styles.kicker} ${styles.intro}`}>
          Healthcare Central
        </span>
        <strong className={styles.intro}>{title}</strong>
        {message && (
          <span className={`${styles.message} ${styles.intro}`}>
            {message}
          </span>
        )}
        <div className={`${styles.dots} ${styles.intro}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
