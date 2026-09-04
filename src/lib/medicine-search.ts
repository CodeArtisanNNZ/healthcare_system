import "server-only";
import {
  allowedUrl,
  pharmacies,
  rankResult,
  extractProduct,
  type SearchHit,
  type Offer,
} from "./medicine-utils";
async function limitedBody(response: Response, max = 1500000) {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > max) throw new Error("Response too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const c of chunks) {
    body.set(c, offset);
    offset += c.length;
  }
  return new TextDecoder().decode(body);
}
async function productPage(link: string, domain: string) {
  let url = link;
  for (let i = 0; i < 4; i++) {
    if (!allowedUrl(url, domain)) return "";
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(7000),
      headers: { "User-Agent": "HealthcareCentral/1.0" },
      cache: "no-store",
    });
    if (response.status >= 300 && response.status < 400) {
      const to = response.headers.get("location");
      if (!to) return "";
      url = new URL(to, url).toString();
      continue;
    }
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("text/html")
    )
      return "";
    return limitedBody(response);
  }
  return "";
}
export async function searchMedicines(query: string): Promise<Offer[]> {
  if (!process.env.SERPER_API_KEY)
    throw new Error(
      "Live pharmacy search is not configured. Browse the catalog or ask the administrator to enable it.",
    );
  return Promise.all(
    pharmacies.map(async (platform) => {
      try {
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: `${query} medicine price Bangladesh site:${platform.domain}`,
            gl: "bd",
            hl: "en",
            num: 6,
          }),
          signal: AbortSignal.timeout(10000),
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Search provider unavailable.");
        const json = JSON.parse(await limitedBody(response, 200000));
        const hits: SearchHit[] = Array.isArray(json.organic)
          ? json.organic.filter(
              (h: SearchHit) =>
                typeof h?.title === "string" && typeof h?.link === "string",
            )
          : [];
        const best = hits
          .filter((h) => rankResult(h, query, platform.domain) >= 2)
          .sort(
            (a, b) =>
              rankResult(b, query, platform.domain) -
              rankResult(a, query, platform.domain),
          )[0];
        if (!best) return { platform: platform.name, found: false };
        const html = await productPage(best.link, platform.domain).catch(
          () => "",
        );
        const info = extractProduct(html, best);
        return {
          platform: platform.name,
          found: true,
          ...info,
          url: best.link,
          checkedAt: new Date().toISOString(),
        };
      } catch {
        return {
          platform: platform.name,
          found: false,
          error: "This seller could not be checked. Please try again later.",
        };
      }
    }),
  );
}
