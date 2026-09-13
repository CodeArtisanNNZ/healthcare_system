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
    note: "Open Arogga to check the current listing, price and availability.",
  },
  {
    name: "MedEasy",
    url: (query) =>
      `https://medeasy.health/?search=${encodeURIComponent(query)}`,
    note: "Open MedEasy to check the current listing, price and availability.",
  },
  {
    name: "ePharma",
    url: () => "https://epharma.com.bd/en/products",
    note: "Open ePharma and confirm the exact medicine, strength and current price.",
  },
  {
    name: "Osudpotro",
    url: () => "https://osudpotro.com/category",
    note: "Open Osudpotro and confirm the exact medicine, strength and current price.",
  },
  {
    name: "BanglaMeds / Chaldal Pharmacy",
    url: () => "https://chaldal.com/pharmacy",
    note: "Open BanglaMeds / Chaldal Pharmacy and check the live listing.",
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
