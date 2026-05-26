"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

// ── 1. useAboutContent.ts — add useApplyLink hook ───────────────
const hooksPath = path.join(ROOT, "src/lib/useAboutContent.ts");
let hooks = fs.readFileSync(hooksPath, "utf8");

// Insert after useCareerStats
hooks = hooks.replace(
  `export function useCareerStats(): CareerStat[] {
  return useListValue<CareerStat>("about.careers.stats", DEFAULT_CAREERS_STATS);
}`,
  `export function useCareerStats(): CareerStat[] {
  return useListValue<CareerStat>("about.careers.stats", DEFAULT_CAREERS_STATS);
}
export function useApplyLink(): string {
  return useContentValue<string>("about.careers.applyLink", "mailto:careers@brewmatch.in");
}`
);

// Add to AboutDefaults export
hooks = hooks.replace(
  `  careersStats: DEFAULT_CAREERS_STATS,`,
  `  careersStats: DEFAULT_CAREERS_STATS,
  applyLink: "mailto:careers@brewmatch.in",`
);

fs.writeFileSync(hooksPath, hooks, "utf8");
console.log("✅  useAboutContent.ts — useApplyLink added");

// ── 2. careers/page.tsx — use the hook ─────────────────────────
const pagePath = path.join(ROOT, "app/about/careers/page.tsx");
let page = fs.readFileSync(pagePath, "utf8");

// Add useApplyLink to the imports from useAboutContent
page = page.replace(
  `  useCareersHero,`,
  `  useCareersHero,
  useApplyLink,`
);

// Use it in the component body (after the last existing hook call)
page = page.replace(
  `  const statTiles = useCareerStats();`,
  `  const statTiles = useCareerStats();
  const applyLink = useApplyLink();`
);

// Replace hardcoded mailto href in the Apply CTA
page = page.replace(
  `              href="mailto:careers@brewmatch.in"`,
  `              href={applyLink}`
);

fs.writeFileSync(pagePath, page, "utf8");
console.log("✅  careers/page.tsx — applyLink wired");

// ── 3. AboutCMS.tsx — add ApplyLinkEditor ───────────────────────
const cmsPath = path.join(ROOT, "src/components/admin/AboutCMS.tsx");
let cms = fs.readFileSync(cmsPath, "utf8");

// Add the editor component after the CareersEditors function (before CoffeeSchoolEditor)
cms = cms.replace(
  `function CoffeeSchoolEditor({ onSave }: { onSave: () => void }) {`,
  `function ApplyLinkEditor({ onSave }: { onSave: () => void }) {
  const { form, setForm, save, reset, status, error } = useContentForm<string>(
    "about.careers.applyLink",
    "mailto:careers@brewmatch.in"
  );
  async function handleSave() { if (await save()) onSave(); }
  return (
    <section className={PANEL}>
      <div className="flex items-baseline justify-between">
        <div>
          <h4 className="font-serif font-bold text-lg text-stone-800">Apply CTA link</h4>
          <p className="text-xs text-stone-500">
            The "Send your application" button URL. Use a mailto: address, a Google Form, Notion form, or any URL.
          </p>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">about.careers.applyLink</span>
      </div>
      <div>
        <label className={LABEL}>Link URL</label>
        <input
          value={form}
          onChange={(e) => setForm(e.target.value)}
          className={INPUT}
          placeholder="mailto:careers@brewmatch.in  or  https://forms.gle/…"
        />
        <p className="mt-1 text-[11px] text-stone-400">
          Examples: <code>mailto:jobs@yourdomain.com</code> · <code>https://forms.gle/abc123</code> · <code>https://airtable.com/…</code>
        </p>
      </div>
      <SaveBar status={status} error={error} onSave={handleSave} onReset={() => reset()} />
    </section>
  );
}

function CoffeeSchoolEditor({ onSave }: { onSave: () => void }) {`
);

// Add ApplyLinkEditor to CareersEditors
cms = cms.replace(
  `      <HeroEditor storageKey="about.careers.hero" defaults={AboutDefaults.careersHero} onSave={onSave} />
      <MarqueeEditor onSave={onSave} />
      <StatsEditor onSave={onSave} />
      <CoffeeSchoolEditor onSave={onSave} />`,
  `      <HeroEditor storageKey="about.careers.hero" defaults={AboutDefaults.careersHero} onSave={onSave} />
      <ApplyLinkEditor onSave={onSave} />
      <MarqueeEditor onSave={onSave} />
      <StatsEditor onSave={onSave} />
      <CoffeeSchoolEditor onSave={onSave} />`
);

fs.writeFileSync(cmsPath, cms, "utf8");
console.log("✅  AboutCMS.tsx — ApplyLinkEditor added to Careers tab");
