"use client";

import { AboutPageShell } from "@/src/components/about/AboutPageShell";
import {
  ParallaxHero,
  PinnedTextBlock,
  StatStrip,
  TiltCard,
  RevealOnScroll,
} from "@/src/components/about/ParallaxPrimitives";
import { asset } from "@/src/lib/asset";

const processSteps = [
  ["01", "Sourcing", "Direct relationships with 14 Indian estates, not anonymous bags from a trading desk."],
  ["02", "Harvest", "Selective hand-picking means ripe cherries first, speed second."],
  ["03", "Processing", "Washed, natural, or honey processing is chosen per lot, not as a trend label."],
  ["04", "Roasting", "Small batches on a restored Probat, profiled by origin and brew method."],
  ["05", "Dispatch", "Roasted, checked, packed, and sent out within 48 hours."],
] as const;

const regions = [
  {
    name: "Chikmagalur",
    elevation: "1,000-1,500 m",
    varietals: "Arabica-heavy, SLN 795, Selection 9",
    harvest: "Nov-Feb",
    profile: "Citrus, cocoa, and a clean sweetness that works for people coming from both filter coffee and cafe lattes.",
    estates: "6 partner estates",
    image: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"),
  },
  {
    name: "Coorg / Kodagu",
    elevation: "900-1,200 m",
    varietals: "Arabica + shade-grown Robusta",
    harvest: "Dec-Mar",
    profile: "Deep body, spice, and nutty sweetness. The region that makes a French Press feel like a hug without turning muddy.",
    estates: "3 partner estates",
    image: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"),
  },
  {
    name: "Wayanad",
    elevation: "700-1,000 m",
    varietals: "Robusta-dominant",
    harvest: "Dec-Feb",
    profile: "Full-bodied, low-acid, and quietly powerful. Good Robusta is not a shortcut. Bad Robusta gave it a bad reputation.",
    estates: "2 partner estates",
    image: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"),
  },
  {
    name: "Araku Valley",
    elevation: "900-1,100 m",
    varietals: "Arabica, tribal cooperative lots",
    harvest: "Jan-Mar",
    profile: "Bright, floral, and easy to over-roast if you are impatient. We keep this one light and let it talk.",
    estates: "1 partner cooperative",
    image: asset("assets/SSIFB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-17.jpg"),
  },
  {
    name: "Bababudangiri",
    elevation: "1,500 m+",
    varietals: "Arabica, Catuai, SLN lots",
    harvest: "Dec-Feb",
    profile: "Wine-like, dense, and a little dramatic in the best way. This is where coffee history becomes cup character.",
    estates: "2 partner estates",
    image: asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-25.jpg"),
  },
] as const;

const roastLevels = [
  ["Light", "Bright, fruit-forward, and best when you want to taste the region clearly.", "Pour-over, AeroPress", asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-02.jpg")],
  ["Medium", "Balanced sweetness, chocolate, and enough body for daily cups without bitterness.", "French Press, moka, milk drinks", asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg")],
  ["Dark", "Roasty, heavy, and built for milk. Strong does not mean burnt; we stop before that line.", "Espresso, South Indian filter", asset("assets/FR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-05.jpg")],
] as const;

const brewMethods = [
  {
    method: "French Press",
    label: "hostel-friendly default",
    gear: "Rs 900-1,800 press, kettle, spoon. Premium: Espro if you are committed.",
    ratio: "1:15",
    grind: "Coarse, like sea salt",
    water: "Boil, wait 30 seconds",
    time: "4 min",
    steps: ["Add 20 g coffee + 300 g water.", "Stir once. Put the lid on, do not plunge yet.", "At 4 minutes, skim the foam, then plunge gently.", "Pour all of it out. Leaving it inside keeps extracting."],
    trouble: "Sour means too coarse or too short. Bitter means too long. Weak means you got shy with coffee.",
  },
  {
    method: "V60 / Hario",
    label: "weekend ritual",
    gear: "Rs 450 plastic dripper from any Amazon search, paper filters, mug. Premium: Rs 6,000 Hario glass if you are feeling it.",
    ratio: "1:16",
    grind: "Medium-fine, like table salt",
    water: "Boil, wait 30 seconds",
    time: "3 min",
    steps: ["Rinse filter. Add 18 g coffee.", "Pour 40 g water and wait 30 seconds.", "Pour slowly in circles until 288 g total.", "If it drains in under 2:30, grind finer next time."],
    trouble: "Sour = under-extracted. Bitter = over-extracted. Muddy = your pour got chaotic.",
  },
  {
    method: "AeroPress",
    label: "traveler's friend",
    gear: "Rs 3,500 AeroPress, filters, mug. Works in hotel rooms and borrowed kitchens.",
    ratio: "1:14",
    grind: "Fine, just softer than table salt",
    water: "Boil, wait 45 seconds",
    time: "90 sec",
    steps: ["Use inverted if you know it; normal if you do not.", "Add 16 g coffee + 220 g water.", "Stir for 10 seconds, steep 30 seconds.", "Press slowly. If your arm shakes, you ground too fine."],
    trouble: "Too sharp? Grind finer or steep longer. Too heavy? Back off the steep time.",
  },
  {
    method: "Moka Pot",
    label: "almost espresso",
    gear: "Rs 900-2,500 moka pot, stove, patience. No tamping, no aggression.",
    ratio: "1:7",
    grind: "Fine-medium, not espresso powder",
    water: "Hot water in base",
    time: "4-5 min",
    steps: ["Fill base with hot water below valve.", "Fill basket level. Do not press it down.", "Low flame until the first sputter.", "Take it off heat early; the final angry gurgle tastes burnt."],
    trouble: "Metallic bitterness usually means too much heat. Lower the flame and stop earlier.",
  },
] as const;

const notes = [
  ["Citrus", "Coorg orange peel"],
  ["Stone fruit", "ripe Alphonso"],
  ["Chocolate", "70% dark Amul Tribute"],
  ["Floral", "jasmine garland morning"],
  ["Nutty", "roasted cashew"],
  ["Spice", "cardamom pod"],
] as const;

const products = [
  ["Monsoon Malabar", "Low-acid, big body, moka-friendly", "/products/monsoon-malabar", asset("assets/WEBSITE ECB MM IMAGES 2026 2048x2048-07.jpg")],
  ["Vienna Roast", "Dark enough for milk, not burnt", "/products/vienna-roast", asset("assets/WEBSITE ECB VR IMAGES 2026 2048x2048-11.jpg")],
  ["Single Origin", "Clean, bright, weekend-brew energy", "/products/single-origin", asset("assets/WEBSITE ECB SO IMAGES 2026 2048x2048-09.jpg")],
  ["Cold Brew", "Lazy fridge brew, serious taste", "/products/cold-brew", asset("assets/WEBSITE COLD BREW IMAGES MDR 2026 2048x2048-01.jpg")],
] as const;

export default function OurCoffeePage() {
  return (
    <AboutPageShell active="our-coffee">
      <ParallaxHero
        eyebrow="Our Coffee"
        title="Single-origin, single-minded."
        tagline="Coffee that tells you where it came from, how to brew it, and what to do if your first cup tastes weird."
        imageUrl={asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg")}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Seed to cup</span>
          <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">Five steps. No gatekeeping.</h2>
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {processSteps.map(([number, title, copy], index) => (
            <RevealOnScroll key={title} delay={index * 0.05}>
              <div className="about-page-panel border rounded-xl p-5 h-full shadow-about-soft">
                <p className="font-serif text-4xl font-bold text-natural-accent">{number}</p>
                <h3 className="font-serif font-bold text-xl mt-4">{title}</h3>
                <p className="text-sm text-natural-text/68 leading-relaxed mt-3">{copy}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <section className="bg-about-tint py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Origins</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-12 leading-[1.1]">Five Indian regions, five different cups.</h2>
          </RevealOnScroll>
          <div className="space-y-8 sm:space-y-10">
            {regions.map((region, index) => (
              <RevealOnScroll key={region.name} delay={index * 0.04}>
                <article className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-10 items-center border border-about-accent rounded-xl bg-natural-bg overflow-hidden shadow-about-soft">
                  <img src={region.image} alt={region.name} loading="lazy" decoding="async" className="aspect-[3/2] w-full h-full object-cover" />
                  <div className="p-6 sm:p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-natural-accent">{region.estates}</p>
                    <h3 className="font-serif font-bold text-3xl sm:text-4xl mt-3">{region.name}</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-sm">
                      <div><dt className="text-natural-text/45 uppercase tracking-widest text-[10px] font-bold">Elevation</dt><dd className="font-bold">{region.elevation}</dd></div>
                      <div><dt className="text-natural-text/45 uppercase tracking-widest text-[10px] font-bold">Harvest</dt><dd className="font-bold">{region.harvest}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-natural-text/45 uppercase tracking-widest text-[10px] font-bold">Varietals</dt><dd className="font-bold">{region.varietals}</dd></div>
                    </dl>
                    <p className="mt-6 text-natural-text/70 leading-relaxed">{region.profile}</p>
                  </div>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <PinnedTextBlock
        eyebrow="The roastery"
        title="Consistency over capacity. Every time."
        paragraphs={[
          "We roast on a restored 1965 Probat UG-22 because it gives us control, not because old machines look good in photos. Capacity is useful. Consistency is survival.",
          "Head roaster Anjali has led the table since 2018. Every Friday, production cups the week's roasts for aroma, acidity, body, sweetness, balance, aftertaste, and defects.",
          "Roast profiles are per-origin, not generic. Araku stays light and floral. Chikmagalur gets a medium profile. Dark roasts are built for milk without crossing into burnt.",
        ]}
        sideImages={[
          { url: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-22.jpg"), alt: "Probat roaster mid-roast" },
          { url: asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-26.jpg"), alt: "First crack" },
          { url: asset("assets/SSRR  WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-35.jpg"), alt: "Cooling tray" },
        ]}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <RevealOnScroll>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Quality control</span>
              <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 leading-[1.1]">We reject the stuff most brands would hide.</h2>
              <p className="mt-6 text-natural-text/70 leading-relaxed">80+ on the SCA scale is the entry ticket. After that we cup for sweetness, balance, aftertaste, and defects. Boring? Maybe. But this is where your Rs 800 bag gets protected.</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={0.08}>
            <div className="about-page-panel border rounded-xl p-6 sm:p-8 shadow-about-soft">
              <h3 className="font-serif font-bold text-2xl">Rejected in the last 12 months</h3>
              <ol className="mt-6 space-y-4 text-natural-text/70 leading-relaxed list-decimal list-inside">
                <li>Monsoon lot, defects above 3% after second screen.</li>
                <li>Lot 247, over-fermented ester notes that swallowed the sweetness.</li>
                <li>Partner-change sample, re-evaluated after inconsistent picking standards.</li>
              </ol>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="bg-about-tint py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Roast levels</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">Strong is not a roast level.</h2>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {roastLevels.map(([level, copy, bestFor, image], index) => (
              <RevealOnScroll key={level} delay={index * 0.06}>
                <TiltCard intensity={4} className="bg-natural-bg border border-about-accent rounded-xl overflow-hidden h-full shadow-about-soft">
                  <img src={image} alt={`${level} roast beans`} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
                  <div className="p-6">
                    <h3 className="font-serif font-bold text-2xl">{level}</h3>
                    <p className="mt-3 text-natural-text/68 leading-relaxed">{copy}</p>
                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-natural-accent">Best for: {bestFor}</p>
                  </div>
                </TiltCard>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Brew methods</span>
          <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-4 leading-[1.1]">Recipes you can actually use.</h2>
          <p className="text-natural-text/68 max-w-2xl mb-10">Made for PG kitchens, 1BHK counters, hostel induction plates, and weekend hosts who just want the cup to slap.</p>
        </RevealOnScroll>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {brewMethods.map((method, index) => (
            <RevealOnScroll key={method.method} delay={index * 0.05}>
              <article className="about-page-panel border rounded-xl p-6 sm:p-8 h-full shadow-about-soft">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-natural-accent">{method.label}</p>
                <h3 className="font-serif font-bold text-2xl sm:text-3xl mt-2">{method.method}</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-sm">
                  <div><dt className="text-natural-text/45 uppercase tracking-widest text-[10px] font-bold">Gear</dt><dd className="text-natural-text/75">{method.gear}</dd></div>
                  <div><dt className="text-natural-text/45 uppercase tracking-widest text-[10px] font-bold">Ratio</dt><dd className="font-bold">{method.ratio}</dd></div>
                  <div><dt className="text-natural-text/45 uppercase tracking-widest text-[10px] font-bold">Grind</dt><dd className="font-bold">{method.grind}</dd></div>
                  <div><dt className="text-natural-text/45 uppercase tracking-widest text-[10px] font-bold">Water + time</dt><dd className="font-bold">{method.water} · {method.time}</dd></div>
                </dl>
                <ol className="mt-6 space-y-2 list-decimal list-inside text-natural-text/72 leading-relaxed">
                  {method.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
                <p className="mt-6 rounded-lg bg-natural-bg px-4 py-3 text-sm text-natural-text/70"><strong>If it goes wrong:</strong> {method.trouble}</p>
              </article>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      <RevealOnScroll>
        <section className="bg-natural-text text-natural-bg py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-bg/60">Freshness promise</p>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 max-w-3xl leading-[1.1]">We refuse to sell coffee older than the day it's named after.</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-10">
              {["Day 0: roasted", "Day 1: QC + packed", "Day 2-5: in transit", "Week 1-6: peak window", "Week 6+: still drinkable"].map((item) => (
                <div key={item} className="border-l border-natural-bg/25 pl-4 text-natural-bg/75 font-bold">{item}</div>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <RevealOnScroll>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Tasting notes decoded</span>
          <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">Less wine-list, more Indian pantry.</h2>
        </RevealOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {notes.map(([note, analog], index) => (
            <RevealOnScroll key={note} delay={index * 0.04}>
              <div className="about-page-panel border rounded-xl p-5 h-full shadow-about-soft">
                <p className="font-serif font-bold text-xl">{note}</p>
                <p className="text-sm text-natural-text/65 mt-2">{analog}</p>
              </div>
            </RevealOnScroll>
          ))}
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevealOnScroll>
            <div className="about-page-panel border rounded-xl p-6 sm:p-8 h-full shadow-about-soft">
              <h2 className="font-serif font-bold text-3xl">Sustainability without the greenwash.</h2>
              <ul className="mt-6 space-y-3 text-natural-text/70 leading-relaxed list-disc list-inside">
                <li>Estate-direct buying cuts middlemen and repeat transport.</li>
                <li>Returnable jute outer packaging for wholesale orders.</li>
                <li>Compostable inner liners on the next packaging run.</li>
              </ul>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={0.08}>
            <div className="about-page-panel border rounded-xl p-6 sm:p-8 h-full shadow-about-soft">
              <h3 className="font-serif font-bold text-3xl">What we are working on.</h3>
              <ul className="mt-6 space-y-3 text-natural-text/70 leading-relaxed list-disc list-inside">
                <li>Carbon-neutral shipping target for 2027.</li>
                <li>30% lower roastery water usage.</li>
                <li>Publishing the verified farm list before launch copy is final.</li>
              </ul>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="bg-about-tint py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <RevealOnScroll>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent">Shop the range</span>
            <h2 className="font-serif font-bold text-3xl sm:text-5xl mt-4 mb-10 leading-[1.1]">Now that you know how we make it, try a bag.</h2>
          </RevealOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map(([name, copy, href, image], index) => (
              <RevealOnScroll key={name} delay={index * 0.05}>
                <a href={href} className="block bg-natural-bg border border-natural-border rounded-xl overflow-hidden h-full hover:border-natural-accent/50 transition-colors">
                  <img src={image} alt={name} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
                  <div className="p-5">
                    <h3 className="font-serif font-bold text-xl">{name}</h3>
                    <p className="mt-2 text-sm text-natural-text/65">{copy}</p>
                  </div>
                </a>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>
    </AboutPageShell>
  );
}
