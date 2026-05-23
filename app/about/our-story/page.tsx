"use client";
/**
 * /about/our-story
 *
 * The brand origin narrative. Three pinned-text chapters with parallax image
 * stacks between each, capped by a stat strip. Designed for a 40-something
 * Indian buyer who wants to know "who am I buying from?" before spending ₹2,500.
 *
 * Content is statically authored (v7.0 decision). Replace headlines/paragraphs
 * here when the brand team has finalised copy.
 */
import { AboutPageShell } from "@/src/components/about/AboutPageShell";
import {
  ParallaxHero,
  PinnedTextBlock,
  LayeredImageColumns,
  StatStrip,
  RevealOnScroll,
} from "@/src/components/about/ParallaxPrimitives";
import { asset } from "@/src/lib/asset";

export default function OurStoryPage() {
  return (
    <AboutPageShell active="our-story">
      <ParallaxHero
        eyebrow="Since 2016"
        title={"From a single roastery\nin Bengaluru."}
        tagline="A decade of obsessing over what makes a cup of coffee feel like home — and what it takes to ship that feeling across India."
        imageUrl={asset("assets/our-story.png")}
      />

      <PinnedTextBlock
        eyebrow="The Beginning"
        title={"Three friends.\nOne roaster.\nA stubborn belief."}
        paragraphs={[
          "In 2016, when most of India still associated coffee with a tin of instant powder, three friends opened a 600-square-foot roastery in Bengaluru's Indiranagar with one idea: the beans grown in our own hills deserve better than to be shipped abroad and forgotten.",
          "We started with a single Probat sample roaster, two espresso machines, and the conviction that a properly brewed cup of Chikmagalur coffee could stand shoulder to shoulder with anything from Ethiopia or Colombia.",
          "Ten years on, that conviction has become 130 cafés, a national e-commerce footprint, and a community that calls itself the Third Circle.",
        ]}
        sideImages={[
          { url: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"), alt: "First roastery" },
          { url: asset("assets/our-story.png"), alt: "Roasting floor" },
          { url: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-14.jpg"), alt: "First espresso bar" },
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

      <PinnedTextBlock
        reverse
        eyebrow="The Craft"
        title={"We roast every batch\nlike it's the first."}
        paragraphs={[
          "Every Friday at 6 AM, our head roaster Anjali walks the cupping table with the production team. Twenty-three samples. Same hot water, same grind, same timer. Same one question: would we pour this for someone we love?",
          "If the answer is no, the batch doesn't ship. It's the most expensive quality gate in the industry, and it's the only one we've ever trusted. It's why a 250 g bag from us costs what it costs — and why we don't apologise for it.",
          "Our beans come from 14 estates across Chikmagalur, Coorg, and the Baba Budangiri hills. We pay 28 % above the C-market price, every season, because the farmers who get our shade-grown Arabicas to the mill at dawn deserve to send their kids to college.",
        ]}
        sideImages={[
          { url: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"), alt: "Roast curves" },
          { url: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"), alt: "Green bean QC" },
          { url: asset("assets/FR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-05.jpg"), alt: "Packed bags" },
        ]}
      />

      <StatStrip
        eyebrow="Ten years in"
        caption="A small Bengaluru roastery turned into a national specialty coffee company — one estate, one café, one careful cup at a time."
        stats={[
          { value: "2016", label: "Founded in Bengaluru" },
          { value: "14", label: "Partner estates" },
          { value: "130+", label: "Cafés across India" },
          { value: "28%", label: "Above C-market to farmers" },
        ]}
      />

      <PinnedTextBlock
        eyebrow="The Promise"
        title={"Roasted on Monday,\nin your cup by Friday."}
        paragraphs={[
          "Coffee is a perishable good. Most Indian buyers have only ever tasted stale coffee — beans that left their origin nine months ago and sat in a warehouse before reaching their kitchen.",
          "Every bag we ship leaves the roastery within 48 hours of the roast. The 'roasted on' date is printed on the back of every pack — not the 'best before', which any brand can game. Look at the date. If it's more than 21 days old, we'll replace it free.",
          "This is the promise that runs the company. Not the marketing line — the operational discipline behind it. It's why we control our own logistics, our own packaging, and our own café supply chain end-to-end.",
        ]}
        sideImages={[
          { url: asset("assets/WEBSITE ECB SO IMAGES 2026 2048x2048-09.jpg"), alt: "Fresh-packed bag" },
          { url: asset("assets/WEBSITE COLD BREW IMAGES MDR 2026 2048x2048-01.jpg"), alt: "Dispatch line" },
          { url: asset("assets/WEBSITE ECB MM IMAGES 2026 2048x2048-07.jpg"), alt: "Roast-date stamp" },
        ]}
      />

      <RevealOnScroll>
        <section className="max-w-4xl mx-auto px-4 sm:px-6 md:px-12 py-24 sm:py-40 text-center">
          <p className="text-natural-text/55 text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] mb-6">
            A note from the founders
          </p>
          <blockquote className="font-serif text-2xl sm:text-3xl md:text-4xl leading-[1.3] text-natural-text">
            “Coffee isn't a commodity we sell. It's a ritual we get the privilege of being part of every morning. That's not marketing — it's how we decide everything from roast curve to packaging weight.”
          </blockquote>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-natural-text/60">
            — Anjali, Sushant & Ayushi · Co-founders
          </p>
        </section>
      </RevealOnScroll>
    </AboutPageShell>
  );
}
