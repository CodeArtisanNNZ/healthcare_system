export const pharmacies = [
  { name: "Arogga", domain: "arogga.com" },
  { name: "MedEasy", domain: "medeasy.health" },
  { name: "ePharma", domain: "epharma.com.bd" },
  { name: "Osudpotro", domain: "osudpotro.com" },
];
export function allowedUrl(value: string, domain: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      (!u.port || u.port === "443") &&
      (u.hostname === domain || u.hostname === "www." + domain)
    );
  } catch {
    return false;
  }
}
export function priceFromText(text: string): number | null {
  const m = text.match(/(?:৳|\bBDT\b|\bTk\.?)[\s]*([0-9,]+(?:\.[0-9]{1,2})?)/i);
  if (!m) return null;
  const n = Number(m[1].replaceAll(",", ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}
export type SearchHit = { title: string; link: string; snippet?: string };
export function rankResult(hit: SearchHit, query: string, domain: string) {
  if (!allowedUrl(hit.link, domain)) return -1;
  const title = hit.title.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = terms.filter((t) => title.includes(t));
  if (!matches.length) return -1;
  return (
    (title.includes(query.toLowerCase()) ? 10 : 0) +
    matches.length * 2 +
    (/\/products?\/|\/medicines?\//i.test(hit.link) ? 4 : 0)
  );
}
export type Offer = {
  platform: string;
  found: boolean;
  title?: string;
  description?: string;
  price?: number | null;
  currency?: string;
  url?: string;
  error?: string;
  source?: string;
  checkedAt?: string;
};
type JsonObject = Record<string, unknown>;
function object(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
export function extractProduct(
  html: string,
  hit: SearchHit,
): {
  title: string;
  description: string;
  price: number | null;
  currency: string;
  source: string;
} {
  const result = {
    title: hit.title,
    description: hit.snippet || "",
    price: priceFromText(hit.snippet || ""),
    currency: "BDT",
    source: "Search snippet (unverified)",
  };
  const products: JsonObject[] = [];
  function walk(v: unknown, depth = 0) {
    if (depth > 20) return;
    if (Array.isArray(v)) {
      v.forEach((x) => walk(x, depth + 1));
      return;
    }
    if (!object(v)) return;
    if (
      v["@type"] === "Product" ||
      (Array.isArray(v["@type"]) && v["@type"].includes("Product"))
    )
      products.push(v);
    Object.values(v).forEach((x) => walk(x, depth + 1));
  }
  for (const m of html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      walk(JSON.parse(m[1]));
    } catch {
      /* Malformed third-party metadata is ignored. */
    }
  }
  // Accept only a unique Product object: category pages can contain unrelated products.
  if (products.length === 1) {
    const product = products[0];
    const offer = Array.isArray(product.offers)
      ? product.offers[0]
      : product.offers;
    if (typeof product.name === "string") result.title = product.name;
    if (typeof product.description === "string")
      result.description = product.description
        .replace(/<[^>]*>/g, "")
        .slice(0, 300);
    if (object(offer)) {
      const raw = offer.price ?? offer.lowPrice;
      const n =
        typeof raw === "number"
          ? raw
          : typeof raw === "string" && raw.trim()
            ? Number(raw)
            : NaN;
      if (Number.isFinite(n) && n >= 0) {
        result.price = n;
        result.currency =
          typeof offer.priceCurrency === "string"
            ? offer.priceCurrency
            : "Unknown";
        result.source =
          "Product metadata (confirm pack size and price with seller)";
      }
    }
  }
  return result;
}
