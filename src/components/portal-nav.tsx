import Link from "next/link";
import { entities } from "@/lib/entities";

export function PortalNav({ admin = false }: { admin?: boolean }) {
  const links = admin
    ? [
        ["/", "View website"],
        ["/patient", "Preview patient UI"],
        ["/admin", "Overview"],
        ["/admin/users", "Users"],
        ["/admin/appointments", "Appointment requests"],
        ...Object.entries(entities).map(([key, value]) => [
          `/admin/${key}`,
          value.title,
        ]),
      ]
    : [
        ["/", "Home"],
        ["/patient", "Dashboard"],
        ["/patient/search", "Find a doctor"],
        ["/patient/appointments", "My appointment requests"],
        ["/patient/profile", "My profile"],
        ["/patient/prescriptions", "Prescriptions"],
        ["/patient/reports", "Lab reports"],
        ["/patient/lab_tests", "Lab tests"],
        ["/patient/hospitals", "Hospitals"],
        ["/patient/caregivers", "Caregivers"],
        ["/emergency", "Ambulances"],
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
