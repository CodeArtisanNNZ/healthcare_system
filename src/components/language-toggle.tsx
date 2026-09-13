"use client";

import { useEffect, useState } from "react";
import styles from "./language-toggle.module.css";

type Language = "en" | "bn";

export function LanguageToggle() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const url = new URL(window.location.href);
    const current = url.searchParams.get("lang") === "bn" ? "bn" : "en";
    setLanguage(current);
    document.documentElement.lang = current === "bn" ? "bn" : "en";
  }, []);

  function choose(next: Language) {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.location.href = url.toString();
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
