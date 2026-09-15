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

  while (tries < 36) {
    const index = lower.indexOf(anchor, cursor);
    if (index < 0) break;

    const start = Math.max(0, index - 35);
    const window = text.slice(start, Math.min(text.length, index + 240));
    const windowLower = window.toLocaleLowerCase("en");
    const matchedTokens = tokens.filter((token) => windowLower.includes(token)).length;
    const prices = pricesFromText(window);

    if (prices.length && matchedTokens >= Math.min(tokens.length, 2)) {
      // Seller cards normally show MRP first and the current listed price last.
      const price = prices[prices.length - 1];
      const score = matchedTokens * 10 + Math.min(prices.length, 3);

      if (!best || score > best.score) {
        best = { score, price };
      }
    }

    cursor = index + Math.max(anchor.length, 1);
    tries += 1;
  }

  return best?.price ?? null;
}

async function fetchSellerText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; HealthcareCentral/1.0; +https://healthcare-system-m5q5.vercel.app)",
      },
    });

    if (!response.ok) return "";

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return "";

    const html = await response.text();
    return htmlToText(html.slice(0, 2_000_000));
  } catch {
    return "";
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

  const sellerText = await fetchSellerText(url);
  const price = sellerText ? extractListingPrice(sellerText, query) : null;

  return {
    query,
    platform: seller.name,
    found: true,
    title: query,
    description:
      price === null
        ? "The seller page is available, but its live price could not be read reliably. Confirm the exact strength and pack on the seller website."
        : "Live listed seller price found. Confirm the exact strength, pack size, stock and final checkout price before buying.",
    price,
    currency: "BDT",
    url,
    source:
      price === null
        ? "Original seller website"
        : "Live seller listing (price may change at checkout)",
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
        // Cross-site carts are isolated by each pharmacy's own browser session.
        // We only enable this after a seller provides a supported cart/deep-link API.
        cartHandoffAvailable: false,
        cartNote:
          "This pharmacy does not currently expose a supported cross-site cart hand-off. Open the seller to confirm each medicine and add it to that seller's cart.",
      };
    }),
  );
}

export async function searchMedicines(query: string): Promise<Offer[]> {
  const cleanQuery = query.trim();
  const bundles = await searchMedicineList([cleanQuery]);

  return bundles.map((bundle) => bundle.items[0]);
}
