/**
 * Adds AICapabilitiesStrip to HomeContent.tsx:
 * 1. Add Sparkles + Sun to lucide imports
 * 2. Inject AICapabilitiesStrip component before DemoStorefront
 * 3. Add onOpenTI prop to DemoStorefront
 * 4. Render AICapabilitiesStrip between ChapterDeck and CatalogBanner
 * 5. Pass onOpenTI={openTI} when DemoStorefront is called
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../src/components/HomeContent.tsx");
let src = fs.readFileSync(file, "utf8");

// ── 1. Add Sparkles + Sun to lucide imports ────────────────────
const LUCIDE_ANCHOR = `  ChevronRight,\n} from "lucide-react";`;
if (!src.includes("Sparkles,")) {
  src = src.replace(
    LUCIDE_ANCHOR,
    `  ChevronRight,\n  Sparkles,\n  Sun,\n  ArrowUpRight,\n} from "lucide-react";`
  );
  console.log("Lucide icons added.");
} else {
  console.log("Icons already present.");
}

// ── 2. Inject AICapabilitiesStrip component before DemoStorefront ─
const COMPONENT_ANCHOR = `// ── Demo Storefront ────────────────────────────────────────────`;
const STRIP_COMPONENT = `// ── AI Capabilities Strip ─────────────────────────────────────
function AICapabilitiesStrip({
  onOpenTI,
}: {
  onOpenTI: (e: React.MouseEvent) => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  const features = [
    {
      Icon: Sparkles,
      tag: "AI Recommendation",
      title: "Find your perfect cup",
      body: "Answer 5 questions about your mood, lifestyle and palate. Third Intelligence — our AI — matches you to the exact bean, brew method and ritual that fits you best.",
      cta: "Try it now",
      onClick: onOpenTI,
      glow: "from-amber-400/15 to-amber-700/5",
      iconBg: "bg-amber-400/15",
      iconColor: "text-amber-300",
      dot: "bg-amber-400",
    },
    {
      Icon: Coffee,
      tag: "Brewing Studio",
      title: "Brew like a barista",
      body: "Step-by-step brew guides for V60, AeroPress, French Press, Espresso and Cold Brew. Set your dose, run the live timer — or let AI craft a signature drink for your exact bean.",
      cta: "Explore beans",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        const el = document.getElementById("section-coffee-beans");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else router.push("/shop");
      },
      glow: "from-orange-400/15 to-orange-700/5",
      iconBg: "bg-orange-400/15",
      iconColor: "text-orange-300",
      dot: "bg-orange-400",
    },
    {
      Icon: Sun,
      tag: "Sip Forecast",
      title: "Your daily cup, forecasted",
      body: "Pick your moment — morning calm, midday focus, late-night quiet — and get an AI-crafted ritual with a flavour arc, food pairing and mood soundtrack matched to your cup.",
      cta: "See easy bags",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        const el = document.getElementById("section-coffee-ecb");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else router.push("/shop");
      },
      glow: "from-sky-400/15 to-sky-700/5",
      iconBg: "bg-sky-400/15",
      iconColor: "text-sky-300",
      dot: "bg-sky-300",
    },
  ] as const;

  return (
    <div ref={ref} className="relative bg-[#130B05] overflow-hidden">
      {/* Subtle radial glow from top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(168,118,68,0.16) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-24 sm:py-32">
        {/* India badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-[10px] font-bold uppercase tracking-[0.38em]">
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{ boxShadow: "0 0 6px 2px rgba(251,191,36,0.55)" }}
            />
            India's only AI coffee companion
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="text-center mb-14 sm:mb-16"
        >
          <h2 className="font-serif font-black text-4xl sm:text-5xl md:text-[3.75rem] leading-[1.02] text-white">
            Not just a shop.
            <br />
            <em className="font-serif italic font-light text-amber-200/70">
              A complete coffee intelligence.
            </em>
          </h2>
          <p className="mt-6 text-white/45 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
            Buy beans. Get a personalised AI recommendation. Follow a barista-level brew guide. Discover your daily sip forecast — all in one place, built for India.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {features.map((feat, i) => (
            <motion.div
              key={feat.tag}
              initial={{ opacity: 0, y: 36 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.18 + i * 0.1 }}
              className="relative group rounded-3xl p-6 sm:p-7 bg-white/[0.035] border border-white/[0.09] hover:border-white/20 transition-all duration-300 flex flex-col gap-5 overflow-hidden cursor-pointer"
              onClick={feat.onClick}
            >
              {/* Card hover glow */}
              <div
                aria-hidden
                className={\`absolute inset-0 bg-gradient-to-br \${feat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none\`}
              />

              {/* Icon row */}
              <div className="relative z-10 flex items-center gap-3">
                <div
                  className={\`w-10 h-10 rounded-2xl flex items-center justify-center \${feat.iconBg}\`}
                >
                  <feat.Icon className={\`w-5 h-5 \${feat.iconColor}\`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={\`w-1 h-1 rounded-full \${feat.dot}\`} />
                  <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/35">
                    {feat.tag}
                  </span>
                </div>
              </div>

              {/* Title + body */}
              <div className="relative z-10 flex-1 space-y-2.5">
                <h3 className="text-[1.2rem] font-bold text-white leading-snug">
                  {feat.title}
                </h3>
                <p className="text-sm text-white/45 leading-relaxed">{feat.body}</p>
              </div>

              {/* CTA */}
              <div className="relative z-10 flex items-center gap-1.5 text-[0.8125rem] font-bold text-amber-300/80 group-hover:text-amber-300 transition-colors">
                {feat.cta}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

`;

if (!src.includes("AICapabilitiesStrip")) {
  src = src.replace(COMPONENT_ANCHOR, STRIP_COMPONENT + COMPONENT_ANCHOR);
  console.log("AICapabilitiesStrip component injected.");
} else {
  console.log("AICapabilitiesStrip already present.");
}

// ── 3. Add onOpenTI prop to DemoStorefront ─────────────────────
const DS_PROP_ANCHOR = `function DemoStorefront({\n  products,\n  onAddToCart,\n}: {\n  products: Product[];\n  onAddToCart: (name: string) => void;\n})`;
const DS_PROP_REPLACEMENT = `function DemoStorefront({\n  products,\n  onAddToCart,\n  onOpenTI,\n}: {\n  products: Product[];\n  onAddToCart: (name: string) => void;\n  onOpenTI: (e: React.MouseEvent) => void;\n})`;

if (!src.includes("onOpenTI,\n}: {\n  products: Product[];")) {
  src = src.replace(DS_PROP_ANCHOR, DS_PROP_REPLACEMENT);
  console.log("DemoStorefront onOpenTI prop added.");
} else {
  console.log("DemoStorefront prop already updated.");
}

// ── 4. Insert <AICapabilitiesStrip> before <CatalogBanner> ──────
const CATALOG_ANCHOR = `      <CatalogBanner`;
const STRIP_INSERT = `      <AICapabilitiesStrip onOpenTI={onOpenTI} />\n\n`;

if (!src.includes("<AICapabilitiesStrip")) {
  src = src.replace(CATALOG_ANCHOR, STRIP_INSERT + CATALOG_ANCHOR);
  console.log("AICapabilitiesStrip rendered before CatalogBanner.");
} else {
  console.log("AICapabilitiesStrip render already present.");
}

// ── 5. Pass onOpenTI when calling DemoStorefront ────────────────
const DS_CALL_ANCHOR = `<DemoStorefront products={products ?? []} onAddToCart={onAddToCart} />`;
const DS_CALL_REPLACEMENT = `<DemoStorefront products={products ?? []} onAddToCart={onAddToCart} onOpenTI={openTI} />`;

if (src.includes(DS_CALL_ANCHOR)) {
  src = src.replace(DS_CALL_ANCHOR, DS_CALL_REPLACEMENT);
  console.log("DemoStorefront call updated with onOpenTI.");
} else {
  console.log("DemoStorefront call already updated.");
}

fs.writeFileSync(file, src, "utf8");
console.log("Done.");
