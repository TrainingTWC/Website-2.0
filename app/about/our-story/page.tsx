"use client";

import { AboutPageShell } from "@/src/components/about/AboutPageShell";
import {
  ParallaxHero,
  PinnedTextBlock,
  LayeredImageColumns,
  StatStrip,
  TiltCard,
  RevealOnScroll,
} from "@/src/components/about/ParallaxPrimitives";
import { CreativeHero, MarqueeStrip, StarDivider } from "@/src/components/about/AboutCreative";
import { asset } from "@/src/lib/asset";

const founders = [
  {
    name: "Sushant Goel",
    role: "Co-founder",
    image: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-14.jpg"),
    bio: "Sushant grew up around South Indian filter coffee in a household where the morning cup was non-negotiable. After Wharton and a stint in consumer investing, he came home convinced India deserved fresh, traceable coffee — not warehouse beans dressed up in nice bags.",
    quote: "We did not start a cafe chain. We started a roastery that opened cafes so people could taste what fresh actually means.",
    note: "now reading: The Monk of Mokha",
  },
  {
    name: "Anirudh Sharma",
    role: "Co-founder",
    image: asset("assets/our-story.png"),
    bio: "Anirudh runs the parts of the business that do not make it into the brand film — the logistics, the cafe playbook, the unglamorous spreadsheets that decide whether a 130-cafe network can still ship a bag roasted on Monday.",
    quote: "The romantic version is that we started with a dream. The honest version is that we started with a spreadsheet, a tiny roaster, and very little patience for stale coffee.",
    note: "now listening: Peter Cat Recording Co.",
  },
  {
    name: "Ayush Bathwal",
    role: "Co-founder",
    image: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-09.jpg"),
    bio: "Ayush leads sourcing, partnerships, and the slow work of turning estate relationships into seasonal pricing contracts. If a bag carries a farm name on its back, he probably knows the person who grew it.",
    quote: "Fourteen estates, fourteen relationships. None of them survive on price alone. They survive because we keep showing up the year after a bad monsoon.",
    note: "now drinking: Attikan washed lot 04",
  },
  {
    name: "Rajat Luthra",
    role: "Chief Executive Officer",
    image: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"),
    bio: "Rajat joined as CEO in late 2023 after years building consumer brands at scale. He runs the next chapter — more cafes, a second roastery, and a training school built so a barista in Indore tastes the same espresso a barista in Bandra pulls.",
    quote: "Growth is the easy part. Growing without losing the cup is the actual job.",
    note: "now obsessing over: dispatch SLAs",
  },
] as const;

const timeline = [
  ["2016", "First roastery, Bengaluru", "A 600 sq ft space, one restored roaster, and a roast log held together by tape."],
  ["2018", "First estate partnership", "Chikmagalur stopped being a sourcing line and became a relationship."],
  ["2021", "8 estates locked in", "Long-term pricing replaced opportunistic buying."],
  ["2023", "Coffee School + new CEO", "Three paid weeks of training, and Rajat Luthra steps in to scale the playbook."],
  ["2025", "Series B closed", "Rs 120 cr to grow cafes, roastery capacity, and direct trade."],
  ["2026", "130+ cafes, 14 estates", "Still small enough for the founders to read the bad reviews."],
] as const;

const estates = [
  ["Attikan", "Bababudangiri", "1,450 m", "Arabica"],
  ["Kelagur", "Chikmagalur", "1,220 m", "SLN 795"],
  ["Mooley Maneh", "Coorg", "1,050 m", "Arabica + Robusta"],
  ["Ratnagiri", "Bababudangiri", "1,350 m", "Catuai"],
  ["Baarbara", "Bababudangiri", "1,500 m", "Arabica"],
  ["Kerehaklu", "Chikmagalur", "1,320 m", "Catimor"],
  ["Harley", "Sakleshpur", "1,100 m", "Arabica"],
  ["Balanoor", "Chikmagalur", "1,250 m", "Arabica"],
] as const;

const values = [
  ["Roast dates, not best-before stamps", "Every bag tells you when it was roasted. If the date is more than 21 days old when it reaches you, we replace it."],
  ["No post-rationalised blends", "Single-origin lots stay intact. If a lot tastes flat, we do not hide it inside a blend and call it balance."],
  ["SCA 80 is the floor", "Three lots were rejected in 2024 because they cleared price but failed cup quality. That is expensive. That is the point."],
  ["One health plan", "Barista to executive, same coverage. A company cannot sell care at the counter and ration it behind the counter."],
] as const;

export default function OurStoryPage() {
  return (
    <AboutPageShell active="our-story">
      <>
        <CreativeHero
          eyebrow="Our Story"
          title="A small Bengaluru roastery, ten years on."
          tagline="Made by people who care about the cup, the farm, and the person drinking it on a half-awake Tuesday."
          imageUrl={asset("assets/our-story.png")}
          accentWord="Bengaluru"
          stickerText="EST. 2016"
          decorations={[
            { glyph: "bean", top: "12%", left: "4%", size: 38, color: "var(--about-accent)", rotate: -18, drift: 12, duration: 7 },
            { glyph: "sparkle", top: "8%", right: "10%", size: 26, color: "var(--about-accent)", rotate: 12, drift: 10, duration: 5, delay: 0.4 },
            { glyph: "squiggle", top: "32%", right: "44%", size: 80, color: "var(--about-accent)", rotate: -8, drift: 6, duration: 6, delay: 0.2 },
            { glyph: "planet", bottom: "8%", left: "8%", size: 56, color: "var(--about-accent)", rotate: 6, drift: 8, duration: 8, delay: 0.6 },
            { glyph: "star", bottom: "20%", right: "6%", size: 32, color: "var(--about-accent)", rotate: 14, drift: 12, duration: 5, delay: 0.3 },
            { glyph: "flower", top: "58%", left: "2%", size: 42, color: "var(--about-accent)", rotate: -10, drift: 9, duration: 7, delay: 0.5 },
          ]}
        />
        <MarqueeStrip items={["MADE WITH CARE", "SMALL BATCH", "ROASTED FRESH", "BENGALURU", "FROM BEAN TO CUP"]} variant="accent" />
      </>

      <PinnedTextBlock
        eyebrow="Bengaluru, 2016"
        title="How a stale-cup epiphany became a roastery."
        paragraphs={[
          "In 2016, India's specialty wave was just starting. You could find a serious espresso machine in a few cafes, but too many cups were still built on beans that had been roasted months ago and shipped around like dry goods.",
          "The founders had tasted what fresh Indian coffee could do outside India, then came home to a gap that felt silly: we were growing beautiful beans and drinking the tired version ourselves.",
          "So the first decision was simple. Roast in small batches, ship within a week, print the roast date, and stop pretending freshness is a luxury feature.",
        ]}
        sideImages={[
          { url: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"), alt: "First roastery exterior" },
          { url: asset("assets/our-story.png"), alt: "Founders at the first cupping table" },
          { url: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-14.jpg"), alt: "Hand-written roast log" },
        ]}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <div className="max-w-3xl mb-10 sm:mb-14">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">The humans</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">Meet the people who still cup the bad batches.</h2>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
          {founders.map((founder, index) => (
            <RevealOnScroll key={founder.name} delay={index * 0.08}>
              <article className="about-page-panel border rounded-xl overflow-hidden shadow-about-soft">
                <img src={founder.image} alt={founder.name} loading="lazy" decoding="async" className="aspect-[3/4] w-full object-cover" />
                <div className="p-6 sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-accent">{founder.role}</p>
                  <h3 className="font-serif font-bold text-2xl sm:text-3xl mt-2">{founder.name}</h3>
                  <p className="mt-4 text-natural-text/70 leading-relaxed">{founder.bio}</p>
                  <blockquote className="font-serif text-xl sm:text-2xl leading-snug mt-6 text-natural-text">“{founder.quote}”</blockquote>
                  <p className="mt-5 text-xs italic text-natural-text/50">{founder.note}</p>
                </div>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section className="bg-about-tint py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">The timeline</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-12 leading-[1.1]">Ten years, no mythology.</h2>
          </RevealOnScroll>
          <div className="space-y-6">
            {timeline.map(([year, title, copy], index) => (
              <RevealOnScroll key={year} delay={index * 0.04}>
                <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[120px_1fr] gap-5 border-t border-natural-border pt-6">
                  <div className="sticky top-28 self-start font-serif font-bold text-3xl sm:text-5xl text-natural-accent">{year}</div>
                  <div>
                    <h3 className="font-serif font-bold text-xl sm:text-2xl">{title}</h3>
                    <p className="mt-2 text-natural-text/68 leading-relaxed">{copy}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <PinnedTextBlock
        eyebrow="The Promise"
        title="Roasted on Monday, in your cup by Friday."
        paragraphs={[
          "Coffee is not shelf decor. Most people in India have only tasted beans that spent their best weeks in a warehouse, then got sold as premium because the bag looked expensive.",
          "Every bag we ship leaves the roastery within 48 hours of roasting. The date on the back is the roasted-on date, not a best-before stamp doing legal gymnastics.",
          "If it reaches you tired, we replace it. Simple promise, complicated operation, worth the headache.",
        ]}
        sideImages={[
          { url: asset("assets/WEBSITE ECB SO IMAGES 2026 2048x2048-09.jpg"), alt: "Fresh-packed bag" },
          { url: asset("assets/WEBSITE COLD BREW IMAGES MDR 2026 2048x2048-01.jpg"), alt: "Dispatch line" },
          { url: asset("assets/WEBSITE ECB MM IMAGES 2026 2048x2048-07.jpg"), alt: "Roast-date stamp" },
        ]}
      />

      <LayeredImageColumns
        images={[
          { url: asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-25.jpg"), alt: "Coffee cherries" },
          { url: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-09.jpg"), alt: "Hand-sorted beans" },
          { url: asset("assets/SSIFB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-17.jpg"), alt: "Roasting" },
          { url: asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg"), alt: "Cupping session" },
        ]}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <div className="max-w-3xl mb-10 sm:mb-14">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">8 of 14 partner estates</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">Where your coffee is actually from.</h2>
            <p className="mt-5 text-natural-text/68 leading-relaxed">Eight of our fourteen partner estates, by name. Where the coffee actually comes from — written on the bag, on the menu, on the wall.</p>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {estates.map(([name, region, elevation, varietal], index) => (
            <RevealOnScroll key={name} delay={(index % 4) * 0.04}>
              <TiltCard intensity={4} className="about-page-panel border rounded-xl p-5 h-full shadow-about-soft">
                <h3 className="font-serif font-bold text-xl">{name}</h3>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-natural-accent mt-2">{region}</p>
                <dl className="mt-5 space-y-2 text-sm text-natural-text/68">
                  <div className="flex justify-between gap-3"><dt>Elevation</dt><dd className="font-bold text-natural-text">{elevation}</dd></div>
                  <div className="flex justify-between gap-3"><dt>Varietal</dt><dd className="font-bold text-natural-text text-right">{varietal}</dd></div>
                </dl>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <RevealOnScroll>
        <section className="bg-natural-text text-natural-bg py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12">
            <blockquote className="font-serif font-bold text-3xl sm:text-5xl leading-tight max-w-4xl">“We pay 28% above the C-market price. Not as charity. As the actual cost of the coffee we want to drink.”</blockquote>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 text-natural-bg/75 leading-relaxed">
              <p>The C-market can make a farmer's best work feel like a commodity spreadsheet. We set seasonal prices with partners before the harvest pressure hits, then grade lots transparently.</p>
              <p>It costs us more per kilo. It also means better cherries, fewer defects, and a relationship that survives one bad monsoon. That is not a sustainability slogan. It is procurement.</p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Values with receipts</span>
          <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">What we will not compromise on.</h2>
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map(([title, copy], index) => (
            <RevealOnScroll key={title} delay={index * 0.06}>
              <TiltCard intensity={5} className="about-page-panel border rounded-xl p-6 h-full shadow-about-soft">
                <h3 className="font-serif font-bold text-xl leading-snug">{title}</h3>
                <p className="mt-4 text-sm text-natural-text/68 leading-relaxed">{copy}</p>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <StatStrip
        eyebrow="Ten years in"
        caption="A small Bengaluru roastery turned into a national specialty coffee company — one estate, one cafe, one careful cup at a time."
        stats={[
          { value: "2016", label: "Founded in Bengaluru" },
          { value: "14", label: "Partner estates" },
          { value: "130+", label: "Cafes across India" },
          { value: "28%", label: "Above C-market to farmers" },
        ]}
      />

      <PinnedTextBlock
        reverse
        eyebrow="Today + next"
        title="Still growing. Still allergic to stale coffee."
        paragraphs={[
          "Today BrewMatch runs 130+ cafes across India, buys from 14 partner estates, and ships fresh coffee to people who once thought specialty coffee was not for them.",
          "The next chapter is not world-domination theatre. It is a second roastery, better training, more transparent sourcing, and fewer reasons for anyone to settle for dead beans.",
        ]}
        sideImages={[
          { url: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"), alt: "Roastery floor" },
          { url: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"), alt: "Green bean quality check" },
          { url: asset("assets/FR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-05.jpg"), alt: "Packed bags" },
        ]}
      />

      <RevealOnScroll>
        <section className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28 text-center">
          <div className="about-page-panel border rounded-xl px-6 py-10 sm:p-12 shadow-about-soft">
            <p className="text-natural-text/55 text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] mb-6">A note from the founders</p>
            <blockquote className="font-serif text-2xl sm:text-4xl leading-[1.3] text-natural-text">We started because the cup felt wrong. We are still here because fixing it turned out to mean farmers, baristas, logistics, design, training, and a thousand boring decisions done carefully.</blockquote>
            <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-natural-text/60">Sushant, Anirudh, Ayush & Rajat</p>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <a href="/about/our-coffee" className="inline-flex justify-center px-5 py-3 rounded-full bg-natural-text text-natural-bg font-bold text-sm">Read about our coffee →</a>
            <a href="mailto:hello@brewmatch.in?subject=Roastery visit" className="inline-flex justify-center px-5 py-3 rounded-full border border-natural-border text-natural-text font-bold text-sm">Visit the roastery →</a>
          </div>
        </section>
      </RevealOnScroll>
    </AboutPageShell>
  );
}
