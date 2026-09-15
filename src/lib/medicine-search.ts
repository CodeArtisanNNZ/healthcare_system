import "server-only";

import type { Offer } from "./medicine-utils";

type Seller = {
  name: string;
  homeUrl: string;
  searchUrl: (query: string) => string;
  note: string;
  livePrice: boolean;
};

export type MedicineItemOffer = Offer & {
  query: string;
};

export type SellerBundle = {
  platform: string;
  sellerUrl: string;
  items: MedicineItemOffer[];
  totalPrice: number | null;
  knownTotal: number;
  pricedCount: number;
  itemCount: number;
  currency: "BDT";
  totalComplete: boolean;
  cartHandoffAvailable: boolean;
  cartNote: string;
};

const sellers: Seller[] = [
  {
    name: "Arogga",
    homeUrl: "https://www.arogga.com/",
    searchUrl: (query) =>
      `https://www.arogga.com/search?_product_type=all&_search=${encodeURIComponent(query)}`,
    note: "Arogga seller listing",
    livePrice: true,
  },
  {
    name: "MedEasy",
    homeUrl: "https://medeasy.health/",
    searchUrl: (query) =>
      `https://medeasy.health/?search=${encodeURIComponent(query)}`,
    note: "MedEasy seller listing",
    livePrice: true,
  },
  {
    name: "ePharma",
    homeUrl: "https://epharma.com.bd/",
    searchUrl: (query) =>
      `https://epharma.com.bd/en/products?keyword=${encodeURIComponent(query)}`,
    note: "ePharma seller listing",
    livePrice: true,
  },
  {
    name: "Osudpotro",
    homeUrl: "https://osudpotro.com/",
    searchUrl: () => "https://osudpotro.com/category",
    note: "Open Osudpotro and confirm the exact medicine there.",
    livePrice: false,
  },
  {
    name: "BanglaMeds / Chaldal Pharmacy",
    homeUrl: "https://chaldal.com/pharmacy",
    searchUrl: () => "https://chaldal.com/pharmacy",
    note: "Open Chaldal Pharmacy and confirm the exact medicine there.",
    livePrice: false,
  },
];

export function parseMedicineQueries(input: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const piece of input.split(/[\n,;]+/)) {
    const clean = piece.replace(/\s+/g, " ").trim();
    if (clean.length < 2) continue;

    const key = clean.toLocaleLowerCase("en");
    if (seen.has(key)) continue;

    seen.add(key);
    results.push(clean.slice(0, 100));

    if (results.length === 10) break;
  }

  return results;
}

function decodeHtml(text: string) {
  return text
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function htmlToText(html: string) {
  return decodeHtml(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function queryTokens(query: string) {
  return query
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9\u0980-\u09ff]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function pricesFromText(text: string) {
  const values: number[] = [];
  const pattern = /(?:৳|\bBDT\b|\bTk\.?)[\s\u00a0]*([0-9,]+(?:\.[0-9]{1,2})?)/gi;

  for (const match of text.matchAll(pattern)) {
    const value = Number(match[1].replaceAll(",", ""));
    if (Number.isFinite(value) && value >= 0 && value < 1_000_000) {
      values.push(value);
    }
  }

  return values;
}

function extractListingPrice(text: string, query: string): number | null {
  const lower = text.toLocaleLowerCase("en");
  const tokens = queryTokens(query);
  if (!tokens.length) return null;

  const anchor = tokens[0];
  let cursor = 0;
  let best: { score: number; price: number } | null = null;
  let tries = 0;

  while (tries < 48) {
    const index = lower.indexOf(anchor, cursor);
    if (index < 0) break;

    const start = Math.max(0, index - 55);
    const window = text.slice(start, Math.min(text.length, index + 320));
    const windowLower = window.toLocaleLowerCase("en");
    const matchedTokens = tokens.filter((token) => windowLower.includes(token)).length;
    const prices = pricesFromText(window);

    if (prices.length && matchedTokens >= Math.min(tokens.length, 2)) {
      const price = prices[prices.length - 1];
      const exactBonus = windowLower.includes(query.toLocaleLowerCase("en")) ? 20 : 0;
      const score = exactBonus + matchedTokens * 10 + Math.min(prices.length, 4);

      if (!best || score > best.score) {
        best = { score, price };
      }
    }

    cursor = index + Math.max(anchor.length, 1);
    tries += 1;
  }

  return best?.price ?? null;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOfferPrice(value: unknown): number | null {
  const offers = Array.isArray(value) ? value : [value];

  for (const offer of offers) {
    if (!isRecord(offer)) continue;
    const raw = offer.price ?? offer.lowPrice ?? offer.highPrice;
    const amount =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number(raw.replaceAll(",", "").trim())
          : NaN;

    if (Number.isFinite(amount) && amount >= 0 && amount < 1_000_000) {
      return amount;
    }
  }

  return null;
}

function extractStructuredPrice(html: string, query: string): number | null {
  const tokens = queryTokens(query);
  if (!tokens.length) return null;

  const best: {
    value: { score: number; price: number } | null;
  } = { value: null };

  function inspect(value: unknown, depth = 0) {
    if (depth > 18) return;

    if (Array.isArray(value)) {
      value.forEach((item) => inspect(item, depth + 1));
      return;
    }

    if (!isRecord(value)) return;

    const type = value["@type"];
    const isProduct =
      type === "Product" ||
      (Array.isArray(type) && type.some((entry) => entry === "Product"));

    if (isProduct && typeof value.name === "string") {
      const name = value.name.toLocaleLowerCase("en");
      const matchedTokens = tokens.filter((token) => name.includes(token)).length;
      const minimumMatches = Math.min(tokens.length, 2);
      const price = readOfferPrice(value.offers);

      if (price !== null && matchedTokens >= minimumMatches) {
        const exactBonus = name.includes(query.toLocaleLowerCase("en")) ? 30 : 0;
        const score = exactBonus + matchedTokens * 12;

        if (!best.value || score > best.value.score) {
          best.value = { score, price };
        }
      }
    }

    Object.values(value).forEach((child) => inspect(child, depth + 1));
  }

  for (const match of html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      inspect(JSON.parse(match[1]));
    } catch {
      // Ignore malformed third-party metadata.
    }
  }

  return best.value?.price ?? null;
}

async function fetchSellerPage(url: string): Promise<{ html: string; text: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-BD,en;q=0.9,bn;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; HealthcareCentral/1.0; +https://healthcare-system-m5q5.vercel.app)",
      },
    });

    if (!response.ok) return { html: "", text: "" };

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return { html: "", text: "" };

    const html = (await response.text()).slice(0, 2_500_000);
    return { html, text: htmlToText(html) };
  } catch {
    return { html: "", text: "" };
  } finally {
    clearTimeout(timeout);
  }
}

async function searchSellerItem(
  seller: Seller,
  query: string,
): Promise<MedicineItemOffer> {
  const url = seller.searchUrl(query);

  if (!seller.livePrice) {
    return {
      query,
      platform: seller.name,
      found: true,
      title: query,
      description: seller.note,
      price: null,
      currency: "BDT",
      url,
      source: "Original seller website",
      checkedAt: new Date().toISOString(),
    };
  }

  const sellerPage = await fetchSellerPage(url);
  const structuredPrice = sellerPage.html
    ? extractStructuredPrice(sellerPage.html, query)
    : null;
  const textPrice =
    structuredPrice === null && sellerPage.text
      ? extractListingPrice(sellerPage.text, query)
      : null;
  const price = structuredPrice ?? textPrice;

  return {
    query,
    platform: seller.name,
    found: true,
    title: query,
    description:
      price === null
        ? "The seller page is available, but a matching live price could not be read reliably. Open the listing to confirm the exact medicine, strength and pack."
        : "A matching live seller price was read from the current listing. Confirm the exact strength, pack size, stock and checkout price before buying.",
    price,
    currency: "BDT",
    url,
    source:
      price === null
        ? "Original seller website"
        : structuredPrice !== null
          ? "Live seller product metadata"
          : "Live seller listing text",
    checkedAt: new Date().toISOString(),
  };
}

export async function searchMedicineList(
  queries: string[],
): Promise<SellerBundle[]> {
  return Promise.all(
    sellers.map(async (seller) => {
      const items = await Promise.all(
        queries.map((query) => searchSellerItem(seller, query)),
      );

      const pricedItems = items.filter(
        (item) => typeof item.price === "number" && Number.isFinite(item.price),
      );
      const knownTotal = pricedItems.reduce(
        (sum, item) => sum + (item.price || 0),
        0,
      );
      const totalComplete = pricedItems.length === items.length && items.length > 0;

      return {
        platform: seller.name,
        sellerUrl: seller.homeUrl,
        items,
        totalPrice: totalComplete ? knownTotal : null,
        knownTotal,
        pricedCount: pricedItems.length,
        itemCount: items.length,
        currency: "BDT" as const,
        totalComplete,
        cartHandoffAvailable: false,
        cartNote:
          "Healthcare Central opens the original pharmacy. Cart contents remain controlled by that pharmacy's own website and session.",
      };
    }),
  );
}

export async function searchMedicines(query: string): Promise<Offer[]> {
  const cleanQuery = query.trim();
  const bundles = await searchMedicineList([cleanQuery]);

  return bundles.map((bundle) => bundle.items[0]);
}
