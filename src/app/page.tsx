import Link from "next/link";
import { services } from "@/lib/services";
export default function Home() {
  return (
    <>
      <section className="hero container">
        <div>
          <p className="eyebrow">ONE ACCOUNT. TOTAL WELL-BEING.</p>
          <h1>
            Your healthcare,
            <br />
            <span>connected.</span>
          </h1>
          <p className="intro">
            Doctors, caregivers, hospitals, medicines and your health
            information. A simpler way to keep your care in one place.
          </p>
          <div className="actions">
            <Link className="button" href="/register">
              Create your account →
            </Link>
            <Link className="button secondary" href="#services">
              Explore services
            </Link>
          </div>
          <p className="hero-caption">
            For patients. For families. For everyday care.
          </p>
        </div>
        <div className="hero-visual">
          <div className="orbit">
            <img src="/images/logo.png" alt="Healthcare Central" />
            <span className="orbit-label one">♡ Care that connects</span>
            <span className="orbit-label two">▤ Your health records</span>
            <span className="orbit-label three">✚ Find your specialist</span>
          </div>
        </div>
      </section>
      <section className="container section" id="services">
        <div className="section-head">
          <div>
            <p className="eyebrow">CONNECTED SERVICES</p>
            <h2>Everything starts with your care.</h2>
          </div>
          <p className="muted">Choose a service to get started.</p>
        </div>
        <div className="cards">
          {services.map((s) => (
            <Link className="card service-card" key={s.href} href={s.href}>
              <span className="icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <span className="text-link">Explore →</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="container callout">
        <div>
          <p className="eyebrow">YOUR PATIENT PORTAL</p>
          <h2>Less searching. More connected care.</h2>
          <p>
            Manage your profile, prescriptions and reports from your account.
          </p>
        </div>
        <Link className="button" href="/login">
          Open patient portal →
        </Link>
      </section>
    </>
  );
}
