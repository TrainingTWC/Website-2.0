import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";
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
  onCard = false,
}: {
  post: Post;
  discount: Discount | undefined;
  onCard?: boolean;
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
          className={`border rounded-xl px-4 py-2 font-semibold text-sm shadow transition flex items-center gap-2
            ${onCard
              ? disabled
                ? "bg-natural-muted border-natural-border text-natural-text/30 cursor-not-allowed"
                : "bg-natural-accent/10 border-natural-accent text-natural-accent hover:bg-natural-accent hover:text-white cursor-pointer"
              : disabled
                ? "bg-white/5 border-white/20 text-white opacity-40 cursor-not-allowed"
                : "bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 cursor-pointer"
            }`}
        >
          <Tag className="w-3.5 h-3.5" />
          {loading ? "Claiming…" : "Claim Offer"}
        </button>
      </div>
    </div>
  );
}

// ── Skeleton card ───────────────────────────────────────────
function SkeletonCard({ large }: { large: boolean }) {
  return (
    <div className={`rounded-3xl overflow-hidden bg-natural-paper border border-natural-border ${large ? "col-span-12 md:col-span-8" : "col-span-12 md:col-span-4"}`}>
      <div className={`bg-natural-muted animate-pulse ${large ? "aspect-16/7" : "aspect-3/2"}`} />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-natural-muted animate-pulse rounded-lg w-3/4" />
        <div className="h-3 bg-natural-muted animate-pulse rounded-lg w-1/2" />
        <div className="h-3 bg-natural-muted animate-pulse rounded-lg w-1/4" />
      </div>
    </div>
  );
}

// ── Session cache helpers ─────────────────────────────────
const CACHE_KEY = "twc_third_circle_posts";
function getCachedPosts(): Post[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Post[]) : null;
  } catch { return null; }
}
function setCachedPosts(posts: Post[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(posts)); } catch {}
}

// ── Post card with 3D tilt ───────────────────────────────────
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
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 180, damping: 22 });
  const sy = useSpring(my, { stiffness: 180, damping: 22 });
  const rotateY = useTransform(sx, [-1, 1], [-6, 6]);
  const rotateX = useTransform(sy, [-1, 1], [4, -4]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const discount = post.discountId ? discountMap.get(post.discountId) : undefined;
  const isExpired = post.expiresAt ? post.expiresAt < Date.now() : false;

  if (post.type === "flash-sale" && isExpired) return null;

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className={`relative rounded-3xl overflow-hidden bg-natural-paper border border-natural-border group cursor-pointer preserve-3d ${large ? "col-span-12 md:col-span-8" : "col-span-12 md:col-span-4"}`}
      onClick={() => {
        if (post.type === "product-launch" && post.linkedProductId) {
          onProductClick(post.linkedProductId);
        } else {
          onOpen(post);
        }
      }}
    >
      {/* Cover image */}
      <div className={`relative overflow-hidden ${large ? "aspect-16/7" : "aspect-3/2"}`}>
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-natural-muted to-natural-stone" />
        )}
        {/* Gradient overlay on flash-sale */}
        {post.type === "flash-sale" && (
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
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
            <ClaimOfferButton post={post} discount={discount} onCard />
          </div>
        )}
        {post.type === "flash-sale" && !post.expiresAt && discount && (
          <ClaimOfferButton post={post} discount={discount} onCard />
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
function ChampionCard({ post, onOpen }: { post: Post; onOpen?: (post: Post) => void }) {
  return (
    <div
      className="min-w-[220px] max-w-[220px] bg-natural-paper rounded-2xl border border-natural-border p-4 shrink-0 space-y-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
      onClick={() => onOpen?.(post)}
    >
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll parallax — image drifts up slower than the page
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  // Mouse parallax
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 60, damping: 20 });
  const springY = useSpring(rawY, { stiffness: 60, damping: 20 });
  const textX = useTransform(springX, [-1, 1], ["-8px", "8px"]);
  const textY = useTransform(springY, [-1, 1], ["-6px", "6px"]);
  const imgParallaxX = useTransform(springX, [-1, 1], ["-12px", "12px"]);
  const imgParallaxY = useTransform(springY, [-1, 1], ["-8px", "8px"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    rawY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }
  function handleMouseLeave() { rawX.set(0); rawY.set(0); }

  if (!hero) {
    return (
      <div className="w-full h-[50vh] bg-linear-to-br from-natural-stone to-natural-muted rounded-3xl flex items-end p-10">
        <h1 className="font-serif font-black text-5xl md:text-7xl text-natural-text/20">Third Circle</h1>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[55vh] md:h-[65vh] rounded-3xl overflow-hidden cursor-default"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Parallax image — slightly oversized so drift doesn't show edges */}
      <motion.div
        className="absolute inset-[-3%] w-[106%] h-[106%]"
        style={{ y: imgY, x: imgParallaxX }}
      >
        {hero.coverImageUrl ? (
          <img
            src={hero.coverImageUrl}
            alt={hero.headline}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-natural-stone to-[#2a2a1e]" />
        )}
      </motion.div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      {/* Text — moves opposite direction to image for depth */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 p-8 md:p-12 space-y-3"
        style={{ x: textX, y: textY }}
      >
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
      </motion.div>
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
  const postsRaw = useQuery(convexApi.posts.listPublished);
  const discountsRaw = useQuery(convexApi.discounts.listDiscounts) ?? [];
  const [filter, setFilter] = useState<FilterType>("all");

  // Session cache: show cached posts immediately while Convex loads
  const [cachedPosts, setCachedPostsState] = useState<Post[]>(() => getCachedPosts() ?? []);
  const loading = postsRaw === undefined;

  // Whenever fresh data arrives, update the session cache
  const livePosts = postsRaw as Post[] | undefined;
  if (livePosts && livePosts.length > 0 && JSON.stringify(livePosts) !== JSON.stringify(cachedPosts)) {
    setCachedPostsState(livePosts);
    setCachedPosts(livePosts);
  }

  const posts = livePosts ?? cachedPosts;

  // Build discount lookup map
  const discountMap = useMemo(() => {
    const map = new Map<string, Discount>();
    for (const d of discountsRaw as Discount[]) map.set(d._id, d);
    return map;
  }, [discountsRaw]);

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

  const hero = posts[0];
  const showSkeleton = loading && cachedPosts.length === 0;

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 space-y-10">

        {/* Hero — skeleton while loading */}
        {showSkeleton ? (
          <div className="w-full h-[55vh] md:h-[65vh] rounded-3xl bg-natural-muted animate-pulse" />
        ) : (
          <HeroSection hero={hero} />
        )}

        {/* Category filter pills */}
        <div className="sticky top-[72px] z-20 flex gap-2 flex-wrap bg-natural-bg py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-natural-border/40">
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

        {/* Magazine grid — skeletons while loading, real cards once ready */}
        {showSkeleton ? (
          <div className="grid grid-cols-12 gap-6">
            {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} large={i % 3 === 0} />)}
          </div>
        ) : gridPosts.length === 0 ? (
          <div className="py-24 text-center text-natural-text/30 text-lg font-serif">
            {filter === "all" ? "No posts yet." : `No ${FILTER_LABELS[filter].toLowerCase()} posts yet.`}
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <AnimatePresence mode="popLayout">
              {gridPosts.map((post, i) => {
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
        {!showSkeleton && (filter === "all" || filter === "champion") && champions.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif font-bold text-2xl">Champions</h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
              {champions.map((c) => (
                <ChampionCard key={c._id} post={c} onOpen={(p) => onPostOpen(p._id)} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
