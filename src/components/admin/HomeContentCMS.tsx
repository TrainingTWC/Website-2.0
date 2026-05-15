import { useEffect, useState } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Trash2, Save, ImagePlus } from "lucide-react";
import { useProducts } from "../../lib/useProducts";
import { slugify } from "../../lib/slug";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convexApi = api as any;

const INPUT =
  "w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 ring-natural-accent/20 bg-white text-sm";
const LABEL =
  "block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5";

interface StoryStat { value: string; label: string }
interface StorySlide { storageId?: string; url: string }

interface StoryValue {
  headline: string;
  paragraphs: string[];
  stats: StoryStat[];
  slides: StorySlide[];
}

const EMPTY: StoryValue = {
  headline: "From bean to cup, with intention.",
  paragraphs: [""],
  stats: [{ value: "", label: "" }],
  slides: [],
};

export function HomeContentCMS() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h3 className="text-2xl font-serif font-bold text-stone-800">Home Page Content</h3>
        <p className="text-sm text-stone-500 mt-1">
          Edit the copy, stats, and slideshow images shown on the storefront homepage.
        </p>
      </div>

      <HeroEditor />
      <SectionHeadingsEditor />
      <BannerSlidesEditor />
      <ChaptersEditor />
      <StoryEditor />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
function StoryEditor() {
  const entry = useQuery(convexApi.siteContent.get, { key: "story" });
  const setContent = useMutation(convexApi.siteContent.set);
  const generateUploadUrl = useMutation(convexApi.siteContent.generateUploadUrl);
  const convex = useConvex();

  const [form, setForm] = useState<StoryValue>(EMPTY);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string>("");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  // Hydrate form from the saved entry once it loads
  useEffect(() => {
    if (entry === undefined) return; // still loading
    if (entry === null) {
      setForm(EMPTY);
      return;
    }
    const v = entry.value as Partial<StoryValue> | null;
    if (!v) {
      setForm(EMPTY);
      return;
    }
    setForm({
      headline: v.headline ?? EMPTY.headline,
      paragraphs: Array.isArray(v.paragraphs) && v.paragraphs.length > 0 ? v.paragraphs : [""],
      stats: Array.isArray(v.stats) && v.stats.length > 0 ? v.stats : [{ value: "", label: "" }],
      slides: Array.isArray(v.slides) ? v.slides : [],
    });
  }, [entry]);

  async function handleSave() {
    setStatus("saving");
    setError("");
    try {
      // Strip the resolved `url` for slides that have a storageId — the
      // backend re-resolves URLs on read so we only persist storageId.
      const slides = form.slides.map((s) =>
        s.storageId ? { storageId: s.storageId } : { url: s.url }
      );
      const payload = {
        headline: form.headline.trim(),
        paragraphs: form.paragraphs.map((p) => p.trim()).filter(Boolean),
        stats: form.stats.filter((s) => s.value.trim() || s.label.trim()),
        slides,
      };
      await setContent({ key: "story", json: JSON.stringify(payload) });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e: any) {
      setStatus("error");
      setError(e?.message ?? "Failed to save");
    }
  }

  async function handleSlideUpload(file: File, idx: number | "new") {
    const targetIdx = idx === "new" ? form.slides.length : idx;
    setUploadingIdx(targetIdx);
    setError("");
    try {
      const localPreview = URL.createObjectURL(file);
      // Optimistic insert/replace with local preview
      setForm((f) => {
        const slides = [...f.slides];
        if (idx === "new") {
          slides.push({ url: localPreview });
        } else {
          slides[idx] = { url: localPreview };
        }
        return { ...f, slides };
      });

      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Upload failed (${res.status}): ${txt.slice(0, 120)}`);
      }
      const { storageId } = await res.json();
      if (!storageId) throw new Error("No storageId returned from upload");

      // Fetch the real CDN url so the admin sees it
      let cdnUrl = "";
      try {
        cdnUrl = await convex.query(convexApi.siteContent.getStorageUrl, { storageId });
      } catch {
        // ignore — backend will resolve on read
      }

      URL.revokeObjectURL(localPreview);
      setForm((f) => {
        const slides = [...f.slides];
        slides[targetIdx] = { storageId, url: cdnUrl || localPreview };
        return { ...f, slides };
      });
    } catch (e: any) {
      setError(e?.message ?? "Slide upload failed");
      // eslint-disable-next-line no-console
      console.error("[HomeContentCMS] slide upload failed:", e);
    } finally {
      setUploadingIdx(null);
    }
  }

  function removeSlide(idx: number) {
    setForm((f) => ({ ...f, slides: f.slides.filter((_, i) => i !== idx) }));
  }

  function moveSlide(idx: number, dir: -1 | 1) {
    setForm((f) => {
      const slides = [...f.slides];
      const j = idx + dir;
      if (j < 0 || j >= slides.length) return f;
      [slides[idx], slides[j]] = [slides[j], slides[idx]];
      return { ...f, slides };
    });
  }

  function addParagraph() {
    setForm((f) => ({ ...f, paragraphs: [...f.paragraphs, ""] }));
  }
  function updateParagraph(i: number, val: string) {
    setForm((f) => ({
      ...f,
      paragraphs: f.paragraphs.map((p, idx) => (idx === i ? val : p)),
    }));
  }
  function removeParagraph(i: number) {
    setForm((f) => ({
      ...f,
      paragraphs: f.paragraphs.filter((_, idx) => idx !== i),
    }));
  }

  function addStat() {
    setForm((f) => ({ ...f, stats: [...f.stats, { value: "", label: "" }] }));
  }
  function updateStat(i: number, key: keyof StoryStat, val: string) {
    setForm((f) => ({
      ...f,
      stats: f.stats.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)),
    }));
  }
  function removeStat(i: number) {
    setForm((f) => ({ ...f, stats: f.stats.filter((_, idx) => idx !== i) }));
  }

  if (entry === undefined) {
    return <p className="text-stone-400 text-sm">Loading…</p>;
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/40 p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-stone-800">"Our Story" section</h4>
          <p className="text-xs text-stone-500">Headline, body paragraphs, stats, and slideshow.</p>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" && (
            <span className="text-xs text-green-600 font-bold">✓ Saved</span>
          )}
          {status === "error" && (
            <span className="text-xs text-red-600 font-bold">! {error}</span>
          )}
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="flex items-center gap-2 bg-natural-accent text-white rounded-xl px-4 py-2 text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {status === "saving" ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </header>

      {/* Headline */}
      <div>
        <label className={LABEL}>Headline (use a newline to break the heading)</label>
        <textarea
          value={form.headline}
          onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
          rows={2}
          className={INPUT}
          placeholder="From bean to cup,\nwith intention."
        />
      </div>

      {/* Paragraphs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={LABEL}>Body paragraphs</label>
          <button
            onClick={addParagraph}
            className="flex items-center gap-1 text-xs font-bold text-natural-accent hover:underline"
          >
            <Plus className="w-3 h-3" /> Add paragraph
          </button>
        </div>
        <div className="space-y-2">
          {form.paragraphs.map((p, i) => (
            <div key={i} className="flex gap-2 items-start">
              <textarea
                value={p}
                onChange={(e) => updateParagraph(i, e.target.value)}
                rows={3}
                className={INPUT}
                placeholder={`Paragraph ${i + 1}`}
              />
              <button
                onClick={() => removeParagraph(i)}
                className="text-stone-400 hover:text-red-500 transition p-2 shrink-0"
                title="Remove paragraph"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={LABEL}>Stats (shown as a 3-column row)</label>
          <button
            onClick={addStat}
            className="flex items-center gap-1 text-xs font-bold text-natural-accent hover:underline"
          >
            <Plus className="w-3 h-3" /> Add stat
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {form.stats.map((s, i) => (
            <div key={i} className="flex gap-2 items-center bg-white rounded-xl border border-stone-200 p-2">
              <input
                value={s.value}
                onChange={(e) => updateStat(i, "value", e.target.value)}
                placeholder="12+"
                className="w-20 px-2 py-1.5 rounded-lg border border-stone-200 bg-white text-sm font-bold"
              />
              <input
                value={s.label}
                onChange={(e) => updateStat(i, "label", e.target.value)}
                placeholder="Origins"
                className="flex-1 px-2 py-1.5 rounded-lg border border-stone-200 bg-white text-sm"
              />
              <button
                onClick={() => removeStat(i)}
                className="text-stone-400 hover:text-red-500 transition p-1"
                title="Remove stat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Slides */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={LABEL}>Slideshow images</label>
          <label className="flex items-center gap-1 text-xs font-bold text-natural-accent hover:underline cursor-pointer">
            <ImagePlus className="w-3 h-3" /> Add slide
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleSlideUpload(f, "new");
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        {form.slides.length === 0 ? (
          <p className="text-xs text-stone-400 italic">No slides yet. Add at least one for the slideshow.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {form.slides.map((slide, i) => (
              <div
                key={i}
                className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-100 aspect-square"
              >
                {slide.url ? (
                  <img
                    src={slide.url}
                    alt={`Slide ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">
                    No image
                  </div>
                )}
                {uploadingIdx === i && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs font-bold animate-pulse">Uploading…</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-stone-700">
                  {i + 1}
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => removeSlide(i)}
                    className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition gap-1">
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveSlide(i, -1)}
                      disabled={i === 0}
                      className="px-2 py-0.5 rounded bg-white/90 text-xs font-bold text-stone-700 hover:bg-white disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => moveSlide(i, 1)}
                      disabled={i === form.slides.length - 1}
                      className="px-2 py-0.5 rounded bg-white/90 text-xs font-bold text-stone-700 hover:bg-white disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                  <label className="px-2 py-0.5 rounded bg-white/90 text-xs font-bold text-stone-700 hover:bg-white cursor-pointer">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleSlideUpload(f, i);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Hero text editor — eyebrow + 2-line wordmark
// ═══════════════════════════════════════════════════════════════════════════
interface HeroValue {
  eyebrow: string;
  wordmarkLine1: string;
  wordmarkLine2: string;
}
const HERO_DEFAULTS: HeroValue = {
  eyebrow: "A daily ritual · est. 2016",
  wordmarkLine1: "THIRD WAVE",
  wordmarkLine2: "coffee.",
};

function HeroEditor() {
  const entry = useQuery(convexApi.siteContent.get, { key: "hero" });
  const setContent = useMutation(convexApi.siteContent.set);
  const [form, setForm] = useState<HeroValue>(HERO_DEFAULTS);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (entry === undefined) return;
    if (entry === null) { setForm(HERO_DEFAULTS); return; }
    const v = entry.value as Partial<HeroValue> | null;
    setForm({
      eyebrow: v?.eyebrow ?? HERO_DEFAULTS.eyebrow,
      wordmarkLine1: v?.wordmarkLine1 ?? HERO_DEFAULTS.wordmarkLine1,
      wordmarkLine2: v?.wordmarkLine2 ?? HERO_DEFAULTS.wordmarkLine2,
    });
  }, [entry]);

  async function handleSave() {
    setStatus("saving"); setError("");
    try {
      await setContent({ key: "hero", json: JSON.stringify(form) });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e: any) {
      setStatus("error"); setError(e?.message ?? "Failed to save");
    }
  }

  if (entry === undefined) return <p className="text-stone-400 text-sm">Loading…</p>;

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/40 p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-stone-800">Hero text (cinematic banner)</h4>
          <p className="text-xs text-stone-500">Eyebrow tagline and the giant background wordmark at the top of the homepage.</p>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" && <span className="text-xs text-green-600 font-bold">✓ Saved</span>}
          {status === "error" && <span className="text-xs text-red-600 font-bold">! {error}</span>}
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="flex items-center gap-2 bg-natural-accent text-white rounded-xl px-4 py-2 text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className={LABEL}>Eyebrow</label>
          <input value={form.eyebrow} onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Wordmark line 1</label>
          <input value={form.wordmarkLine1} onChange={(e) => setForm((f) => ({ ...f, wordmarkLine1: e.target.value }))} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Wordmark line 2 (italic)</label>
          <input value={form.wordmarkLine2} onChange={(e) => setForm((f) => ({ ...f, wordmarkLine2: e.target.value }))} className={INPUT} />
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Section headings editor
// ═══════════════════════════════════════════════════════════════════════════
interface SectionHeading { eyebrow: string; title: string }
interface SectionsValue {
  catalogBanner: SectionHeading;
  categories: SectionHeading;
}
const SECTIONS_DEFAULTS: SectionsValue = {
  catalogBanner: { eyebrow: "The Collection", title: "Choose your\nritual." },
  categories: { eyebrow: "Shop the catalog", title: "Pick your aisle." },
};

function SectionHeadingsEditor() {
  const entry = useQuery(convexApi.siteContent.get, { key: "sections" });
  const setContent = useMutation(convexApi.siteContent.set);
  const [form, setForm] = useState<SectionsValue>(SECTIONS_DEFAULTS);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (entry === undefined) return;
    if (entry === null) { setForm(SECTIONS_DEFAULTS); return; }
    const v = entry.value as Partial<SectionsValue> | null;
    setForm({
      catalogBanner: {
        eyebrow: v?.catalogBanner?.eyebrow ?? SECTIONS_DEFAULTS.catalogBanner.eyebrow,
        title: v?.catalogBanner?.title ?? SECTIONS_DEFAULTS.catalogBanner.title,
      },
      categories: {
        eyebrow: v?.categories?.eyebrow ?? SECTIONS_DEFAULTS.categories.eyebrow,
        title: v?.categories?.title ?? SECTIONS_DEFAULTS.categories.title,
      },
    });
  }, [entry]);

  async function handleSave() {
    setStatus("saving"); setError("");
    try {
      await setContent({ key: "sections", json: JSON.stringify(form) });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e: any) {
      setStatus("error"); setError(e?.message ?? "Failed to save");
    }
  }

  if (entry === undefined) return <p className="text-stone-400 text-sm">Loading…</p>;

  const sections: { key: keyof SectionsValue; label: string; note: string }[] = [
    { key: "catalogBanner", label: "Catalog intro banner", note: "Big parallax banner before the category grid. Use a newline in Title to break across two lines — the second line is italic." },
    { key: "categories", label: "Categories grid header", note: "Sits above the bento tile grid." },
  ];

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/40 p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-stone-800">Section headings</h4>
          <p className="text-xs text-stone-500">Eyebrows and titles for the major homepage sections.</p>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" && <span className="text-xs text-green-600 font-bold">✓ Saved</span>}
          {status === "error" && <span className="text-xs text-red-600 font-bold">! {error}</span>}
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="flex items-center gap-2 bg-natural-accent text-white rounded-xl px-4 py-2 text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </header>
      <div className="space-y-4">
        {sections.map(({ key, label, note }) => (
          <div key={key} className="rounded-xl border border-stone-200 bg-white p-4 space-y-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-600">{label}</p>
              <p className="text-[11px] text-stone-400">{note}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className={LABEL}>Eyebrow</label>
                <input
                  value={form[key].eyebrow}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: { ...f[key], eyebrow: e.target.value } }))}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Title</label>
                <textarea
                  value={form[key].title}
                  rows={2}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: { ...f[key], title: e.target.value } }))}
                  className={INPUT}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Banner slideshow editor — hero banner CRUD
// ═══════════════════════════════════════════════════════════════════════════
interface BannerSlide {
  storageId?: string;
  url?: string;             // resolved on read; not persisted when storageId present
  partner?: string;
  headline: string;
  headlineItalic?: string;
  subhead?: string;
  tagline?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientOpacity?: number;
}

const BANNER_EMPTY: BannerSlide = {
  partner: "",
  headline: "NEW HEADLINE",
  headlineItalic: "",
  subhead: "",
  tagline: "",
  gradientFrom: "#1a3a8a",
  gradientTo: "#ff6fa4",
  gradientOpacity: 0.6,
};

function BannerSlidesEditor() {
  const entry = useQuery(convexApi.siteContent.get, { key: "banner.slides" });
  const setContent = useMutation(convexApi.siteContent.set);
  const generateUploadUrl = useMutation(convexApi.siteContent.generateUploadUrl);
  const convex = useConvex();

  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (entry === undefined) return;
    if (entry === null) { setSlides([]); return; }
    const v = entry.value as { slides?: BannerSlide[] } | null;
    setSlides(Array.isArray(v?.slides) ? v!.slides : []);
  }, [entry]);

  async function handleSave() {
    setStatus("saving"); setError("");
    try {
      // Only persist storageId when present (drop transient url)
      const toSave = slides.map((s) => {
        const { url, ...rest } = s;
        return s.storageId ? rest : { ...rest, url };
      });
      await setContent({ key: "banner.slides", json: JSON.stringify({ slides: toSave }) });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e: any) {
      setStatus("error"); setError(e?.message ?? "Failed to save");
    }
  }

  async function handleImageUpload(file: File, idx: number) {
    setUploadingIdx(idx); setError("");
    try {
      const localPreview = URL.createObjectURL(file);
      setSlides((arr) => {
        const next = [...arr];
        next[idx] = { ...next[idx], url: localPreview, storageId: undefined };
        return next;
      });

      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Upload failed (${res.status}): ${txt.slice(0, 120)}`);
      }
      const { storageId } = await res.json();
      if (!storageId) throw new Error("No storageId returned from upload");

      let cdnUrl = "";
      try {
        cdnUrl = await convex.query(convexApi.siteContent.getStorageUrl, { storageId });
      } catch { /* backend will resolve on read */ }

      URL.revokeObjectURL(localPreview);
      setSlides((arr) => {
        const next = [...arr];
        next[idx] = { ...next[idx], storageId, url: cdnUrl || localPreview };
        return next;
      });
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
      // eslint-disable-next-line no-console
      console.error("[BannerSlidesEditor] upload failed:", e);
    } finally {
      setUploadingIdx(null);
    }
  }

  function addSlide() { setSlides((arr) => [...arr, { ...BANNER_EMPTY }]); }
  function removeSlide(i: number) { setSlides((arr) => arr.filter((_, idx) => idx !== i)); }
  function moveSlide(i: number, dir: -1 | 1) {
    setSlides((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function update<K extends keyof BannerSlide>(i: number, key: K, val: BannerSlide[K]) {
    setSlides((arr) => arr.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));
  }

  if (entry === undefined) return <p className="text-stone-400 text-sm">Loading…</p>;

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/40 p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-stone-800">Hero banner slideshow</h4>
          <p className="text-xs text-stone-500">
            The rotating banner inside the cinematic hero. Leave empty to fall back to the original built-in banners (Schweppes + Third Rush).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" && <span className="text-xs text-green-600 font-bold">✓ Saved</span>}
          {status === "error" && <span className="text-xs text-red-600 font-bold">! {error}</span>}
          <button
            onClick={addSlide}
            className="flex items-center gap-1 text-xs font-bold text-natural-accent hover:underline"
          >
            <Plus className="w-3 h-3" /> Add slide
          </button>
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="flex items-center gap-2 bg-natural-accent text-white rounded-xl px-4 py-2 text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {slides.length === 0 ? (
        <p className="text-xs text-stone-400 italic">No CMS banner slides yet. Add one to override the defaults.</p>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-white p-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
              {/* image */}
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-100 aspect-[4/5]">
                  {slide.url ? (
                    <img src={slide.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">No image</div>
                  )}
                  {uploadingIdx === i && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold animate-pulse">Uploading…</span>
                    </div>
                  )}
                  <div className="absolute top-1 left-1 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                </div>
                <label className="block text-center px-2 py-1 rounded bg-stone-100 text-xs font-bold text-stone-700 hover:bg-stone-200 cursor-pointer">
                  {slide.storageId || slide.url ? "Replace image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f, i);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveSlide(i, -1)}
                      disabled={i === 0}
                      className="px-2 py-0.5 rounded bg-stone-100 text-xs font-bold text-stone-700 hover:bg-stone-200 disabled:opacity-30"
                    >←</button>
                    <button
                      onClick={() => moveSlide(i, 1)}
                      disabled={i === slides.length - 1}
                      className="px-2 py-0.5 rounded bg-stone-100 text-xs font-bold text-stone-700 hover:bg-stone-200 disabled:opacity-30"
                    >→</button>
                  </div>
                  <button
                    onClick={() => removeSlide(i)}
                    className="text-stone-400 hover:text-red-500 transition p-1"
                    title="Remove slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* fields */}
              <div className="space-y-2">
                <div>
                  <label className={LABEL}>Partner / Eyebrow (small uppercase line)</label>
                  <input value={slide.partner ?? ""} onChange={(e) => update(i, "partner", e.target.value)} className={INPUT} placeholder="THIRD WAVE × Partner" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL}>Headline</label>
                    <input value={slide.headline} onChange={(e) => update(i, "headline", e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Headline italic (optional)</label>
                    <input value={slide.headlineItalic ?? ""} onChange={(e) => update(i, "headlineItalic", e.target.value)} className={INPUT} placeholder="FIZZ." />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Subheading</label>
                  <input value={slide.subhead ?? ""} onChange={(e) => update(i, "subhead", e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Tagline (pill text)</label>
                  <input value={slide.tagline ?? ""} onChange={(e) => update(i, "tagline", e.target.value)} className={INPUT} placeholder="In stores now" />
                </div>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <label className={LABEL}>Gradient from</label>
                    <input
                      type="color"
                      value={slide.gradientFrom ?? "#1a3a8a"}
                      onChange={(e) => update(i, "gradientFrom", e.target.value)}
                      className="w-full h-10 rounded-lg border border-stone-200 bg-white cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Gradient to</label>
                    <input
                      type="color"
                      value={slide.gradientTo ?? "#ff6fa4"}
                      onChange={(e) => update(i, "gradientTo", e.target.value)}
                      className="w-full h-10 rounded-lg border border-stone-200 bg-white cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Overlay opacity</label>
                    <input
                      type="number"
                      step="0.05"
                      min={0}
                      max={1}
                      value={slide.gradientOpacity ?? 0.6}
                      onChange={(e) => update(i, "gradientOpacity", Number(e.target.value))}
                      className={INPUT}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Chapters editor — the 5 (or any N) editorial chapter cards in ChapterDeck
// ═══════════════════════════════════════════════════════════════════════════
interface ChapterValue {
  storageId?: string;
  imageUrl?: string;
  productSlug?: string;
  index: string;
  eyebrow: string;
  titleHead: string;
  titleItalic?: string;
  body: string;
  callouts: string[];
  align: "left" | "right";
  theme: "light" | "dark";
}

const CHAPTER_EMPTY: ChapterValue = {
  index: "01 / 01",
  eyebrow: "New chapter",
  titleHead: "Chapter title.",
  titleItalic: "",
  body: "Body copy.",
  callouts: [],
  align: "left",
  theme: "light",
};

const CHAPTER_DEFAULTS: ChapterValue[] = [
  {
    index: "01 / 05", eyebrow: "Sourcing", titleHead: "Single origins.", titleItalic: "Patient craft.",
    body: "Every harvest is hand-selected from partner farms across the Western Ghats and beyond. Beans rest, breathe, then meet our roasters for a slow, deliberate transformation.",
    callouts: ["Direct trade", "Hand-picked", "Estate-grown", "Traceable"],
    align: "left", theme: "light",
  },
  {
    index: "02 / 05", eyebrow: "Craft", titleHead: "The art of", titleItalic: "roasting.",
    body: "Small-batch drums turn at the rhythm of our master roasters. Every degree, every minute is calibrated until the bean reveals its sweetest, most honest self — then packed whole, ground, or as Easy Coffee Bags ready to brew.",
    callouts: ["Small batch", "Slow roasted", "Cupped daily", "Brew-ready"],
    align: "right", theme: "dark",
  },
  {
    index: "03 / 05", eyebrow: "Brewing", titleHead: "Built to", titleItalic: "brew.",
    body: "Grinders that whisper, presses that bloom, kettles tuned for that gooseneck pour. The tools we trust to coax the best out of every roast — now in your kitchen.",
    callouts: ["Curated", "Barista-tested", "Coffee-first", "Built to last"],
    align: "left", theme: "light",
  },
  {
    index: "04 / 05", eyebrow: "Drinkware", titleHead: "The vessel", titleItalic: "matters.",
    body: "Ceramic that keeps the crema, double-walls that hold the heat, tumblers that travel as well as you do. Cups, mugs and bottles we'd reach for first thing in the morning.",
    callouts: ["Hand-finished", "Built for daily use", "Travel-ready"],
    align: "right", theme: "dark",
  },
  {
    index: "05 / 05", eyebrow: "Ritual", titleHead: "Pour. Pause.", titleItalic: "Repeat.",
    body: "From the first wisp of steam to the last warm sip — what we craft is meant to anchor the small, beautiful pauses in your day. Bags, keychains and trinkets that carry the ritual with you.",
    callouts: ["Carry it everywhere", "Made to share", "Everyday joy"],
    align: "left", theme: "light",
  },
];

function ChaptersEditor() {
  const entry = useQuery(convexApi.siteContent.get, { key: "chapters" });
  const setContent = useMutation(convexApi.siteContent.set);
  const generateUploadUrl = useMutation(convexApi.siteContent.generateUploadUrl);
  const convex = useConvex();
  const products = useProducts() ?? [];

  const [chapters, setChapters] = useState<ChapterValue[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (entry === undefined) return;
    if (entry === null) { setChapters([]); return; }
    const v = entry.value as { chapters?: ChapterValue[] } | null;
    setChapters(Array.isArray(v?.chapters) ? v!.chapters : []);
  }, [entry]);

  async function handleSave() {
    setStatus("saving"); setError("");
    try {
      const toSave = chapters.map((c) => {
        const { imageUrl, ...rest } = c;
        return c.storageId ? rest : { ...rest, imageUrl };
      });
      await setContent({ key: "chapters", json: JSON.stringify({ chapters: toSave }) });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e: any) {
      setStatus("error"); setError(e?.message ?? "Failed to save");
    }
  }

  async function handleImageUpload(file: File, idx: number) {
    setUploadingIdx(idx); setError("");
    try {
      const localPreview = URL.createObjectURL(file);
      setChapters((arr) => {
        const next = [...arr];
        next[idx] = { ...next[idx], imageUrl: localPreview, storageId: undefined };
        return next;
      });

      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Upload failed (${res.status}): ${txt.slice(0, 120)}`);
      }
      const { storageId } = await res.json();
      if (!storageId) throw new Error("No storageId returned from upload");

      let cdnUrl = "";
      try {
        cdnUrl = await convex.query(convexApi.siteContent.getStorageUrl, { storageId });
      } catch { /* hydrated on read */ }

      URL.revokeObjectURL(localPreview);
      setChapters((arr) => {
        const next = [...arr];
        next[idx] = { ...next[idx], storageId, imageUrl: cdnUrl || localPreview };
        return next;
      });
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
      // eslint-disable-next-line no-console
      console.error("[ChaptersEditor] upload failed:", e);
    } finally {
      setUploadingIdx(null);
    }
  }

  function loadDefaults() {
    setChapters(CHAPTER_DEFAULTS.map((c) => ({ ...c, callouts: [...c.callouts] })));
  }
  function addChapter() {
    setChapters((arr) => [...arr, { ...CHAPTER_EMPTY, index: `0${arr.length + 1} / 0${arr.length + 1}` }]);
  }
  function removeChapter(i: number) { setChapters((arr) => arr.filter((_, idx) => idx !== i)); }
  function moveChapter(i: number, dir: -1 | 1) {
    setChapters((arr) => {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function update<K extends keyof ChapterValue>(i: number, key: K, val: ChapterValue[K]) {
    setChapters((arr) => arr.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)));
  }
  function updateCallout(ci: number, ki: number, val: string) {
    setChapters((arr) => arr.map((c, idx) => idx === ci ? { ...c, callouts: c.callouts.map((x, j) => j === ki ? val : x) } : c));
  }
  function addCallout(ci: number) {
    setChapters((arr) => arr.map((c, idx) => idx === ci ? { ...c, callouts: [...c.callouts, ""] } : c));
  }
  function removeCallout(ci: number, ki: number) {
    setChapters((arr) => arr.map((c, idx) => idx === ci ? { ...c, callouts: c.callouts.filter((_, j) => j !== ki) } : c));
  }

  if (entry === undefined) return <p className="text-stone-400 text-sm">Loading…</p>;

  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50/40 p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-stone-800">Editorial chapters (5-card deck)</h4>
          <p className="text-xs text-stone-500">
            The big scroll-pinned chapter cards on the homepage. Leave empty to keep the built-in defaults
            (Sourcing → Craft → Brewing → Drinkware → Ritual).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status === "saved" && <span className="text-xs text-green-600 font-bold">✓ Saved</span>}
          {status === "error" && <span className="text-xs text-red-600 font-bold">! {error}</span>}
          {chapters.length === 0 && (
            <button
              onClick={loadDefaults}
              className="text-xs font-bold text-stone-700 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200"
            >
              Load defaults
            </button>
          )}
          <button
            onClick={addChapter}
            className="flex items-center gap-1 text-xs font-bold text-natural-accent hover:underline"
          >
            <Plus className="w-3 h-3" /> Add chapter
          </button>
          <button
            onClick={handleSave}
            disabled={status === "saving"}
            className="flex items-center gap-2 bg-natural-accent text-white rounded-xl px-4 py-2 text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {status === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {chapters.length === 0 ? (
        <p className="text-xs text-stone-400 italic">No CMS chapters yet. Add chapters or click "Load defaults" to start from the existing 5-card deck.</p>
      ) : (
        <div className="space-y-4">
          {chapters.map((ch, i) => (
            <div key={i} className="rounded-xl border border-stone-200 bg-white p-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
              {/* Image column */}
              <div className="space-y-2">
                <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-100 aspect-[4/5]">
                  {ch.imageUrl ? (
                    <img src={ch.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : ch.productSlug && products.find((p) => slugify(p.name) === ch.productSlug)?.imageUrl ? (
                    <img
                      src={products.find((p) => slugify(p.name) === ch.productSlug)!.imageUrl}
                      alt=""
                      className="w-full h-full object-cover opacity-60"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">No image</div>
                  )}
                  {uploadingIdx === i && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold animate-pulse">Uploading…</span>
                    </div>
                  )}
                  <div className="absolute top-1 left-1 bg-white/90 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                </div>

                <label className="block text-center px-2 py-1 rounded bg-stone-100 text-xs font-bold text-stone-700 hover:bg-stone-200 cursor-pointer">
                  <ImagePlus className="w-3 h-3 inline-block mr-1" />
                  {ch.storageId || ch.imageUrl ? "Replace image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f, i);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {ch.imageUrl && (
                  <button
                    onClick={() => { update(i, "imageUrl", undefined); update(i, "storageId", undefined); }}
                    className="block w-full text-center px-2 py-1 rounded text-xs text-stone-500 hover:text-red-500"
                  >
                    Clear custom image
                  </button>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveChapter(i, -1)}
                      disabled={i === 0}
                      className="px-2 py-0.5 rounded bg-stone-100 text-xs font-bold text-stone-700 hover:bg-stone-200 disabled:opacity-30"
                    >←</button>
                    <button
                      onClick={() => moveChapter(i, 1)}
                      disabled={i === chapters.length - 1}
                      className="px-2 py-0.5 rounded bg-stone-100 text-xs font-bold text-stone-700 hover:bg-stone-200 disabled:opacity-30"
                    >→</button>
                  </div>
                  <button
                    onClick={() => removeChapter(i)}
                    className="text-stone-400 hover:text-red-500 transition p-1"
                    title="Remove chapter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fields column */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2">
                  <div>
                    <label className={LABEL}>Index</label>
                    <input value={ch.index} onChange={(e) => update(i, "index", e.target.value)} className={INPUT} placeholder="01 / 05" />
                  </div>
                  <div>
                    <label className={LABEL}>Eyebrow (also the giant background word)</label>
                    <input value={ch.eyebrow} onChange={(e) => update(i, "eyebrow", e.target.value)} className={INPUT} placeholder="Sourcing" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL}>Title (first line)</label>
                    <input value={ch.titleHead} onChange={(e) => update(i, "titleHead", e.target.value)} className={INPUT} placeholder="Single origins." />
                  </div>
                  <div>
                    <label className={LABEL}>Title (italic line, optional)</label>
                    <input value={ch.titleItalic ?? ""} onChange={(e) => update(i, "titleItalic", e.target.value)} className={INPUT} placeholder="Patient craft." />
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Body</label>
                  <textarea value={ch.body} rows={3} onChange={(e) => update(i, "body", e.target.value)} className={INPUT} />
                </div>

                {/* Callouts */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className={LABEL}>Callout chips</label>
                    <button
                      onClick={() => addCallout(i)}
                      className="text-xs font-bold text-natural-accent hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ch.callouts.map((c, ki) => (
                      <div key={ki} className="flex items-center gap-1 bg-stone-50 rounded-lg border border-stone-200 pl-2">
                        <input
                          value={c}
                          onChange={(e) => updateCallout(i, ki, e.target.value)}
                          className="px-1 py-1 text-xs bg-transparent outline-none w-32"
                          placeholder="Callout"
                        />
                        <button
                          onClick={() => removeCallout(i, ki)}
                          className="px-1.5 text-stone-400 hover:text-red-500 text-xs"
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className={LABEL}>Align</label>
                    <select
                      value={ch.align}
                      onChange={(e) => update(i, "align", e.target.value as "left" | "right")}
                      className={INPUT}
                    >
                      <option value="left">Image left / Text right</option>
                      <option value="right">Image right / Text left</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Theme</label>
                    <select
                      value={ch.theme}
                      onChange={(e) => update(i, "theme", e.target.value as "light" | "dark")}
                      className={INPUT}
                    >
                      <option value="light">Light (paper)</option>
                      <option value="dark">Dark (espresso)</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Linked product (click target & fallback image)</label>
                    <select
                      value={ch.productSlug ?? ""}
                      onChange={(e) => update(i, "productSlug", e.target.value || undefined)}
                      className={INPUT}
                    >
                      <option value="">— None —</option>
                      {products.map((p) => (
                        <option key={p._id} value={slugify(p.name)}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
