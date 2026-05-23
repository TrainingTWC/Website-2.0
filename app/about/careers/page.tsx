"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AboutPageShell } from "@/src/components/about/AboutPageShell";
import { TiltCard, RevealOnScroll } from "@/src/components/about/ParallaxPrimitives";
import { CreativeHero, MarqueeStrip } from "@/src/components/about/AboutCreative";
import { asset } from "@/src/lib/asset";
import { ScormViewer } from "@/src/components/about/ScormViewer";
import { Heart, Brain, Palmtree, BookOpen, Coffee, Globe } from "lucide-react";

type TeamFilter =
  | "All"
  | "Cafe Operations"
  | "Roastery"
  | "Coffee Education"
  | "Technology"
  | "Brand & Marketing"
  | "Supply Chain";

const teams: TeamFilter[] = [
  "All",
  "Cafe Operations",
  "Roastery",
  "Coffee Education",
  "Technology",
  "Brand & Marketing",
  "Supply Chain",
];

const roles = [
  {
    title: "Barista",
    team: "Cafe Operations" as TeamFilter,
    location: "Bengaluru · Multiple Locations",
    salary: "Rs 3.6–4.5L",
    experience: "0–2 yrs",
    posted: "2 days ago",
  },
  {
    title: "Cafe Manager",
    team: "Cafe Operations" as TeamFilter,
    location: "Mumbai · Bandra Flagship",
    salary: "Rs 8–11L",
    experience: "3–5 yrs",
    posted: "5 days ago",
  },
  {
    title: "Head Roaster",
    team: "Roastery" as TeamFilter,
    location: "Bengaluru · Whitefield",
    salary: "Rs 20–28L",
    experience: "7+ yrs",
    posted: "8 days ago",
  },
  {
    title: "Coffee Educator",
    team: "Coffee Education" as TeamFilter,
    location: "Delhi · Hauz Khas",
    salary: "Rs 8–12L",
    experience: "3–5 yrs",
    posted: "3 days ago",
  },
  {
    title: "Senior Frontend Engineer",
    team: "Technology" as TeamFilter,
    location: "Remote · India",
    salary: "Rs 32–42L",
    experience: "5+ yrs",
    posted: "6 days ago",
  },
  {
    title: "Origin & Trade Lead",
    team: "Supply Chain" as TeamFilter,
    location: "Chikmagalur · Field",
    salary: "Rs 22–32L",
    experience: "8+ yrs",
    posted: "12 days ago",
  },
] as const;

const stories = [
  {
    name: "Meera D’Souza",
    role: "Regional Trainer",
    image: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-14.jpg"),
    from: "Barista, 2022",
    to: "Trains 80 people, 2026",
    quote: "I joined thinking coffee was a job. Three years later I train 80 people.",
  },
  {
    name: "Aarav Menon",
    role: "Head of Roasting",
    image: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"),
    from: "Apprentice, 2021",
    to: "Runs Mumbai roastery, 2025",
    quote: "I was hired to clean machines. Now I own the roast profile.",
  },
  {
    name: "Kabir Sethi",
    role: "Senior Engineer",
    image: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"),
    from: "Intern, 2023",
    to: "Senior Engineer, 2025",
    quote: "Three weeks on the cafe floor taught me more about UX than any course.",
  },
];

const gridMoments = [
  {
    src: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"),
    label: "Barista training · Indiranagar",
    span: "col-span-2 row-span-2",
  },
  {
    src: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-11.jpg"),
    label: "Coffee School, Cohort 18",
    span: "",
  },
  {
    src: asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-25.jpg"),
    label: "Estate visit · Coorg",
    span: "",
  },
  {
    src: asset("assets/FR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-06.jpg"),
    label: "Morning roastery shift",
    span: "",
  },
  {
    src: asset("assets/SSIFB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-17.jpg"),
    label: "Quarterly team lunch",
    span: "",
  },
  {
    src: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"),
    label: "Competition prep · Delhi",
    span: "col-span-2",
  },
];

const benefitTiles = [
  { Icon: Heart, title: "Health cover", detail: "You + family. Same plan, barista to exec.", color: "bg-rose-50 border-rose-200", iconColor: "text-rose-500" },
  { Icon: Brain, title: "Mental health", detail: "Confidential sessions. No manager approval.", color: "bg-violet-50 border-violet-200", iconColor: "text-violet-500" },
  { Icon: Palmtree, title: "30 real days off", detail: "No fake unlimited. Actual 30 days.", color: "bg-sky-50 border-sky-200", iconColor: "text-sky-500" },
  { Icon: BookOpen, title: "Rs 50k/year to learn", detail: "Courses, books, certs, conferences.", color: "bg-amber-50 border-amber-200", iconColor: "text-amber-600" },
  { Icon: Coffee, title: "Free beans forever", detail: "Two bags a month + cafe meals on shift.", color: "bg-orange-50 border-orange-200", iconColor: "text-orange-500" },
  { Icon: Globe, title: "Sabbatical", detail: "Eligible every 5 years. Paid time to think.", color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-500" },
];

export default function CareersPage() {
  const [filter, setFilter] = useState<TeamFilter>("All");
  const visibleRoles =
    filter === "All" ? roles : roles.filter((r) => r.team === filter);

  return (
    <AboutPageShell active="careers">
      <>
        <CreativeHero
          eyebrow="Careers"
          title="Make great coffee. Get paid."
          tagline="Real craft. Real growth. The best coffee education in the country — built into the job, from day one."
          imageUrl={asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg")}
          accentWord="great coffee"
          stickerText="WE'RE HIRING"
          decorations={[
            { glyph: "sparkle", top: "10%", right: "12%", size: 32, color: "var(--about-accent)", rotate: 16, drift: 14, duration: 6 },
            { glyph: "star", top: "20%", left: "6%", size: 28, color: "var(--about-accent)", rotate: -10, drift: 12, duration: 5, delay: 0.3 },
            { glyph: "flower", top: "52%", left: "3%", size: 42, color: "var(--about-accent)", rotate: 8, drift: 10, duration: 7, delay: 0.5 },
            { glyph: "bubble", top: "38%", right: "6%", size: 34, color: "var(--about-accent)", rotate: 0, drift: 13, duration: 8, delay: 0.4 },
            { glyph: "squiggle", bottom: "22%", left: "20%", size: 92, color: "var(--about-accent)", rotate: -4, drift: 6, duration: 6, delay: 0.2 },
            { glyph: "planet", bottom: "10%", right: "8%", size: 52, color: "var(--about-accent)", rotate: 12, drift: 9, duration: 8, delay: 0.6 },
          ]}
        />
        <MarqueeStrip
          items={["NO EXPERIENCE NEEDED", "DAY 1 PAID TRAINING", "FREE BEANS FOREVER", "GROW FAST", "130+ CAFES", "JOIN THE TEAM"]}
          variant="accent"
        />
      </>

      {/* STAT SLAM */}
      <section className="bg-natural-text text-natural-bg py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-14">
            {([
              ["Rs 3.6L+", "starting pay"],
              ["Day 1", "training on salary"],
              ["3 weeks", "paid coffee school"],
              ["130+", "cafes to grow into"],
            ] as const).map(([num, label], i) => (
              <RevealOnScroll key={label} delay={i * 0.06}>
                <div className="font-serif font-bold text-5xl sm:text-6xl xl:text-7xl leading-none">
                  {num}
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-[0.35em] opacity-55">
                  {label}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO IMMERSION GRID */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 auto-rows-[28vw] md:auto-rows-[22vw] gap-1"
        aria-label="Life at Third Wave Coffee"
      >
        {gridMoments.map(({ src, label, span }, i) => (
          <RevealOnScroll key={label} delay={i * 0.04} className={span}>
            <figure className="relative h-full overflow-hidden group">
              <img
                src={src}
                alt={label}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <figcaption className="absolute bottom-4 left-4 right-4 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/90">
                {label}
              </figcaption>
            </figure>
          </RevealOnScroll>
        ))}
      </section>

      {/* OPEN ROLES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-16 sm:py-24">
        <RevealOnScroll>
          <h2 className="font-serif font-bold text-4xl sm:text-6xl leading-[1.05] mb-2">
            {visibleRoles.length} role{visibleRoles.length === 1 ? "" : "s"} open.
          </h2>
          <p className="text-natural-text/55 mb-8">Salary bands shown. Always.</p>
        </RevealOnScroll>

        <div className="flex flex-wrap gap-2 mb-8">
          {teams.map((team) => (
            <button
              key={team}
              onClick={() => setFilter(team)}
              className={[
                "inline-flex min-h-10 items-center px-4 py-2 rounded-full text-xs font-bold transition-all border",
                filter === team
                  ? "bg-natural-text text-natural-bg border-natural-text scale-[1.03]"
                  : "bg-transparent text-natural-text/65 border-natural-border hover:border-natural-text/30",
              ].join(" ")}
            >
              {team}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRoles.map((role, i) => (
            <RevealOnScroll key={role.title + role.location} delay={i * 0.04}>
              <TiltCard
                intensity={4}
                className="group about-page-panel rounded-2xl overflow-hidden border hover:border-about-accent transition-all h-full shadow-about-soft flex flex-col"
              >
                <div className="h-1.5 bg-[color:var(--about-accent)]" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-natural-accent leading-relaxed">
                      {role.team}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-natural-text/35 shrink-0">
                      {role.posted}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-2xl leading-snug">{role.title}</h3>
                  <p className="mt-1.5 text-sm text-natural-text/55">{role.location}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="font-bold text-lg">{role.salary}</span>
                    <span className="text-xs text-natural-text/45">{role.experience}</span>
                  </div>
                  <a
                    href={`mailto:careers@brewmatch.in?subject=Application: ${encodeURIComponent(role.title)}`}
                    className="mt-auto pt-5 inline-flex items-center gap-2 bg-natural-text text-natural-bg rounded-full px-5 py-2.5 text-sm font-bold w-fit hover:opacity-80 transition-opacity"
                  >
                    Apply in 10 min →
                  </a>
                </div>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* GROWTH STORIES */}
      <section className="bg-about-tint py-16 sm:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 mb-10">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">
              Real growth
            </span>
            <h2 className="font-serif font-bold text-4xl sm:text-6xl mt-3 leading-[1.05]">
              Barista to boss.<br />It actually happens here.
            </h2>
          </RevealOnScroll>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pl-4 sm:pl-6 md:pl-12 pr-4">
          {stories.map((s, i) => (
            <RevealOnScroll
              key={s.name}
              delay={i * 0.07}
              className="min-w-[76vw] sm:min-w-[360px] snap-start shrink-0"
            >
              <article className="relative rounded-2xl overflow-hidden h-[520px] sm:h-[580px]">
                <img
                  src={s.image}
                  alt={s.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="inline-block bg-white/15 backdrop-blur-sm text-white/70 text-[9px] font-bold uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border border-white/20">
                      {s.from}
                    </span>
                    <span className="inline-block bg-[color:var(--about-accent)] text-[color:var(--about-accent-ink)] text-[9px] font-bold uppercase tracking-[0.3em] px-3 py-1.5 rounded-full">
                      {s.to}
                    </span>
                  </div>
                  <blockquote className="font-serif italic text-xl sm:text-2xl text-white leading-snug">
                    “{s.quote}”
                  </blockquote>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-white/60">
                    {s.name} · {s.role}
                  </p>
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* COFFEE SCHOOL */}
      <section className="relative overflow-hidden" style={{ background: "var(--about-accent)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <RevealOnScroll>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.45em] opacity-70"
                style={{ color: "var(--about-accent-ink)" }}
              >
                Before day one
              </p>
              <h2
                className="font-serif font-bold text-7xl sm:text-9xl leading-[0.88] mt-4"
                style={{ color: "var(--about-accent-ink)" }}
              >
                3 paid<br />weeks.
              </h2>
              <p
                className="mt-6 text-lg opacity-75 max-w-sm leading-relaxed"
                style={{ color: "var(--about-accent-ink)" }}
              >
                Origins. Roasting. Extraction. Service. You get paid the whole time. Rs 0 cost to you.
              </p>
            </RevealOnScroll>
            <div className="grid grid-cols-1 gap-3">
              {([
                ["01", "Origins & farm", "Where beans come from, why it matters, how to talk about it."],
                ["02", "Roast & grind", "Heat curves, extraction, what makes espresso go wrong."],
                ["03", "Service & team", "Hospitality as a skill, not a personality type."],
              ] as const).map(([n, title, desc], i) => (
                <RevealOnScroll key={n} delay={i * 0.06}>
                  <div
                    className="rounded-xl p-5 border"
                    style={{
                      background: "color-mix(in srgb, var(--about-accent-ink) 8%, transparent)",
                      borderColor: "color-mix(in srgb, var(--about-accent-ink) 20%, transparent)",
                    }}
                  >
                    <span
                      className="font-serif font-bold text-3xl opacity-30"
                      style={{ color: "var(--about-accent-ink)" }}
                    >
                      {n}
                    </span>
                    <p
                      className="font-bold text-lg mt-1"
                      style={{ color: "var(--about-accent-ink)" }}
                    >
                      {title}
                    </p>
                    <p
                      className="text-sm mt-1 opacity-65 leading-relaxed"
                      style={{ color: "var(--about-accent-ink)" }}
                    >
                      {desc}
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg"),
            asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-22.jpg"),
            asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-30.jpg"),
          ].map((src, i) => (
            <div key={i} className="aspect-[4/3] overflow-hidden">
              <img
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-16 sm:py-24">
        <RevealOnScroll>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">
            What you actually get
          </span>
          <h2 className="font-serif font-bold text-4xl sm:text-6xl mt-3 mb-10 leading-[1.05]">
            The benefits are real.
          </h2>
        </RevealOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {benefitTiles.map(({ Icon, title, detail, color, iconColor }, i) => (
            <RevealOnScroll key={title} delay={i * 0.04}>
              <TiltCard intensity={5} className={`rounded-2xl border p-6 h-full ${color} shadow-about-soft`}>
                <div className={`mb-4 ${iconColor}`} aria-hidden>
                  <Icon className="w-9 h-9" strokeWidth={1.75} />
                </div>
                <h3 className="font-serif font-bold text-xl leading-snug">{title}</h3>
                <p className="mt-2 text-sm text-natural-text/65 leading-relaxed">{detail}</p>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* ORIENTATION MODULE */}
      <section className="bg-about-tint py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">
              Before you apply
            </span>
            <h2 className="font-serif font-bold text-4xl sm:text-5xl mt-3 mb-4 leading-[1.05]">
              Know what you&apos;re walking into.
            </h2>
            <p className="text-natural-text/60 max-w-xl mb-10 leading-relaxed">
              We made a 20-min orientation anyone can take — no account, no email, no catch.
              Curious? Take it. Ready to apply? Take it first.
            </p>
          </RevealOnScroll>
          <RevealOnScroll>
            <ScormViewer
              launchFile="story.html"
              durationLabel="~20 min"
              title="Company Orientation"
              description="Our sourcing philosophy, cafe standards, feedback culture, training programme, and what a genuinely good cup costs to make."
            />
          </RevealOnScroll>
        </div>
      </section>

      {/* APPLY CTA */}
      <section className="bg-natural-text text-natural-bg py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <RevealOnScroll>
            <p className="text-xs font-bold uppercase tracking-[0.45em] opacity-50 mb-6">Ready?</p>
            <h2 className="font-serif font-bold text-5xl sm:text-7xl xl:text-8xl leading-[0.92]">
              Apply in<br />10 minutes.
            </h2>
            <p className="mt-6 text-base opacity-55 max-w-sm mx-auto leading-relaxed">
              No cover letter. No coffee degree needed. Tell us who you are.
            </p>
            <a
              href="mailto:careers@brewmatch.in"
              className="mt-10 inline-flex items-center gap-3 bg-[color:var(--about-accent)] text-[color:var(--about-accent-ink)] px-10 py-5 rounded-full font-bold text-lg hover:opacity-85 transition-opacity"
            >
              Send your application →
            </a>
            <p className="mt-6 text-xs opacity-35">
              We respond to everyone within 7 business days.
            </p>
          </RevealOnScroll>
        </div>
      </section>
    </AboutPageShell>
  );
}
