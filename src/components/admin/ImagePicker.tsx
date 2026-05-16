import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Upload, Image as ImageIcon, Link2, Loader2, Check, Search } from "lucide-react";

interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
}

type Mode = "upload" | "library" | "url";

const MAX_DIM = 1200;
const TARGET_BYTES = 180 * 1024; // ~180 KB target

async function compressToWebp(file: File): Promise<Blob> {
  // Decode using createImageBitmap (faster than <img>) with fallback.
  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  const srcW = (bitmap as any).width as number;
  const srcH = (bitmap as any).height as number;
  const scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH));
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");
  ctx.drawImage(bitmap as any, 0, 0, w, h);

  // Try progressively lower quality until file size fits target.
  const qualities = [0.82, 0.7, 0.6, 0.5, 0.4];
  for (const q of qualities) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", q)
    );
    if (!blob) continue;
    if (blob.size <= TARGET_BYTES || q === qualities[qualities.length - 1]) {
      return blob;
    }
  }
  throw new Error("compression failed");
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const [mode, setMode] = useState<Mode>(value ? "url" : "upload");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const generateUploadUrl = useMutation((api as any).products.generateUploadUrl);
  const getStorageUrl = useMutation((api as any).products.getStorageUrl);
  const allProducts = useQuery((api as any).products.list) as Array<{ _id: string; name: string; imageUrl: string }> | undefined;

  const library = useMemo(() => {
    if (!allProducts) return [];
    const seen = new Set<string>();
    const list: { url: string; name: string }[] = [];
    for (const p of allProducts) {
      if (!p.imageUrl) continue;
      if (seen.has(p.imageUrl)) continue;
      seen.add(p.imageUrl);
      list.push({ url: p.imageUrl, name: p.name });
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((x) => x.name.toLowerCase().includes(q));
  }, [allProducts, search]);

  async function handleFile(file: File) {
    setErr(null);
    setBusy(true);
    try {
      const original = file.size;
      const blob = await compressToWebp(file);
      const uploadUrl: string = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: blob,
      });
      if (!res.ok) throw new Error(`upload ${res.status}`);
      const { storageId } = await res.json();
      const url: string | null = await getStorageUrl({ storageId });
      if (!url) throw new Error("no url returned");
      onChange(url);
      setStats({ original, compressed: blob.size });
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const tabBtn = (m: Mode, label: string, Icon: any) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
        mode === m ? "bg-[#5A5A40] text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {tabBtn("upload", "Upload", Upload)}
        {tabBtn("library", "From library", ImageIcon)}
        {tabBtn("url", "URL", Link2)}
      </div>

      {mode === "upload" && (
        <div>
          <div
            onClick={() => !busy && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              busy ? "border-stone-200 bg-stone-50" : "border-stone-300 hover:border-[#5A5A40] hover:bg-stone-50"
            }`}
          >
            {busy ? (
              <div className="flex items-center justify-center gap-2 text-stone-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Compressing &amp; uploading…
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 mx-auto mb-2 text-stone-400" />
                <p className="text-sm font-bold text-stone-600">Drop image here or click to browse</p>
                <p className="text-xs text-stone-400 mt-1">Auto-resized to {MAX_DIM}px max &amp; converted to WebP</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>
          {stats && (
            <div className="mt-2 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold">
              <Check className="w-3.5 h-3.5" /> {humanSize(stats.original)} → {humanSize(stats.compressed)} WebP
            </div>
          )}
          {err && <p className="mt-2 text-xs text-red-600 font-bold">{err}</p>}
        </div>
      )}

      {mode === "library" && (
        <div>
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 outline-none focus:ring-2 ring-[#5A5A40]/20 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
            {library.length === 0 ? (
              <p className="col-span-full text-xs text-stone-400 text-center py-6">No images in library</p>
            ) : (
              library.map((item) => {
                const selected = item.url === value;
                return (
                  <button
                    type="button"
                    key={item.url}
                    onClick={() => onChange(item.url)}
                    title={item.name}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selected ? "border-[#5A5A40] ring-2 ring-[#5A5A40]/30" : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    {selected && (
                      <span className="absolute top-1 right-1 bg-[#5A5A40] text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {mode === "url" && (
        <input
          className="w-full p-2.5 rounded-xl border border-stone-200 outline-none focus:ring-2 ring-[#5A5A40]/20 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />
      )}

      {value && (
        <div className="flex items-start gap-3 pt-2">
          <img
            src={value}
            alt="preview"
            className="w-20 h-20 rounded-2xl object-cover border border-stone-200 flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <p className="text-xs text-stone-400 break-all flex-1">{value}</p>
        </div>
      )}
    </div>
  );
}
