import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Plus,
  Trash2,
  Save,
  ImagePlus,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  AboutDefaults,
  BENEFIT_ICON_OPTIONS,
  type AboutHero,
  type Founder,
  type CoffeeRegion,
  type CareerRole,
  type CareerBenefit,
  type CareerStory,
  type CareerStat,
  type CoffeeSchoolCard,
  type CoffeeSchool,
  type OrientationModule,
  type PressItem,
  type FactItem,
} from "../../lib/useAboutContent";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convexApi = api as any;

// ─── shared styles ─────────────────────────────────────────────────────────
const INPUT =
  "w-full px-3 py-2 rounded-lg border border-stone-200 outline-none focus:ring-2 ring-natural-accent/20 bg-white text-sm";
const TEXTAREA = INPUT + " resize-y min-h-[80px]";
const LABEL =
  "block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1";
const PANEL =
  "rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_rgba(20,20,20,0.06)] p-5 space-y-4";
const BTN_PRIMARY =
  "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition disabled:opacity-50";
const BTN_GHOST =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-stone-200 bg-white text-xs text-stone-700 hover:bg-stone-50 transition";
const BTN_DANGER =
  "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-rose-600 hover:bg-rose-50 transition";

type PageId = "story" | "coffee" | "careers" | "newsroom";

interface PageDef {
  id: PageId;
  label: string;
  url: string;
}

const PAGES: PageDef[] = [
  { id: "story", label: "Our Story", url: "/about/our-story" },
  { id: "coffee", label: "Our Coffee", url: "/about/our-coffee" },
  { id: "careers", label: "Careers", url: "/about/careers" },
  { id: "newsroom", label: "Newsroom", url: "/about/newsroom" },
];

export function AboutCMS({ page }: { page?: PageId } = {}) {
  const [active, setActive] = useState<PageId>(page ?? "story");
  // Keep external page in sync if it changes
  useEffect(() => { if (page) setActive(page); }, [page]);
  const showPageTabs = !page;
  const [showPreview, setShowPreview] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const activePage = PAGES.find((p) => p.id === active)!;

  // Bump iframe to reflect saved changes
  function refreshPreview() {
    setRefreshTick((t) => t + 1);
  }

  return (
    <div className="relative p-6 space-y-6">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0)_60%)]" />

      {/* Header */}
      <div className="relative rounded-3xl border border-white/55 bg-white/65 backdrop-blur-xl p-6 shadow-[0_24px_70px_rgba(24,24,24,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-3xl font-serif font-bold tracking-tight text-stone-800">
              Website Content Studio
            </h3>
            <p className="text-sm text-stone-500 mt-1">
              Edit any about page — hero, lists, images — with a live preview.
            </p>
          </div>
          <button
            onClick={() => setShowPreview((s) => !s)}
            className={BTN_GHOST}
            title={showPreview ? "Hide live preview" : "Show live preview"}
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
        </div>

        {showPageTabs && (
          <div className="mt-5 flex flex-wrap gap-2">
            {PAGES.map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={
                  "px-4 py-2 rounded-full text-xs font-bold tracking-wide border transition " +
                  (active === p.id
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white/80 text-stone-700 border-stone-200 hover:bg-white")
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Split layout: editors left, preview right */}
      <div
        className={
          "relative grid gap-6 " +
          (showPreview ? "grid-cols-1 xl:grid-cols-[1fr_560px]" : "grid-cols-1")
        }
      >
        <div className="space-y-6 min-w-0">
          {active === "story" && <StoryEditors onSave={refreshPreview} />}
          {active === "coffee" && <CoffeeEditors onSave={refreshPreview} />}
          {active === "careers" && <CareersEditors onSave={refreshPreview} />}
          {active === "newsroom" && <NewsroomEditors onSave={refreshPreview} />}
        </div>

        {showPreview && (
          <div className="xl:sticky xl:top-4 self-start">
            <div className="rounded-2xl border border-stone-200 bg-white shadow-[0_20px_60px_rgba(20,20,20,0.08)] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100 bg-stone-50/80 text-xs">
                <div className="font-mono text-stone-500 truncate">{activePage.url}</div>
                <div className="flex items-center gap-1">
                  <button onClick={refreshPreview} className={BTN_GHOST} title="Refresh preview">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                  <a href={activePage.url} target="_blank" rel="noreferrer" className={BTN_GHOST}>
                    <ExternalLink className="w-3 h-3" /> Open
                  </a>
                </div>
              </div>
              <iframe
                ref={previewRef}
                key={`${active}-${refreshTick}`}
                src={activePage.url}
                title={`Preview ${activePage.label}`}
                className="w-full h-[78vh] bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//                   GENERIC SAVE HOOK + UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

function useContentForm<T>(key: string, initial: T) {
  const entry = useQuery(convexApi.siteContent.get, { key });
  const setContent = useMutation(convexApi.siteContent.set);
  const [form, setForm] = useState<T>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const hydrated = useRef(false);

  useEffect(() => {
    if (entry === undefined) return; // loading
    if (hydrated.current) return;
    hydrated.current = true;
    if (entry && entry.value) {
      setForm(entry.value as T);
    }
  }, [entry]);

  async function save(payload?: T) {
    setStatus("saving");
    setError("");
    try {
      const value = payload ?? form;
      await setContent({ key, json: JSON.stringify(value) });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1800);
      return true;
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? "Save failed");
      return false;
    }
  }

  function reset() {
    setForm(initial);
    hydrated.current = true;
  }

  return { form, setForm, save, reset, status, error };
}

function SaveBar({
  status,
  error,
  onSave,
  onReset,
}: {
  status: "idle" | "saving" | "saved" | "error";
  error?: string;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <div className="text-xs">
        {status === "saving" && <span className="text-stone-500">Saving…</span>}
        {status === "saved" && <span className="text-emerald-600 font-semibold">✓ Saved</span>}
        {status === "error" && <span className="text-rose-600">{error || "Save failed"}</span>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onReset} className={BTN_GHOST} title="Reset to defaults">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        <button onClick={onSave} className={BTN_PRIMARY} disabled={status === "saving"}>
          <Save className="w-4 h-4" /> Save changes
        </button>
      </div>
    </div>
  );
}

// Image upload (returns absolute storage URL string usable directly)
function useImageUpload() {
  const generateUploadUrl = useMutation(convexApi.siteContent.generateUploadUrl);
  const convex = useConvex();

  async function upload(file: File): Promise<string> {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: file,
      headers: { "Content-Type": file.type },
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const { storageId } = await res.json();
    if (!storageId) throw new Error("No storageId");
    const url: string = await convex.query(convexApi.siteContent.getStorageUrl, { storageId });
    return url;
  }

  return { upload };
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const { upload } = useImageUpload();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const url = await upload(file);
      onChange(url);
    } catch (ex: any) {
      setErr(ex?.message ?? "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or paste URL"
            className={INPUT}
          />
          {err && <div className="text-xs text-rose-600 mt-1">{err}</div>}
        </div>
        <label
          className={
            "shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-white text-xs font-semibold cursor-pointer hover:bg-stone-50 transition " +
            (busy ? "opacity-50 pointer-events-none" : "")
          }
        >
          <ImagePlus className="w-3.5 h-3.5" />
          {busy ? "Uploading…" : "Upload"}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="mt-2 w-32 h-20 object-cover rounded-md border border-stone-200"
        />
      )}
    </div>
  );
}

// Generic list editor — handles add/remove/reorder
function ListEditor<T>({
  title,
  items,
  setItems,
  defaultItem,
  renderItem,
  itemLabel = (idx) => `Item ${idx + 1}`,
}: {
  title: string;
  items: T[];
  setItems: (next: T[]) => void;
  defaultItem: T;
  renderItem: (item: T, update: (patch: Partial<T>) => void, idx: number) => React.ReactNode;
  itemLabel?: (idx: number, item: T) => string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  function add() {
    const next = [...items, structuredClone(defaultItem)];
    setItems(next);
    setOpenIdx(next.length - 1);
  }
  function remove(i: number) {
    if (!confirm(`Delete ${itemLabel(i, items[i])}?`)) return;
    setItems(items.filter((_, k) => k !== i));
    if (openIdx === i) setOpenIdx(null);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  }
  function update(i: number, patch: Partial<T>) {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    setItems(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-bold text-stone-800">{title}</h4>
        <button onClick={add} className={BTN_GHOST}>
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => {
          const open = openIdx === i;
          return (
            <div key={i} className="border border-stone-200 rounded-xl bg-white overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-stone-50/80">
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="text-sm font-semibold text-stone-700 flex-1 text-left"
                >
                  {open ? "▾" : "▸"} {itemLabel(i, item)}
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => move(i, -1)} className={BTN_GHOST} disabled={i === 0}>
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    className={BTN_GHOST}
                    disabled={i === items.length - 1}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button onClick={() => remove(i)} className={BTN_DANGER}>
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
              {open && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-stone-100">
                  {renderItem(item, (p) => update(i, p), i)}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="text-xs text-stone-400 italic px-2 py-3">No items yet. Click Add.</div>
        )}
      </div>
    </div>
  );
}

// Reusable hero editor — common across all pages
function HeroEditor({
  storageKey,
  defaults,
  onSave,
  showAccent = true,
  showSticker = true,
}: {
  storageKey: string;
  defaults: AboutHero;
  onSave: () => void;
  showAccent?: boolean;
  showSticker?: boolean;
}) {
  const { form, setForm, save, reset, status, error } = useContentForm<AboutHero>(
    storageKey,
    defaults
  );

  function update(patch: Partial<AboutHero>) {
    setForm({ ...form, ...patch });
  }

  async function handleSave() {
    if (await save()) onSave();
  }

  return (
    <section className={PANEL}>
      <h4 className="text-lg font-bold text-stone-800">Hero</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Eyebrow</label>
          <input
            value={form.eyebrow}
            onChange={(e) => update({ eyebrow: e.target.value })}
            className={INPUT}
          />
        </div>
        {showSticker && (
          <div>
            <label className={LABEL}>Sticker text</label>
            <input
              value={form.stickerText ?? ""}
              onChange={(e) => update({ stickerText: e.target.value })}
              className={INPUT}
            />
          </div>
        )}
        <div className="md:col-span-2">
          <label className={LABEL}>Title</label>
          <textarea
            value={form.title}
            onChange={(e) => update({ title: e.target.value })}
            className={TEXTAREA}
            rows={2}
          />
        </div>
        <div className="md:col-span-2">
          <label className={LABEL}>Tagline</label>
          <textarea
            value={form.tagline}
            onChange={(e) => update({ tagline: e.target.value })}
            className={TEXTAREA}
            rows={2}
          />
        </div>
        {showAccent && (
          <div>
            <label className={LABEL}>Accent word (highlighted in title)</label>
            <input
              value={form.accentWord ?? ""}
              onChange={(e) => update({ accentWord: e.target.value })}
              className={INPUT}
            />
          </div>
        )}
        <div className="md:col-span-2">
          <ImageField
            label="Hero image"
            value={form.imageUrl}
            onChange={(url) => update({ imageUrl: url })}
          />
        </div>
      </div>
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

// Generic items wrapper (saved as `{ items: T[] }` per useListValue contract)
function useItemsForm<T>(key: string, initial: T[]) {
  const inner = useContentForm<{ items: T[] }>(key, { items: initial });
  return {
    items: inner.form.items,
    setItems: (items: T[]) => inner.setForm({ items }),
    save: inner.save,
    reset: inner.reset,
    status: inner.status,
    error: inner.error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//                            PAGE EDITORS
// ═══════════════════════════════════════════════════════════════════════════

// ─── OUR STORY ─────────────────────────────────────────────────────────────
function StoryEditors({ onSave }: { onSave: () => void }) {
  return (
    <>
      <HeroEditor storageKey="about.story.hero" defaults={AboutDefaults.storyHero} onSave={onSave} />
      <FoundersEditor onSave={onSave} />
    </>
  );
}

function FoundersEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<Founder>(
    "about.story.founders",
    AboutDefaults.founders as Founder[]
  );
  async function handleSave() {
    if (await save()) onSave();
  }
  return (
    <section className={PANEL}>
      <ListEditor<Founder>
        title="Founders / Team"
        items={items}
        setItems={setItems}
        itemLabel={(idx, it) => it.name || `Founder ${idx + 1}`}
        defaultItem={{ name: "", role: "", image: "", bio: "", quote: "", note: "" }}
        renderItem={(item, update) => (
          <>
            <div>
              <label className={LABEL}>Name</label>
              <input value={item.name} onChange={(e) => update({ name: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Role</label>
              <input value={item.role} onChange={(e) => update({ role: e.target.value })} className={INPUT} />
            </div>
            <div className="md:col-span-2">
              <ImageField label="Portrait" value={item.image} onChange={(url) => update({ image: url })} />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Bio</label>
              <textarea value={item.bio} onChange={(e) => update({ bio: e.target.value })} className={TEXTAREA} rows={3} />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Pull-quote</label>
              <textarea value={item.quote} onChange={(e) => update({ quote: e.target.value })} className={TEXTAREA} rows={2} />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Note (footer line)</label>
              <input value={item.note} onChange={(e) => update({ note: e.target.value })} className={INPUT} />
            </div>
          </>
        )}
      />
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

// ─── OUR COFFEE ────────────────────────────────────────────────────────────
function CoffeeEditors({ onSave }: { onSave: () => void }) {
  return (
    <>
      <HeroEditor storageKey="about.coffee.hero" defaults={AboutDefaults.coffeeHero} onSave={onSave} />
      <RegionsEditor onSave={onSave} />
    </>
  );
}

function RegionsEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<CoffeeRegion>(
    "about.coffee.regions",
    AboutDefaults.regions as CoffeeRegion[]
  );
  async function handleSave() {
    if (await save()) onSave();
  }
  return (
    <section className={PANEL}>
      <ListEditor<CoffeeRegion>
        title="Coffee Regions"
        items={items}
        setItems={setItems}
        itemLabel={(idx, it) => it.name || `Region ${idx + 1}`}
        defaultItem={{ name: "", elevation: "", varietals: "", harvest: "", profile: "", estates: "", image: "" }}
        renderItem={(item, update) => (
          <>
            <div>
              <label className={LABEL}>Region name</label>
              <input value={item.name} onChange={(e) => update({ name: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Elevation</label>
              <input value={item.elevation} onChange={(e) => update({ elevation: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Varietals</label>
              <input value={item.varietals} onChange={(e) => update({ varietals: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Harvest window</label>
              <input value={item.harvest} onChange={(e) => update({ harvest: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Estates count / label</label>
              <input value={item.estates} onChange={(e) => update({ estates: e.target.value })} className={INPUT} />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Tasting profile</label>
              <textarea value={item.profile} onChange={(e) => update({ profile: e.target.value })} className={TEXTAREA} rows={2} />
            </div>
            <div className="md:col-span-2">
              <ImageField label="Region image" value={item.image} onChange={(url) => update({ image: url })} />
            </div>
          </>
        )}
      />
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

// ─── CAREERS ───────────────────────────────────────────────────────────────
function CareersEditors({ onSave }: { onSave: () => void }) {
  return (
    <>
      <HeroEditor storageKey="about.careers.hero" defaults={AboutDefaults.careersHero} onSave={onSave} />
      <MarqueeEditor onSave={onSave} />
      <StatsEditor onSave={onSave} />
      <CoffeeSchoolEditor onSave={onSave} />
      <OrientationEditor onSave={onSave} />
      <RolesEditor onSave={onSave} />
      <BenefitsEditor onSave={onSave} />
      <StoriesEditor onSave={onSave} />
    </>
  );
}


function CoffeeSchoolEditor({ onSave }: { onSave: () => void }) {
  const { form, setForm, save, reset, status, error } = useContentForm<CoffeeSchool>(
    "about.careers.coffeeSchool",
    AboutDefaults.coffeeSchool as CoffeeSchool
  );
  async function handleSave() { if (await save()) onSave(); }
  function updateCard(i: number, patch: Partial<CoffeeSchoolCard>) {
    const next = form.cards.map((c, idx) => idx === i ? { ...c, ...patch } : c);
    setForm({ ...form, cards: next });
  }
  function addCard() { setForm({ ...form, cards: [...form.cards, { number: String(form.cards.length + 1).padStart(2, "0"), title: "", description: "" }] }); }
  function removeCard(i: number) { setForm({ ...form, cards: form.cards.filter((_, idx) => idx !== i) }); }
  return (
    <section className={PANEL}>
      <div className="flex items-baseline justify-between">
        <div>
          <h4 className="font-serif font-bold text-lg text-stone-800">Coffee School section</h4>
          <p className="text-xs text-stone-500">The pink "3 paid weeks" band and its curriculum cards.</p>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">about.careers.coffeeSchool</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Eyebrow</label>
          <input value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} className={INPUT} placeholder="Before day one" />
        </div>
        <div>
          <label className={LABEL}>Headline (use \n for line break)</label>
          <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className={INPUT} placeholder="3 paid
weeks." />
        </div>
        <div className="md:col-span-2">
          <label className={LABEL}>Tagline</label>
          <textarea value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={TEXTAREA} rows={2} />
        </div>
      </div>
      <div className="space-y-3 mt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Curriculum cards</p>
          <button onClick={addCard} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-700 transition-colors">
            + Add card
          </button>
        </div>
        {form.cards.map((card, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-[64px_1fr_1fr_32px] gap-3 items-start p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div>
              <label className={LABEL}>No.</label>
              <input value={card.number} onChange={(e) => updateCard(i, { number: e.target.value })} className={INPUT} placeholder="01" />
            </div>
            <div>
              <label className={LABEL}>Title</label>
              <input value={card.title} onChange={(e) => updateCard(i, { title: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Description</label>
              <input value={card.description} onChange={(e) => updateCard(i, { description: e.target.value })} className={INPUT} />
            </div>
            <button onClick={() => removeCard(i)} className="mt-6 text-stone-400 hover:text-rose-500 transition-colors" title="Remove">✕</button>
          </div>
        ))}
      </div>
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

function OrientationEditor({ onSave }: { onSave: () => void }) {
  const { form, setForm, save, reset, status, error } = useContentForm<OrientationModule>(
    "about.careers.orientation",
    AboutDefaults.orientation as OrientationModule
  );
  async function handleSave() { if (await save()) onSave(); }
  return (
    <section className={PANEL}>
      <div className="flex items-baseline justify-between">
        <div>
          <h4 className="font-serif font-bold text-lg text-stone-800">Orientation / Training module</h4>
          <p className="text-xs text-stone-500">The viewer card shown on the Careers page. Paste a hosted URL below to replace the built-in SCORM player.</p>
        </div>
        <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold">about.careers.orientation</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Section eyebrow</label>
          <input value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} className={INPUT} placeholder="Before you apply" />
        </div>
        <div>
          <label className={LABEL}>Module title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={INPUT} placeholder="Company Orientation" />
        </div>
        <div>
          <label className={LABEL}>Duration label</label>
          <input value={form.durationLabel} onChange={(e) => setForm({ ...form, durationLabel: e.target.value })} className={INPUT} placeholder="~20 min" />
        </div>
        <div>
          <label className={LABEL}>Launch URL</label>
          <input
            value={form.launchUrl}
            onChange={(e) => setForm({ ...form, launchUrl: e.target.value })}
            className={INPUT}
            placeholder="https://cdn.example.com/orientation/index.html (leave blank for local)"
          />
          <p className="text-[11px] text-stone-400 mt-1">
            Supports: Hosted SCORM, HTML, Articulate Storyline, Rise 360, or any hosted URL.
            Leave blank to use the built-in /scorm/orientation/ package.
          </p>
        </div>
        <div className="md:col-span-2">
          <label className={LABEL}>Section intro text</label>
          <textarea value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} className={TEXTAREA} rows={2} />
        </div>
        <div className="md:col-span-2">
          <label className={LABEL}>Module description (shown in the viewer card)</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={TEXTAREA} rows={2} />
        </div>
      </div>
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

function MarqueeEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<string>(
    "about.careers.marquee",
    AboutDefaults.careersMarquee as string[]
  );
  const [text, setText] = useState(items.join("\n"));
  // keep textarea in sync when convex data hydrates
  useEffect(() => { setText(items.join("\n")); }, [items.join("\u0001")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Speed control — separate Convex key
  const speedData = useQuery(convexApi.siteContent.get, { key: "about.careers.marqueeSpeed" });
  const setContent = useMutation(convexApi.siteContent.set);
  const [speed, setSpeed] = useState(28);
  useEffect(() => {
    const v = speedData?.value;
    if (typeof v === "number") setSpeed(v);
  }, [speedData]);

  async function handleSave() {
    const next = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    setItems(next);
    await setContent({ key: "about.careers.marqueeSpeed", json: JSON.stringify(speed) });
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
        rows={Math.max(6, text.split(/\r?\n/).length + 1)}
        placeholder={"NO EXPERIENCE NEEDED\nDAY 1 PAID TRAINING\n..."}
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

      <SaveBar status={status} error={error} onSave={handleSave} onReset={() => { reset(); setText((AboutDefaults.careersMarquee as string[]).join("\n")); setSpeed(28); }} />
    </section>
  );
}

function StatsEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<CareerStat>(
    "about.careers.stats",
    AboutDefaults.careersStats as CareerStat[]
  );
  async function handleSave() {
    if (await save()) onSave();
  }
  return (
    <section className={PANEL}>
      <ListEditor<CareerStat>
        title="Stat tiles (dark band)"
        items={items}
        setItems={setItems}
        itemLabel={(idx, it) => it.value || `Stat ${idx + 1}`}
        defaultItem={{ value: "", label: "" }}
        renderItem={(item, update) => (
          <>
            <div>
              <label className={LABEL}>Big number / phrase</label>
              <input value={item.value} onChange={(e) => update({ value: e.target.value })} className={INPUT} placeholder="Rs 3.6L+" />
            </div>
            <div>
              <label className={LABEL}>Caption</label>
              <input value={item.label} onChange={(e) => update({ label: e.target.value })} className={INPUT} placeholder="starting pay" />
            </div>
          </>
        )}
      />
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

function RolesEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<CareerRole>(
    "about.careers.roles",
    AboutDefaults.roles as CareerRole[]
  );
  async function handleSave() {
    if (await save()) onSave();
  }
  return (
    <section className={PANEL}>
      <ListEditor<CareerRole>
        title="Open Roles"
        items={items}
        setItems={setItems}
        itemLabel={(idx, it) => it.title || `Role ${idx + 1}`}
        defaultItem={{ title: "", team: "", location: "", salary: "", experience: "", posted: "" }}
        renderItem={(item, update) => (
          <>
            <div className="md:col-span-2">
              <label className={LABEL}>Role title</label>
              <input value={item.title} onChange={(e) => update({ title: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Team</label>
              <input value={item.team} onChange={(e) => update({ team: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Location</label>
              <input value={item.location} onChange={(e) => update({ location: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Salary range</label>
              <input value={item.salary} onChange={(e) => update({ salary: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Experience</label>
              <input value={item.experience} onChange={(e) => update({ experience: e.target.value })} className={INPUT} />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Posted label (e.g. "2 days ago")</label>
              <input value={item.posted} onChange={(e) => update({ posted: e.target.value })} className={INPUT} />
            </div>
          </>
        )}
      />
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

function BenefitsEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<CareerBenefit>(
    "about.careers.benefits",
    AboutDefaults.benefits as CareerBenefit[]
  );
  async function handleSave() {
    if (await save()) onSave();
  }
  const colorOptions = useMemo(
    () => [
      { value: "bg-rose-50 border-rose-200", iconColor: "text-rose-500", label: "Rose" },
      { value: "bg-violet-50 border-violet-200", iconColor: "text-violet-500", label: "Violet" },
      { value: "bg-sky-50 border-sky-200", iconColor: "text-sky-500", label: "Sky" },
      { value: "bg-amber-50 border-amber-200", iconColor: "text-amber-600", label: "Amber" },
      { value: "bg-orange-50 border-orange-200", iconColor: "text-orange-500", label: "Orange" },
      { value: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-500", label: "Emerald" },
      { value: "bg-pink-50 border-pink-200", iconColor: "text-pink-500", label: "Pink" },
      { value: "bg-stone-50 border-stone-200", iconColor: "text-stone-600", label: "Stone" },
    ],
    []
  );
  return (
    <section className={PANEL}>
      <ListEditor<CareerBenefit>
        title="Benefits"
        items={items}
        setItems={setItems}
        itemLabel={(idx, it) => it.title || `Benefit ${idx + 1}`}
        defaultItem={{
          iconKey: "Heart",
          title: "",
          detail: "",
          color: "bg-rose-50 border-rose-200",
          iconColor: "text-rose-500",
        }}
        renderItem={(item, update) => (
          <>
            <div>
              <label className={LABEL}>Icon</label>
              <select
                value={item.iconKey}
                onChange={(e) => update({ iconKey: e.target.value })}
                className={INPUT}
              >
                {BENEFIT_ICON_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Color theme</label>
              <select
                value={item.color}
                onChange={(e) => {
                  const opt = colorOptions.find((o) => o.value === e.target.value);
                  update({ color: e.target.value, iconColor: opt?.iconColor ?? item.iconColor });
                }}
                className={INPUT}
              >
                {colorOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Title</label>
              <input value={item.title} onChange={(e) => update({ title: e.target.value })} className={INPUT} />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Detail</label>
              <textarea value={item.detail} onChange={(e) => update({ detail: e.target.value })} className={TEXTAREA} rows={2} />
            </div>
          </>
        )}
      />
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

function StoriesEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<CareerStory>(
    "about.careers.stories",
    AboutDefaults.stories as CareerStory[]
  );
  async function handleSave() {
    if (await save()) onSave();
  }
  return (
    <section className={PANEL}>
      <ListEditor<CareerStory>
        title="Career Stories"
        items={items}
        setItems={setItems}
        itemLabel={(idx, it) => it.name || `Story ${idx + 1}`}
        defaultItem={{ name: "", role: "", image: "", from: "", to: "", quote: "" }}
        renderItem={(item, update) => (
          <>
            <div>
              <label className={LABEL}>Name</label>
              <input value={item.name} onChange={(e) => update({ name: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Current role</label>
              <input value={item.role} onChange={(e) => update({ role: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>From (start)</label>
              <input value={item.from} onChange={(e) => update({ from: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>To (now)</label>
              <input value={item.to} onChange={(e) => update({ to: e.target.value })} className={INPUT} />
            </div>
            <div className="md:col-span-2">
              <ImageField label="Portrait" value={item.image} onChange={(url) => update({ image: url })} />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Quote</label>
              <textarea value={item.quote} onChange={(e) => update({ quote: e.target.value })} className={TEXTAREA} rows={2} />
            </div>
          </>
        )}
      />
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

// ─── NEWSROOM ──────────────────────────────────────────────────────────────
function NewsroomEditors({ onSave }: { onSave: () => void }) {
  return (
    <>
      <HeroEditor
        storageKey="about.newsroom.hero"
        defaults={AboutDefaults.newsroomHero}
        onSave={onSave}
      />
      <PressEditor onSave={onSave} />
      <FactsEditor onSave={onSave} />
    </>
  );
}

function PressEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<PressItem>(
    "about.newsroom.press",
    AboutDefaults.press as PressItem[]
  );
  async function handleSave() {
    if (await save()) onSave();
  }
  return (
    <section className={PANEL}>
      <ListEditor<PressItem>
        title="Press Items"
        items={items}
        setItems={setItems}
        itemLabel={(idx, it) => it.outlet ? `${it.outlet} · ${it.date}` : `Item ${idx + 1}`}
        defaultItem={{
          outlet: "",
          date: "",
          headline: "",
          excerpt: "",
          category: "Feature",
          readTime: "",
          imageUrl: "",
          href: "#",
        }}
        renderItem={(item, update) => (
          <>
            <div>
              <label className={LABEL}>Outlet</label>
              <input value={item.outlet} onChange={(e) => update({ outlet: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Date</label>
              <input value={item.date} onChange={(e) => update({ date: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Category</label>
              <select
                value={item.category}
                onChange={(e) =>
                  update({ category: e.target.value as PressItem["category"] })
                }
                className={INPUT}
              >
                <option>Feature</option>
                <option>Interview</option>
                <option>Award</option>
                <option>Industry</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Read time</label>
              <input value={item.readTime} onChange={(e) => update({ readTime: e.target.value })} className={INPUT} />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Headline</label>
              <input value={item.headline} onChange={(e) => update({ headline: e.target.value })} className={INPUT} />
            </div>
            <div className="md:col-span-2">
              <label className={LABEL}>Excerpt</label>
              <textarea value={item.excerpt} onChange={(e) => update({ excerpt: e.target.value })} className={TEXTAREA} rows={2} />
            </div>
            <div>
              <label className={LABEL}>Link (href)</label>
              <input value={item.href} onChange={(e) => update({ href: e.target.value })} className={INPUT} />
            </div>
            <div>
              <ImageField label="Press image" value={item.imageUrl} onChange={(url) => update({ imageUrl: url })} />
            </div>
          </>
        )}
      />
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

function FactsEditor({ onSave }: { onSave: () => void }) {
  const { items, setItems, save, reset, status, error } = useItemsForm<FactItem>(
    "about.newsroom.facts",
    AboutDefaults.facts as FactItem[]
  );
  async function handleSave() {
    if (await save()) onSave();
  }
  return (
    <section className={PANEL}>
      <ListEditor<FactItem>
        title="Fact Sheet"
        items={items}
        setItems={setItems}
        itemLabel={(idx, it) => it.label || `Fact ${idx + 1}`}
        defaultItem={{ label: "", value: "" }}
        renderItem={(item, update) => (
          <>
            <div>
              <label className={LABEL}>Label</label>
              <input value={item.label} onChange={(e) => update({ label: e.target.value })} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Value</label>
              <input value={item.value} onChange={(e) => update({ value: e.target.value })} className={INPUT} />
            </div>
          </>
        )}
      />
      <SaveBar status={status} error={error} onSave={handleSave} onReset={reset} />
    </section>
  );
}

export default AboutCMS;
