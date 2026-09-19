"use client";

import { useEffect, useRef } from "react";
import styles from "./loading-experience.module.css";

type AnimeFn = ((params: Record<string, unknown>) => unknown) & {
  stagger: (value: number, options?: Record<string, unknown>) => unknown;
};

declare global {
  interface Window {
    anime?: AnimeFn;
  }
}

const ANIME_SRC =
  "https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js";

export function LoadingExperience({
  title = "Loading",
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

    const animate = () => {
      if (cancelled || !rootRef.current || !window.anime) return;

      const anime = window.anime;
      const root = rootRef.current;

      anime({
        targets: root.querySelector(`.${styles.logoWrap}`),
        translateY: [0, -5],
        scale: [1, 1.025],
        duration: 1800,
        direction: "alternate",
        loop: true,
        easing: "easeInOutSine",
      });

      anime({
        targets: root.querySelector(`.${styles.ringOuter}`),
        rotate: "1turn",
        duration: 5200,
        loop: true,
        easing: "linear",
      });

      anime({
        targets: root.querySelector(`.${styles.ringInner}`),
        rotate: "-1turn",
        duration: 3900,
        loop: true,
        easing: "linear",
      });

      anime({
        targets: root.querySelectorAll(`.${styles.dot}`),
        scale: [0.65, 1.2],
        opacity: [0.28, 1],
        duration: 950,
        delay: anime.stagger(180),
        direction: "alternate",
        loop: true,
        easing: "easeInOutSine",
      });

      anime({
        targets: root.querySelector(`.${styles.glow}`),
        scale: [0.86, 1.18],
        opacity: [0.18, 0],
        duration: 1600,
        loop: true,
        easing: "easeOutQuad",
      });

      anime({
        targets: root.querySelectorAll(`.${styles.loadingDot}`),
        translateY: [0, -4],
        opacity: [0.28, 1],
        duration: 520,
        delay: anime.stagger(120),
        direction: "alternate",
        loop: true,
        easing: "easeInOutQuad",
      });

      anime({
        targets: root.querySelectorAll(`.${styles.reveal}`),
        opacity: [0, 1],
        translateY: [6, 0],
        duration: 480,
        delay: anime.stagger(90),
        easing: "easeOutCubic",
      });
    };

    if (window.anime) {
      animate();
      return () => {
        cancelled = true;
      };
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-healthcare-anime="true"]',
    );

    const onLoad = () => animate();

    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = ANIME_SRC;
      script.async = true;
      script.dataset.healthcareAnime = "true";
      script.addEventListener("load", onLoad, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      existing?.removeEventListener("load", onLoad);
    };
  }, [compact]);

  if (compact) {
    return (
      <div className={styles.compact} role="status" aria-live="polite">
        <img src="/images/logo.png" alt="" className={styles.compactLogo} />
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
      <div className={styles.visual} aria-hidden="true">
        <span className={styles.glow} />

        <span className={styles.ringOuter}>
          <i className={`${styles.dot} ${styles.dotOne}`} />
          <i className={`${styles.dot} ${styles.dotTwo}`} />
        </span>

        <span className={styles.ringInner}>
          <i className={`${styles.dot} ${styles.dotThree}`} />
        </span>

        <div className={styles.logoWrap}>
          <img
            src="/images/logo.png"
            alt=""
            className={styles.logo}
          />
        </div>
      </div>

      <div className={styles.copy}>
        <strong className={styles.reveal}>{title}</strong>
        {message && (
          <span className={`${styles.message} ${styles.reveal}`}>
            {message}
          </span>
        )}
        <span className={`${styles.dots} ${styles.reveal}`} aria-hidden="true">
          <i className={styles.loadingDot} />
          <i className={styles.loadingDot} />
          <i className={styles.loadingDot} />
        </span>
      </div>
    </div>
  );
}
