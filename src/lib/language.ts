import "server-only";

import { cookies } from "next/headers";

export type Language = "en" | "bn";

type LanguageParams = {
  lang?: string | string[] | undefined;
};

export async function getLanguage(
  searchParams?: LanguageParams | Promise<LanguageParams>,
): Promise<Language> {
  if (searchParams) {
    const params = await searchParams;
    const raw = params.lang;
    const value = Array.isArray(raw) ? raw[0] : raw;

    if (value === "bn") return "bn";
    if (value === "en") return "en";
  }

  const store = await cookies();
  return store.get("hc_lang")?.value === "bn" ? "bn" : "en";
}
