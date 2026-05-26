"use strict";
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../src/components/HomeContent.tsx");
let src = fs.readFileSync(filePath, "utf8");

// ── 1. Add X to lucide imports ──────────────────────────────────
src = src.replace(
  `  ShoppingCart,
  Star,
  Coffee,
  ArrowRight,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  ArrowUpRight,
} from "lucide-react";`,
  `  ShoppingCart,
  Star,
  Coffee,
  ArrowRight,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  ArrowUpRight,
  X,
} from "lucide-react";`
);

// ── 2. Add BrewingStudio + SipForecast imports ──────────────────
// Insert after the GuidedTour import line
src = src.replace(
  `import { GuidedTour } from "./GuidedTour";`,
  `import { GuidedTour } from "./GuidedTour";
import { BrewingStudio } from "./BrewingStudio";
import { SipForecast } from "./SipForecast";`
);

// ── 3. Replace the entire AICapabilitiesStrip component ─────────
const stripStart = src.indexOf("// ── AI Capabilities Strip ─────────────────────────────────────");
const stripEnd   = src.indexOf("// ── Demo Storefront ────────────────────────────────────────────");

if (stripStart === -1 || stripEnd === -1) {
  console.error("❌  Could not locate AICapabilitiesStrip block.");
  process.exit(1);
}

const newStrip = `// ── AI Capabilities Strip ─────────────────────────────────────
function AICapabilitiesStrip({
  onOpenTI,
  onOpenBrewingStudio,
  onOpenSipForecast,
}: {
  onOpenTI: (e: React.MouseEvent) => void;
  onOpenBrewingStudio: () => void;
  onOpenSipForecast: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY   = useTransform(scrollYProgress, [0, 1], ["-18%", "18%"]);
  const headY = useTransform(scrollYProgress, [0, 1], ["10%",  "-10%"]);
  const glowY = useTransform(scrollYProgress, [0, 1], ["-28%", "28%"]);

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
      cta: "Open Brewing Studio",
      onClick: (_e: React.MouseEvent) => onOpenBrewingStudio(),
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
      cta: "Open Sip Forecast",
      onClick: (_e: React.MouseEvent) => onOpenSipForecast(),
      glow: "from-sky-400/15 to-sky-700/5",
      iconBg: "bg-sky-400/15",
      iconColor: "text-sky-300",
      dot: "bg-sky-300",
    },
  ] as const;

  return (
    <div ref={ref} className="relative bg-[#130B05] overflow-hidden">
      {/* Parallax glow layer — drifts at 2× speed */}
      <motion.div
        aria-hidden
        style={{ y: glowY }}
        className="pointer-events-none absolute -inset-y-[20%] inset-x-0"
      >
        <div
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(168,118,68,0.18) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* Parallax wordmark — subtle depth layer */}
      <div className="relative overflow-hidden">
        <motion.div
          aria-hidden
          style={{ y: bgY }}
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center select-none"
        >
          <span className="font-serif font-black text-[clamp(5rem,22vw,18rem)] leading-none tracking-tight text-white/[0.025]">
            INTELLIGENCE
          </span>
        </motion.div>

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

          {/* Parallax headline group */}
          <motion.div style={{ y: headY }} className="text-center mb-14 sm:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.08 }}
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
                  <div className={\`w-10 h-10 rounded-2xl flex items-center justify-center \${feat.iconBg}\`}>
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
                  <h3 className="text-[1.2rem] font-bold text-white leading-snug">{feat.title}</h3>
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
    </div>
  );
}

// ── Tools Overlay ──────────────────────────────────────────────
type ToolPanel = "brewing-studio" | "sip-forecast" | null;

function ToolsOverlay({
  tool,
  onClose,
}: {
  tool: ToolPanel;
  onClose: () => void;
}) {
  const [bagKind, setBagKind] = useState<"drip-bag" | "cold-brew">("drip-bag");

  // Escape key
  useEffect(() => {
    if (!tool) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tool, onClose]);

  // Scroll-lock
  useEffect(() => {
    if (tool) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [tool]);

  return (
    <AnimatePresence>
      {tool && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[60] flex flex-col items-center bg-black/75 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: "3%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "3%", opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl bg-natural-bg text-natural-text rounded-t-3xl mt-16 sm:mt-20 flex flex-col shadow-2xl min-h-[calc(100vh-5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-white/10 bg-natural-bg/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  {tool === "brewing-studio"
                    ? <Coffee className="w-4 h-4 text-amber-400" />
                    : <Sun className="w-4 h-4 text-sky-400" />
                  }
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.38em] text-natural-text/35 leading-none mb-0.5">
                    AI Tool
                  </p>
                  <h2 className="text-base font-bold leading-none">
                    {tool === "brewing-studio" ? "Brewing Studio" : "Sip Forecast"}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {tool === "sip-forecast" && (
                  <div className="flex rounded-xl overflow-hidden border border-white/15 text-[11px] font-bold">
                    {(["drip-bag", "cold-brew"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setBagKind(k)}
                        className={\`px-3 py-1.5 transition-colors \${
                          bagKind === k
                            ? "bg-natural-text text-natural-bg"
                            : "bg-white/5 text-natural-text/55 hover:text-natural-text"
                        }\`}
                      >
                        {k === "drip-bag" ? "Drip Bag" : "Cold Brew"}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={onClose}
                  aria-label="Close tool"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tool body */}
            <div className="flex-1">
              {tool === "brewing-studio" && (
                <BrewingStudio
                  productName="Your Coffee"
                  flavorNotes={[]}
                  accentHex="#a87644"
                />
              )}
              {tool === "sip-forecast" && (
                <SipForecast
                  productName="Easy Coffee Bag"
                  flavorNotes={[]}
                  bagKind={bagKind}
                  accentHex="#a87644"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

`;

src = src.slice(0, stripStart) + newStrip + src.slice(stripEnd);

// ── 4. Update DemoStorefront props ──────────────────────────────
src = src.replace(
  `function DemoStorefront({
  products,
  onAddToCart,
  onOpenTI,
}: {
  products: Product[];
  onAddToCart: (name: string) => void;
  onOpenTI: (e: React.MouseEvent) => void;
})`,
  `function DemoStorefront({
  products,
  onAddToCart,
  onOpenTI,
  onOpenBrewingStudio,
  onOpenSipForecast,
}: {
  products: Product[];
  onAddToCart: (name: string) => void;
  onOpenTI: (e: React.MouseEvent) => void;
  onOpenBrewingStudio: () => void;
  onOpenSipForecast: () => void;
})`
);

// ── 5. Update AICapabilitiesStrip call inside DemoStorefront ────
src = src.replace(
  `<AICapabilitiesStrip onOpenTI={onOpenTI} />`,
  `<AICapabilitiesStrip onOpenTI={onOpenTI} onOpenBrewingStudio={onOpenBrewingStudio} onOpenSipForecast={onOpenSipForecast} />`
);

// ── 6. Add toolPanel state next to tiOpen state ─────────────────
src = src.replace(
  `  const [tiOpen, setTiOpen] = useState(false);`,
  `  const [tiOpen, setTiOpen] = useState(false);
  const [toolPanel, setToolPanel] = useState<ToolPanel>(null);`
);

// ── 7. Update DemoStorefront render call ────────────────────────
src = src.replace(
  `<DemoStorefront products={products ?? []} onAddToCart={onAddToCart} onOpenTI={openTI} />`,
  `<DemoStorefront
              products={products ?? []}
              onAddToCart={onAddToCart}
              onOpenTI={openTI}
              onOpenBrewingStudio={() => setToolPanel("brewing-studio")}
              onOpenSipForecast={() => setToolPanel("sip-forecast")}
            />`
);

// ── 8. Add ToolsOverlay render next to TI overlay ───────────────
src = src.replace(
  `        {/* TI overlay (replaces the ?page=ti full-page route) */}
        {tiOpen && (`,
  `        {/* Tools overlay — Brewing Studio + Sip Forecast standalone */}
        <ToolsOverlay tool={toolPanel} onClose={() => setToolPanel(null)} />

        {/* TI overlay (replaces the ?page=ti full-page route) */}
        {tiOpen && (`
);

fs.writeFileSync(filePath, src, "utf8");
console.log("✅  HomeContent.tsx patched — standalone tools + parallax strip ready.");
