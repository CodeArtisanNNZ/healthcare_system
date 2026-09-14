import "server-only";

import type { Offer } from "./medicine-utils";

type Seller = {
  name: string;
  url: (query: string) => string;
  note: string;
};

const sellers: Seller[] = [
  {
    name: "Arogga",
    url: (query) =>
      `https://www.arogga.com/search?_search=${encodeURIComponent(query)}`,
    note: "Open Arogga with your medicine search.",
  },
  {
    name: "MedEasy",
    url: () => "https://medeasy.health/",
    note: "Open MedEasy and search the medicine there.",
  },
  {
    name: "ePharma",
    url: (query) =>
      `https://epharma.com.bd/en/products?keyword=${encodeURIComponent(query)}`,
    note: "Open ePharma with your medicine search.",
  },
  {
    name: "Osudpotro",
    url: () => "https://osudpotro.com/category",
    note: "Open Osudpotro and search the medicine there.",
  },
  {
    name: "BanglaMeds / Chaldal Pharmacy",
    url: () => "https://chaldal.com/pharmacy",
    note: "Open BanglaMeds / Chaldal Pharmacy and search the medicine there.",
  },
];

export async function searchMedicines(query: string): Promise<Offer[]> {
  const cleanQuery = query.trim();

  return sellers.map((seller) => ({
    platform: seller.name,
    found: true,
    title: cleanQuery,
    description: seller.note,
    price: null,
    currency: "BDT",
    url: seller.url(cleanQuery),
    source: "Original seller website",
    checkedAt: new Date().toISOString(),
  }));
}
