import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { Heading } from "@/components/ui";
import { services } from "@/lib/services";
export default async function Patient() {
  const user = await requireUser("patient");
  return (
    <>
      <Heading eyebrow="PATIENT PORTAL" title={`Welcome, ${user.full_name}.`}>
        Find care and keep your health information together.
      </Heading>
      <form action="/patient/search" className="search">
        <label className="sr-only" htmlFor="symptoms">
          Search doctors or symptoms
        </label>
        <input
          id="symptoms"
          name="q"
          maxLength={160}
          placeholder="Search by specialist, symptoms or location"
        />
        <button>Find a doctor</button>
      </form>
      <div className="cards">
        {[
          ...services,
          {
            icon: "▤",
            title: "Prescriptions",
            text: "Upload and access prescription files.",
            href: "/patient/prescriptions",
          },
          {
            icon: "⌁",
            title: "Lab reports",
            text: "Keep your reports in your account.",
            href: "/patient/reports",
          },
          {
            icon: "○",
            title: "My profile",
            text: "Update personal and contact information.",
            href: "/patient/profile",
          },
        ].map((s) => (
          <Link className="card service-card" key={s.href} href={s.href}>
            <span className="icon">{s.icon}</span>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
            <span className="text-link">Open →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
