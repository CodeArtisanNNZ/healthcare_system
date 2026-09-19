import { requireUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase/server";
import { Empty, Heading } from "@/components/ui";

type PatientInfo = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
};

type ChatRow = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  category: string | null;
  requested_category: string | null;
  location: string | null;
  urgent: boolean;
  created_at: string;
  patient: PatientInfo | PatientInfo[] | null;
};

function patientFrom(row: ChatRow): PatientInfo | null {
  return Array.isArray(row.patient) ? row.patient[0] || null : row.patient;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminPatientChats() {
  await requireUser("admin");
  const db = await supabase();

  const { data, error } = await db
    .from("assistant_messages")
    .select(
      "id,user_id,role,content,category,requested_category,location,urgent,created_at,patient:profiles!assistant_messages_user_id_fkey(full_name,email,phone,role)",
    )
    .order("created_at", { ascending: false })
    .limit(1500);

  if (error) throw new Error(error.message);

  const rows = ((data || []) as ChatRow[]).filter(
    (row) => patientFrom(row)?.role === "patient",
  );

  const conversations = new Map<
    string,
    { patient: PatientInfo | null; messages: ChatRow[]; latest: string }
  >();

  for (const row of rows) {
    const existing = conversations.get(row.user_id);
    if (existing) {
      existing.messages.push(row);
    } else {
      conversations.set(row.user_id, {
        patient: patientFrom(row),
        messages: [row],
        latest: row.created_at,
      });
    }
  }

  const grouped = [...conversations.entries()].sort(
    (a, b) =>
      new Date(b[1].latest).getTime() - new Date(a[1].latest).getTime(),
  );

  return (
    <>
      <Heading eyebrow="PATIENT SUPPORT" title="Patient assistant chats">
        Read the conversations patients had with Healthcare Central Assistant.
        These chats can contain sensitive health information and are visible only
        to authenticated administrators.
      </Heading>

      <div className="stack">
        {grouped.map(([userId, conversation], index) => {
          const patient = conversation.patient;
          const messages = [...conversation.messages].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          );

          return (
            <details className="card" key={userId} open={index === 0}>
              <summary>
                <strong>{patient?.full_name || patient?.email || "Patient"}</strong>
                {" · "}
                {messages.length} message{messages.length === 1 ? "" : "s"}
                {" · "}
                last activity {formatTime(conversation.latest)}
              </summary>

              <p className="muted">
                {patient?.email || "No email"}
                {patient?.phone ? ` · ${patient.phone}` : ""}
              </p>

              <div
                style={{
                  display: "grid",
                  gap: "0.75rem",
                  marginTop: "1rem",
                }}
              >
                {messages.map((message) => {
                  const fromPatient = message.role === "user";

                  return (
                    <div
                      key={message.id}
                      style={{
                        justifySelf: fromPatient ? "end" : "start",
                        width: "min(88%, 760px)",
                        border: "1px solid rgba(16,72,68,.16)",
                        borderRadius: "16px",
                        padding: "0.85rem 1rem",
                        background: fromPatient ? "#eef7f4" : "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                          alignItems: "baseline",
                          marginBottom: "0.35rem",
                        }}
                      >
                        <strong>
                          {fromPatient ? "Patient" : "Healthcare Central Assistant"}
                        </strong>
                        <span className="muted">{formatTime(message.created_at)}</span>
                        {message.location && (
                          <span className="muted">· {message.location}</span>
                        )}
                        {message.urgent && <strong>· URGENT</strong>}
                      </div>

                      <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                        {message.content}
                      </p>

                      {message.category && (
                        <p className="muted" style={{ marginBottom: 0 }}>
                          Service: {message.category}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      {!grouped.length && <Empty />}
    </>
  );
}
