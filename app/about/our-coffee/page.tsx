"use client";
/**
 * /about/our-coffee
 *
 * The "what's in the cup" page. Walks the reader from farm → roast → brew, with
 * heavy emphasis on freshness, origin transparency, and brew guidance — the
 * three things that convert a 40+ buyer who's used to instant or supermarket
 * Arabica blends.
 */
import { AboutPageShell } from "@/src/components/about/AboutPageShell";
import {
  ParallaxHero,
  PinnedTextBlock,
  LayeredImageColumns,
  StatStrip,
  TiltCard,
  RevealOnScroll,
} from "@/src/components/about/ParallaxPrimitives";
import { asset } from "@/src/lib/asset";

const ORIGIN_REGIONS = [
  {
    name: "Chikmagalur",
    state: "Karnataka",
    altitude: "900–1,500 m",
    note: "The birthplace of Indian coffee — every bean here can trace a lineage to the seven seeds Baba Budan smuggled from Yemen in 1670.",
    imageUrl: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"),
  },
  {
    name: "Coorg",
    state: "Karnataka",
    altitude: "1,100 m",
    note: "Shaded by rosewood and silver oak. Late-monsoon harvests give us the chocolatey, full-bodied profile our French Press blend depends on.",
    imageUrl: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"),
  },
  {
    name: "Baba Budangiri",
    state: "Karnataka",
    altitude: "1,500–1,800 m",
    note: "The highest estate in our network. Slow ripening = denser beans = the bright, citrusy notes you'll only ever find in our limited single-origin micro-lots.",
    imageUrl: asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-25.jpg"),
  },
  {
    name: "Wayanad",
    state: "Kerala",
    altitude: "700–2,100 m",
    note: "Heirloom Robusta. Yes, Robusta — when grown with care, it's the secret weapon behind every great Indian espresso.",
    imageUrl: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"),
  },
];

const BREW_METHODS = [
  {
    method: "South Indian Filter",
    grind: "Fine (sugar-fine)",
    ratio: "1:4",
    time: "5–7 min drip",
    pairing: "Madras Filter Bru, dark roast Coorg",
  },
  {
    method: "French Press",
    grind: "Coarse (sea-salt coarse)",
    ratio: "1:15",
    time: "4 min steep",
    pairing: "Karinkonda blend, medium roast",
  },
  {
    method: "Moka Pot",
    grind: "Fine-medium",
    ratio: "1:7",
    time: "4–5 min on low flame",
    pairing: "Vienna Roast espresso blend",
  },
  {
    method: "Espresso Machine",
    grind: "Very fine",
    ratio: "1:2 (in 28 s)",
    time: "25–30 s pull",
    pairing: "Third Wave House Blend",
  },
];

export default function OurCoffeePage() {
  return (
    <AboutPageShell active="our-coffee">
      <ParallaxHero
        eyebrow="From Hill to Cup"
        title={"The coffee\nbehind the brand."}
        tagline="14 estates. 4 regions. One obsession with what happens between the cherry on the branch and the first sip at your kitchen table."
        imageUrl={asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg")}
      />

      <PinnedTextBlock
        eyebrow="The Bean"
        title={"Specialty grade.\nIndia grown."}
        paragraphs={[
          "Every bean we roast is Specialty Grade — scoring 80+ on the SCA scale. To put that in perspective: 95 % of coffee sold in Indian supermarkets is Commercial Grade (sub-80).",
          "We work with single estates rather than co-operatives, which means we can trace every cup back to the farmer who picked it. Each pack carries the estate name, harvest year, and processing method on the back.",
          "Shade-grown. Hand-picked. Wet-processed or natural depending on the bean. No exceptions, no shortcuts. The price you pay reflects exactly this discipline.",
        ]}
        sideImages={[
          { url: asset("assets/SSIFB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-17.jpg"), alt: "Coffee cherries" },
          { url: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-09.jpg"), alt: "Hand sorting" },
          { url: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"), alt: "Wet processing" },
        ]}
      />

      <LayeredImageColumns
        images={[
          { url: asset("assets/FR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-05.jpg"), alt: "Roast development" },
          { url: asset("assets/SSRR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-33.jpg"), alt: "Tasting flight" },
          { url: asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-02.jpg"), alt: "Aroma check" },
          { url: asset("assets/WEBSITE ECB SO IMAGES 2026 2048x2048-09.jpg"), alt: "Sealed bag" },
        ]}
      />

      {/* Origins grid — interactive tilt cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-24 sm:py-32">
        <RevealOnScroll>
          <div className="text-center mb-12 sm:mb-20">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">
              Origins
            </span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">
              Four regions.<br />One promise of provenance.
            </h2>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
          {ORIGIN_REGIONS.map((r, i) => (
            <RevealOnScroll key={r.name} delay={i * 0.08}>
              <TiltCard
                intensity={6}
                className="bg-natural-paper rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow"
              >
                <div className="aspect-[5/3] overflow-hidden">
                  <img
                    src={r.imageUrl}
                    alt={r.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 sm:p-8 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-serif font-bold text-2xl text-natural-text">{r.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-natural-text/40">
                      {r.state}
                    </span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-natural-accent">
                    {r.altitude}
                  </p>
                  <p className="text-natural-text/70 leading-relaxed text-sm">{r.note}</p>
                </div>
              </TiltCard>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <PinnedTextBlock
        reverse
        eyebrow="The Roast"
        title={"22 batches a week.\nNot one minute longer."}
        paragraphs={[
          "Roasting is the most misunderstood part of coffee. A dark roast isn't 'strong' — it's just over-developed. A light roast isn't 'weak' — it's a snapshot of the bean's true character.",
          "We profile each bean three ways: light for filter, medium for moka and pour-over, dark for South Indian filter and espresso. Each profile is locked to a specific roast curve, drum temperature, and development time.",
          "Once a batch is roasted, it rests for 72 hours, gets cupped one final time, and ships within the next 24. Total roast-to-doorstep: 4 to 6 working days anywhere in India.",
        ]}
        sideImages={[
          { url: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-22.jpg"), alt: "Roast curves" },
          { url: asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-26.jpg"), alt: "First crack" },
          { url: asset("assets/SSRR  WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-35.jpg"), alt: "Cooling tray" },
        ]}
      />

      {/* Brew methods grid */}
      <section className="bg-natural-paper py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <div className="text-center mb-12 sm:mb-20">
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">
                Brewing
              </span>
              <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">
                Whatever's in your kitchen,<br />we'll match the bean to it.
              </h2>
              <p className="mt-6 text-natural-text/65 max-w-2xl mx-auto leading-relaxed">
                Same bean, four wildly different cups. Get the grind right and you'll never want supermarket coffee again. Get it wrong and you'll waste even our best beans.
              </p>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BREW_METHODS.map((b, i) => (
              <RevealOnScroll key={b.method} delay={i * 0.08}>
                <TiltCard
                  intensity={5}
                  className="bg-natural-bg rounded-2xl p-6 sm:p-8 h-full border border-natural-border"
                >
                  <h3 className="font-serif font-bold text-xl text-natural-text">{b.method}</h3>
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-2 border-b border-natural-border/60 pb-2">
                      <dt className="text-natural-text/55 text-xs uppercase tracking-widest font-bold">Grind</dt>
                      <dd className="font-bold text-natural-text text-right">{b.grind}</dd>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-natural-border/60 pb-2">
                      <dt className="text-natural-text/55 text-xs uppercase tracking-widest font-bold">Ratio</dt>
                      <dd className="font-bold text-natural-text text-right">{b.ratio}</dd>
                    </div>
                    <div className="flex justify-between gap-2 border-b border-natural-border/60 pb-2">
                      <dt className="text-natural-text/55 text-xs uppercase tracking-widest font-bold">Time</dt>
                      <dd className="font-bold text-natural-text text-right">{b.time}</dd>
                    </div>
                    <div className="pt-2">
                      <dt className="text-natural-text/55 text-xs uppercase tracking-widest font-bold mb-2">Try</dt>
                      <dd className="text-natural-text/80 text-sm leading-snug">{b.pairing}</dd>
                    </div>
                  </dl>
                </TiltCard>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <StatStrip
        eyebrow="Quality, measured"
        caption="Specialty-grade beans, single-origin sourcing, and a roast-to-dispatch window most retailers won't match."
        stats={[
          { value: "80+", label: "SCA cupping score" },
          { value: "48 hrs", label: "Roast to dispatch" },
          { value: "100%", label: "Indian origin" },
          { value: "0", label: "Commercial-grade beans" },
        ]}
      />
    </AboutPageShell>
  );
}
