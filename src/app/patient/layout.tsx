import { requireUser } from "@/lib/auth";
import { PortalNav } from "@/components/portal-nav";
export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("patient");
  return (
    <div className="container section">
      <PortalNav />
      {children}
    </div>
  );
}
