import { useEffect, useState } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Trash2, Save, ImagePlus } from "lucide-react";

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
