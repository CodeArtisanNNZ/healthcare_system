import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { entities } from "@/lib/entities";
import { supabase } from "@/lib/supabase/server";
import { Heading } from "@/components/ui";
export default async function Admin() {
  await requireUser("admin");
  const db = await supabase();
  const stats = await Promise.all(
    Object.entries(entities).map(async ([key, e]) => {
      const { count, error } = await db
        .from(key)
        .select("*", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return { key, title: e.title, count };
    }),
  );
  return (
    <>
      <Heading eyebrow="ADMINISTRATION" title="Healthcare overview">
        Manage the people and services in your directory.
      </Heading>
      <div className="cards">
        {stats.map((s) => (
          <Link className="card" key={s.key} href={"/admin/" + s.key}>
            <p className="muted">{s.title}</p>
            <strong className="stat">{s.count}</strong>
            <p className="text-link">Manage →</p>
          </Link>
        ))}
      </div>
    </>
  );
}
