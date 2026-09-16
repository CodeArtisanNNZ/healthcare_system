import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { Heading, Empty } from "@/components/ui";

export default async function PatientAppointments() {
  const user = await requireUser("patient"); const db = await supabase();
  const { data, error } = await db.from("appointment_requests").select("*,requested:doctors!appointment_requests_requested_doctor_id_fkey(full_name),assigned:doctors!appointment_requests_assigned_doctor_id_fkey(full_name,hospital_name,location)").eq("patient_id", user.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return <><Heading eyebrow="APPOINTMENTS" title="My appointment requests">A request is not final until its status is Confirmed.</Heading><div className="stack">{data?.map((item) => <article className="card" key={item.id}><p className="eyebrow">{item.status}</p><h2>{item.assigned?.full_name || item.requested?.full_name || "Doctor matching requested"}</h2><p>Preferred: {item.preferred_date} · {String(item.preferred_time_start).slice(0,5)}–{String(item.preferred_time_end).slice(0,5)} · {item.area}</p><p>Budget: ৳{item.budget_min}–৳{item.budget_max}</p>{item.confirmed_time && <p><strong>Confirmed time:</strong> {new Date(item.confirmed_time).toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}</p>}{item.assigned?.hospital_name && <p><strong>Chamber:</strong> {item.assigned.hospital_name}</p>}{item.contact_info && <p><strong>Contact / arrival instructions:</strong> {item.contact_info}</p>}{item.admin_note && <p><strong>Admin note:</strong> {item.admin_note}</p>}</article>)}</div>{!data?.length && <Empty />}</>;
}
