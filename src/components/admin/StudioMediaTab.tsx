"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { STUDIO_SLOTS, type StudioSlot } from "@/src/lib/studioSlots";
import { UploadForm } from "./studio-media/UploadForm";
import { MediaList } from "./studio-media/MediaList";
import {
  Coffee,
  Layers,
  Star,
  Package,
  Wind,
  Upload,
  X,
} from "lucide-react";

// ── Slot metadata ──────────────────────────────────────────────────────────
const SLOT_CONFIG: Array<{
  id: StudioSlot;
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "brew_method",
    label: "Brew Methods",
    description: "Hero image or video for each brewing method (V60, Aeropress, etc.)",
    Icon: Coffee,
  },
  {
    id: "brew_step",
    label: "Brew Steps",
    description: "Step-by-step visuals shown in the interactive brew guide",
    Icon: Layers,
  },
  {
    id: "signature",
    label: "Signature Drinks",
    description: "Photography for your signature drink menu cards",
    Icon: Star,
  },
  {
    id: "product",
    label: "Products",
    description: "Product hero visuals tied to catalog slugs",
    Icon: Package,
  },
  {
    id: "ambience",
    label: "Ambience",
    description: "Background mood visuals that loop in the studio environment",
    Icon: Wind,
  },
];

/**
 * Studio Media admin tab — redesigned for clarity.
 *
 * Layout: slot tabs across the top → slot key filter pills → media list.
 * Upload panel slides in as an overlay when the user clicks "Upload".
 */
export default function StudioMediaTab() {
  const [activeSlot, setActiveSlot] = useState<StudioSlot>("brew_method");
  const [filterKey, setFilterKey] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const products = useQuery(api.products.list);
  const productSlugs = useMemo(
    () =>
      (products ?? [])
        .map((p) => slugify((p as any).slug ?? p.name))
        .filter(Boolean),
    [products],
  );

  const slotCfg = SLOT_CONFIG.find((s) => s.id === activeSlot)!;
  const keyOptions: readonly string[] =
    activeSlot === "product" ? productSlugs : STUDIO_SLOTS[activeSlot];

  // Reset filter key when slot changes
  const handleSlotChange = (id: StudioSlot) => {
    setActiveSlot(id);
    setFilterKey(null);
    setShowUpload(false);
  };

  return (
    <div className="space-y-0 rounded-2xl border border-stone-200 bg-white overflow-hidden">
      {/* ── Top header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/60">
        <div>
          <h2 className="text-base font-bold text-stone-900">Studio Media</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Upload and publish visuals for the Brewing Studio experience.
          </p>
        </div>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            showUpload
              ? "bg-stone-200 text-stone-700"
              : "bg-stone-900 text-white hover:bg-stone-700"
          }`}
        >
          {showUpload ? (
            <><X className="w-4 h-4" /> Close</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload new</>
          )}
        </button>
      </div>

      {/* ── Upload panel (inline, not a sidebar) ────────────────────────── */}
      {showUpload && (
        <div className="border-b border-stone-100 bg-amber-50/40 px-5 py-5">
          <UploadForm
            productSlugs={productSlugs}
            defaultSlot={activeSlot}
            defaultSlotKey={filterKey ?? keyOptions[0] ?? ""}
            onUploaded={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* ── Slot tab bar ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 px-4 pt-3 pb-0 border-b border-stone-100 overflow-x-auto">
        {SLOT_CONFIG.map(({ id, label, Icon }) => {
          const on = activeSlot === id;
          return (
            <button
              key={id}
              onClick={() => handleSlotChange(id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 whitespace-nowrap transition-colors ${
                on
                  ? "border-stone-800 text-stone-900 bg-white"
                  : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Slot description + key filter ───────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 border-b border-stone-100">
        <p className="text-xs text-stone-500 mb-3">{slotCfg.description}</p>
        {keyOptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterKey(null)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                filterKey === null
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
              }`}
            >
              All
            </button>
            {keyOptions.map((k) => (
              <button
                key={k}
                onClick={() => setFilterKey(filterKey === k ? null : k)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                  filterKey === k
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                }`}
              >
                {humanize(k)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Media list ──────────────────────────────────────────────────── */}
      <div className="p-5">
        <MediaList
          slot={activeSlot}
          filterKey={filterKey}
          onUploadClick={() => setShowUpload(true)}
        />
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** "v60.bloom" → "V60 Bloom", "el-diablo" → "El Diablo" */
export function humanize(key: string): string {
  return key
    .split(/[.\-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
