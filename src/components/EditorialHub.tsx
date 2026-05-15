import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import { CountdownTimer } from "./CountdownTimer";
import { Tag } from "lucide-react";
import { api } from "../../convex/_generated/api";

// Type-cast to access new modules before convex dev regenerates types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convexApi = api as any;

type PostType =
  | "flash-sale"
  | "product-launch"
  | "cafe-news"
  | "brand-story"
  | "champion";

type PostStatus = "draft" | "published" | "scheduled";

interface Post {
  _id: string;
  _creationTime: number;
  type: PostType;
  headline: string;
  subhead?: string;
  body: string;
  coverImageUrl?: string;
  status: PostStatus;
  publishAt?: number;
  expiresAt?: number;
  linkedProductId?: string;
  discountId?: string;
  personName?: string;
  personRole?: string;
  personStory?: string;
}

interface Discount {
  _id: string;
  code: string;
  discountType: "percent" | "flat";
  amount: number;
  firstOrderOnly: boolean;
  expiresAt?: number;
  maxUses?: number;
  usageCount: number;
}

type FilterType = "all" | "flash-sale" | "cafe-news" | "brand-story" | "champion";

const FILTER_LABELS: Record<FilterType, string> = {
  all: "All",
  "flash-sale": "Offers",
  "cafe-news": "News",
  "brand-story": "Stories",
  champion: "Champions",
};

const TYPE_BADGE: Record<PostType, string> = {
  "flash-sale": "bg-amber-500 text-white",
  "product-launch": "bg-violet-600 text-white",
  "cafe-news": "bg-sky-500 text-white",
  "brand-story": "bg-emerald-600 text-white",
  champion: "bg-rose-600 text-white",
};

const TYPE_LABEL: Record<PostType, string> = {
  "flash-sale": "Flash Sale",
  "product-launch": "New Launch",
  "cafe-news": "Café News",
  "brand-story": "Brand Story",
  champion: "Champion",
};

// ── Active discount localStorage helpers ─────────────────────
interface ActiveDiscount {
  code: string;
  discountType: "percent" | "flat";
  amount: number;
  claimedAt: number;
}

function getActiveDiscount(): ActiveDiscount | null {
  try {
    const raw = localStorage.getItem("twc_active_discount");
    return raw ? (JSON.parse(raw) as ActiveDiscount) : null;
  } catch {
    return null;
  }
}

function setActiveDiscount(d: ActiveDiscount) {
  localStorage.setItem("twc_active_discount", JSON.stringify(d));
}

// ── Toast ─────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  function show(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(null), 3000);
  }
  return { msg, show };
}

// ── Claim Offer button ────────────────────────────────────────
function ClaimOfferButton({
  post,
  discount,
}: {
  post: Post;
  discount: Discount | undefined;
}) {
  const claimDiscount = useMutation(convexApi.discounts.claimDiscount);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState("");
  const { msg: toastMsg, show: showToast } = useToast();

  if (!discount) return null;

  const expired =
    (post.expiresAt && post.expiresAt < Date.now()) ||
    (discount.expiresAt && discount.expiresAt < Date.now());
  const maxedOut =
    discount.maxUses !== undefined && discount.usageCount >= discount.maxUses;

  const disabled = expired || maxedOut || loading;

  const tooltipText = expired
    ? "This offer has ended"
    : maxedOut
    ? "This offer has reached its limit"
    : "";

  async function handleClaim() {
    if (disabled) return;
    setLoading(true);
    try {
      const existing = getActiveDiscount();
      if (existing && existing.code !== discount!.code) {
        const replace = window.confirm(
          `Replace your current offer "${existing.code}" with "${discount!.code}"?`
        );
        if (!replace) {
          setLoading(false);
          return;
        }
      }
      await claimDiscount({ code: discount!.code });
      const savingsText =
        discount!.discountType === "percent"
          ? `${discount!.amount}% off`
          : `₹${discount!.amount} off`;
      setActiveDiscount({
        code: discount!.code,
        discountType: discount!.discountType,
        amount: discount!.amount,
        claimedAt: Date.now(),
      });
      showToast(`Offer applied ✓ ${discount!.code} — save ${savingsText} your order`);
    } catch (e: any) {
      showToast(e?.data ?? e?.message ?? "Could not claim offer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {toastMsg && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs font-medium px-3 py-1.5 rounded-lg z-10">
          {toastMsg}
        </div>
      )}
      <div
        className="relative"
        onMouseEnter={() => tooltipText && setTooltip(tooltipText)}
        onMouseLeave={() => setTooltip("")}
      >
        {tooltip && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg z-10">
            {tooltip}
          </div>
        )}
        <button
          onClick={handleClaim}
          disabled={disabled}
          className={`backdrop-blur-md border border-white/20 text-white rounded-xl px-4 py-2 font-semibold text-sm shadow-lg transition flex items-center gap-2
            ${disabled
              ? "bg-white/5 opacity-40 cursor-not-allowed"
              : "bg-white/10 hover:bg-white/20 cursor-pointer"
            }`}
        >
          <Tag className="w-3.5 h-3.5" />
          {loading ? "Claiming…" : "Claim Offer"}
        </button>
      </div>
    </div>
  );
}

// ── Post card ─────────────────────────────────────────────────
function PostCard({
  post,
  discountMap,
  large,
  onOpen,
  onProductClick,
}: {
  post: Post;
  discountMap: Map<string, Discount>;
  large: boolean;
  onOpen: (post: Post) => void;
  onProductClick: (id: string) => void;
}) {
  const discount = post.discountId ? discountMap.get(post.discountId) : undefined;
  const isExpired = post.expiresAt ? post.expiresAt < Date.now() : false;

  if (post.type === "flash-sale" && isExpired) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`relative rounded-3xl overflow-hidden bg-natural-paper border border-natural-border group cursor-pointer ${large ? "col-span-12 md:col-span-8" : "col-span-12 md:col-span-4"}`}
      onClick={() => {
        if (post.type === "product-launch" && post.linkedProductId) {
          onProductClick(post.linkedProductId);
        } else {
          onOpen(post);
        }
      }}
    >
      {/* Cover image */}
      <div className={`relative overflow-hidden ${large ? "aspect-[16/7]" : "aspect-[3/2]"}`}>
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-natural-muted to-natural-stone" />
        )}
        {/* Dark gradient overlay for flash-sale */}
        {post.type === "flash-sale" && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        )}
        {/* Type badge */}
        <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${TYPE_BADGE[post.type]}`}>
          {TYPE_LABEL[post.type]}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 space-y-2">
        <h3 className={`font-serif font-bold leading-tight text-natural-text ${large ? "text-2xl" : "text-lg"} line-clamp-2`}>
          {post.headline}
        </h3>
        {post.subhead && (
          <p className="text-natural-text/60 text-sm line-clamp-2">{post.subhead}</p>
        )}

        {/* Flash-sale extras */}
        {post.type === "flash-sale" && post.expiresAt && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-natural-text/40 uppercase tracking-wider font-bold">Ends in</span>
              <CountdownTimer expiresAt={post.expiresAt} />
            </div>
            <ClaimOfferButton post={post} discount={discount} />
          </div>
        )}
        {post.type === "flash-sale" && !post.expiresAt && discount && (
          <ClaimOfferButton post={post} discount={discount} />
        )}

        {/* Product launch CTA */}
        {post.type === "product-launch" && (
          <span className="text-natural-accent text-sm font-semibold">Shop now →</span>
        )}

        {/* Date */}
        <p className="text-natural-text/30 text-xs pt-1">
          {new Date(post.publishAt ?? post._creationTime).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </motion.div>
  );
}

// ── Champion card ─────────────────────────────────────────────
function ChampionCard({ post }: { post: Post }) {
  return (
    <div className="min-w-[220px] max-w-[220px] bg-natural-paper rounded-2xl border border-natural-border p-4 flex-shrink-0 space-y-3">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-100 to-rose-300 flex items-center justify-center text-2xl font-serif font-bold text-rose-700 overflow-hidden">
        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt={post.personName} className="w-full h-full object-cover rounded-full" />
        ) : (
          post.personName?.[0] ?? "?"
        )}
      </div>
      <div>
        <p className="font-bold text-natural-text text-sm">{post.personName}</p>
        <p className="text-natural-text/50 text-xs">{post.personRole}</p>
      </div>
      <p className="text-natural-text/70 text-xs line-clamp-3">{post.personStory}</p>
    </div>
  );
}

// ── Hero section ──────────────────────────────────────────────
function HeroSection({ hero }: { hero: Post | undefined }) {
  if (!hero) {
    return (
      <div className="w-full h-[50vh] bg-gradient-to-br from-natural-stone to-natural-muted rounded-3xl flex items-end p-10">
        <h1 className="font-serif font-black text-5xl md:text-7xl text-natural-text/20">Journal</h1>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[55vh] md:h-[65vh] rounded-3xl overflow-hidden">
      {hero.coverImageUrl ? (
        <img
          src={hero.coverImageUrl}
          alt={hero.headline}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-natural-stone to-[#2a2a1e]" />
      )}
      {/* Bottom-to-top gradient for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 space-y-3">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${TYPE_BADGE[hero.type]}`}>
          {TYPE_LABEL[hero.type]}
        </span>
        <h1 className="font-serif font-black text-3xl md:text-5xl text-white leading-tight max-w-2xl">
          {hero.headline}
        </h1>
        {hero.subhead && (
          <p className="text-white/70 text-base md:text-lg max-w-xl">{hero.subhead}</p>
        )}
        {hero.type === "flash-sale" && hero.expiresAt && (
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs uppercase tracking-wider font-bold">Ends in</span>
            <CountdownTimer expiresAt={hero.expiresAt} className="text-white text-sm" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main EditorialHub ─────────────────────────────────────────
export function EditorialHub({
  onProductClick,
  onPostOpen,
}: {
  onProductClick: (productId: string) => void;
  onPostOpen: (postId: string) => void;
}) {
  const postsRaw = useQuery(convexApi.posts.listPublished) ?? [];
  const discountsRaw = useQuery(convexApi.discounts.listDiscounts) ?? [];
  const [filter, setFilter] = useState<FilterType>("all");

  // Build discount lookup map
  const discountMap = useMemo(() => {
    const map = new Map<string, Discount>();
    for (const d of discountsRaw as Discount[]) map.set(d._id, d);
    return map;
  }, [discountsRaw]);

  const posts = postsRaw as Post[];

  // Separate champions for the band
  const champions = posts.filter((p) => p.type === "champion");

  // Main grid: exclude champion from grid (shown in band), apply filter
  const gridPosts = useMemo(() => {
    return posts.filter((p) => {
      if (p.type === "champion") return false;
      if (filter === "all") return true;
      return p.type === filter;
    });
  }, [posts, filter]);

  // Hero = first published post overall (including champions)
  const hero = posts[0];

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Page title */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-natural-accent mb-2">Third Wave Coffee</p>
          <h1 className="font-serif font-black text-5xl md:text-6xl tracking-tight">Journal</h1>
        </div>

        {/* Hero */}
        <HeroSection hero={hero} />

        {/* Category filter pills */}
        <div className="sticky top-20 z-10 flex gap-2 flex-wrap bg-natural-bg/80 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6">
          {(Object.keys(FILTER_LABELS) as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                filter === f
                  ? "bg-natural-accent text-white border-natural-accent shadow"
                  : "bg-natural-paper border-natural-border text-natural-text/60 hover:border-natural-accent hover:text-natural-accent"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Magazine grid */}
        {gridPosts.length === 0 ? (
          <div className="py-24 text-center text-natural-text/30 text-lg font-serif">
            {filter === "all" ? "No posts yet." : `No ${FILTER_LABELS[filter].toLowerCase()} posts yet.`}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <AnimatePresence mode="popLayout">
              {gridPosts.map((post, i) => {
                // Every 3rd card (index 0, 3, 6…) is large
                const large = i % 3 === 0;
                return (
                  <PostCard
                    key={post._id}
                    post={post}
                    discountMap={discountMap}
                    large={large}
                    onOpen={(p) => onPostOpen(p._id)}
                    onProductClick={onProductClick}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Champions band */}
        {(filter === "all" || filter === "champion") && champions.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif font-bold text-2xl">Champions</h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
              {champions.map((c) => (
                <ChampionCard key={c._id} post={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
