import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import styles from "./service.module.css";

type ServiceKey =
  | "doctor"
  | "medicine"
  | "hospital"
  | "lab-test"
  | "caregiver"
  | "ambulance";

const servicePath: Record<ServiceKey, string> = {
  doctor: "/doctors",
  medicine: "/medicines",
  hospital: "/hospitals",
  "lab-test": "/lab-tests",
  caregiver: "/caregivers",
  ambulance: "/patient",
};

const serviceContent: Record<
  ServiceKey,
  {
    name: string;
    intro: string;
    promise: string;
    points: string[];
    steps: string[];
    note?: string;
  }
> = {
  doctor: {
    name: "Doctor",
    intro:
      "Finding a doctor should not feel like searching through a long, confusing directory.",
    promise:
      "Healthcare Central helps you narrow the search using the kind of care you need and the location you choose.",
    points: [
      "Search doctors by specialty, name or the kind of problem you are looking for help with.",
      "Use a location filter to focus on options that are more relevant to you.",
      "Open a doctor profile to review the information available in Healthcare Central.",
    ],
    steps: [
      "Sign in to your Healthcare Central account.",
      "Choose Doctor and describe what you are looking for.",
      "Select a location and review the matching options.",
    ],
  },
  medicine: {
    name: "Medicine",
    intro:
      "Medicine prices and availability can differ from one online pharmacy to another.",
    promise:
      "Healthcare Central gives you one place to search a medicine and continue to several pharmacy websites instead of checking them one by one.",
    points: [
      "Search by medicine name or strength.",
      "See several supported online pharmacy options together.",
      "Continue to the original seller website to check the current price, pack size and availability before buying.",
    ],
    steps: [
      "Sign in and open Medicine.",
      "Enter the medicine name and strength.",
      "Compare the available seller options and continue to the seller you prefer.",
    ],
    note:
      "Healthcare Central does not sell medicine and does not replace a pharmacist or doctor. Always confirm the exact medicine and strength before purchasing.",
  },
  hospital: {
    name: "Hospital",
    intro:
      "When you already know the type of care you need, the next question is often where to go.",
    promise:
      "Healthcare Central helps you look through hospital information in a simpler, location-focused way.",
    points: [
      "Search hospitals by name, department or location.",
      "Review the contact and department information available in the directory.",
      "Use your chosen location to reduce unrelated results.",
    ],
    steps: [
      "Sign in and choose Hospital.",
      "Search for a hospital, department or service.",
      "Use the location filter and open the option that fits your need.",
    ],
  },
  "lab-test": {
    name: "Lab Test",
    intro:
      "A lab test search should help you understand where a test is available without making the process harder.",
    promise:
      "Healthcare Central brings laboratory and diagnostic test listings into one searchable place.",
    points: [
      "Search for a test by name.",
      "Review listed laboratories, locations and prices when those details are available.",
      "Use location filtering to focus your search.",
    ],
    steps: [
      "Sign in and open Lab Test.",
      "Enter the name of the test you are looking for.",
      "Review matching listings and their available details.",
    ],
  },
  caregiver: {
    name: "Caregiver",
    intro:
      "Care at home is personal, so the search needs to be clear and easy to understand.",
    promise:
      "Healthcare Central helps you explore caregiver and nursing-support listings from one place.",
    points: [
      "Search caregiver profiles and the services they offer.",
      "Review experience, location and listed fees when available.",
      "Use location filtering to make the results more relevant.",
    ],
    steps: [
      "Sign in and choose Caregiver.",
      "Describe the kind of support you need.",
      "Review the matching caregiver listings.",
    ],
  },
  ambulance: {
    name: "Ambulance",
    intro:
      "In an urgent situation, ambulance information should be easy to reach.",
    promise:
      "Healthcare Central keeps emergency access separate from the normal signed-in service flow so urgent contacts remain available without an account.",
    points: [
      "Open Emergency Help without signing in.",
      "Choose your area to see listed ambulance contacts.",
      "Signed-in users can also reach ambulance search from the Healthcare Central Assistant.",
    ],
    steps: [
      "For urgent help, open the public Emergency page immediately.",
      "Choose your location.",
      "Use the listed contact information or the national emergency options shown there.",
    ],
    note:
      "Do not wait for a website search if someone may be in immediate danger. Use the emergency options shown on the Emergency page.",
  },
};

function isService(value: string): value is ServiceKey {
  return value in serviceContent;
}

export default async function ServiceDetails({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  if (!isService(service)) notFound();

  const user = await currentUser();
  const item = serviceContent[service];
  const emergency = service === "ambulance";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <Link className={styles.back} href="/#services">
          ← Back to services
        </Link>

        <p className={styles.label}>Healthcare Central service</p>
        <h1>{item.name}</h1>
        <p className={styles.intro}>{item.intro}</p>
        <p className={styles.promise}>{item.promise}</p>

        <div className={styles.actions}>
          {emergency && (
            <Link className={styles.emergencyButton} href="/emergency">
              Emergency Help
            </Link>
          )}

          <Link
            className={styles.primaryButton}
            href={user ? servicePath[service] : "/login"}
          >
            {user ? "Open service" : "Log in to access"}
          </Link>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.block}>
          <p className={styles.blockLabel}>What we offer</p>
          <h2>A simpler way to start</h2>

          <div className={styles.pointGrid}>
            {item.points.map((point, index) => (
              <article key={point}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{point}</p>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.block}>
          <p className={styles.blockLabel}>How it works</p>
          <h2>Three straightforward steps</h2>

          <div className={styles.steps}>
            {item.steps.map((step, index) => (
              <div key={step}>
                <strong>{index + 1}</strong>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {item.note && <p className={styles.note}>{item.note}</p>}

        {!user && (
          <div className={styles.loginPanel}>
            <div>
              <span>Ready to use {item.name}?</span>
              <h2>Sign in when you want to continue.</h2>
            </div>
            <Link href="/login">Log in</Link>
          </div>
        )}
      </section>
    </div>
  );
}
