import { useState, useMemo } from "react";
import {
  ArrowLeft, Search, ShoppingCart, X, Sparkles, Coffee, Plus,
} from "lucide-react";
import { useProducts } from "../lib/useProducts";
import { SmartImage } from "./SmartImage";
import { DiscoveryWidget } from "./widget/DiscoveryWidget";
import { GalaxySweep } from "./GalaxySweep";
import { slugify } from "../lib/slug";
import type { Product } from "../types";

interface ShopPageProps {
  cart: { productId: string; qty: number }[];
  onAddToCart: (productId: string) => void;
  onProductClick: (slug: string) => void;
  onGoToCart: () => void;
}

type TypeFilter = "all" | "beans" | "bags" | "merch";
type SortMode = "default" | "price-asc" | "price-desc";

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "All",
  beans: "Beans",
  bags: "Bags",
  merch: "Merch",
};

function goToStorefront() {
  window.history.pushState({ scrollY: 0 }, "", window.location.pathname);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// ── Individual product card ────────────────────────────────────────────────
function ProductCard({
  product,
  isPrimary,
  isCross,
  onAdd,
  onView,
}: {
  product: Product;
  isPrimary: boolean;
  isCross: boolean;
  onAdd: () => void;
  onView: () => void;
}) {
  const outOfStock = product.stockStatus === "out-of-stock";

  return (
    <div
      className={`bg-natural-paper rounded-2xl overflow-hidden border transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-lg ${
        isPrimary
          ? "border-natural-accent/60 ring-1 ring-natural-accent/20 shadow-md"
          : isCross
          ? "border-natural-border/80"
          : "border-natural-border"
      } hover:border-natural-accent/40`}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden cursor-pointer"
        onClick={onView}
      >
        <SmartImage
          src={product.imageUrl}
          alt={product.name}
          blur={product.imageBlur}
          aspectRatio="4/5"
          className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* AI Pick badges */}
        {isPrimary && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-natural-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <Sparkles className="w-2.5 h-2.5" /> AI Pick
          </div>
        )}
        {isCross && !isPrimary && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-natural-text/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" /> Suggested
          </div>
        )}

        {/* Stock overlays */}
        {outOfStock && (
          <div className="absolute inset-0 bg-natural-paper/65 flex items-center justify-center">
            <span className="text-natural-text/65 text-xs font-semibold bg-natural-paper/90 px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        {product.stockStatus === "low-stock" && (
          <div className="absolute bottom-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            Low Stock
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <div className="cursor-pointer mb-3" onClick={onView}>
          <p className="font-serif font-bold text-natural-text text-sm leading-snug line-clamp-2">
            {product.name}
          </p>
          {product.flavorNotes.length > 0 && (
            <p className="text-natural-text/50 text-xs mt-1 truncate">
              {product.flavorNotes.slice(0, 2).join(" · ")}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-natural-text text-sm">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            disabled={outOfStock}
            className="flex items-center gap-1 bg-natural-accent text-white text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ShopPage export ───────────────────────────────────────────────────
export function ShopPage({ cart, onAddToCart, onProductClick, onGoToCart }: ShopPageProps) {
  const products = useProducts();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortMode>("default");
  const [aiOpen, setAiOpen] = useState(false);
  const [tiSweep, setTiSweep] = useState<{ x: number; y: number } | null>(null);
  const [aiPrimaryIds, setAiPrimaryIds] = useState<string[]>([]);
  const [aiCrossIds, setAiCrossIds] = useState<string[]>([]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const hasAiPicks = aiPrimaryIds.length > 0 || aiCrossIds.length > 0;

  const aiPrimarySet = useMemo(() => new Set(aiPrimaryIds), [aiPrimaryIds]);
  const aiCrossSet = useMemo(() => new Set(aiCrossIds), [aiCrossIds]);

  // Filter + sort
  const filtered = useMemo<Product[]>(() => {
    if (!products) return [];
    let list: Product[] = products;
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.flavorNotes.some((f) => f.toLowerCase().includes(q))
      );
    }
    if (sortBy === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, typeFilter, search, sortBy]);

  // Bring AI picks to top
  const displayProducts = useMemo<Product[]>(() => {
    if (!hasAiPicks) return filtered;
    const primary = filtered.filter((p) => aiPrimarySet.has(p._id));
    const cross = filtered.filter(
      (p) => aiCrossSet.has(p._id) && !aiPrimarySet.has(p._id)
    );
    const rest = filtered.filter(
      (p) => !aiPrimarySet.has(p._id) && !aiCrossSet.has(p._id)
    );
    return [...primary, ...cross, ...rest];
  }, [filtered, aiPrimarySet, aiCrossSet, hasAiPicks]);

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans pb-24">
      {/* ── Sticky header ───────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-natural-bg/96 backdrop-blur-md border-b border-natural-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Back to home */}
          <button
            onClick={goToStorefront}
            className="flex items-center gap-1 text-natural-text/60 hover:text-natural-text transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Home</span>
          </button>

          {/* Title */}
          <div className="shrink-0">
            <h1 className="font-serif font-bold text-lg text-natural-text leading-none">Shop</h1>
            {products && (
              <p className="text-[10px] text-natural-text/40 font-medium uppercase tracking-widest mt-0.5">
                {filtered.length} / {products.length} products
              </p>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 relative max-w-sm mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-text/35 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search beans, bags, merch…"
              className="w-full bg-natural-paper border border-natural-border rounded-full pl-9 pr-9 py-2 text-sm text-natural-text placeholder:text-natural-text/35 focus:outline-none focus:ring-2 focus:ring-natural-accent/30"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-natural-text/35 hover:text-natural-text transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Cart button */}
          <button
            onClick={onGoToCart}
            className="relative flex items-center gap-1.5 bg-natural-text text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-natural-accent transition-colors shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-white text-natural-text text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ml-0.5">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter chips + sort */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {(Object.entries(TYPE_LABELS) as [TypeFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                typeFilter === key
                  ? "bg-natural-accent text-white border-natural-accent"
                  : "border-natural-border text-natural-text/60 hover:text-natural-text hover:border-natural-text/30 bg-transparent"
              }`}
            >
              {label}
            </button>
          ))}

          <div className="ml-auto shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortMode)}
              className="text-xs border border-natural-border rounded-full px-3 py-1.5 bg-natural-bg text-natural-text/70 focus:outline-none cursor-pointer"
            >
              <option value="default">Sort: Default</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* AI picks banner */}
        {hasAiPicks && (
          <div className="bg-natural-accent/10 border border-natural-accent/25 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-natural-accent shrink-0" />
              <div>
                <p className="font-semibold text-natural-text text-sm">Your AI matches are ready</p>
                <p className="text-natural-text/55 text-xs mt-0.5">
                  {aiPrimaryIds.length} top pick{aiPrimaryIds.length !== 1 ? "s" : ""} +{" "}
                  {aiCrossIds.length} suggestion{aiCrossIds.length !== 1 ? "s" : ""} — shown first below
                </p>
              </div>
            </div>
            <button
              onClick={() => { setAiPrimaryIds([]); setAiCrossIds([]); }}
              className="text-natural-text/40 hover:text-natural-text/70 transition-colors shrink-0"
              title="Clear AI picks"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {products === undefined && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-natural-paper rounded-2xl border border-natural-border overflow-hidden animate-pulse">
                <div className="bg-natural-border aspect-[4/5]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-natural-border rounded w-3/4" />
                  <div className="h-3 bg-natural-border rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {products !== undefined && displayProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <Coffee className="w-12 h-12 text-natural-text/20 mb-4" />
            <p className="font-semibold text-natural-text text-lg">No products found</p>
            <p className="text-natural-text/50 text-sm mt-1 max-w-xs">
              Try a different search term or clear the filters.
            </p>
            <button
              onClick={() => { setSearch(""); setTypeFilter("all"); }}
              className="mt-5 text-natural-accent text-sm font-semibold underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Product grid */}
        {displayProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayProducts.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                isPrimary={aiPrimarySet.has(p._id)}
                isCross={aiCrossSet.has(p._id) && !aiPrimarySet.has(p._id)}
                onAdd={() => onAddToCart(p._id)}
                onView={() => onProductClick(slugify(p.name))}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Floating Third Intelligence button ────────────────── */}
      <button
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setTiSweep({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2.5 bg-natural-accent text-white px-5 py-3.5 rounded-full shadow-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-transform"
      >
        <Sparkles className="w-4 h-4" />
        Find Your Match
      </button>

      {/* ── Galaxy-AI sweep transition ─────────────────── */}
      {tiSweep && !aiOpen && (
        <GalaxySweep
          origin={tiSweep}
          onComplete={() => setAiOpen(true)}
        />
      )}

      {/* ── Discovery Widget overlay ──────────────────────────── */}
      {aiOpen && (
        <div className="fixed inset-0 z-40">
          <DiscoveryWidget
            onClose={() => {
              setAiOpen(false);
              setTiSweep(null);
            }}
            onNavigateToProduct={(slug) => {
              setAiOpen(false);
              setTiSweep(null);
              onProductClick(slug);
            }}
            onAddToCart={(productId) => {
              onAddToCart(productId);
              setAiOpen(false);
              setTiSweep(null);
            }}
            onRecommendations={(primaryIds, crossIds) => {
              setAiPrimaryIds(primaryIds);
              setAiCrossIds(crossIds);
              setAiOpen(false);
              setTiSweep(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
