"use client";

import { useState } from "react";
import { AboutPageShell } from "@/src/components/about/AboutPageShell";
import {
  ParallaxHero,
  StatStrip,
  TiltCard,
  RevealOnScroll,
} from "@/src/components/about/ParallaxPrimitives";
import { asset } from "@/src/lib/asset";

type PressCategory = "Feature" | "Interview" | "Award" | "Industry";
type PressItem = {
  outlet: string;
  date: string;
  headline: string;
  excerpt: string;
  category: PressCategory;
  readTime: string;
  imageUrl: string;
  href: string;
};

const press: PressItem[] = [
  { outlet: "Economic Times", date: "Aug 2025", headline: "The quiet revolution in India's specialty coffee scene", excerpt: "A reported look at homegrown roasters reshaping what Indians expect from a cup of coffee.", category: "Feature", readTime: "7 min", imageUrl: asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg"), href: "#" },
  { outlet: "Mint Lounge", date: "Jun 2025", headline: "Inside the Bengaluru roastery that ships fresh beans across India", excerpt: "A long-read on the 48-hour roast-to-dispatch operation and the cupping protocol.", category: "Interview", readTime: "9 min", imageUrl: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"), href: "#" },
  { outlet: "Forbes India", date: "Apr 2025", headline: "30 Under 30: The duo redefining Indian cafe culture", excerpt: "Co-founders Anjali and Sushant featured under Food & Beverage for the third consecutive year.", category: "Award", readTime: "5 min", imageUrl: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"), href: "#" },
  { outlet: "Conde Nast Traveller", date: "Mar 2025", headline: "The 12 best cafes in India for serious coffee drinkers", excerpt: "Three flagship cafes featured in CNT's list of independent specialty coffee bars.", category: "Feature", readTime: "6 min", imageUrl: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"), href: "#" },
  { outlet: "Business Standard", date: "Jan 2025", headline: "Series B: Rs 120 cr to expand cafe footprint to 250 stores", excerpt: "The roaster-cafe chain closes a Series B led by a marquee consumer fund.", category: "Industry", readTime: "4 min", imageUrl: asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-25.jpg"), href: "#" },
  { outlet: "The Hindu", date: "Nov 2024", headline: "How a 28% premium to farmers is changing Chikmagalur", excerpt: "A field report on long-term estate partnerships and transparent pricing.", category: "Feature", readTime: "8 min", imageUrl: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"), href: "#" },
];

const categories = ["All", "Feature", "Interview", "Award", "Industry"] as const;
type Filter = (typeof categories)[number];

const awards = [
  ["Forbes India", "2023-2025", "30 Under 30, F&B"],
  ["Conde Nast Traveller", "2025", "Top 12 Cafes in India"],
  ["SCA India", "2024", "Best Roaster"],
  ["India Coffee Awards", "2023", "Sustainable Sourcing"],
  ["Mint Lounge", "2025", "Best of Food & Drink"],
  ["LinkedIn", "2024", "Top Startups India"],
] as const;

const media = [
  ["The Seen and the Unseen", "The economics of specialty coffee in India", "~3 hrs · Podcast", asset("assets/our-story.png"), "Listen →"],
  ["India Coffee Forum 2024", "What 14 estates taught us about pricing", "~45 min · Keynote", asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-26.jpg"), "Watch →"],
  ["The Ken: Daybreak", "Building a fresh-coffee supply chain", "~25 min · Interview", asset("assets/FR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-05.jpg"), "Listen →"],
] as const;

const events = [
  ["India Coffee Festival", "Bengaluru", "Jun 12, 2026", "Anjali Iyer", "Why freshness is an operations problem"],
  ["D2C Insider Summit", "Mumbai", "Jul 4, 2026", "Sushant Rao", "Building trust without discount addiction"],
  ["SCA India Cupping Table", "Delhi", "Aug 19, 2026", "Roastery team", "New Indian micro-lots"],
] as const;

const pressKit = [
  ["Logo Pack", "SVG + PNG, light + dark", "~2MB", "#"],
  ["Brand Guidelines", "Type, colour, voice", "~8MB", "#"],
  ["Founder Bios + Headshots", "Short + long bios, portraits", "~30MB", "#"],
  ["Roastery Photography", "50+ editorial photos", "~200MB", "#"],
] as const;

const facts = [
  ["Founded", "2016, Bengaluru"],
  ["Founders", "Anjali Iyer, Sushant Rao, Ayushi Mehta"],
  ["Headquarters", "Bengaluru"],
  ["Roastery", "Bengaluru; Mumbai under construction"],
  ["Cafes", "130+ across 18 cities"],
  ["Team size", "450+"],
  ["Partner estates", "14"],
  ["Funding raised", "Rs 165 cr"],
  ["Latest round", "Series B, Rs 120 cr, Jan 2025"],
  ["Press contact", "press@brewmatch.in"],
] as const;

export default function NewsroomPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const visiblePress = filter === "All" ? press : press.filter((item) => item.category === filter);
  const featured = press[0];

  return (
    <AboutPageShell active="newsroom">
      <ParallaxHero
        eyebrow="Newsroom"
        title="In the news, in our own words."
        tagline="Receipts, interviews, facts, and direct contact. Quiet design. Verifiable claims. No investor-deck cosplay."
        imageUrl={asset("assets/SSRR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-33.jpg")}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-16 sm:py-24">
        <RevealOnScroll>
          <article className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-0 bg-natural-paper border border-natural-border rounded-xl overflow-hidden">
            <img src={featured.imageUrl} alt={featured.headline} loading="eager" decoding="async" className="aspect-[16/10] lg:aspect-auto w-full h-full object-cover" />
            <div className="p-6 sm:p-10 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Featured right now · {featured.date}</p>
              <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">{featured.headline}</h2>
              <blockquote className="mt-6 text-natural-text/70 leading-relaxed">“A new generation of Indian coffee companies is making freshness, sourcing, and taste feel obvious rather than elite.”</blockquote>
              <a href={featured.href} target="_blank" rel="noopener noreferrer" className="mt-8 text-sm font-bold text-natural-accent hover:text-natural-text transition-colors">Read on {featured.outlet} →</a>
            </div>
          </article>
        </RevealOnScroll>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-16 sm:py-24">
        <RevealOnScroll>
          <div className="mb-8 sm:mb-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">The press wall</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">Reported pieces, not press releases.</h2>
          </div>
        </RevealOnScroll>
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-8">
          {categories.map((category) => {
            const active = filter === category;
            return (
              <button key={category} onClick={() => setFilter(category)} className={["inline-flex min-h-11 items-center px-4 py-2 rounded-full text-sm font-bold transition-colors border", active ? "bg-natural-text text-natural-bg border-natural-text" : "bg-transparent text-natural-text/75 border-natural-border hover:bg-natural-text/5"].join(" ")}>{category}</button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {visiblePress.map((item, index) => (
            <RevealOnScroll key={item.headline} delay={index * 0.05}>
              <TiltCard intensity={4} className="bg-natural-paper rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow h-full flex flex-col border border-natural-border">
                <img src={item.imageUrl} alt={item.outlet} loading="lazy" decoding="async" className="aspect-[5/3] w-full object-cover" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-serif font-bold text-xl text-natural-text">{item.outlet}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-natural-text/45">{item.date}</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg leading-snug">{item.headline}</h3>
                  <p className="mt-3 text-sm text-natural-text/70 leading-relaxed">{item.excerpt}</p>
                  <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-natural-text/45">{item.category} · {item.readTime}</span>
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-natural-accent hover:text-natural-text">Read on {item.outlet} →</a>
                  </div>
                </div>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
        <p className="mt-8 text-sm text-natural-text/55">View all 120+ mentions in our press archive — coming soon.</p>
      </section>

      <section className="bg-natural-paper py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Awards</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">Recognition, separated from coverage.</h2>
          </RevealOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {awards.map(([body, years, category], index) => (
              <RevealOnScroll key={`${body}-${category}`} delay={index * 0.05}>
                <div className="bg-natural-bg border border-natural-border rounded-xl p-6 h-full">
                  <p className="font-serif font-bold text-2xl">{body}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-natural-accent mt-3">{years}</p>
                  <p className="text-natural-text/68 mt-4">{category}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Founders in conversation</span>
          <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">Long-form voice, not brand voice.</h2>
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {media.map(([show, title, meta, image, cta], index) => (
            <RevealOnScroll key={title} delay={index * 0.05}>
              <a href="#" target="_blank" rel="noopener noreferrer" className="block bg-natural-paper border border-natural-border rounded-xl overflow-hidden h-full hover:border-natural-accent/50 transition-colors">
                <div className="relative">
                  <img src={image} alt={show} loading="lazy" decoding="async" className="aspect-video w-full object-cover" />
                  <span className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-natural-bg/90 text-natural-text font-bold">▶</span>
                </div>
                <div className="p-6">
                  <p className="font-serif font-bold text-2xl">{show}</p>
                  <h3 className="mt-3 text-natural-text/75 leading-relaxed">{title}</h3>
                  <div className="mt-5 flex items-center justify-between text-sm font-bold"><span className="text-natural-text/45">{meta}</span><span className="text-natural-accent">{cta}</span></div>
                </div>
              </a>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section className="bg-natural-paper py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Speaking</span>
            <h2 className="font-serif font-bold text-3xl sm:text-4xl mt-4 mb-8 leading-[1.1]">Where we will be next.</h2>
          </RevealOnScroll>
          <div className="divide-y divide-natural-border border-y border-natural-border">
            {events.map(([event, city, date, speaker, topic]) => (
              <RevealOnScroll key={`${event}-${date}`}>
                <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.7fr_1.2fr] gap-3 py-5">
                  <div><p className="font-serif font-bold text-xl">{event}</p><p className="text-sm text-natural-text/55">{city} · {date}</p></div>
                  <p className="font-bold text-natural-accent">{speaker}</p>
                  <p className="text-natural-text/68">{topic}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <StatStrip
        eyebrow="By the numbers"
        caption="Earned coverage, not bought attention. Here's what a decade of letting the coffee do the talking adds up to."
        stats={[
          { value: "120+", label: "Press mentions to date" },
          { value: "9", label: "Long-form features in 2025" },
          { value: "0", label: "Paid placements, ever" },
          { value: "2", label: "Day press-email response SLA" },
        ]}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Press kit</span>
          <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">Useful assets, not a scavenger hunt.</h2>
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {pressKit.map(([name, detail, size, href], index) => (
            <RevealOnScroll key={name} delay={index * 0.05}>
              <TiltCard intensity={3} className="bg-natural-paper border border-natural-border rounded-xl p-6 h-full">
                <p className="font-serif font-bold text-xl">{name}</p>
                <p className="text-sm text-natural-text/65 mt-3">{detail}</p>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-natural-text/45 mt-5">{size}</p>
                <a href={href} className="inline-flex mt-5 text-sm font-bold text-natural-accent">Download →</a>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
        <p className="mt-6 text-sm text-natural-text/55">Released for editorial use under attribution. Please credit photography appropriately.</p>
      </section>

      <section className="bg-natural-paper py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Fact sheet</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">The quotable version.</h2>
          </RevealOnScroll>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-10 border-t border-natural-border">
            {facts.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[130px_1fr] gap-4 border-b border-natural-border py-4">
                <dt className="font-serif font-bold text-natural-text">{key}</dt>
                <dd className="font-mono text-sm text-natural-text/70">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <RevealOnScroll>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28 text-center">
          <p className="text-natural-text/55 text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] mb-6">Press inquiries</p>
          <h2 className="font-serif font-bold text-2xl sm:text-4xl leading-[1.2] text-natural-text">Write to Ayushi directly.</h2>
          <p className="mt-6 text-natural-text/70 leading-relaxed">We respond to every press email within 2 working days. Include your outlet, deadline, topic, and what you would like from us.</p>
          <a href="mailto:press@brewmatch.in" className="inline-flex mt-8 items-center gap-2 px-6 py-3 rounded-full bg-natural-text text-natural-bg font-bold text-sm hover:bg-natural-accent transition-colors">press@brewmatch.in →</a>
          <p className="mt-10 text-sm text-natural-text/55">If you are a buyer, not a journalist — <a href="/about/our-coffee" className="font-bold text-natural-accent">start with the coffee →</a></p>
        </section>
      </RevealOnScroll>
    </AboutPageShell>
  );
}
