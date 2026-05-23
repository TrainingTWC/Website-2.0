"use client";
/**
 * /about/newsroom
 *
 * Press & media page. Static array of press mentions for v7.0. Wire to a CMS
 * (Convex, Sanity, or Notion) when the press team starts publishing regularly.
 */
import { AboutPageShell } from "@/src/components/about/AboutPageShell";
import {
  ParallaxHero,
  PinnedTextBlock,
  StatStrip,
  TiltCard,
  RevealOnScroll,
} from "@/src/components/about/ParallaxPrimitives";
import { asset } from "@/src/lib/asset";

type PressItem = {
  outlet: string;
  date: string;
  headline: string;
  excerpt: string;
  category: "Feature" | "Interview" | "Award" | "Industry";
  imageUrl: string;
};

const PRESS: PressItem[] = [
  {
    outlet: "Economic Times",
    date: "Aug 2025",
    headline: "The quiet revolution in India's specialty coffee scene",
    excerpt: "A deep dive into how a handful of homegrown roasters are reshaping what Indians expect from a cup of coffee — and why supermarket brands are scrambling to catch up.",
    category: "Feature",
    imageUrl: asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg"),
  },
  {
    outlet: "Mint Lounge",
    date: "Jun 2025",
    headline: "Inside the Bengaluru roastery that ships fresh beans across India",
    excerpt: "A long-read on the 48-hour roast-to-dispatch operation, the cupping protocol, and the unusual decision to publish roast dates instead of best-before stamps.",
    category: "Interview",
    imageUrl: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"),
  },
  {
    outlet: "Forbes India",
    date: "Apr 2025",
    headline: "30 Under 30: The duo redefining Indian café culture",
    excerpt: "Co-founders Anjali and Sushant featured on Forbes India's 30 Under 30 list under the Food & Beverage category for the third consecutive year.",
    category: "Award",
    imageUrl: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"),
  },
  {
    outlet: "Condé Nast Traveller",
    date: "Mar 2025",
    headline: "The 12 best cafés in India for serious coffee drinkers",
    excerpt: "Three of our flagship cafés — Indiranagar, Bandra, and Hauz Khas — featured in CNT's definitive list of India's best independent specialty coffee bars.",
    category: "Feature",
    imageUrl: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"),
  },
  {
    outlet: "Business Standard",
    date: "Jan 2025",
    headline: "Series B: ₹120 cr to expand café footprint to 250 stores by 2027",
    excerpt: "The roaster-cum-café chain closes its Series B led by a marquee consumer fund, with proceeds earmarked for retail expansion and a second roastery in Bengaluru.",
    category: "Industry",
    imageUrl: asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-25.jpg"),
  },
  {
    outlet: "The Hindu",
    date: "Nov 2024",
    headline: "How a 28% premium to farmers is changing Chikmagalur",
    excerpt: "A reported piece from the field on the long-term partnerships with 14 estates and how transparent pricing is reshaping incomes in coffee-growing regions of Karnataka.",
    category: "Feature",
    imageUrl: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"),
  },
];

export default function NewsroomPage() {
  return (
    <AboutPageShell active="newsroom">
      <ParallaxHero
        eyebrow="Newsroom"
        title={"In the news,\nin our own words."}
        tagline="Press coverage, interviews, and stories from the people who write about Indian coffee for a living."
        imageUrl={asset("assets/SSRR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-33.jpg")}
      />

      <PinnedTextBlock
        eyebrow="Press"
        title={"We're a small team\nwith a loud cup."}
        paragraphs={[
          "We don't have a PR firm. We don't pitch. The journalists who write about us are people who walked into one of our cafés, ordered a cup, and came back the next week to ask why it tasted the way it did.",
          "Below is a curated archive of the longer features and reported pieces that have shaped how the industry talks about us. For interviews, samples, or roastery tours, write directly to our co-founder Ayushi at press@brewmatch.in.",
          "We respond to every email within two working days. We say yes to most thoughtful requests. We don't do paid placements, ever.",
        ]}
        sideImages={[
          { url: asset("assets/our-story.png"), alt: "Roastery" },
          { url: asset("assets/WEBSITE ECB MM IMAGES 2026 2048x2048-07.jpg"), alt: "Cupping table" },
          { url: asset("assets/FR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-05.jpg"), alt: "Café floor" },
        ]}
      />

      {/* Press grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <div className="mb-10 sm:mb-16">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">
              Featured Coverage
            </span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">
              Reported pieces, not press releases.
            </h2>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PRESS.map((p, i) => (
            <RevealOnScroll key={p.headline} delay={i * 0.06}>
              <TiltCard
                intensity={5}
                className="bg-natural-paper rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow h-full flex flex-col"
              >
                <div className="aspect-[5/3] overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.outlet}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 sm:p-7 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent">
                      {p.outlet}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/45">
                      {p.date}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-xl text-natural-text leading-snug">
                    {p.headline}
                  </h3>
                  <p className="mt-3 text-sm text-natural-text/70 leading-relaxed">{p.excerpt}</p>
                  <div className="mt-auto pt-5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/45">
                      {p.category}
                    </span>
                    <span className="text-sm font-bold text-natural-accent">Read piece →</span>
                  </div>
                </div>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <StatStrip
        stats={[
          { value: "120+", label: "Press mentions to date" },
          { value: "9", label: "Long-form features in 2025" },
          { value: "0", label: "Paid placements, ever" },
          { value: "2", label: "Day press-email response SLA" },
        ]}
      />

      <PinnedTextBlock
        reverse
        eyebrow="Brand Assets"
        title={"For journalists,\npartners, & students."}
        paragraphs={[
          "Logo files (light and dark), brand guidelines, founder bios, and high-resolution photography from the roastery and cafés are available on request.",
          "If you're writing about specialty coffee in India, an MBA student studying the category, or a small partner brand who'd like to collaborate — write in. We're generous with our time when the ask is thoughtful.",
          "All assets are released for editorial use under attribution. Please credit photography appropriately when used in print or online.",
        ]}
        sideImages={[
          { url: asset("assets/SSIFB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-17.jpg"), alt: "Brand photography" },
          { url: asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-02.jpg"), alt: "Lifestyle shot" },
          { url: asset("assets/WEBSITE COLD BREW IMAGES MDR 2026 2048x2048-01.jpg"), alt: "Cold brew" },
        ]}
      />

      <RevealOnScroll>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-32 text-center">
          <p className="text-natural-text/55 text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] mb-6">
            Press Inquiries
          </p>
          <h2 className="font-serif font-bold text-2xl sm:text-4xl leading-[1.2] text-natural-text">
            Get in touch with our press team.
          </h2>
          <p className="mt-6 text-natural-text/70 leading-relaxed">
            For interviews, samples, roastery tours, or brand asset requests — write to our co-founder Ayushi directly.
          </p>
          <a
            href="mailto:press@brewmatch.in"
            className="inline-flex mt-8 items-center gap-2 px-6 py-3 rounded-full bg-natural-text text-natural-bg font-bold text-sm hover:bg-natural-accent transition-colors"
          >
            press@brewmatch.in →
          </a>
        </section>
      </RevealOnScroll>
    </AboutPageShell>
  );
}
