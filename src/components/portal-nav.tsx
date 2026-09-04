import Link from "next/link";
import { entities } from "@/lib/entities";
export function PortalNav({ admin = false }: { admin?: boolean }) {
  const links = admin
    ? [
        ["/admin", "Overview"],
        ["/admin/users", "Users"],
        ...Object.entries(entities).map(([k, v]) => ["/admin/" + k, v.title]),
      ]
    : [
        ["/patient", "Overview"],
        ["/patient/search", "Find a doctor"],
        ["/patient/profile", "My profile"],
        ["/patient/prescriptions", "Prescriptions"],
        ["/patient/reports", "Lab reports"],
        ["/patient/lab_tests", "Lab tests"],
        ["/patient/hospitals", "Hospitals"],
        ["/patient/caregivers", "Caregivers"],
        ["/patient/ambulances", "Ambulances"],
      ];
  return (
    <nav
      className="portal-nav"
      aria-label={admin ? "Administration" : "Patient services"}
    >
      {links.map(([href, label]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
