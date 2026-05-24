// Add marquee speed control: new Convex key + hook + CMS slider + wire to careers page
const fs = require("fs");

function write(path, src, hadCRLF) {
  if (hadCRLF) src = src.replace(/\n/g, "\r\n");
  fs.writeFileSync(path, src, "utf8");
}

// ── 1) useAboutContent.ts: add useCareerMarqueeSpeed hook ────────────────────
{
  let src = fs.readFileSync("src/lib/useAboutContent.ts", "utf8");
  const had = src.includes("\r\n");
  if (had) src = src.replace(/\r\n/g, "\n");

  // Insert hook after useCareerMarquee
  src = src.replace(
    `export function useCareerMarquee(): string[] {\n  return useListValue<string>("about.careers.marquee", DEFAULT_CAREERS_MARQUEE);\n}`,
    `export function useCareerMarquee(): string[] {\n  return useListValue<string>("about.careers.marquee", DEFAULT_CAREERS_MARQUEE);\n}\n\nexport function useCareerMarqueeSpeed(): number {\n  return useContentValue<number>("about.careers.marqueeSpeed", 28);\n}`
  );

  write("src/lib/useAboutContent.ts", src, had);
  console.log("✓ useAboutContent.ts :: added useCareerMarqueeSpeed");
}

// ── 2) careers/page.tsx: import + use the speed hook ────────────────────────
{
  let src = fs.readFileSync("app/about/careers/page.tsx", "utf8");
  const had = src.includes("\r\n");
  if (had) src = src.replace(/\r\n/g, "\n");

  // Add to import
  src = src.replace(
    `import { useCareerMarquee,`,
    `import { useCareerMarquee, useCareerMarqueeSpeed,`
  );

  // Add hook call (after useCareerMarquee call)
  src = src.replace(
    `  const marqueeItems = useCareerMarquee();`,
    `  const marqueeItems = useCareerMarquee();\n  const marqueeSpeed = useCareerMarqueeSpeed();`
  );

  // Pass speed to MarqueeStrip
  src = src.replace(
    `        <MarqueeStrip\n          items={marqueeItems}\n          variant="accent"\n        />`,
    `        <MarqueeStrip\n          items={marqueeItems}\n          variant="accent"\n          speed={marqueeSpeed}\n        />`
  );

  write("app/about/careers/page.tsx", src, had);
  console.log("✓ careers/page.tsx :: wired marqueeSpeed");
}

// ── 3) AboutCMS.tsx: add speed slider to MarqueeEditor ──────────────────────
{
  let src = fs.readFileSync("src/components/admin/AboutCMS.tsx", "utf8");
  const had = src.includes("\r\n");
  if (had) src = src.replace(/\r\n/g, "\n");

  // Add useCareerMarqueeSpeed to import (it's not imported yet; we'll inline a useMutation + useQuery pattern)
  // Actually the simpler approach: inline a useContentForm for the speed
  // We need to import useMutation + useQuery from convex/react (already imported)
  // Let's add a speed state inside MarqueeEditor using a separate save call pattern

  const OLD_MARQUEE_EDITOR = `function MarqueeEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<string>(
    "about.careers.marquee",
    AboutDefaults.careersMarquee as string[]
  );
  const [text, setText] = useState(items.join("\\n"));
  // keep textarea in sync when convex data hydrates
  useEffect(() => { setText(items.join("\\n")); }, [items.join("\\u0001")]); // eslint-disable-line react-hooks/exhaustive-deps
  async function handleSave() {
    const next = text.split(/\\r?\\n/).map((s) => s.trim()).filter(Boolean);
    setItems(next);
    // give state a tick then save
    setTimeout(async () => { if (await save()) onSave(); }, 0);
  }
  return (
    <section className={PANEL}>
      <div className="flex items-baseline justify-between">
        <div>
          <h4 className="font-serif font-bold text-lg text-stone-800">Banner marquee</h4>
          <p className="text-xs text-stone-500">The scrolling pink banner under the hero. One phrase per line.</p>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">about.careers.marquee</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={TEXTAREA}
        rows={Math.max(6, text.split(/\\r?\\n/).length + 1)}
        placeholder={"NO EXPERIENCE NEEDED\\nDAY 1 PAID TRAINING\\n..."}
      />
      <SaveBar status={status} error={error} onSave={handleSave} onReset={() => { reset(); setText((AboutDefaults.careersMarquee as string[]).join("\\n")); }} />
    </section>
  );
}`;

  const NEW_MARQUEE_EDITOR = `function MarqueeEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<string>(
    "about.careers.marquee",
    AboutDefaults.careersMarquee as string[]
  );
  const [text, setText] = useState(items.join("\\n"));
  // keep textarea in sync when convex data hydrates
  useEffect(() => { setText(items.join("\\n")); }, [items.join("\\u0001")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Speed control — separate Convex key
  const speedData = useQuery(convexApi.siteContent.get, { key: "about.careers.marqueeSpeed" });
  const setContent = useMutation(convexApi.siteContent.set);
  const [speed, setSpeed] = useState(28);
  useEffect(() => {
    const v = speedData?.value;
    if (typeof v === "number") setSpeed(v);
  }, [speedData]);

  async function handleSave() {
    const next = text.split(/\\r?\\n/).map((s) => s.trim()).filter(Boolean);
    setItems(next);
    await setContent({ key: "about.careers.marqueeSpeed", json: speed });
    setTimeout(async () => { if (await save()) onSave(); }, 0);
  }

  // Speed label helper: lower duration = faster scroll
  const speedLabel = speed <= 16 ? "Very fast" : speed <= 24 ? "Fast" : speed <= 35 ? "Medium" : speed <= 50 ? "Slow" : "Very slow";

  return (
    <section className={PANEL}>
      <div className="flex items-baseline justify-between">
        <div>
          <h4 className="font-serif font-bold text-lg text-stone-800">Banner marquee</h4>
          <p className="text-xs text-stone-500">The scrolling pink banner under the hero. One phrase per line.</p>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">about.careers.marquee</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={TEXTAREA}
        rows={Math.max(6, text.split(/\\r?\\n/).length + 1)}
        placeholder={"NO EXPERIENCE NEEDED\\nDAY 1 PAID TRAINING\\n..."}
      />

      {/* Speed control */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-700 uppercase tracking-wide">Scroll speed</label>
          <span className="text-xs font-bold text-natural-accent px-2 py-0.5 rounded-full bg-natural-accent/10">{speedLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-stone-400 font-bold w-8 text-right">Fast</span>
          <input
            type="range"
            min={10}
            max={70}
            step={2}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="flex-1 h-1.5 accent-natural-accent cursor-pointer"
          />
          <span className="text-[10px] text-stone-400 font-bold w-8">Slow</span>
        </div>
        <p className="text-[10px] text-stone-400">Current: {speed}s per loop. Lower = faster scroll.</p>
      </div>

      <SaveBar status={status} error={error} onSave={handleSave} onReset={() => { reset(); setText((AboutDefaults.careersMarquee as string[]).join("\\n")); setSpeed(28); }} />
    </section>
  );
}`;

  if (!src.includes(OLD_MARQUEE_EDITOR)) {
    console.error("ERROR: MarqueeEditor anchor not found — check for CRLF or whitespace differences");
    process.exit(1);
  }

  src = src.replace(OLD_MARQUEE_EDITOR, NEW_MARQUEE_EDITOR);
  write("src/components/admin/AboutCMS.tsx", src, had);
  console.log("✓ AboutCMS.tsx :: MarqueeEditor speed slider added");
}
