"use client";

import { useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { Upload, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import {
  MEDIA_KIND_SIZE_LIMITS,
  type MediaKind,
  type StudioSlot,
} from "@/src/lib/studioSlots";
import { SlotPicker } from "./SlotPicker";

const KIND_BY_MIME: Array<[RegExp, MediaKind]> = [
  [/^image\/gif$/, "gif"],
  [/^image\/(?!gif)/, "image"],
  [/^video\//, "video"],
  [/^model\/gltf-binary$/, "glb"],
  [/^application\/(json|octet-stream)$/, "lottie"],
];

function detectKind(file: File): MediaKind | null {
  for (const [rx, kind] of KIND_BY_MIME) if (rx.test(file.type)) return kind;
  // Fall back on filename extension.
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  if (ext === "glb") return "glb";
  if (ext === "json") return "lottie";
  if (["mp4", "webm", "mov"].includes(ext)) return "video";
  if (ext === "gif") return "gif";
  if (["jpg", "jpeg", "png", "webp", "avif"].includes(ext)) return "image";
  return null;
}

type Props = {
  productSlugs?: readonly string[];
  onUploaded?: () => void;
};

export function UploadForm({ productSlugs, onUploaded }: Props) {
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const saveMediaRef = useMutation(api.media.saveMediaRef);

  const [slot, setSlot] = useState<StudioSlot>("brew_step");
  const [slotKey, setSlotKey] = useState<string>("v60.bloom");
  const [file, setFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPosterFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadOne = useCallback(
    async (blob: File): Promise<string> => {
      const url = await generateUploadUrl();
      return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", blob.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const { storageId } = JSON.parse(xhr.responseText);
              resolve(storageId);
            } catch (e) {
              reject(new Error("Bad upload response"));
            }
          } else reject(new Error(`Upload failed (${xhr.status})`));
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
        `${kind} exceeds size limit (${(file.size / 1024 / 1024).toFixed(1)} MB > ${(limit / 1024 / 1024).toFixed(1)} MB)`,
      );
      return;
    }
    if (!slotKey) {
      setErr("Pick a slot key");
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

      // Best-effort dimension probe for images (skip for video/glb/lottie).
      let width: number | undefined;
      let height: number | undefined;
      if (kind === "image" || kind === "gif") {
        const dims = await probeImageDimensions(file).catch(() => null);
        if (dims) {
          width = dims.w;
          height = dims.h;
        }
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

      setOk(`Uploaded ${file.name} as draft. Publish it from the list to activate.`);
      reset();
      onUploaded?.();
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
        <Upload className="w-4 h-4" /> Upload media
      </h3>

      <SlotPicker
        slot={slot}
        slotKey={slotKey}
        onSlotChange={setSlot}
        onSlotKeyChange={setSlotKey}
        productSlugs={productSlugs}
        disabled={busy}
      />

      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">
          File (image / gif / video / lottie json / glb)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          disabled={busy}
          accept="image/*,video/*,model/gltf-binary,.glb,application/json"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
        />
        {file && (
          <p className="mt-1 text-xs text-stone-500">
            {file.name} — {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-700 mb-1">
          Optional poster (for video / gif fallback on low-tier devices)
        </label>
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
        />
      </div>

      {busy && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-stone-700 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {err && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {ok && (
        <div className="flex items-start gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{ok}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || !file}
          className="rounded-md bg-stone-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Uploading…" : "Upload as draft"}
        </button>
        {file && !busy && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

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
      reject(new Error("Image probe failed"));
    };
    img.src = url;
  });
}
