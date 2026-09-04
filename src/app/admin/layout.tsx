import { requireUser } from "@/lib/auth";
import { PortalNav } from "@/components/portal-nav";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser("admin");
  return (
    <div className="container section">
      <PortalNav admin />
      {children}
    </div>
  );
}
