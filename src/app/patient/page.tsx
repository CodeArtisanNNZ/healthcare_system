import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AwareMinds } from "@/components/aware-minds";
import { services } from "@/lib/services";

export default async function Patient() {
  const user = await requireUser("patient");

  return (
    <>
      <section className="patient-welcome">
        <div>
          <p className="eyebrow">PATIENT PORTAL</p>
          <h1>Welcome, {user.full_name}.</h1>
          <p className="muted">
            Start with Aware Minds AI or open a Healthcare Central service directly.
          </p>
        </div>
      </section>

      <AwareMinds />

      <section className="section">
        <div className="section-head">
          <div>
            <p className="eyebrow">QUICK ACCESS</p>
            <h2>Healthcare services</h2>
          </div>
          <p className="muted">These directories are available only while you are signed in.</p>
        </div>

        <div className="cards service-grid">
          {services.map((service) => (
            <Link className="card service-card" key={service.href} href={service.href}>
              <span className="icon">{service.icon}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <span className="text-link">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="account-strip">
        <div>
          <p className="eyebrow">MY HEALTH INFORMATION</p>
          <h2>Keep your account organized.</h2>
        </div>
        <div className="actions">
          <Link className="button secondary" href="/patient/prescriptions">Prescriptions</Link>
          <Link className="button secondary" href="/patient/reports">Lab reports</Link>
          <Link className="button secondary" href="/patient/profile">My profile</Link>
        </div>
      </section>
    </>
  );
}
