import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { Heading, Empty } from "@/components/ui";
import styles from "./medicine.module.css";

export default async function Medicine({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const db = await supabase();
  const { data: medicine, error } = await db
    .from("medicines")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!medicine) notFound();

  const { data: offers, error: offerError } = await db
    .from("medicine_offers")
    .select("*")
    .eq("medicine_id", id)
    .order("price");

  if (offerError) throw new Error(offerError.message);

  return (
    <div className={`container section ${styles.page}`}>
      <Link className={styles.back} href="/medicines">
        ← Back to medicine search
      </Link>

      <Heading title={medicine.name}>
        {[medicine.generic, medicine.strength].filter(Boolean).join(" · ")}
      </Heading>

      <p className={styles.note}>
        Prices are comparison listings. Always confirm the exact medicine,
        strength, pack size, availability and final price on the seller website.
      </p>

      {offers?.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Seller</th>
                <th>Listed price</th>
                <th>Last checked</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id}>
                  <td data-label="Seller">
                    <strong>{offer.seller}</strong>
                  </td>
                  <td data-label="Listed price">৳{offer.price}</td>
                  <td data-label="Last checked">{offer.checked_on}</td>
                  <td data-label="Action">
                    <a
                      className={styles.buyButton}
                      href={
                        offer.url.startsWith("https://") ? offer.url : undefined
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Buy on {offer.seller} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No seller offers have been added for this medicine.</Empty>
      )}
    </div>
  );
}
