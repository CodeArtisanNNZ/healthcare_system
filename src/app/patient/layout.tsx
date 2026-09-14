import { requireUser } from "@/lib/auth";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("patient");

  return <div className="container section">{children}</div>;
}
