import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { Heading, DirectoryCard, Empty } from "@/components/ui";
import type { Row } from "@/lib/entities";
export default async function Doctor() {
  const user = await requireUser("doctor");
  const db = await supabase();
  const { data, error } = await db
    .from("doctors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (
    <div className="container section">
      <Heading eyebrow="DOCTOR PORTAL" title={`Welcome, ${user.full_name}.`}>
        Your professional directory profile.
      </Heading>
      {data ? (
        <DirectoryCard kind="doctors" row={data as Row} />
      ) : (
        <Empty>
          No active listing is linked to your account. Ask an administrator to
          link your account UUID to a doctor profile.
        </Empty>
      )}
      <p className="notice">
        Contact your administrator to update directory details. Appointment
        management and access to patient records are not part of this portal.
      </p>
    </div>
  );
}
