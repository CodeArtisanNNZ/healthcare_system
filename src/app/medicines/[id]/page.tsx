import { notFound } from "next/navigation";
import { z } from "zod";
import { supabase } from "@/lib/supabase/server";
import { Heading, Empty } from "@/components/ui";
export default async function Medicine({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  const { data: offers, error: oe } = await db
    .from("medicine_offers")
    .select("*")
    .eq("medicine_id", id)
    .order("price");
  if (oe) throw new Error(oe.message);
  return (
    <div className="container section">
      <Heading title={medicine.name}>
        {medicine.generic} · {medicine.strength}
      </Heading>
      <p className="notice">
        Administrator-entered prices are dated reference listings. Confirm the
        current price and pack size with each seller.
      </p>
      <div className="cards">
        {offers?.map((o) => (
          <article className="card" key={o.id}>
            <h2>{o.seller}</h2>
            <strong className="stat">৳{o.price}</strong>
            <p className="muted">Checked on {o.checked_on}</p>
            <a
              className="button secondary"
              href={o.url.startsWith("https://") ? o.url : undefined}
              target="_blank"
              rel="noreferrer"
            >
              Visit seller ↗
            </a>
          </article>
        ))}
      </div>
      {!offers?.length && (
        <Empty>No prices have been added for this medicine.</Empty>
      )}
    </div>
  );
}
