import { useQuery } from "convex/react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convexApi = api as any;

const TYPE_BADGE: Record<string, string> = {
  "flash-sale": "bg-amber-500 text-white",
  "product-launch": "bg-violet-600 text-white",
  "cafe-news": "bg-sky-500 text-white",
  "brand-story": "bg-emerald-600 text-white",
  champion: "bg-rose-600 text-white",
};

const TYPE_LABEL: Record<string, string> = {
  "flash-sale": "Flash Sale",
  "product-launch": "New Launch",
  "cafe-news": "Café News",
  "brand-story": "Brand Story",
  champion: "Champion",
};

interface PostDetailProps {
  postId: string;
  onBack: () => void;
  onProductClick: (productId: string) => void;
}

export function PostDetail({ postId, onBack, onProductClick }: PostDetailProps) {
  const post = useQuery(convexApi.posts.getPost, { id: postId as Id<"posts"> });

  if (post === undefined) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-natural-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center text-natural-text/40">
        Post not found.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-natural-bg text-natural-text"
    >
      {/* Cover image header */}
      <div className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.headline}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-natural-stone to-[#2a2a1e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl px-4 py-2 font-semibold text-sm hover:bg-white/20 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${TYPE_BADGE[post.type] ?? "bg-stone-200 text-stone-600"}`}>
            {TYPE_LABEL[post.type] ?? post.type}
          </span>
          <span className="text-natural-text/30 text-sm">
            {new Date(post.publishAt ?? post._creationTime).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="font-serif font-black text-4xl md:text-5xl leading-tight">{post.headline}</h1>

        {post.subhead && (
          <p className="text-natural-text/60 text-xl font-medium leading-relaxed">{post.subhead}</p>
        )}

        {/* Flash-sale: countdown + claim button */}
        {post.type === "flash-sale" && post.expiresAt && post.expiresAt > Date.now() && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Offer ends in</p>
              <CountdownTimer expiresAt={post.expiresAt} className="text-amber-600 text-base" />
            </div>
          </div>
        )}

        {/* Body text — preserves line breaks */}
        <div className="prose prose-stone max-w-none">
          {post.body.split("\n").map((line: string, i: number) =>
            line.trim() ? (
              <p key={i} className="text-natural-text/80 leading-relaxed text-base">
                {line}
              </p>
            ) : (
              <br key={i} />
            )
          )}
        </div>

        {/* Champion fields */}
        {post.type === "champion" && (post.personName || post.personRole || post.personStory) && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 space-y-2">
            <p className="font-bold text-rose-800 text-lg">{post.personName}</p>
            <p className="text-rose-600 text-sm font-medium">{post.personRole}</p>
            {post.personStory && (
              <p className="text-rose-700/70 text-sm leading-relaxed">{post.personStory}</p>
            )}
          </div>
        )}

        {/* Product-launch CTA */}
        {post.type === "product-launch" && post.linkedProductId && (
          <button
            onClick={() => onProductClick(post.linkedProductId!)}
            className="bg-natural-accent text-white rounded-2xl px-8 py-3 font-bold text-sm hover:bg-natural-text transition"
          >
            Shop Now →
          </button>
        )}

        {/* Back link */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-natural-text/40 hover:text-natural-accent transition text-sm font-medium pt-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Journal
        </button>
      </div>
    </motion.div>
  );
}
