"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  Trash2,
  Eye,
  EyeOff,
  Box,
  Film,
  Image as ImageIcon,
  Sparkles,
  FileJson,
  Upload,
  Loader2,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { type StudioSlot, type MediaKind } from "@/src/lib/studioSlots";
import { humanize } from "../StudioMediaTab";

// ── Types ────────────────────────────────────────────────────────────────────

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

type Props = {
  slot: StudioSlot;
  filterKey?: string | null;
  onUploadClick?: () => void;
};

// ── Icon / label maps ────────────────────────────────────────────────────────

const KIND_ICON: Record<MediaKind, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  gif: ImageIcon,
  video: Film,
  lottie: FileJson,
  glb: Box,
};

const KIND_LABEL: Record<MediaKind, string> = {
  image: "Image",
  gif: "GIF",
  video: "Video",
  lottie: "Lottie",
  glb: "3D",
};

const KIND_COLOR: Record<MediaKind, string> = {
  image: "bg-blue-50 text-blue-600",
  gif: "bg-purple-50 text-purple-600",
  video: "bg-rose-50 text-rose-600",
  lottie: "bg-amber-50 text-amber-600",
  glb: "bg-teal-50 text-teal-600",
};

/**
 * Flat media list for one slot, optionally filtered by slotKey.
 * Shows items grouped by slotKey with clean rows: thumbnail, name, badges, actions.
 */
export function MediaList({ slot, filterKey, onUploadClick }: Props) {
  const rows = (useQuery(api.media.listBySlot, { slot }) ?? []) as MediaRow[] | undefined;
  const setActive = useMutation(api.media.setActive);
  const unpublish = useMutation(api.media.unpublish);
  const deleteMedia = useMutation(api.media.deleteMedia);
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!rows) {
    return (
      <div className="flex items-center gap-2 text-sm text-stone-500 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading media…
      </div>
    );
  }

  // Apply key filter
  const visible = filterKey ? rows.filter((r) => r.slotKey === filterKey) : rows;

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-stone-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-700">No media uploaded yet</p>
          <p className="text-xs text-stone-400 mt-1">
            {filterKey
              ? `Nothing uploaded for "${humanize(filterKey)}" — try uploading one.`
              : "Upload your first asset to get started."}
          </p>
        </div>
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="flex items-center gap-2 mt-1 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-700 transition"
          >
            <Upload className="w-4 h-4" /> Upload media
          </button>
        )}
      </div>
    );
  }

  // Group by slotKey for clear visual sections
  const groups = new Map<string, MediaRow[]>();
  for (const r of visible) {
    if (!groups.has(r.slotKey)) groups.set(r.slotKey, []);
    groups.get(r.slotKey)!.push(r);
  }
  const sortedKeys = [...groups.keys()].sort();

  const handlePublish = async (row: MediaRow) => {
    setPendingId(row._id);
    try { await setActive({ mediaId: row._id }); }
    finally { setPendingId(null); }
  };
  const handleUnpublish = async (row: MediaRow) => {
    setPendingId(row._id);
    try { await unpublish({ mediaId: row._id }); }
    finally { setPendingId(null); }
  };
  const handleDelete = async (row: MediaRow) => {
    if (!confirm(`Delete this ${row.kind} for "${humanize(row.slotKey)}"? This cannot be undone.`)) return;
    setPendingId(row._id);
    try { await deleteMedia({ mediaId: row._id }); }
    finally { setPendingId(null); }
  };

  return (
    <div className="space-y-6">
      {sortedKeys.map((key) => {
        const items = groups.get(key) ?? [];
        return (
          <div key={key}>
            {/* Key group header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                {humanize(key)}
              </span>
              <span className="text-xs text-stone-400">
                {items.length} {items.length === 1 ? "file" : "files"}
              </span>
              <div className="flex-1 h-px bg-stone-100" />
              {items.some((r) => r.status === "published") && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Live
                </span>
              )}
            </div>

            {/* Media rows */}
            <div className="rounded-xl border border-stone-100 divide-y divide-stone-100 overflow-hidden">
              {items.map((row) => {
                const Icon = KIND_ICON[row.kind];
                const thumbSrc =
                  row.kind === "video" || row.kind === "lottie" || row.kind === "glb"
                    ? row.posterUrl ?? null
                    : row.url;
                const busy = pendingId === row._id;
                const isLive = row.status === "published";

                return (
                  <div
                    key={row._id}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                      isLive ? "bg-emerald-50/30" : "bg-white hover:bg-stone-50/70"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center">
                      {thumbSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbSrc}
                          alt={`${row.slotKey} ${row.kind}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="w-5 h-5 text-stone-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${KIND_COLOR[row.kind]}`}>
                          {KIND_LABEL[row.kind]}
                        </span>
                        {row.width && row.height && (
                          <span className="text-[10px] text-stone-400">
                            {row.width}×{row.height}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        Added {new Date(row._creationTime).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        isLive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {isLive ? "Live" : "Draft"}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {isLive ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleUnpublish(row)}
                          title="Unpublish"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition"
                        >
                          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3 h-3" />}
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handlePublish(row)}
                          title="Publish"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 transition"
                        >
                          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                          Publish
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(row)}
                        title="Delete"
                        className="p-1.5 rounded-lg border border-transparent text-stone-400 hover:border-red-200 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
