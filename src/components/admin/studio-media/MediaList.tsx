"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Eye,
  EyeOff,
  Box,
  Film,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  STUDIO_SLOTS,
  type StudioSlot,
  type MediaKind,
} from "@/src/lib/studioSlots";

type Props = {
  slot: StudioSlot;
};

const KIND_ICON: Record<MediaKind, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  gif: ImageIcon,
  video: Film,
  lottie: Sparkles,
  glb: Box,
};

const SLOT_LABELS: Record<StudioSlot, string> = {
  brew_method: "Brew Method",
  brew_step: "Brew Step",
  signature: "Signature Drink",
  product: "Product",
  ambience: "Ambience",
};

type MediaRow = {
  _id: Id<"media">;
  _creationTime: number;
  kind: MediaKind;
  slot: StudioSlot;
  slotKey: string;
  storageId: Id<"_storage">;
  posterStorageId?: Id<"_storage"> | null;
  status: "draft" | "published" | "archived";
  width?: number;
  height?: number;
  url: string | null;
  posterUrl: string | null;
};

/**
 * Media list for one slot, grouped by slotKey. Each row exposes
 * publish/unpublish + delete actions. Drafts and published shown together.
 */
export function MediaList({ slot }: Props) {
  const rows = (useQuery(api.media.listBySlot, { slot }) ?? []) as MediaRow[] | undefined;
  const setActive = useMutation(api.media.setActive);
  const unpublish = useMutation(api.media.unpublish);
  const deleteMedia = useMutation(api.media.deleteMedia);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!rows) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-xs text-stone-500">
        Loading {SLOT_LABELS[slot]} media…
      </div>
    );
  }

  // Group by slotKey.
  const groups = new Map<string, MediaRow[]>();
  for (const r of rows) {
    if (!groups.has(r.slotKey)) groups.set(r.slotKey, []);
    groups.get(r.slotKey)!.push(r);
  }

  // Include all registered slotKeys so empty ones still render.
  const registeredKeys =
    slot === "product"
      ? [...new Set(rows.map((r) => r.slotKey))] // product slotKey set is open; only show used ones
      : ([...STUDIO_SLOTS[slot]] as string[]);
  for (const k of registeredKeys) if (!groups.has(k)) groups.set(k, []);

  const sortedKeys = [...groups.keys()].sort();

  const handlePublish = async (row: MediaRow) => {
    setPendingId(row._id);
    try {
      await setActive({ mediaId: row._id });
    } finally {
      setPendingId(null);
    }
  };

  const handleUnpublish = async (row: MediaRow) => {
    setPendingId(row._id);
    try {
      await unpublish({ mediaId: row._id });
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (row: MediaRow) => {
    if (!confirm(`Delete ${row.kind} for ${row.slotKey}? This removes the storage blob.`)) return;
    setPendingId(row._id);
    try {
      await deleteMedia({ mediaId: row._id });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-5 py-3">
        <h3 className="text-sm font-bold text-stone-900">{SLOT_LABELS[slot]} media</h3>
        <p className="text-xs text-stone-500 mt-0.5">
          {rows.filter((r) => r.status === "published").length} published, {rows.filter((r) => r.status === "draft").length} draft
        </p>
      </div>
      <ul className="divide-y divide-stone-100">
        {sortedKeys.map((key) => {
          const items = groups.get(key) ?? [];
          const isOpen = expanded[key] ?? items.length > 0;
          return (
            <li key={key} className="px-5 py-2">
              <button
                type="button"
                onClick={() => setExpanded((s) => ({ ...s, [key]: !isOpen }))}
                className="flex w-full items-center gap-2 text-left text-xs font-semibold text-stone-700"
              >
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>{key}</span>
                <span className="ml-auto text-stone-400">{items.length}</span>
              </button>

              {isOpen && (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {items.length === 0 && (
                    <div className="col-span-full rounded-md border border-dashed border-stone-200 px-3 py-4 text-center text-xs text-stone-400">
                      No media yet — upload one or generate via AI (coming soon).
                    </div>
                  )}
                  {items.map((row) => {
                    const Icon = KIND_ICON[row.kind];
                    const thumbSrc =
                      row.kind === "video" || row.kind === "lottie" || row.kind === "glb"
                        ? row.posterUrl ?? null
                        : row.url;
                    const busy = pendingId === row._id;
                    return (
                      <div
                        key={row._id}
                        className={`rounded-lg border ${
                          row.status === "published"
                            ? "border-emerald-300 bg-emerald-50/40"
                            : "border-stone-200 bg-stone-50/40"
                        } p-2 flex flex-col gap-2`}
                      >
                        <div className="relative aspect-square w-full overflow-hidden rounded bg-stone-100">
                          {thumbSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element -- dynamic storage URLs
                            <img
                              src={thumbSrc}
                              alt={`${row.slotKey} ${row.kind}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-400">
                              <Icon className="w-6 h-6" />
                            </div>
                          )}
                          <span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                            {row.kind}
                          </span>
                          {row.status === "published" && (
                            <span className="absolute top-1 right-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                              live
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {row.status === "published" ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleUnpublish(row)}
                              className="flex items-center gap-1 rounded-md bg-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-700 disabled:opacity-40"
                            >
                              <EyeOff className="w-3 h-3" /> Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handlePublish(row)}
                              className="flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-40"
                            >
                              <Eye className="w-3 h-3" /> Publish
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleDelete(row)}
                            className="flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
