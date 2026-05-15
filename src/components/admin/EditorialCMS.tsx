import { useState } from "react";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Type-cast api to access newly-created modules before convex dev regenerates types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convexApi = api as any;
import { Plus, Trash2, Edit3, Tag, Percent } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const INPUT =
  "w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 ring-[#5A5A40]/20 bg-white text-sm";
const LABEL =
  "block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5";

type PostType =
  | "flash-sale"
  | "product-launch"
  | "cafe-news"
  | "brand-story"
  | "champion";
type PostStatus = "draft" | "published" | "scheduled";

interface PostFormState {
  type: PostType;
  headline: string;
  subhead: string;
  body: string;
  coverImageStorageId: string;
  coverImageUrl: string;
  status: PostStatus;
  publishAt: string;
  expiresAt: string;
  linkedProductId: string;
  discountId: string;
  personName: string;
  personRole: string;
  personStory: string;
}

const defaultPostForm = (): PostFormState => ({
  type: "cafe-news",
  headline: "",
  subhead: "",
  body: "",
  coverImageStorageId: "",
  coverImageUrl: "",
  status: "draft",
  publishAt: "",
  expiresAt: "",
  linkedProductId: "",
  discountId: "",
  personName: "",
  personRole: "",
  personStory: "",
});

const TYPE_LABELS: Record<PostType, string> = {
  "flash-sale": "Flash Sale",
  "product-launch": "Product Launch",
  "cafe-news": "Café News",
  "brand-story": "Brand Story",
  champion: "Champion",
};

const TYPE_COLORS: Record<PostType, string> = {
  "flash-sale": "bg-amber-100 text-amber-700",
  "product-launch": "bg-violet-100 text-violet-700",
  "cafe-news": "bg-sky-100 text-sky-700",
  "brand-story": "bg-emerald-100 text-emerald-700",
  champion: "bg-rose-100 text-rose-700",
};

const STATUS_COLORS: Record<PostStatus, string> = {
  draft: "bg-stone-100 text-stone-500",
  published: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
};

// ─── Root component ──────────────────────────────────────────────────────────
export function EditorialCMS() {
  const [subTab, setSubTab] = useState<"posts" | "discounts">("posts");

  return (
    <div className="p-8 space-y-6">
      {/* Sub-tab pills */}
      <div className="flex gap-2">
        {(["posts", "discounts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
              subTab === t
                ? "bg-[#5A5A40] text-white shadow"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {t === "posts" ? "Posts" : "Discounts"}
          </button>
        ))}
      </div>

      {subTab === "posts" && <PostsManager />}
      {subTab === "discounts" && <DiscountsManager />}
    </div>
  );
}

// ─── Posts manager ────────────────────────────────────────────────────────────
function PostsManager() {
  const posts = useQuery(convexApi.posts.listAll) ?? [];
  const discounts = useQuery(convexApi.discounts.listDiscounts) ?? [];
  const products = useQuery(api.products.list) ?? [];
  const createPost = useMutation(convexApi.posts.createPost);
  const updatePost = useMutation(convexApi.posts.updatePost);
  const togglePublish = useMutation(convexApi.posts.togglePublish);
  const deletePost = useMutation(convexApi.posts.deletePost);
  const generateUploadUrl = useMutation(convexApi.posts.generateUploadUrl);

  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<(typeof posts)[0] | null>(null);
  const [form, setForm] = useState<PostFormState>(defaultPostForm());
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const convex = useConvex();

  function openNew() {
    setEditingPost(null);
    setForm(defaultPostForm());
    setPreviewUrl("");
    setUploadStatus("idle");
    setError("");
    setShowForm(true);
  }

  function openEdit(post: (typeof posts)[0]) {
    setEditingPost(post);
    setForm({
      type: post.type as PostType,
      headline: post.headline,
      subhead: post.subhead ?? "",
      body: post.body,
      coverImageStorageId: post.coverImageStorageId ?? "",
      // If the post has a storageId, the URL is derived server-side; don't echo it
      // back into the form (would cause stale URL to win over new uploads).
      coverImageUrl: post.coverImageStorageId ? "" : (post.coverImageUrl ?? ""),
      status: post.status as PostStatus,
      publishAt: post.publishAt
        ? new Date(post.publishAt).toISOString().slice(0, 16)
        : "",
      expiresAt: post.expiresAt
        ? new Date(post.expiresAt).toISOString().slice(0, 16)
        : "",
      linkedProductId: post.linkedProductId ?? "",
      discountId: post.discountId ?? "",
      personName: post.personName ?? "",
      personRole: post.personRole ?? "",
      personStory: post.personStory ?? "",
    });
    // Use the resolved URL from the query for preview only
    setPreviewUrl(post.coverImageUrl ?? "");
    setUploadStatus("idle");
    setError("");
    setShowForm(true);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setUploadStatus("uploading");
    setError("");
    try {
      // Show a local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!result.ok) throw new Error(`Upload failed: ${result.status}`);
      const { storageId } = await result.json();
      if (!storageId) throw new Error("No storageId returned from upload");

      // Fetch the real served CDN URL to confirm the file is reachable end-to-end
      const cdnUrl = await convex.query(convexApi.posts.getStorageUrl, { storageId });
      if (!cdnUrl) throw new Error("Storage returned no URL for the uploaded file");

      // Swap the blob preview for the real CDN URL — visible proof it persisted
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(cdnUrl);
      setForm((f) => ({ ...f, coverImageStorageId: storageId, coverImageUrl: "" }));
      setUploadStatus("success");
    } catch (e: any) {
      setUploadStatus("error");
      setError(e?.message ?? "Image upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      type: form.type,
      headline: form.headline,
      subhead: form.subhead || undefined,
      body: form.body,
      coverImageStorageId: form.coverImageStorageId
        ? (form.coverImageStorageId as Id<"_storage">)
        : undefined,
      // Send empty string to explicitly clear stale URLs in the DB (Convex
      // patch only skips `undefined`, so empty string actually overwrites).
      coverImageUrl: form.coverImageUrl ?? "",
      status: form.status,
      publishAt: form.publishAt ? new Date(form.publishAt).getTime() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined,
      linkedProductId: form.linkedProductId
        ? (form.linkedProductId as Id<"products">)
        : undefined,
      discountId: form.discountId
        ? (form.discountId as Id<"discounts">)
        : undefined,
      personName: form.personName || undefined,
      personRole: form.personRole || undefined,
      personStory: form.personStory || undefined,
    };
    try {
      if (editingPost) {
        await updatePost({ id: editingPost._id, ...payload });
      } else {
        await createPost(payload);
      }
      setShowForm(false);
      setForm(defaultPostForm());
      setPreviewUrl("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to save post");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-stone-700">Posts</h3>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#5A5A40] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[#4a4a33] transition"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Post list */}
      {posts.length === 0 ? (
        <p className="text-stone-400 text-sm py-8 text-center">No posts yet. Create your first editorial post.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-stone-100">
                <th className="pb-3 pr-4 font-bold text-stone-400 text-xs uppercase tracking-wider">Headline</th>
                <th className="pb-3 pr-4 font-bold text-stone-400 text-xs uppercase tracking-wider">Type</th>
                <th className="pb-3 pr-4 font-bold text-stone-400 text-xs uppercase tracking-wider">Status</th>
                <th className="pb-3 pr-4 font-bold text-stone-400 text-xs uppercase tracking-wider">Publish</th>
                <th className="pb-3 font-bold text-stone-400 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id} className="border-b border-stone-50 hover:bg-stone-50 transition">
                  <td className="py-3 pr-4 font-medium text-stone-700 max-w-xs truncate">
                    {post.headline.slice(0, 40)}{post.headline.length > 40 ? "…" : ""}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[post.type as PostType]}`}>
                      {TYPE_LABELS[post.type as PostType]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[post.status as PostStatus]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-stone-400 text-xs">
                    {post.publishAt ? new Date(post.publishAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(post)}
                        className="flex items-center gap-1 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-medium transition"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => togglePublish({ id: post._id })}
                        className="bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-medium transition"
                      >
                        {post.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${post.headline}"?`)) deletePost({ id: post._id });
                        }}
                        className="bg-red-50 text-red-500 hover:bg-red-100 rounded-lg px-2.5 py-1.5 text-xs font-medium transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Post form panel */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => { setShowForm(false); setPreviewUrl(""); }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-stone-800">
                    {editingPost ? "Edit Post" : "New Post"}
                  </h3>
                  <button
                    onClick={() => { setShowForm(false); setPreviewUrl(""); }}
                    className="text-stone-400 hover:text-stone-600 transition"
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type */}
                  <div>
                    <label className={LABEL}>Type</label>
                    <select
                      className={INPUT}
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PostType }))}
                    >
                      {Object.entries(TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Headline */}
                  <div>
                    <label className={LABEL}>Headline *</label>
                    <input
                      required
                      className={INPUT}
                      value={form.headline}
                      onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                      placeholder="Compelling headline"
                    />
                  </div>

                  {/* Subhead */}
                  <div>
                    <label className={LABEL}>Subhead</label>
                    <input
                      className={INPUT}
                      value={form.subhead}
                      onChange={(e) => setForm((f) => ({ ...f, subhead: e.target.value }))}
                      placeholder="Supporting text"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className={LABEL}>Body *</label>
                    <textarea
                      required
                      rows={6}
                      className={INPUT}
                      value={form.body}
                      onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                      placeholder="Post content..."
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className={LABEL}>Status</label>
                    <select
                      className={INPUT}
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PostStatus }))}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>

                  {/* Publish at */}
                  <div>
                    <label className={LABEL}>Publish At</label>
                    <input
                      type="datetime-local"
                      className={INPUT}
                      value={form.publishAt}
                      onChange={(e) => setForm((f) => ({ ...f, publishAt: e.target.value }))}
                    />
                  </div>

                  {/* Expires at (flash-sale) */}
                  {form.type === "flash-sale" && (
                    <div>
                      <label className={LABEL}>Expires At</label>
                      <input
                        type="datetime-local"
                        className={INPUT}
                        value={form.expiresAt}
                        onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Linked product (product-launch, champion) */}
                  {(form.type === "product-launch" || form.type === "champion") && (
                    <div>
                      <label className={LABEL}>Linked Product</label>
                      <select
                        className={INPUT}
                        value={form.linkedProductId}
                        onChange={(e) => setForm((f) => ({ ...f, linkedProductId: e.target.value }))}
                      >
                        <option value="">— None —</option>
                        {products.map((p: any) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Discount selector (flash-sale only) */}
                  {form.type === "flash-sale" && (
                    <div>
                      <label className={LABEL}>Linked Discount Code</label>
                      <select
                        className={INPUT}
                        value={form.discountId}
                        onChange={(e) => setForm((f) => ({ ...f, discountId: e.target.value }))}
                      >
                        <option value="">— None —</option>
                        {discounts.map((d: any) => (
                          <option key={d._id} value={d._id}>
                            {d.code} ({d.discountType === "percent" ? `${d.amount}%` : `₹${d.amount}`})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Champion-only fields */}
                  {form.type === "champion" && (
                    <>
                      <div>
                        <label className={LABEL}>Person Name</label>
                        <input
                          className={INPUT}
                          value={form.personName}
                          onChange={(e) => setForm((f) => ({ ...f, personName: e.target.value }))}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Person Role</label>
                        <input
                          className={INPUT}
                          value={form.personRole}
                          onChange={(e) => setForm((f) => ({ ...f, personRole: e.target.value }))}
                          placeholder="e.g. Head Barista"
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Person Story</label>
                        <textarea
                          rows={4}
                          className={INPUT}
                          value={form.personStory}
                          onChange={(e) => setForm((f) => ({ ...f, personStory: e.target.value }))}
                          placeholder="Their story..."
                        />
                      </div>
                    </>
                  )}

                  {/* Cover image upload */}
                  <div>
                    <label className={LABEL}>Cover Image</label>
                    {(previewUrl || form.coverImageUrl) && (
                      <img
                        src={previewUrl || form.coverImageUrl}
                        alt="Cover preview"
                        className="w-full h-32 object-cover rounded-xl mb-2"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-stone-100 file:text-stone-600 hover:file:bg-stone-200"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      disabled={uploading}
                    />
                    {uploadStatus === "uploading" && (
                      <p className="text-xs text-amber-600 mt-2 animate-pulse flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        Uploading image…
                      </p>
                    )}
                    {uploadStatus === "success" && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5 font-semibold">
                        <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[9px]">✓</span>
                        Upload complete — image saved. Click “Save Changes” to publish.
                      </p>
                    )}
                    {uploadStatus === "error" && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5 font-semibold">
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px]">!</span>
                        Upload failed. Try a smaller file or check your connection.
                      </p>
                    )}
                    {form.coverImageStorageId && uploadStatus !== "uploading" && (
                      <p className="text-[10px] text-stone-300 mt-1 font-mono truncate">storageId: {form.coverImageStorageId}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#5A5A40] text-white rounded-xl py-3 font-bold hover:bg-[#4a4a33] transition disabled:opacity-50"
                    disabled={uploading}
                  >
                    {editingPost ? "Save Changes" : "Create Post"}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Discounts manager ────────────────────────────────────────────────────────
function DiscountsManager() {
  const discounts = useQuery(convexApi.discounts.listDiscounts) ?? [];
  const createDiscount = useMutation(convexApi.discounts.createDiscount);
  const deleteDiscount = useMutation(convexApi.discounts.deleteDiscount);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "flat",
    amount: "",
    firstOrderOnly: false,
    expiresAt: "",
    maxUses: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createDiscount({
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        amount: parseFloat(form.amount),
        firstOrderOnly: form.firstOrderOnly,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).getTime() : undefined,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
      });
      setForm({ code: "", discountType: "percent", amount: "", firstOrderOnly: false, expiresAt: "", maxUses: "" });
      setShowForm(false);
    } catch (e: any) {
      setError(e?.data ?? e?.message ?? "Failed to create discount");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-stone-700">Discount Codes</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-[#5A5A40] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[#4a4a33] transition"
        >
          <Plus className="w-4 h-4" /> New Discount
        </button>
      </div>

      {/* Inline create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-stone-50 rounded-2xl p-5 border border-stone-200"
          >
            {error && (
              <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className={LABEL}>Code *</label>
                <input
                  required
                  className={INPUT}
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="SUMMER20"
                />
              </div>
              <div>
                <label className={LABEL}>Type</label>
                <select
                  className={INPUT}
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "percent" | "flat" }))}
                >
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Amount *</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  className={INPUT}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder={form.discountType === "percent" ? "10" : "50"}
                />
              </div>
              <div>
                <label className={LABEL}>Max Uses</label>
                <input
                  type="number"
                  min="1"
                  className={INPUT}
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className={LABEL}>Expires At</label>
                <input
                  type="datetime-local"
                  className={INPUT}
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="firstOrderOnly"
                  checked={form.firstOrderOnly}
                  onChange={(e) => setForm((f) => ({ ...f, firstOrderOnly: e.target.checked }))}
                  className="w-4 h-4 accent-[#5A5A40]"
                />
                <label htmlFor="firstOrderOnly" className="text-sm font-medium text-stone-600">
                  First order only
                </label>
              </div>
              <div className="col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-[#5A5A40] text-white rounded-xl px-5 py-2 font-bold text-sm hover:bg-[#4a4a33] transition"
                >
                  Create Code
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-stone-100 text-stone-600 rounded-xl px-5 py-2 font-bold text-sm hover:bg-stone-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discounts table */}
      {discounts.length === 0 ? (
        <p className="text-stone-400 text-sm py-8 text-center">No discount codes yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-stone-100">
                <th className="pb-3 pr-4 font-bold text-stone-400 text-xs uppercase tracking-wider">Code</th>
                <th className="pb-3 pr-4 font-bold text-stone-400 text-xs uppercase tracking-wider">Type</th>
                <th className="pb-3 pr-4 font-bold text-stone-400 text-xs uppercase tracking-wider">Amount</th>
                <th className="pb-3 pr-4 font-bold text-stone-400 text-xs uppercase tracking-wider">1st Order</th>
                <th className="pb-3 pr-4 font-bold text-stone-400 text-xs uppercase tracking-wider">Expires</th>
                <th className="pb-3 pr-4 font-bold text-stone-400 text-xs uppercase tracking-wider">Max / Used</th>
                <th className="pb-3 font-bold text-stone-400 text-xs uppercase tracking-wider">Del</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d: any) => (
                <tr key={d._id} className="border-b border-stone-50 hover:bg-stone-50 transition">
                  <td className="py-3 pr-4 font-mono font-bold text-stone-800">{d.code}</td>
                  <td className="py-3 pr-4">
                    <span className={`flex items-center gap-1 text-xs font-semibold ${d.discountType === "percent" ? "text-violet-600" : "text-emerald-600"}`}>
                      {d.discountType === "percent" ? <Percent className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                      {d.discountType}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-semibold">
                    {d.discountType === "percent" ? `${d.amount}%` : `₹${d.amount}`}
                  </td>
                  <td className="py-3 pr-4 text-stone-500">
                    {d.firstOrderOnly ? "✓" : "—"}
                  </td>
                  <td className="py-3 pr-4 text-stone-400 text-xs">
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3 pr-4 text-stone-500 text-xs">
                    {d.maxUses !== undefined ? `${d.maxUses}` : "∞"} / {d.usageCount}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => {
                        if (confirm(`Delete discount code "${d.code}"?`)) {
                          deleteDiscount({ id: d._id });
                        }
                      }}
                      className="bg-red-50 text-red-500 hover:bg-red-100 rounded-lg p-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
