"use client";
/**
 * /about/careers
 *
 * Recruiting page. The funnel: convey culture (parallax + pinned narrative)
 * then drop straight into a tilt-card grid of open roles. Static role list for
 * v7.0 — wire to Convex / Greenhouse / Lever when the talent stack lands.
 */
import { useState } from "react";
import { AboutPageShell } from "@/src/components/about/AboutPageShell";
import {
  ParallaxHero,
  PinnedTextBlock,
  StatStrip,
  TiltCard,
  RevealOnScroll,
} from "@/src/components/about/ParallaxPrimitives";
import { asset } from "@/src/lib/asset";

type Role = {
  title: string;
  team: "Café Operations" | "Roastery" | "Coffee Education" | "Technology" | "Brand & Marketing" | "Supply Chain";
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  level: "Entry" | "Mid" | "Senior" | "Lead";
};

const ROLES: Role[] = [
  { title: "Barista", team: "Café Operations", location: "Bengaluru · Multiple Locations", type: "Full-time", level: "Entry" },
  { title: "Café Manager", team: "Café Operations", location: "Mumbai · Bandra Flagship", type: "Full-time", level: "Mid" },
  { title: "Head Roaster", team: "Roastery", location: "Bengaluru · Whitefield Roastery", type: "Full-time", level: "Senior" },
  { title: "QC Cupper", team: "Roastery", location: "Bengaluru · Whitefield Roastery", type: "Full-time", level: "Mid" },
  { title: "Coffee Educator", team: "Coffee Education", location: "Delhi · Hauz Khas", type: "Full-time", level: "Mid" },
  { title: "Senior Frontend Engineer (Next.js)", team: "Technology", location: "Remote · India", type: "Full-time", level: "Senior" },
  { title: "Brand Storyteller", team: "Brand & Marketing", location: "Bengaluru · HQ", type: "Full-time", level: "Mid" },
  { title: "Origin & Trade Lead", team: "Supply Chain", location: "Chikmagalur · Field-based", type: "Full-time", level: "Lead" },
  { title: "Weekend Barista", team: "Café Operations", location: "Pune · Koregaon Park", type: "Part-time", level: "Entry" },
];

const TEAMS = ["All", "Café Operations", "Roastery", "Coffee Education", "Technology", "Brand & Marketing", "Supply Chain"] as const;
type TeamFilter = (typeof TEAMS)[number];

export default function CareersPage() {
  const [filter, setFilter] = useState<TeamFilter>("All");
  const visibleRoles = filter === "All" ? ROLES : ROLES.filter((r) => r.team === filter);

  return (
    <AboutPageShell active="careers">
      <ParallaxHero
        eyebrow="Careers"
        title={"Brew your career\nwith us."}
        tagline="We're hiring across cafés, roastery, technology, and origin teams. Whatever your craft, we want people who get excited about the unglamorous details."
        imageUrl={asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg")}
      />

      <PinnedTextBlock
        eyebrow="The Team"
        title={"450 people.\nOne shared standard."}
        paragraphs={[
          "From the barista pulling shots at 7 AM in Indiranagar to the QC cupper grading green beans in Whitefield, every person who works here is a coffee professional. Not 'staff'. Not 'crew'. Professionals.",
          "We invest in that distinction. Every new café hire goes through 3 weeks of paid coffee school before they ever touch a customer's order. Every roaster spends time at a partner estate during harvest. Every engineer can talk you through a roast curve.",
          "The result is a team that takes the work seriously without taking themselves seriously. We laugh a lot. We disagree productively. We never apologise for caring about details no one else notices.",
        ]}
        sideImages={[
          { url: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"), alt: "Barista at espresso bar" },
          { url: asset("assets/our-story.png"), alt: "Roastery floor" },
          { url: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-11.jpg"), alt: "Coffee school" },
        ]}
      />

      <StatStrip
        stats={[
          { value: "450+", label: "Teammates pan-India" },
          { value: "3 wks", label: "Paid coffee school" },
          { value: "₹0", label: "Cost of barista certification" },
          { value: "92%", label: "Promote-from-within rate" },
        ]}
      />

      <PinnedTextBlock
        reverse
        eyebrow="Benefits"
        title={"The basics, done properly."}
        paragraphs={[
          "Health cover for you and your immediate family, including parents. Standard for every full-time role — barista to senior engineer, same plan, same coverage.",
          "Two pounds of fresh beans every month, on the house. A 40 % discount in any of our cafés, any day of the week, for you and a guest. Sabbatical eligibility after 5 years.",
          "And the unglamorous one we're most proud of: we publish our salary bands internally. You'll always know what the next level pays before you ask for it.",
        ]}
        sideImages={[
          { url: asset("assets/WEBSITE ECB MM IMAGES 2026 2048x2048-07.jpg"), alt: "Team café" },
          { url: asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-26.jpg"), alt: "Team training" },
          { url: asset("assets/FR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-06.jpg"), alt: "Team brew demo" },
        ]}
      />

      {/* Roles list */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-24 sm:py-32">
        <RevealOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">
              Open Roles
            </span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">
              {visibleRoles.length} role{visibleRoles.length === 1 ? "" : "s"} open right now.
            </h2>
          </div>
        </RevealOnScroll>

        {/* Filter chips */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
          {TEAMS.map((t) => {
            const active = filter === t;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={[
                  "inline-flex items-center px-4 py-2 rounded-full text-sm font-bold transition-colors border",
                  active
                    ? "bg-natural-text text-natural-bg border-natural-text"
                    : "bg-transparent text-natural-text/75 border-natural-border hover:bg-natural-text/5 hover:text-natural-text",
                ].join(" ")}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {visibleRoles.map((r, i) => (
            <RevealOnScroll key={`${r.title}-${r.location}`} delay={i * 0.04}>
              <TiltCard
                intensity={5}
                className="bg-natural-paper rounded-2xl p-6 sm:p-7 h-full border border-natural-border hover:border-natural-accent/40 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent">
                    {r.team}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/40">
                    {r.level}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl text-natural-text leading-snug">
                  {r.title}
                </h3>
                <p className="mt-3 text-sm text-natural-text/65 leading-snug">{r.location}</p>
                <div className="mt-auto pt-5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-natural-text/55">
                    {r.type}
                  </span>
                  <a
                    href="mailto:careers@brewmatch.in?subject=Application"
                    className="text-sm font-bold text-natural-accent hover:text-natural-text transition-colors"
                  >
                    Apply →
                  </a>
                </div>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>

        {visibleRoles.length === 0 && (
          <p className="text-center text-natural-text/55 mt-12">
            No open roles in this team right now. Email us at{" "}
            <a className="underline" href="mailto:careers@brewmatch.in">
              careers@brewmatch.in
            </a>{" "}
            anyway — we keep good resumes on file.
          </p>
        )}
      </section>

      <RevealOnScroll>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-32 text-center">
          <p className="text-natural-text/55 text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] mb-6">
            Don't see your role?
          </p>
          <h2 className="font-serif font-bold text-2xl sm:text-4xl leading-[1.2] text-natural-text">
            We hire for craft, not titles.
          </h2>
          <p className="mt-6 text-natural-text/70 leading-relaxed">
            If you're great at what you do and our story resonates, write to us. The best people on our team rarely arrived through a job posting.
          </p>
          <a
            href="mailto:careers@brewmatch.in"
            className="inline-flex mt-8 items-center gap-2 px-6 py-3 rounded-full bg-natural-text text-natural-bg font-bold text-sm hover:bg-natural-accent transition-colors"
          >
            careers@brewmatch.in →
          </a>
        </section>
      </RevealOnScroll>
    </AboutPageShell>
  );
}
