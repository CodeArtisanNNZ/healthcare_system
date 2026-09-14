"use client";

import { useEffect, useState } from "react";
import styles from "./language-toggle.module.css";

type Language = "en" | "bn";

function cookieLanguage(): Language {
  if (typeof document === "undefined") return "en";
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === "hc_lang=bn")
    ? "bn"
    : "en";
}

export function LanguageToggle() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("lang");
    const current: Language =
      fromUrl === "bn" || fromUrl === "en" ? fromUrl : cookieLanguage();

    setLanguage(current);
    document.documentElement.lang = current;
    document.cookie = `hc_lang=${current}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, []);

  function choose(next: Language) {
    document.cookie = `hc_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;

    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.location.assign(url.toString());
  }

  return (
    <div className={styles.switcher} aria-label="Language">
      <button
        type="button"
        className={language === "en" ? styles.active : ""}
        onClick={() => choose("en")}
        aria-pressed={language === "en"}
      >
        EN
      </button>
      <span aria-hidden="true">|</span>
      <button
        type="button"
        className={language === "bn" ? styles.active : ""}
        onClick={() => choose("bn")}
        aria-pressed={language === "bn"}
      >
        বাংলা
      </button>
    </div>
  );
}
