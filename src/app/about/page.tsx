import Link from "next/link";
import { getLanguage } from "@/lib/language";
import styles from "./about.module.css";

export default async function AboutPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const language = await getLanguage(searchParams);
  const bn = language === "bn";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>
            {bn ? "আমাদের সম্পর্কে" : "About Healthcare Central"}
          </p>

          <h1>
            {bn
              ? "স্বাস্থ্যসেবা প্রতিবার নতুন করে শুরু হওয়া উচিত নয়।"
              : "Healthcare should not feel like starting over every time."}
          </h1>

          <p className={styles.lead}>
            {bn
              ? "Healthcare Central শুরু হয়েছে বাংলাদেশের স্বাস্থ্যসেবা ব্যবস্থার খুব সাধারণ, কিন্তু বারবার ফিরে আসা কিছু সমস্যার অভিজ্ঞতা থেকে—ছড়িয়ে থাকা স্বাস্থ্যতথ্য, একই পরীক্ষা বারবার করা, এবং নিজের উপসর্গ অনুযায়ী কোথা থেকে শুরু করতে হবে তা না জানা।"
              : "Healthcare Central began from a very personal frustration with problems that are common across healthcare in Bangladesh: scattered health information, repeated tests, and not knowing where to begin when symptoms appear."}
          </p>
        </div>
      </section>

      <section className={styles.storySection}>
        <div className={styles.storyIntro}>
          <p className={styles.sectionLabel}>{bn ? "কেন শুরু করেছি" : "Why I started it"}</p>
          <h2>{bn ? "সমস্যাগুলো আলাদা ছিল না—একটার সাথে আরেকটা জড়িত ছিল।" : "The problems were not separate. They kept connecting to each other."}</h2>
        </div>

        <div className={styles.storyGrid}>
          <article className={styles.storyCard}>
            <span>01</span>
            <h3>{bn ? "নিজের স্বাস্থ্যতথ্যও নিজের কাছে থাকে না" : "My health information never felt connected"}</h3>
            <p>
              {bn
                ? "ডাক্তার বদলালেই মনে হতো পুরো চিকিৎসার গল্প আবার শুরু থেকে বলতে হচ্ছে। পুরোনো রিপোর্ট, পরীক্ষা, প্রেসক্রিপশন—সবকিছু এক জায়গায়, হালনাগাদভাবে পাওয়া যায় না। একজন নতুন ডাক্তারকে দেখাতে গেলে আগের চিকিৎসার ধারাবাহিকতা সহজে বোঝানো কঠিন হয়ে যায়।"
                : "Changing doctors often meant rebuilding the same medical story from the beginning. Reports, prescriptions and past tests were scattered, so a new doctor did not automatically have a clear, up-to-date picture of what had already happened."}
            </p>
          </article>

          <article className={styles.storyCard}>
            <span>02</span>
            <h3>{bn ? "একই পরীক্ষা বারবার" : "The same tests, again and again"}</h3>
            <p>
              {bn
                ? "আগের পরীক্ষার তথ্য সহজে ব্যবহারযোগ্য না থাকলে নতুন জায়গায় গিয়ে একই পরীক্ষা আবার করতে হতে পারে। এতে শুধু খরচ বাড়ে না—সময় নষ্ট হয়, রোগীর ঝামেলাও বাড়ে। তখন আমার প্রশ্ন ছিল: কেন রোগীর স্বাস্থ্যতথ্য তার চিকিৎসার সাথে ধারাবাহিকভাবে চলতে পারে না?"
                : "When previous results are difficult to access or share, the same tests may be ordered again. That can mean more cost, more waiting and more stress. I kept asking myself: why can’t a patient’s health information move with them through their care?"}
            </p>
          </article>

          <article className={styles.storyCard}>
            <span>03</span>
            <h3>{bn ? "কোন ডাক্তার দেখাব, সেটাই বুঝতাম না" : "I did not always know which doctor to look for"}</h3>
            <p>
              {bn
                ? "উপসর্গ জানা আর কোন বিশেষজ্ঞের কাছে যেতে হবে জানা এক জিনিস নয়। মাথাব্যথা, পায়ের ব্যথা, বুকের অস্বস্তি বা অন্য কোনো সমস্যা—সাধারণ মানুষ সবসময় জানে না কোন বিভাগ বা বিশেষজ্ঞ দিয়ে শুরু করা উচিত। ভুল জায়গা থেকে শুরু করলে সময় ও অর্থ দুটোই নষ্ট হতে পারে।"
                : "Knowing your symptoms is not the same as knowing the right specialty. A headache, leg pain, chest discomfort or another problem does not automatically tell an ordinary person which department or specialist should be the first step."}
            </p>
          </article>

          <article className={styles.storyCard}>
            <span>04</span>
            <h3>{bn ? "স্বাস্থ্য সম্পর্কে তথ্যের ঘাটতি" : "Too many people are left without clear health information"}</h3>
            <p>
              {bn
                ? "বাংলাদেশে অনেক মানুষ নিজের শরীর, নিয়মিত পরীক্ষা, রিপোর্ট, জরুরি লক্ষণ বা কোন সেবাটি কখন প্রয়োজন—এসব সম্পর্কে খুব সীমিত তথ্য নিয়ে সিদ্ধান্ত নেয়। তথ্য আছে, কিন্তু তা সবসময় সহজ, এক জায়গায় বা ব্যবহারযোগ্যভাবে পাওয়া যায় না।"
                : "Many people in Bangladesh make health decisions with very little accessible information about their own body, routine tests, reports, warning signs, or which service they may need. Information exists, but it is often fragmented, difficult to navigate, or hard to understand."}
            </p>
          </article>
        </div>
      </section>

      <section className={styles.purposeSection}>
        <div className={styles.purposeCopy}>
          <p className={styles.sectionLabel}>{bn ? "Healthcare Central-এর উদ্দেশ্য" : "What Healthcare Central is trying to change"}</p>
          <h2>
            {bn
              ? "একটি জায়গা, যেখান থেকে মানুষ নিজের স্বাস্থ্যসেবা বুঝে শুরু করতে পারে।"
              : "One place where people can understand what they need and take the next step with less confusion."}
          </h2>
          <p>
            {bn
              ? "Healthcare Central-এর লক্ষ্য ডাক্তার, হাসপাতাল, ওষুধ, ল্যাব টেস্ট, কেয়ারগিভার, অ্যাম্বুলেন্স ও রোগীর নিজের স্বাস্থ্যতথ্যের মতো বিচ্ছিন্ন অংশগুলোকে ধীরে ধীরে একটি পরিষ্কার অভিজ্ঞতায় যুক্ত করা। এটি ডাক্তারকে প্রতিস্থাপন করার জন্য নয়; বরং রোগীকে সঠিক সেবা খুঁজে পেতে, নিজের তথ্য সংগঠিত রাখতে এবং স্বাস্থ্য নিয়ে আরও সচেতন হতে সাহায্য করার জন্য।"
              : "Healthcare Central is being built to bring fragmented parts of the healthcare journey—doctors, hospitals, medicines, lab tests, caregivers, ambulances and a patient’s own health information—into a clearer experience. It is not meant to replace medical professionals. It is meant to help people find the right service, keep their information better organised, and understand their health more confidently."}
          </p>
        </div>

        <div className={styles.principles}>
          <div>
            <strong>{bn ? "কম বিভ্রান্তি" : "Less confusion"}</strong>
            <span>{bn ? "কোথা থেকে শুরু করবেন তা সহজে বুঝতে সাহায্য করা।" : "Make the first step in care easier to understand."}</span>
          </div>
          <div>
            <strong>{bn ? "আরও ধারাবাহিক তথ্য" : "More continuity"}</strong>
            <span>{bn ? "স্বাস্থ্যতথ্য যেন প্রতিবার নতুন করে শুরু না হয়।" : "Help health information stay useful across the care journey."}</span>
          </div>
          <div>
            <strong>{bn ? "আরও সচেতন রোগী" : "Better informed patients"}</strong>
            <span>{bn ? "নিজের শরীর ও স্বাস্থ্যসেবা সম্পর্কে জানার সুযোগ বাড়ানো।" : "Give people a clearer way to learn about their body and healthcare options."}</span>
          </div>
        </div>
      </section>

      <section className={styles.founderSection}>
        <div className={styles.quoteCard}>
          <p className={styles.quoteMark}>“</p>
          <blockquote>
            {bn
              ? "Healthcare Central শুরু করেছি কারণ আমি বারবার দেখেছি—ডাক্তার বদলালেই যেন রোগীর গল্প আবার শূন্য থেকে শুরু হয়। একই পরীক্ষা, ছড়িয়ে থাকা তথ্য, আর কোন ডাক্তার দেখাব সেটাও বুঝতে না পারা—এই অভিজ্ঞতাগুলো স্বাস্থ্যসেবাকে প্রয়োজনের চেয়ে অনেক বেশি কঠিন করে তোলে। আমি এমন একটি ব্যবস্থা তৈরি করতে চাই যেখানে মানুষ নিজের স্বাস্থ্য সম্পর্কে আরও জানবে, নিজের তথ্যের ওপর আরও নিয়ন্ত্রণ রাখবে এবং সঠিক সেবায় পৌঁছাতে কম বিভ্রান্ত হবে।"
              : "I started Healthcare Central because I kept seeing the same pattern: changing doctors could make a patient’s story feel like it had to start from zero again. Repeated tests, scattered information, and not knowing which doctor to see made healthcare harder than it needed to be. I want to build a system where people understand more about their health, keep better control of their information, and reach the right care with less confusion."}
          </blockquote>

          <div className={styles.founderIdentity}>
            <div className={styles.founderInitials}>NNZ</div>
            <div>
              <strong>Nusaiba Nusrat Zaman</strong>
              <span>{bn ? "প্রতিষ্ঠাতা ও ফুল-স্ট্যাক ডেভেলপার" : "Founder & Full-Stack Developer"}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div>
          <p className={styles.sectionLabel}>{bn ? "শুরু করুন" : "Start here"}</p>
          <h2>{bn ? "আপনার প্রয়োজনীয় স্বাস্থ্যসেবা খুঁজুন।" : "Find the healthcare service you need."}</h2>
        </div>
        <div className={styles.ctaActions}>
          <Link className={styles.primary} href="/#services">
            {bn ? "সেবাগুলো দেখুন" : "Explore services"}
          </Link>
          <Link className={styles.secondary} href="/patient">
            {bn ? "ড্যাশবোর্ড" : "Open dashboard"}
          </Link>
        </div>
      </section>
    </div>
  );
}
