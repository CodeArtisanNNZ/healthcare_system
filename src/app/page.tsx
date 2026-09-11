import Link from "next/link";
import { services } from "@/lib/services";

export default function Home() {
  return (
    <>
      <section className="home-hero container">
        <div className="home-hero-copy">
          <p className="eyebrow">HEALTHCARE CENTRAL</p>
          <h1>
            Healthcare,
            <br />
            <span>easier to navigate.</span>
          </h1>
          <p className="intro">
            One secure account for finding doctors, hospitals, medicines, caregivers, lab tests and ambulance services.
          </p>
          <div className="actions">
            <Link className="button" href="/register">Create your account →</Link>
            <Link className="button secondary" href="/login">Log in</Link>
          </div>
          <p className="hero-caption">Service information is available after you sign in.</p>
        </div>

        <div className="ai-preview" aria-label="Aware Minds AI preview">
          <div className="ai-preview-top">
            <div className="aware-mark">AM</div>
            <div>
              <p className="eyebrow">AWARE MINDS AI</p>
              <h2>Your healthcare navigation assistant.</h2>
            </div>
          </div>
          <div className="preview-chips" aria-hidden="true">
            <span>Doctor</span><span>Medicine</span><span>Caregiver</span>
            <span>Lab test</span><span>Ambulance</span><span>Hospital</span>
          </div>
          <div className="preview-conversation">
            <p className="preview-ai">How can I help you today?</p>
            <p className="preview-user">amar matha betha kore, Mirpur 12</p>
            <p className="preview-ai small">
              I can help you search the relevant healthcare service using the location you choose.
            </p>
          </div>
          <div className="preview-input">Ask in English, বাংলা or Banglish…</div>
        </div>
      </section>

      <section className="container section" id="services">
        <div className="section-head">
          <div>
            <p className="eyebrow">OUR SERVICES</p>
            <h2>Everything you need to navigate care.</h2>
          </div>
          <p className="muted">
            Browse what Healthcare Central offers. Sign in to access provider and service data.
          </p>
        </div>

        <div className="cards service-grid">
          {services.map((service) => (
            <article className="card service-card locked-service" key={service.href}>
              <span className="icon">{service.icon}</span>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
              <Link className="text-link" href="/login">Sign in to access →</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container aware-about">
        <div>
          <p className="eyebrow">MEET AWARE MINDS AI</p>
          <h2>Start with your problem, not a complicated directory.</h2>
        </div>
        <div className="aware-about-copy">
          <p>
            After login, choose Doctor, Medicine, Caregiver, Lab Test, Ambulance or Hospital. Then describe what you need and select your location.
          </p>
          <p>
            Aware Minds is being designed to understand natural healthcare requests, including English, বাংলা and Banglish, and guide patients to relevant services without pretending to diagnose them.
          </p>
        </div>
      </section>

      <section className="container callout">
        <div>
          <p className="eyebrow">YOUR HEALTHCARE ACCOUNT</p>
          <h2>One login. Six connected services.</h2>
          <p>Create your account to access Healthcare Central and Aware Minds AI.</p>
        </div>
        <Link className="button" href="/register">Get started →</Link>
      </section>
    </>
  );
}
