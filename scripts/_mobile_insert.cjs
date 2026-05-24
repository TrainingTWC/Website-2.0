// Insert MobileHeader before MorphingHeader function
const fs = require("fs");

let src = fs.readFileSync("src/components/MorphingHeader.tsx", "utf8");
const had = src.includes("\r\n");
if (had) src = src.replace(/\r\n/g, "\n");

if (src.includes("function MobileHeader(")) {
  console.log("  (skip) MobileHeader already present");
  process.exit(0);
}

const MOBILE_HEADER = `
// ── MobileHeader (hamburger + glass drawer) ───────────────────
function MobileHeader({
  compact,
  active,
  headerBg,
  headerBorder,
  headerShadow,
  cartCount,
  chapterItems,
  onOpenCart,
  onOpenTI,
  onNavTo,
}: {
  compact: boolean;
  active: string;
  headerBg: any;
  headerBorder: any;
  headerShadow: any;
  cartCount: number;
  chapterItems?: { label: string; target: string }[];
  onOpenCart: () => void;
  onOpenTI: (e: React.MouseEvent) => void;
  onNavTo: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  function navigate(t: string) {
    setOpen(false);
    onNavTo(t);
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  const getDropItems = (key: string) =>
    key === "chapters" ? (chapterItems || []) : (STATIC_DROPDOWNS[key] || []);

  return (
    <>
      {/* Slim top bar */}
      <motion.header
        style={{ backgroundColor: headerBg, borderBottomColor: headerBorder, boxShadow: headerShadow }}
        className="md:hidden pointer-events-auto backdrop-blur-2xl saturate-150 border-b"
      >
        <motion.div
          animate={{ paddingTop: compact ? 8 : 12, paddingBottom: compact ? 8 : 12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 flex items-center justify-between"
        >
          <button
            onClick={() => navigate("hero")}
            aria-label="Third Wave Coffee — home"
            className="flex items-center"
          >
            <motion.img
              src={asset("logo.png")}
              alt="Third Wave Coffee"
              initial={false}
              animate={{ height: compact ? 40 : 60 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-auto"
            />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenCart}
              aria-label="Cart"
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-natural-text/70 hover:bg-natural-muted/50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[1rem] h-4 bg-natural-accent text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5 pointer-events-none">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="w-10 h-10 flex items-center justify-center rounded-full text-natural-text/70 hover:bg-natural-muted/50 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[200] bg-black/30"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.85 }}
              className="fixed top-0 right-0 bottom-0 z-[201] w-[82vw] max-w-[340px] flex flex-col"
              style={{
                background: "rgba(252,251,248,0.88)",
                backdropFilter: "blur(56px) saturate(190%) brightness(1.07)",
                WebkitBackdropFilter: "blur(56px) saturate(190%) brightness(1.07)",
                boxShadow: "-24px 0 80px -16px rgba(44,24,16,0.28), -1px 0 0 rgba(255,255,255,0.55)",
              }}
            >
              <span aria-hidden className="absolute top-0 inset-x-0 h-24 pointer-events-none"
                style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0) 100%)" }} />

              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <button onClick={() => navigate("hero")} aria-label="Home" className="flex items-center">
                  <img src={asset("logo.png")} alt="Third Wave Coffee" className="h-11 w-auto" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-900/10 transition-colors text-natural-text/70"
                >
                  <XIcon className="w-[18px] h-[18px]" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 pb-8 space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const dropItems = getDropItems(item.key);
                  const hasDropdown = dropItems.length > 0;
                  const isExpanded = expandedKey === item.key;
                  const isActive = active === item.key;
                  return (
                    <div key={item.key}>
                      <button
                        onClick={() => {
                          if (hasDropdown) {
                            setExpandedKey(isExpanded ? null : item.key);
                          } else {
                            navigate(item.target);
                          }
                        }}
                        className={\`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left transition-all \${
                          isActive
                            ? "bg-natural-accent/12 text-natural-text font-bold"
                            : "text-natural-text/75 hover:bg-black/5 hover:text-natural-text"
                        }\`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={\`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 \${isActive ? "bg-natural-accent text-white" : "bg-stone-900/7 text-natural-text/55"}\`}>
                            <item.Icon className="w-4 h-4" />
                          </span>
                          <span className="text-[15px] font-bold tracking-[-0.01em]">{item.label}</span>
                        </span>
                        {hasDropdown && (
                          <motion.span
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0"
                          >
                            <ChevronRight className="w-4 h-4 text-natural-text/35" />
                          </motion.span>
                        )}
                      </button>

                      <AnimatePresence initial={false}>
                        {hasDropdown && isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden pl-4"
                          >
                            <div className="space-y-0.5 py-1">
                              {dropItems.map((di) => (
                                <button
                                  key={di.target + di.label}
                                  onClick={() => navigate(di.target)}
                                  className="w-full flex items-start gap-3 px-4 py-2.5 rounded-xl text-left hover:bg-black/5 transition-colors"
                                >
                                  {di.Icon && (
                                    <span className="w-7 h-7 rounded-lg bg-natural-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                                      <di.Icon className="w-3.5 h-3.5 text-natural-accent" />
                                    </span>
                                  )}
                                  <span>
                                    <span className="block text-[13px] font-bold text-natural-text/80">{di.label}</span>
                                    {di.description && (
                                      <span className="block text-[11px] text-natural-text/45 mt-0.5 leading-snug">{di.description}</span>
                                    )}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                <div className="h-px bg-stone-900/8 mx-2 my-3" />

                <button
                  onClick={(e) => { setOpen(false); onOpenTI(e); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left text-natural-text/75 hover:bg-black/5 hover:text-natural-text transition-all"
                >
                  <span className="relative w-8 h-8 rounded-xl bg-stone-900/7 flex items-center justify-center shrink-0">
                    <motion.span
                      animate={{ scale: [1, 1.55], opacity: [0.4, 0] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-xl bg-natural-accent/30"
                    />
                    <img src={asset("third-intelligence-icon.png")} alt="" className="relative z-10 w-4 h-4 object-contain" />
                  </span>
                  <span className="text-[15px] font-bold tracking-[-0.01em]">Third Intelligence</span>
                </button>

                <button
                  onClick={() => { setOpen(false); onOpenCart(); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left text-natural-text/75 hover:bg-black/5 hover:text-natural-text transition-all"
                >
                  <span className="relative w-8 h-8 rounded-xl bg-stone-900/7 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 bg-natural-accent text-white text-[8px] font-black rounded-full flex items-center justify-center px-0.5">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </span>
                  <span className="text-[15px] font-bold tracking-[-0.01em]">
                    Cart{cartCount > 0 ? \` (\${cartCount})\` : ""}
                  </span>
                </button>
              </nav>

              <div className="shrink-0 px-5 pb-8 pt-3 border-t border-stone-900/8">
                <p className="text-[11px] text-natural-text/35 font-medium">Third Wave Coffee · Bengaluru, India</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

`;

// Insert before the MorphingHeader export function
const anchor = "// ── MorphingHeader ─────────────────────────────────────────────";
if (!src.includes(anchor)) {
  console.error("ERROR: anchor not found — " + anchor);
  process.exit(1);
}

src = src.replace(anchor, MOBILE_HEADER + anchor);

if (had) src = src.replace(/\n/g, "\r\n");
fs.writeFileSync("src/components/MorphingHeader.tsx", src, "utf8");
console.log("✓ MobileHeader component inserted");
