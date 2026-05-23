"use client";

import { useState } from "react";
import { AboutPageShell } from "@/src/components/about/AboutPageShell";
import {
  ParallaxHero,
  StatStrip,
  TiltCard,
  RevealOnScroll,
} from "@/src/components/about/ParallaxPrimitives";
import { CreativeHero, MarqueeStrip, StarDivider } from "@/src/components/about/AboutCreative";
import { asset } from "@/src/lib/asset";

type Role = {
  title: string;
  team: "Cafe Operations" | "Roastery" | "Coffee Education" | "Technology" | "Brand & Marketing" | "Supply Chain";
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  level: "Entry" | "Mid" | "Senior" | "Lead";
  salary: string;
  experience: string;
  posted: string;
};

const roles: Role[] = [
  { title: "Barista", team: "Cafe Operations", location: "Bengaluru · Multiple Locations", type: "Full-time", level: "Entry", salary: "Rs 3.2-4.2L LPA", experience: "0-2 yrs", posted: "2 days ago" },
  { title: "Cafe Manager", team: "Cafe Operations", location: "Mumbai · Bandra Flagship", type: "Full-time", level: "Mid", salary: "Rs 7-10L LPA", experience: "3-5 yrs", posted: "5 days ago" },
  { title: "Head Roaster", team: "Roastery", location: "Bengaluru · Whitefield", type: "Full-time", level: "Senior", salary: "Rs 18-25L LPA", experience: "7+ yrs", posted: "8 days ago" },
  { title: "QC Cupper", team: "Roastery", location: "Bengaluru · Whitefield", type: "Full-time", level: "Mid", salary: "Rs 8-12L LPA", experience: "3+ yrs", posted: "11 days ago" },
  { title: "Coffee Educator", team: "Coffee Education", location: "Delhi · Hauz Khas", type: "Full-time", level: "Mid", salary: "Rs 7-11L LPA", experience: "3-5 yrs", posted: "3 days ago" },
  { title: "Senior Frontend Engineer", team: "Technology", location: "Remote · India", type: "Full-time", level: "Senior", salary: "Rs 28-38L LPA", experience: "5+ yrs", posted: "6 days ago" },
  { title: "Brand Storyteller", team: "Brand & Marketing", location: "Bengaluru · HQ", type: "Full-time", level: "Mid", salary: "Rs 10-16L LPA", experience: "3+ yrs", posted: "4 days ago" },
  { title: "Origin & Trade Lead", team: "Supply Chain", location: "Chikmagalur · Field", type: "Full-time", level: "Lead", salary: "Rs 20-30L LPA", experience: "8+ yrs", posted: "12 days ago" },
  { title: "Weekend Barista", team: "Cafe Operations", location: "Pune · Koregaon Park", type: "Part-time", level: "Entry", salary: "Rs 450/hr", experience: "0-1 yr", posted: "1 day ago" },
];

const teams = ["All", "Cafe Operations", "Roastery", "Coffee Education", "Technology", "Brand & Marketing", "Supply Chain"] as const;
type TeamFilter = (typeof teams)[number];

const photos = [
  [asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"), "Barista training, Indiranagar · Jan 2026", "md:col-span-2"],
  [asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-11.jpg"), "Coffee School cohort 18", ""],
  [asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-25.jpg"), "Estate visit, Coorg", ""],
  [asset("assets/our-story.png"), "Quarterly lunch: engineers + cafe team", "md:col-span-2"],
  [asset("assets/FR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-06.jpg"), "Roastery morning shift", ""],
] as const;

const stories = [
  {
    name: "Meera D'Souza",
    role: "Regional Trainer, South India",
    image: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-14.jpg"),
    timeline: ["Barista · Mar 2022", "Senior Barista · Oct 2022", "Cafe Lead · Jul 2023", "Regional Trainer · Mar 2025"],
    quote: "I joined thinking coffee was a job. Three years later I train 80 people and still remember the first latte I absolutely ruined.",
    story: "Meera started in Indiranagar with no coffee background and a lot of nerves. Her first month was mostly milk texture, cleaning routines, and learning to handle rush-hour feedback without taking it personally. Now she runs trainer calibration across South India.",
  },
  {
    name: "Kabir Sethi",
    role: "Senior Frontend Engineer",
    image: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"),
    timeline: ["Product intern · Jun 2023", "Engineer · Jan 2024", "Senior Engineer · Aug 2025"],
    quote: "Three weeks shadowing baristas taught me more about user empathy than any product course online.",
    story: "Kabir joined to fix menu performance and ended up rebuilding parts of the ordering flow after working cafe shifts. He still pairs with baristas before shipping customer-facing features because edge cases show up at the counter first.",
  },
  {
    name: "Aarav Menon",
    role: "Head of Roasting, Mumbai",
    image: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"),
    timeline: ["Roastery apprentice · 2021", "Assistant roaster · 2022", "Profile lead · 2024", "Head of Roasting · 2025"],
    quote: "I was hired to clean machines. Now I own the Mumbai roast profile. The jump was not luck. It was feedback, every week.",
    story: "Aarav's first job was cleaning chaff trays and logging roast defects. Four years later he leads a new roastery setup because he understands the machine, the cup, and the people who drink the cup.",
  },
] as const;

const benefits = [
  ["You & family", "Health cover including parents", "Same plan from barista to executive."],
  ["You & family", "Mental health support", "Confidential sessions, no manager approval."],
  ["Time", "30 days paid leave", "No fake unlimited leave theatre."],
  ["Time", "Paid sabbatical", "Eligible every 5 years."],
  ["Learning", "Rs 50k annual budget", "Courses, books, certifications, conferences."],
  ["Learning", "Free beans for life", "Two fresh bags a month, plus cafe meals."],
] as const;

const faqs = [
  ["I do not have coffee experience. Can I apply?", "Yes. Entry cafe roles are designed for curious beginners. We train for coffee; we hire for hospitality."],
  ["Is the trial shift paid?", "Yes. Cafe trials and corporate work samples are paid. Free labour is not a culture test."],
  ["Are remote roles available?", "Mostly Technology and a few Brand roles. Cafe, Roastery, and Supply Chain roles are location-based."],
  ["Do you respond to rejected applicants?", "Yes. Every applicant gets a response within 7 business days, even when it is a no."],
  ["What if there is no role for me today?", "Write in anyway. The best people on our team rarely arrived through a perfect job posting."],
] as const;

export default function CareersPage() {
  const [filter, setFilter] = useState<TeamFilter>("All");
  const visibleRoles = filter === "All" ? roles : roles.filter((role) => role.team === filter);

  return (
    <AboutPageShell active="careers">
      <>
        <CreativeHero
          eyebrow="Careers"
          title="Hospitality, not customer service."
          tagline="Fast growth, real training, transparent bands, and people who take the work seriously without turning into a corporate portal."
          imageUrl={asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg")}
          accentWord="Hospitality"
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
        <MarqueeStrip items={["PEOPLE FIRST", "GROW WITH US", "REAL TRAINING", "OPEN ROLES", "JOIN THE TEAM"]} variant="accent" />
      </>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-16 sm:py-24">
        <RevealOnScroll>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Open roles</span>
              <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">{visibleRoles.length} role{visibleRoles.length === 1 ? "" : "s"} open right now.</h2>
              <p className="mt-4 text-natural-text/65">9 open roles across 6 teams. Salary bands included because hiding them is tired.</p>
            </div>
          </div>
        </RevealOnScroll>

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-8">
          {teams.map((team) => {
            const active = filter === team;
            return (
              <button
                key={team}
                onClick={() => setFilter(team)}
                className={["inline-flex min-h-11 items-center px-4 py-2 rounded-full text-sm font-bold transition-colors border", active ? "bg-natural-text text-natural-bg border-natural-text" : "bg-transparent text-natural-text/75 border-natural-border hover:bg-natural-text/5"].join(" ")}
              >
                {team}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {visibleRoles.map((role, index) => (
            <RevealOnScroll key={`${role.title}-${role.location}`} delay={index * 0.04}>
              <TiltCard intensity={4} className="about-page-panel rounded-xl p-6 h-full border hover:border-about-accent transition-colors flex flex-col shadow-about-soft">
                <div className="flex justify-between gap-3 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent">{role.team}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/45">{role.posted}</span>
                </div>
                <h3 className="font-serif font-bold text-2xl leading-snug">{role.title}</h3>
                <p className="mt-3 text-sm text-natural-text/65">{role.location}</p>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-natural-text/50">Salary</dt><dd className="font-bold text-right">{role.salary}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-natural-text/50">Experience</dt><dd className="font-bold text-right">{role.experience}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-natural-text/50">Level</dt><dd className="font-bold text-right">{role.level} · {role.type}</dd></div>
                </dl>
                <a href={`mailto:careers@brewmatch.in?subject=Application: ${encodeURIComponent(role.title)}`} className="mt-auto pt-6 text-sm font-bold text-natural-accent hover:text-natural-text transition-colors">Apply →</a>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section className="bg-about-tint py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Life here</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">A photo wall, not stock culture.</h2>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[240px]">
            {photos.map(([image, caption, span], index) => (
              <RevealOnScroll key={caption} delay={index * 0.05} className={span}>
                <figure className="relative h-full overflow-hidden rounded-xl border border-natural-border bg-natural-bg">
                  <img src={image} alt={caption} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  <figcaption className="absolute left-4 bottom-4 right-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">{caption}</figcaption>
                </figure>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Success stories</span>
          <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">Growth speed you can screenshot.</h2>
        </RevealOnScroll>
        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0">
          {stories.map((story, index) => (
            <RevealOnScroll key={story.name} delay={index * 0.06} className="min-w-[82vw] sm:min-w-[420px] md:min-w-0 snap-start">
              <article className="about-page-panel border rounded-xl overflow-hidden h-full shadow-about-soft">
                <img src={story.image} alt={story.name} loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover" />
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-natural-accent">{story.role}</p>
                  <h3 className="font-serif font-bold text-2xl mt-2">{story.name}</h3>
                  <div className="mt-5 space-y-2">
                    {story.timeline.map((step) => <div key={step} className="border-l border-natural-accent pl-3 text-sm font-bold text-natural-text/75">{step}</div>)}
                  </div>
                  <p className="mt-5 text-natural-text/68 leading-relaxed">{story.story}</p>
                  <blockquote className="font-serif text-xl leading-snug mt-5">“{story.quote}”</blockquote>
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section className="bg-about-tint py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Coffee School</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">Three paid weeks before the counter.</h2>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {["Week 1: Origins, varietals, harvest, processing", "Week 2: Roast theory, grind, extraction, water", "Week 3: Service, conflict, cafe operations"].map((week, index) => (
              <RevealOnScroll key={week} delay={index * 0.05}>
                <div className="bg-natural-bg border border-about-accent rounded-xl p-6 h-full shadow-about-soft">
                  <p className="font-serif font-bold text-2xl">{week.split(": ")[0]}</p>
                  <p className="mt-3 text-natural-text/70 leading-relaxed">{week.split(": ")[1]}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
          <p className="mt-8 font-serif text-2xl sm:text-3xl max-w-3xl">Rs 0 cost. Full salary. SCA-aligned curriculum. 12 cohorts a year.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Career paths</span>
          <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">The ladder is visible before you climb it.</h2>
        </RevealOnScroll>
        <div className="space-y-4">
          {[
            ["Cafe", "Barista", "Senior Barista", "Cafe Lead", "Regional Trainer", "Operations Manager"],
            ["Roastery", "Apprentice", "Assistant Roaster", "Profile Lead", "Head Roaster", "Roastery Director"],
            ["Corporate", "Associate", "Manager", "Lead", "Head", "Director"],
          ].map(([lane, ...steps]) => (
            <RevealOnScroll key={lane}>
              <div className="about-page-panel border rounded-xl p-5 shadow-about-soft">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-natural-accent mb-4">{lane}</p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {steps.map((step, index) => <div key={step} className="rounded-lg bg-natural-bg px-4 py-3 text-sm font-bold">{index + 1}. {step}</div>)}
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section className="bg-about-tint py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Benefits</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">The specifics, not the brochure version.</h2>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {benefits.map(([group, title, detail], index) => (
              <RevealOnScroll key={`${group}-${title}`} delay={index * 0.04}>
                <div className="bg-natural-bg border border-about-accent rounded-xl p-6 h-full shadow-about-soft">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent">{group}</p>
                  <h3 className="font-serif font-bold text-xl mt-3">{title}</h3>
                  <p className="text-sm text-natural-text/68 mt-3">{detail}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RevealOnScroll>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Hiring process</span>
              <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">No mystery rounds.</h2>
            </div>
          </RevealOnScroll>
          <div className="space-y-4">
            {["Apply: 10 min form + portfolio if relevant", "Cup & chat: 30 min call; we mail beans beforehand", "Trial day or work sample: paid", "Offer: within 5 business days"].map((step, index) => (
              <RevealOnScroll key={step} delay={index * 0.05}>
                <div className="border-l-2 border-natural-accent pl-5 py-2 font-bold">{index + 1}. {step}</div>
              </RevealOnScroll>
            ))}
            <p className="text-natural-text/65">We respond to every applicant within 7 business days, even rejections.</p>
          </div>
        </div>
      </section>

      <section className="bg-about-tint py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevealOnScroll>
            <div className="bg-natural-bg rounded-xl border border-about-accent p-6 sm:p-8 h-full shadow-about-soft">
              <h2 className="font-serif font-bold text-3xl">We look for</h2>
              <ul className="mt-6 space-y-3 list-disc list-inside text-natural-text/70"><li>Curiosity that survives boredom.</li><li>Hospitality as instinct, not performance.</li><li>The ability to be wrong without flinching.</li><li>Specificity in how you describe past work.</li></ul>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={0.08}>
            <div className="bg-natural-bg rounded-xl border border-about-accent p-6 sm:p-8 h-full shadow-about-soft">
              <h2 className="font-serif font-bold text-3xl">We do not hire for</h2>
              <ul className="mt-6 space-y-3 list-disc list-inside text-natural-text/70"><li>Coffee-influencer aesthetics.</li><li>Performative passion.</li><li>Ego that does not match output.</li><li>Resumes optimized only for keywords.</li></ul>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <StatStrip
        eyebrow="The team, in numbers"
        caption="We hire for curiosity, train for craft, and promote from within. Here's what that looks like in practice."
        stats={[
          { value: "450+", label: "Teammates pan-India" },
          { value: "3 wks", label: "Paid coffee school" },
          { value: "Rs 0", label: "Cost of certification" },
          { value: "92%", label: "Leadership promoted within" },
        ]}
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">FAQ</span>
          <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-8 leading-[1.1]">Questions applicants actually ask.</h2>
        </RevealOnScroll>
        <div className="space-y-3">
          {faqs.map(([question, answer]) => (
            <details key={question} className="bg-natural-paper border border-natural-border rounded-xl p-5 group">
              <summary className="font-serif font-bold text-xl cursor-pointer">{question}</summary>
              <p className="mt-4 text-natural-text/68 leading-relaxed">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <RevealOnScroll>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 py-16 sm:py-24 text-center">
          <p className="text-natural-text/55 text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] mb-6">Do not see your role?</p>
          <h2 className="font-serif font-bold text-2xl sm:text-4xl leading-[1.2] text-natural-text">We hire people, not job descriptions.</h2>
          <p className="mt-6 text-natural-text/70 leading-relaxed">If you are great at what you do and this page made you nod, write in anyway.</p>
          <a href="mailto:careers@brewmatch.in" className="inline-flex mt-8 items-center gap-2 px-6 py-3 rounded-full bg-natural-text text-natural-bg font-bold text-sm hover:bg-natural-accent transition-colors">careers@brewmatch.in →</a>
        </section>
      </RevealOnScroll>
    </AboutPageShell>
  );
}
