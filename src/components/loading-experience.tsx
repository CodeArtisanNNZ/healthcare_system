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
        targets: root.querySelectorAll(`.${styles.tile}`),
        scale: [0.72, 1],
        opacity: [0.35, 1],
        duration: 760,
        delay: anime.stagger(105, { from: "center" }),
        direction: "alternate",
        loop: true,
        easing: "easeInOutQuad",
      });

      anime({
        targets: root.querySelector(`.${styles.cross}`),
        translateY: [0, -6],
        duration: 1650,
        direction: "alternate",
        loop: true,
        easing: "easeInOutSine",
      });

      anime({
        targets: root.querySelector(`.${styles.halo}`),
        scale: [0.72, 1.28],
        opacity: [0.22, 0],
        duration: 1500,
        loop: true,
        easing: "easeOutQuad",
      });

      anime({
        targets: root.querySelectorAll(`.${styles.orb}`),
        rotate: "1turn",
        duration: 3000,
        delay: anime.stagger(320),
        loop: true,
        easing: "linear",
      });

      anime({
        targets: root.querySelector(`.${styles.sweep}`),
        translateX: ["-120%", "120%"],
        duration: 1750,
        loop: true,
        easing: "easeInOutCubic",
      });

      anime({
        targets: root.querySelectorAll(`.${styles.reveal}`),
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 520,
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
        <span className={styles.compactDot} aria-hidden="true" />
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
        <span className={styles.halo} />

        <span className={`${styles.orb} ${styles.orbOne}`}>
          <i />
        </span>
        <span className={`${styles.orb} ${styles.orbTwo}`}>
          <i />
        </span>
        <span className={`${styles.orb} ${styles.orbThree}`}>
          <i />
        </span>

        <div className={styles.cross}>
          <span className={`${styles.tile} ${styles.top}`} />
          <span className={`${styles.tile} ${styles.left}`} />
          <span className={`${styles.tile} ${styles.center}`}>
            <span className={styles.sweep} />
          </span>
          <span className={`${styles.tile} ${styles.right}`} />
          <span className={`${styles.tile} ${styles.bottom}`} />
        </div>
      </div>

      <div className={styles.copy}>
        <span className={`${styles.brand} ${styles.reveal}`}>
          Healthcare Central
        </span>
        <strong className={styles.reveal}>{title}</strong>
        {message && (
          <span className={`${styles.message} ${styles.reveal}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
