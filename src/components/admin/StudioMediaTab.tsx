"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { STUDIO_SLOTS, type StudioSlot } from "@/src/lib/studioSlots";
import { UploadForm } from "./studio-media/UploadForm";
import { MediaList } from "./studio-media/MediaList";

const SLOT_ORDER: readonly StudioSlot[] = [
  "brew_method",
  "brew_step",
  "signature",
  "product",
  "ambience",
];

/**
 * Admin "Studio Media" tab. Two-pane layout: upload form on the right,
 * media library grouped per slot on the left. Lazy-loaded from AdminDashboard
 * to keep the customer bundle free of admin-only code.
 */
export default function StudioMediaTab() {
  // Used to populate the "product" slotKey dropdown with real product slugs.
  const products = useQuery(api.products.list);
  const productSlugs = useMemo(
    () => (products ?? []).map((p) => slugify((p as any).slug ?? p.name)).filter(Boolean),
    [products],
  );

  // Sanity: make sure STUDIO_SLOTS hasn't drifted from SLOT_ORDER.
  // (Render in registry order if order list ever misses a slot.)
  const orderedSlots: StudioSlot[] = SLOT_ORDER.filter(
    (s) => s in STUDIO_SLOTS,
  );

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h2 className="text-lg font-bold text-stone-900">Brewing Studio media</h2>
        <p className="mt-1 text-xs text-stone-600 max-w-2xl">
          Manage the visuals that drive the Brewing Studio experience. Upload images,
          short videos, Lottie animations, or GLB models per slot. Drafts are private;
          publish a row to make it the live asset for that slot key.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
        <div className="space-y-6 order-2 lg:order-1">
          {orderedSlots.map((slot) => (
            <MediaList key={slot} slot={slot} />
          ))}
        </div>
        <aside className="order-1 lg:order-2 lg:sticky lg:top-4 self-start">
          <UploadForm productSlugs={productSlugs} />
        </aside>
      </div>
    </div>
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
