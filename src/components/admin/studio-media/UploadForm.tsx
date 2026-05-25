"use client";

import { useCallback, useRef, useState, DragEvent } from "react";
import { useMutation } from "convex/react";
import {
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  Film,
  FileJson,
  Box,
  X,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import {
  MEDIA_KIND_SIZE_LIMITS,
  STUDIO_SLOTS,
  type MediaKind,
  type StudioSlot,
} from "@/src/lib/studioSlots";
import { humanize } from "../StudioMediaTab";

// ── Kind detection ───────────────────────────────────────────────────────────

const KIND_BY_MIME: Array<[RegExp, MediaKind]> = [
  [/^image\/gif$/, "gif"],
  [/^image\/(?!gif)/, "image"],
  [/^video\//, "video"],
  [/^model\/gltf-binary$/, "glb"],
  [/^application\/(json|octet-stream)$/, "lottie"],
];

function detectKind(file: File): MediaKind | null {
  for (const [rx, kind] of KIND_BY_MIME) if (rx.test(file.type)) return kind;
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (ext === "glb") return "glb";
  if (ext === "json") return "lottie";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  if (ext === "gif") return "gif";
  if (["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) return "image";
  return null;
}

const KIND_ICON: Record<MediaKind, React.ComponentType<{ className?: string }>> = {
  image: ImageIcon,
  gif: ImageIcon,
  video: Film,
  lottie: FileJson,
  glb: Box,
};

const KIND_COLOR: Record<MediaKind, string> = {
  image: "bg-blue-100 text-blue-700",
  gif: "bg-purple-100 text-purple-700",
  video: "bg-rose-100 text-rose-700",
  lottie: "bg-amber-100 text-amber-700",
  glb: "bg-teal-100 text-teal-700",
};

// ── Component ────────────────────────────────────────────────────────────────

type Props = {
  productSlugs?: readonly string[];
  defaultSlot?: StudioSlot;
  defaultSlotKey?: string;
  onUploaded?: () => void;
};

export function UploadForm({
  productSlugs,
  defaultSlot = "brew_step",
  defaultSlotKey,
  onUploaded,
}: Props) {
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const saveMediaRef = useMutation(api.media.saveMediaRef);

  const [slot, setSlot] = useState<StudioSlot>(defaultSlot);
  const [slotKey, setSlotKey] = useState<string>(() => {
    if (defaultSlotKey) return defaultSlotKey;
    const opts =
      defaultSlot === "product"
        ? productSlugs ?? []
        : STUDIO_SLOTS[defaultSlot];
    return opts[0] ?? "";
  });
  const [file, setFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const slotKeyOptions: readonly string[] =
    slot === "product" ? (productSlugs ?? []) : STUDIO_SLOTS[slot];

  const detectedKind = file ? detectKind(file) : null;

  // ── File selection ─────────────────────────────────────────────────────

  const applyFile = (f: File) => {
    setFile(f);
    setErr(null);
    setOk(null);
    // Generate an object-URL preview for images/gifs
    const kind = detectKind(f);
    if (kind === "image" || kind === "gif") {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const reset = () => {
    setFile(null);
    setPosterFile(null);
    setProgress(0);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Drag and drop ──────────────────────────────────────────────────────

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) applyFile(f);
  };

  // ── Slot change ────────────────────────────────────────────────────────

  const handleSlotChange = (next: StudioSlot) => {
    setSlot(next);
    const opts = next === "product" ? productSlugs ?? [] : STUDIO_SLOTS[next];
    setSlotKey(opts[0] ?? "");
  };

  // ── Upload ─────────────────────────────────────────────────────────────

  const uploadOne = useCallback(
    async (blob: File): Promise<string> => {
      const url = await generateUploadUrl();
      return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader(
          "Content-Type",
          blob.type || "application/octet-stream",
        );
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const { storageId } = JSON.parse(xhr.responseText);
              resolve(storageId);
            } catch {
              reject(new Error("Unexpected response from server"));
            }
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(blob);
      });
    },
    [generateUploadUrl],
  );

  const onSubmit = async () => {
    if (!file) return;
    setErr(null);
    setOk(null);
    const kind = detectKind(file);
    if (!kind) {
      setErr(`Unsupported file type: ${file.type || "unknown"}`);
      return;
    }
    const limit = MEDIA_KIND_SIZE_LIMITS[kind];
    if (file.size > limit) {
      setErr(
        `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB  (max ${(limit / 1024 / 1024).toFixed(0)} MB for ${kind})`,
      );
      return;
    }
    if (!slotKey) {
      setErr("Choose a target slot key first");
      return;
    }

    setBusy(true);
    setProgress(0);
    try {
      const storageId = await uploadOne(file);
      let posterStorageId: string | undefined;
      if (posterFile && (kind === "video" || kind === "gif")) {
        posterStorageId = await uploadOne(posterFile);
      }

      let width: number | undefined;
      let height: number | undefined;
      if (kind === "image" || kind === "gif") {
        const dims = await probeImageDimensions(file).catch(() => null);
        if (dims) { width = dims.w; height = dims.h; }
      }

      await saveMediaRef({
        kind,
        slot,
        slotKey,
        storageId: storageId as any,
        sizeBytes: file.size,
        posterStorageId: posterStorageId as any,
        width,
        height,
        provenance: "upload",
      });

      setOk(`Uploaded as draft. Click "Publish" on the item below to make it live.`);
      reset();
      onUploaded?.();
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-2xl">
      <h3 className="text-sm font-bold text-stone-900">Upload media</h3>

      {/* Slot + key selector */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
            Section
          </label>
          <select
            value={slot}
            disabled={busy}
            onChange={(e) => handleSlotChange(e.target.value as StudioSlot)}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
          >
            <option value="brew_method">Brew Methods</option>
            <option value="brew_step">Brew Steps</option>
            <option value="signature">Signature Drinks</option>
            <option value="product">Products</option>
            <option value="ambience">Ambience</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
            Specific item
          </label>
          {slotKeyOptions.length === 0 ? (
            <input
              type="text"
              value={slotKey}
              disabled={busy}
              onChange={(e) => setSlotKey(e.target.value)}
              placeholder="e.g. my-product-slug"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          ) : (
            <select
              value={slotKey}
              disabled={busy}
              onChange={(e) => setSlotKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              {slotKeyOptions.map((k) => (
                <option key={k} value={k}>
                  {humanize(k)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Drop zone */}
      {!file ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer py-10 transition-colors ${
            isDragging
              ? "border-stone-600 bg-stone-100"
              : "border-stone-200 bg-stone-50 hover:border-stone-400 hover:bg-white"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
            <Upload className="w-5 h-5 text-stone-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-stone-700">
              Drop a file here, or click to browse
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Image · GIF · Video · Lottie JSON · GLB model
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            disabled={busy}
            className="sr-only"
            accept="image/*,video/*,model/gltf-binary,.glb,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) applyFile(f);
            }}
          />
        </div>
      ) : (
        /* File preview card */
        <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="preview"
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-stone-100"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
              {detectedKind && (() => {
                const Icon = KIND_ICON[detectedKind];
                return <Icon className="w-6 h-6 text-stone-400" />;
              })()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">{file.name}</p>
            <div className="flex items-center gap-2 mt-1">
              {detectedKind && (
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${KIND_COLOR[detectedKind]}`}>
                  {detectedKind}
                </span>
              )}
              <span className="text-xs text-stone-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-stone-400 hover:text-stone-700 transition mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Poster upload (video/gif only) */}
      {file && detectedKind && (detectedKind === "video" || detectedKind === "gif") && (
        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
            Poster image <span className="font-normal normal-case text-stone-400">(fallback for slow connections)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
          />
          {posterFile && (
            <p className="mt-1 text-xs text-stone-500">{posterFile.name}</p>
          )}
        </div>
      )}

      {/* Progress */}
      {busy && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
            </span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-stone-800 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error / success */}
      {err && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{err}</span>
        </div>
      )}
      {ok && (
        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{ok}</span>
        </div>
      )}

      {/* Actions */}
      {file && !ok && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy || !file}
            className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-stone-700 transition"
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="w-4 h-4" /> Upload as draft</>
            )}
          </button>
          {!busy && (
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function probeImageDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const out = { w: img.naturalWidth, h: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = url;
  });
}
