import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  Plus,
  TrendingUp,
  Users,
  CheckCircle2,
  Trash2,
  Edit3,
  Search,
  List as ListIcon,
  Coffee as CoffeeIcon,
  IndianRupee,
  Database,
  X,
  Settings,
  Star,
  MapPin,
  AlertTriangle,
  PackageX,
  FolderPlus,
  Eye,
  Clock,
  BarChart2,
  Globe,
  ShoppingBag,
  Save,
  Box,
  Filter,
  Sparkles,
  Newspaper,
  Home as HomeIcon,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useProducts } from "../../lib/useProducts";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Product, ProductType, RoastLevel, MainCategory, SubCategory } from "../../types";
import { MAIN_CATEGORIES, SUBCATEGORIES, resolveTaxonomy } from "../../types";
import { SalesAnalytics } from "./SalesAnalytics";
import { EditorialCMS } from "./EditorialCMS";
import { HomeContentCMS } from "./HomeContentCMS";
import { AboutCMS } from "./AboutCMS";
import { UnifiedCMS } from "./UnifiedCMS";
import { AdminShell, type NavGroup } from "./AdminShell";
import { DashboardOverview } from "./DashboardOverview";
import { LayoutDashboard } from "lucide-react";
import { ImagePicker } from "./ImagePicker";
import { VisitorMap } from "./VisitorMapLazy";
import type { AdminMe } from "./AdminAuthGate";

// ─── Shared design tokens ─────────────────────────────────────────────────────
const INPUT =
  "w-full px-4 py-3 rounded-xl border border-stone-200 outline-none focus:ring-2 ring-[#5A5A40]/20 bg-white text-sm";
const LABEL =
  "block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5";
const ROAST_LEVELS: RoastLevel[] = ["light", "medium", "medium-dark", "dark"];
const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "beans", label: "Coffee Beans (Freshly Roasted)" },
  { value: "bags", label: "Coffee Bags (Ground & Packed)" },
  { value: "merch", label: "Merch (Cups, Keychains, etc.)" },
];

interface Category {
  _id: string;
  name: string;
  slug: string;
  productType: "beans" | "bags" | "merch" | "all";
}

// ─── Product form helpers ─────────────────────────────────────────────────────
interface ProductFormData {
  name: string;
  description: string;
  type: ProductType;
  category: string;
  mainCategory: MainCategory;
  subCategory: SubCategory;
  price: number;
  imageUrl: string;
  modelUrl: string;
  roastLevel?: RoastLevel;
  origin: string;
  weight: string;
  flavorNotes: string;
  tags: string;
  stockQty: number;
  lowStockThreshold: number;
  rating: string;
  reviewCount: string;
}

function productToFormData(p: Product): ProductFormData {
  const tax = resolveTaxonomy(p);
  return {
    name: p.name,
    description: p.description,
    type: p.type,
    category: p.category,
    mainCategory: tax.mainCategory,
    subCategory: tax.subCategory,
    price: p.price,
    imageUrl: p.imageUrl,
    modelUrl: p.modelUrl ?? "",
    roastLevel: p.roastLevel,
    origin: p.origin ?? "",
    weight: p.weight ?? "",
    flavorNotes: p.flavorNotes.join(", "),
    tags: p.tags.join(", "),
    stockQty: p.stockQty ?? 0,
    lowStockThreshold: p.lowStockThreshold ?? 10,
    rating: p.rating?.toString() ?? "",
    reviewCount: p.reviewCount?.toString() ?? "",
  };
}

function defaultFormData(): ProductFormData {
  return {
    name: "",
    description: "",
    type: "beans",
    category: "single-origin",
    mainCategory: "coffee",
    subCategory: "beans",
    price: 1499,
    imageUrl: "",
    modelUrl: "",
    roastLevel: "medium",
    origin: "",
    weight: "250g",
    flavorNotes: "",
    tags: "",
    stockQty: 0,
    lowStockThreshold: 10,
    rating: "",
    reviewCount: "",
  };
}

function formDataToProductPayload(form: ProductFormData) {
  const sq = form.stockQty;
  const th = form.lowStockThreshold;
  const stockStatus: "in-stock" | "out-of-stock" | "low-stock" =
    sq === 0 ? "out-of-stock" : sq <= th ? "low-stock" : "in-stock";
  return {
    name: form.name,
    description: form.description,
    type: form.type,
    category: form.category,
    mainCategory: form.mainCategory,
    subCategory: form.subCategory,
    price: form.price,
    imageUrl: form.imageUrl,
    modelUrl: form.modelUrl || undefined,
    roastLevel:
      form.type === "beans" || form.type === "bags" ? form.roastLevel : undefined,
    origin: form.origin || undefined,
    weight: form.weight || undefined,
    flavorNotes: form.flavorNotes.split(",").map((s) => s.trim()).filter(Boolean),
    tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
    stockStatus,
    rating: form.rating ? parseFloat(form.rating) : undefined,
    reviewCount: form.reviewCount ? parseInt(form.reviewCount) : undefined,
  };
}

// ─── Root dashboard ───────────────────────────────────────────────────────────
export function AdminDashboard({ me }: { me?: AdminMe }) {
  const isCmsOnly = me?.admin?.role === "hr" || me?.admin?.role === "marketing" || me?.admin?.role === "pr";
  const [activeTab, setActiveTab] = useState<
    "overview" | "inventory" | "analytics" | "rules" | "orders" | "editorial" | "home" | "about" | "settings"
  >(isCmsOnly ? "home" : "overview");

  const products = (useQuery(api.products.list) ?? []) as any[];
  const orders = useQuery((api as any).orders.listOrders) as any[] | undefined;

  const notifications = useMemo(() => {
    const notes: { id: string; icon: React.ReactNode; title: string; body: string; time: string; unread?: boolean }[] = [];
    const lowStock = products.filter((p) => p.stockStatus === "low-stock");
    if (lowStock.length > 0) {
      notes.push({
        id: "low-stock",
        icon: <Package className="w-4 h-4" />,
        title: `${lowStock.length} product${lowStock.length > 1 ? "s" : ""} low on stock`,
        body: lowStock.slice(0, 2).map((p) => p.name).join(", ") + (lowStock.length > 2 ? ` +${lowStock.length - 2} more` : ""),
        time: "now",
        unread: true,
      });
    }
    const pending = (orders ?? []).filter((o) => o.status === "pending");
    if (pending.length > 0) {
      notes.push({
        id: "pending-orders",
        icon: <ShoppingBag className="w-4 h-4" />,
        title: `${pending.length} order${pending.length > 1 ? "s" : ""} awaiting fulfilment`,
        body: `Total value: ₹${pending.reduce((s: number, o: any) => s + (o.total ?? 0), 0).toLocaleString("en-IN")}`,
        time: "just now",
        unread: true,
      });
    }
    return notes;
  }, [products, orders]);

  const navGroups: NavGroup[] = isCmsOnly
    ? [{ label: "Content", items: [{ id: "home", label: "CMS", icon: <Globe className="w-4 h-4" /> }] }]
    : [
        {
          label: "Workspace",
          items: [
            { id: "overview", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "analytics", label: "Analytics", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },
          ],
        },
        {
          label: "Catalog",
          items: [
            { id: "inventory", label: "Inventory", icon: <Package className="w-4 h-4" /> },
            { id: "home", label: "CMS", icon: <Globe className="w-4 h-4" /> },
          ],
        },
        {
          label: "System",
          items: [
            { id: "rules", label: "Logic Rules", icon: <Search className="w-4 h-4" /> },
            { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
          ],
        },
      ];

  const titles: Record<typeof activeTab, { title: string; subtitle: string }> = {
    overview: { title: "Dashboard", subtitle: "Bird's-eye view of revenue, orders, inventory and customers." },
    inventory: { title: "Inventory", subtitle: "Manage products, stock levels and categories." },
    analytics: { title: "Analytics", subtitle: "Sales performance, traffic and behavioural insights." },
    rules: { title: "Logic Rules", subtitle: "Tune recommendation and discovery logic." },
    orders: { title: "Orders", subtitle: "Track and fulfil incoming customer orders." },
    editorial: { title: "Editorial", subtitle: "Publish stories, journal entries and editorial pieces." },
    home: { title: "CMS", subtitle: "Edit every page — Home, Third Circle, and About — with live preview." },
    about: { title: "About Pages", subtitle: "Edit Our Story, Our Coffee, Careers, and Newsroom with live preview." },
    settings: { title: "Settings", subtitle: "Workspace preferences and integrations." },
  };

  const meta = titles[activeTab];

  return (
    <AdminShell
      brand="Third Wave"
      panelLabel="Merchant"
      panelAccent="olive"
      navGroups={navGroups}
      activeId={activeTab}
      onNavigate={(id) => setActiveTab(id as typeof activeTab)}
      user={{
        name: me?.name ?? me?.email?.split("@")[0] ?? "Merchant",
        email: me?.email ?? "",
        role: ({ superadmin: "Superadmin", admin: "Admin", editor: "Editor", viewer: "Viewer", hr: "HR", marketing: "Marketing", pr: "PR" } as Record<string, string>)[me?.admin?.role ?? "admin"] ?? "Admin",
      }}
      notifications={notifications}
      workspaceTitle={meta.title}
      workspaceSubtitle={meta.subtitle}
    >
      {activeTab === "overview" && <DashboardOverview />}
      {activeTab === "inventory" && <InventoryManager />}
      {activeTab === "analytics" && <CombinedAnalytics />}
      {activeTab === "rules" && <RulesManager />}
      {activeTab === "orders" && <OrdersView />}
      {activeTab === "editorial" && <EditorialCMS />}
      {activeTab === "home" && <UnifiedCMS />}
      {activeTab === "settings" && (
        <div className="rounded-2xl border border-stone-200 bg-white/70 p-6 text-sm text-stone-600">
          <p className="font-bold text-stone-900 text-base mb-1">Workspace settings</p>
          <p>Detailed configuration lives in the Super Admin panel. Switch with the panel selector or ask a superadmin for access.</p>
        </div>
      )}
    </AdminShell>
  );
}

// ─── Inventory manager ────────────────────────────────────────────────────────
export function InventoryManager() {
  const products = (useQuery(api.products.list) ?? []) as Product[];
  const categories = useQuery((api as any).categories.list) as
    | Category[]
    | undefined;

  const addProductMutation = useMutation(api.products.add);
  const updateProductMutation = useMutation(api.products.update);
  const removeProductMutation = useMutation(api.products.remove);
  const updateStockMutation = useMutation(api.products.updateStock);
  const addCategoryMutation = useMutation((api as any).categories.add);
  const removeCategoryMutation = useMutation((api as any).categories.remove);

  const [activeFilter, setActiveFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"all" | "beans" | "bags" | "merch">("all");

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") return products;
    if (["beans", "bags", "merch"].includes(activeFilter))
      return products.filter((p) => p.type === activeFilter);
    return products.filter((p) => p.category === activeFilter);
  }, [products, activeFilter]);

  const handleDelete = async (p: Product) => {
    if (confirm(`Delete "${p.name}"? This cannot be undone.`)) {
      await removeProductMutation({ id: p._id as Id<"products"> });
      if (editingId === p._id) setEditingId(null);
    }
  };

  const handleToggleEdit = (p: Product) => {
    setEditingId(editingId === p._id ? null : p._id);
    setIsAdding(false);
  };

  const handleAddCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    try {
      await addCategoryMutation({ name, slug, productType: newCatType });
    } catch {
      /* duplicate — silently ignore */
    }
    setNewCatName("");
    setNewCatType("all");
    setShowAddCategory(false);
  };

  const handleRemoveCategory = async (cat: Category) => {
    if (confirm(`Remove category "${cat.name}"?`)) {
      await removeCategoryMutation({ id: cat._id as any });
      if (activeFilter === cat.slug) setActiveFilter("all");
    }
  };

  const inStock = products.filter((p) => p.stockStatus === "in-stock").length;
  const lowStock = products.filter((p) => p.stockStatus === "low-stock").length;
  const outStock = products.filter((p) => p.stockStatus === "out-of-stock").length;

  return (
    <div className="p-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h3 className="text-3xl font-serif font-bold flex items-center gap-3">
          <Database className="w-7 h-7 text-natural-accent" />
          Product Catalog
          <span className="text-base font-sans text-natural-text/40 font-medium">
            ({products.length} items)
          </span>
        </h3>
        <button
          onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}
          className="flex items-center gap-2 bg-natural-text text-white px-6 py-3 rounded-full font-bold hover:bg-natural-accent transition-all shadow-xl active:scale-95"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? "Cancel" : "Add Product"}
        </button>
      </div>

      {/* ── Category filter bar ── */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {[
          { id: "all", label: "All", count: products.length },
          { id: "beans", label: "Beans", count: products.filter((p) => p.type === "beans").length },
          { id: "bags", label: "Bags", count: products.filter((p) => p.type === "bags").length },
          { id: "merch", label: "Merch", count: products.filter((p) => p.type === "merch").length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
              activeFilter === f.id
                ? "bg-natural-accent text-white border-natural-accent shadow"
                : "bg-stone-50 text-stone-500 border-stone-200 hover:border-natural-accent/40"
            }`}
          >
            {f.label} <span className={activeFilter === f.id ? "opacity-70" : "opacity-50"}>({f.count})</span>
          </button>
        ))}
        {categories?.map((cat) => (
          <div key={cat._id} className="flex items-center">
            <button
              onClick={() => setActiveFilter(cat.slug)}
              className={`pl-3 pr-2 py-1.5 rounded-l-full text-xs font-bold transition-all border border-r-0 ${
                activeFilter === cat.slug
                  ? "bg-natural-accent text-white border-natural-accent shadow"
                  : "bg-stone-50 text-stone-500 border-stone-200 hover:border-natural-accent/40"
              }`}
            >
              {cat.name} <span className={activeFilter === cat.slug ? "opacity-70" : "opacity-50"}>({products.filter((p) => p.category === cat.slug).length})</span>
            </button>
            <button
              onClick={() => handleRemoveCategory(cat)}
              title="Remove category"
              className={`px-1.5 py-1.5 rounded-r-full border text-xs transition-all ${
                activeFilter === cat.slug
                  ? "bg-natural-accent text-white/70 hover:text-white border-natural-accent"
                  : "bg-stone-50 text-stone-300 border-stone-200 hover:text-red-400 hover:border-red-200"
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {!showAddCategory && (
          <button
            onClick={() => setShowAddCategory(true)}
            className="px-3 py-1.5 rounded-full text-xs font-bold border border-dashed border-stone-300 text-stone-400 hover:text-natural-accent hover:border-natural-accent transition-all flex items-center gap-1"
          >
            <FolderPlus className="w-3 h-3" /> Category
          </button>
        )}
        <AnimatePresence>
          {showAddCategory && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2"
            >
              <input
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCategory();
                  if (e.key === "Escape") setShowAddCategory(false);
                }}
                placeholder="Category name"
                className="text-xs outline-none bg-transparent font-medium w-32"
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as any)}
                className="text-xs bg-transparent outline-none font-medium text-stone-500"
              >
                <option value="all">All types</option>
                <option value="beans">Beans only</option>
                <option value="bags">Bags only</option>
                <option value="merch">Merch only</option>
              </select>
              <button onClick={handleAddCategory} className="bg-natural-accent text-white px-3 py-1 rounded-lg text-xs font-bold">Add</button>
              <button onClick={() => setShowAddCategory(false)} className="text-stone-400 hover:text-stone-600"><X className="w-3 h-3" /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stock overview pills ── */}
      {products.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-bold text-green-700">{inStock} In Stock</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">{lowStock} Low Stock</span>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-3 flex items-center gap-2">
            <PackageX className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-700">{outStock} Out of Stock</span>
          </div>
        </div>
      )}

      {/* ── Add product form ── */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <AddProductForm
              categories={categories ?? []}
              onSave={async (data) => {
                await addProductMutation(data as any);
                setIsAdding(false);
              }}
              onCancel={() => setIsAdding(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Product list ── */}
      <div className="space-y-3">
        {filteredProducts.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-stone-100 rounded-[2rem]">
            <Package className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400 font-medium">
              {activeFilter === "all"
                ? "Your catalog is empty. Add a product above."
                : `No products in this category.`}
            </p>
          </div>
        )}
        {filteredProducts.map((p) => (
          <div key={p._id}>
            <div
              className={`group flex items-center justify-between p-5 bg-white border border-stone-100 hover:border-[#5A5A40]/30 hover:shadow-lg transition-all ${
                editingId === p._id ? "rounded-t-3xl rounded-b-none border-b-0" : "rounded-3xl"
              }`}
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-stone-100">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <CoffeeIcon className="w-6 h-6 text-stone-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-base font-bold truncate">{p.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                      p.type === "beans" ? "bg-[#5A5A40]/10 text-[#5A5A40]"
                        : p.type === "bags" ? "bg-blue-50 text-blue-600"
                        : "bg-amber-50 text-amber-700"
                    }`}>{p.type}</span>
                    {p.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500 uppercase tracking-wider flex-shrink-0">
                        {p.category}
                      </span>
                    )}
                    {p.modelUrl && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-500 uppercase tracking-wider flex-shrink-0 flex items-center gap-0.5">
                        <Box className="w-2.5 h-2.5" /> 3D
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-400 flex-wrap">
                    <span className="flex items-center gap-0.5 font-bold text-natural-text">
                      <IndianRupee className="w-3 h-3" />{p.price.toLocaleString("en-IN")}
                    </span>
                    {p.roastLevel && <span className="capitalize">{p.roastLevel} Roast</span>}
                    {p.origin && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{p.origin}</span>}
                    {p.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{p.rating}</span>}
                    <span className={`flex items-center gap-1 font-semibold ${
                      p.stockStatus === "in-stock" ? "text-green-600"
                        : p.stockStatus === "low-stock" ? "text-amber-600"
                        : "text-red-600"
                    }`}>
                      {p.stockStatus}
                      {p.stockQty !== undefined && (
                        <span className="text-stone-400 font-normal">({p.stockQty} units)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                <button
                  onClick={() => handleToggleEdit(p)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    editingId === p._id
                      ? "bg-[#5A5A40] text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-[#5A5A40]/10 hover:text-[#5A5A40]"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {editingId === p._id ? "Close" : "Edit"}
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {editingId === p._id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ProductEditor
                    product={p}
                    categories={categories ?? []}
                    onSave={async (updates) => {
                      const { _stockQty, _lowStockThreshold, ...rest } = updates;
                      await updateProductMutation({ id: p._id as Id<"products">, ...rest } as any);
                      await updateStockMutation({ id: p._id as Id<"products">, stockQty: _stockQty, lowStockThreshold: _lowStockThreshold });
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Full product editor ──────────────────────────────────────────────────────
function ProductEditor({
  product, categories, onSave, onCancel,
}: {
  product: Product;
  categories: Category[];
  onSave: (updates: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>(() => productToFormData(product));
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"details" | "media" | "stock">("details");
  const set = (key: keyof ProductFormData, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = formDataToProductPayload(form);
      await onSave({ ...payload, _stockQty: form.stockQty, _lowStockThreshold: form.lowStockThreshold });
    } finally {
      setSaving(false);
    }
  };

  const computedStatus = form.stockQty === 0 ? "out-of-stock" : form.stockQty <= form.lowStockThreshold ? "low-stock" : "in-stock";

  return (
    <div className="bg-stone-50 border-x border-b border-[#5A5A40]/20 rounded-b-3xl overflow-hidden">
      <div className="flex border-b border-stone-200 bg-white/60">
        {[
          { id: "details", label: "Details & Pricing" },
          { id: "media", label: "Media & 3D" },
          { id: "stock", label: "Stock & Status" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              tab === t.id ? "border-[#5A5A40] text-[#5A5A40]" : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === "details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><label className={LABEL}>Product Name</label><input className={INPUT} value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div><label className={LABEL}>Description</label><textarea className={`${INPUT} h-28 resize-none`} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Type</label>
                  <select className={INPUT} value={form.type} onChange={(e) => set("type", e.target.value as ProductType)}>
                    {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div><label className={LABEL}>Price (₹)</label><input type="number" className={INPUT} value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Main Category</label>
                  <select
                    className={INPUT}
                    value={form.mainCategory}
                    onChange={(e) => {
                      const main = e.target.value as MainCategory;
                      set("mainCategory", main);
                      // Reset subCategory to first option in the new main bucket.
                      set("subCategory", SUBCATEGORIES[main][0].value);
                    }}
                  >
                    {MAIN_CATEGORIES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Sub-Category</label>
                  <select
                    className={INPUT}
                    value={form.subCategory}
                    onChange={(e) => set("subCategory", e.target.value as SubCategory)}
                  >
                    {SUBCATEGORIES[form.mainCategory].map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Category</label>
                <input className={INPUT} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. single-origin" list="edit-cat-dl" />
                <datalist id="edit-cat-dl">{categories.map((c) => <option key={c._id} value={c.slug} />)}</datalist>
              </div>
              {(form.type === "beans" || form.type === "bags") && (
                <div>
                  <label className={LABEL}>Roast Level</label>
                  <div className="flex gap-2">
                    {ROAST_LEVELS.map((level) => (
                      <button key={level} onClick={() => set("roastLevel", level)}
                        className={`flex-1 py-2 rounded-xl border-2 capitalize font-bold text-xs transition-all ${form.roastLevel === level ? "bg-[#5A5A40] text-white border-[#5A5A40]" : "border-stone-200 text-stone-400 hover:border-stone-400"}`}
                      >{level}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={LABEL}>Origin</label><input className={INPUT} value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="e.g. Yirgacheffe" /></div>
                <div><label className={LABEL}>Weight</label><input className={INPUT} value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="e.g. 250g" /></div>
              </div>
              <div>
                <label className={LABEL}>Flavor Notes <span className="normal-case font-normal">(comma separated)</span></label>
                <input className={INPUT} value={form.flavorNotes} onChange={(e) => set("flavorNotes", e.target.value)} placeholder="chocolate, citrus, caramel" />
              </div>
              <div>
                <label className={LABEL}>Search Tags <span className="normal-case font-normal">(comma separated)</span></label>
                <input className={INPUT} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="morning-brew, espresso" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={LABEL}>Rating (0–5)</label><input type="number" min="0" max="5" step="0.1" className={INPUT} value={form.rating} onChange={(e) => set("rating", e.target.value)} placeholder="4.5" /></div>
                <div><label className={LABEL}>Review Count</label><input type="number" min="0" className={INPUT} value={form.reviewCount} onChange={(e) => set("reviewCount", e.target.value)} placeholder="128" /></div>
              </div>
            </div>
          </div>
        )}

        {tab === "media" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <label className={LABEL}>Product Image</label>
              <ImagePicker value={form.imageUrl} onChange={(url) => set("imageUrl", url)} />
            </div>
            <div>
              <label className={LABEL}>3D Model URL <span className="normal-case font-normal">(GLB/GLTF file)</span></label>
              <input className={INPUT} value={form.modelUrl} onChange={(e) => set("modelUrl", e.target.value)} placeholder="https://your-cdn.com/model.glb" />
              <p className="mt-2 text-xs text-stone-400">Used for the interactive 3D product viewer on the product page. Upload a .glb file to a CDN and paste the URL here.</p>
              {form.modelUrl && (
                <div className="mt-2 inline-flex items-center gap-2 bg-violet-50 text-violet-600 px-3 py-1.5 rounded-xl text-xs font-bold">
                  <Box className="w-3.5 h-3.5" /> 3D model linked — will appear in product viewer
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "stock" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end gap-8">
              <div>
                <label className={LABEL}>Stock Quantity</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => set("stockQty", Math.max(0, form.stockQty - 1))} className="w-10 h-10 rounded-xl bg-stone-200 hover:bg-stone-300 font-bold text-xl transition-all flex items-center justify-center">−</button>
                  <input type="number" min="0" value={form.stockQty}
                    onChange={(e) => set("stockQty", Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 text-center p-2 rounded-xl border border-stone-200 font-bold text-lg outline-none focus:ring-2 ring-[#5A5A40]/20" />
                  <button onClick={() => set("stockQty", form.stockQty + 1)} className="w-10 h-10 rounded-xl bg-stone-200 hover:bg-stone-300 font-bold text-xl transition-all flex items-center justify-center">+</button>
                </div>
              </div>
              <div>
                <label className={LABEL}>Low-Stock Alert Threshold</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="1" value={form.lowStockThreshold}
                    onChange={(e) => set("lowStockThreshold", Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center p-2 rounded-xl border border-stone-200 font-bold outline-none focus:ring-2 ring-[#5A5A40]/20" />
                  <span className="text-sm text-stone-400">units</span>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                computedStatus === "out-of-stock" ? "bg-red-100 text-red-700"
                  : computedStatus === "low-stock" ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
              }`}>
                → {computedStatus === "out-of-stock" ? "Out of Stock" : computedStatus === "low-stock" ? "Low Stock" : "In Stock"}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-stone-200">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl font-bold text-stone-500 hover:bg-stone-200 transition-all text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-[#5A5A40] text-white px-8 py-2.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add product form ─────────────────────────────────────────────────────────
function AddProductForm({ categories, onSave, onCancel }: {
  categories: Category[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof ProductFormData, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try { await onSave(formDataToProductPayload(form)); } finally { setSaving(false); }
  };

  return (
    <div className="bg-stone-50 p-8 rounded-3xl border-2 border-dashed border-stone-200 space-y-5 mb-4">
      <h4 className="text-xl font-bold flex items-center gap-2">
        <Plus className="w-5 h-5 text-natural-accent" /> Add New Product
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div><label className={LABEL}>Product Name *</label><input className={INPUT} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ethiopian Yirgacheffe" /></div>
          <div><label className={LABEL}>Description</label><textarea className={`${INPUT} h-24 resize-none`} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Flavor notes, roast process…" /></div>
          <div><label className={LABEL}>Image</label><ImagePicker value={form.imageUrl} onChange={(url) => set("imageUrl", url)} /></div>
          <div>
            <label className={LABEL}>3D Model URL <span className="normal-case font-normal">(optional .glb)</span></label>
            <input className={INPUT} value={form.modelUrl} onChange={(e) => set("modelUrl", e.target.value)} placeholder="https://your-cdn.com/model.glb" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Type</label>
              <select className={INPUT} value={form.type} onChange={(e) => set("type", e.target.value as ProductType)}>
                {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label className={LABEL}>Price (₹)</label><input type="number" className={INPUT} value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Main Category</label>
              <select
                className={INPUT}
                value={form.mainCategory}
                onChange={(e) => {
                  const main = e.target.value as MainCategory;
                  set("mainCategory", main);
                  set("subCategory", SUBCATEGORIES[main][0].value);
                }}
              >
                {MAIN_CATEGORIES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Sub-Category</label>
              <select
                className={INPUT}
                value={form.subCategory}
                onChange={(e) => set("subCategory", e.target.value as SubCategory)}
              >
                {SUBCATEGORIES[form.mainCategory].map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Category</label>
              <input className={INPUT} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="single-origin" list="add-cat-dl" />
              <datalist id="add-cat-dl">{categories.map((c) => <option key={c._id} value={c.slug} />)}</datalist>
            </div>
            <div><label className={LABEL}>Origin</label><input className={INPUT} value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="e.g. Ethiopia" /></div>
          </div>
          {(form.type === "beans" || form.type === "bags") && (
            <div>
              <label className={LABEL}>Roast Level</label>
              <div className="flex gap-2">
                {ROAST_LEVELS.map((level) => (
                  <button key={level} onClick={() => set("roastLevel", level)}
                    className={`flex-1 py-2 rounded-xl border-2 capitalize font-bold text-xs transition-all ${form.roastLevel === level ? "bg-[#5A5A40] text-white border-[#5A5A40]" : "border-stone-200 text-stone-400"}`}
                  >{level}</button>
                ))}
              </div>
            </div>
          )}
          <div><label className={LABEL}>Flavor Notes <span className="normal-case font-normal">(comma separated)</span></label><input className={INPUT} value={form.flavorNotes} onChange={(e) => set("flavorNotes", e.target.value)} placeholder="chocolate, citrus" /></div>
          <div><label className={LABEL}>Tags <span className="normal-case font-normal">(comma separated)</span></label><input className={INPUT} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="morning-brew, espresso" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onCancel} className="px-5 py-2.5 rounded-xl font-bold text-stone-500 hover:bg-stone-200 transition-all text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name}
              className="flex items-center gap-2 bg-[#5A5A40] text-white px-8 py-2.5 rounded-xl font-bold hover:brightness-110 disabled:opacity-50 text-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 7-day bar chart ──────────────────────────────────────────────────────────
function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 w-full pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          {d.count > 0 && <span className="text-[10px] font-bold text-stone-500">{d.count}</span>}
          <div
            className="w-full rounded-t-lg bg-natural-accent/60 hover:bg-natural-accent transition-colors"
            style={{ height: `${Math.max((d.count / max) * 80, d.count > 0 ? 4 : 2)}px` }}
          />
          <span className="text-[10px] text-stone-400">{d.date}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Geo list (top countries / cities) ────────────────────────────────────────
function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return "";
  const A = 0x1f1e6;
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => A + c.charCodeAt(0) - 65));
}

function GeoList({
  title,
  rows,
  renderLabel,
  total,
}: {
  title: string;
  rows: { name: string; count: number; code?: string; country?: string }[];
  renderLabel: (row: any) => React.ReactNode;
  total: number;
}) {
  const max = rows[0]?.count ?? 1;
  return (
    <div className="bg-white border border-stone-100 rounded-3xl p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-4">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-stone-400">No data yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => {
            const pct = (row.count / max) * 100;
            const share = total > 0 ? Math.round((row.count / total) * 100) : 0;
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-sm font-semibold text-stone-700 mb-1">
                  <span className="flex-1 min-w-0 truncate">{renderLabel(row)}</span>
                  <span className="ml-3 shrink-0 tabular-nums">
                    {row.count}
                    <span className="text-stone-400 font-normal text-xs"> · {share}%</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full bg-natural-accent/70 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Analytics view ───────────────────────────────────────────────────────────
export function CombinedAnalytics() {
  const sessions = (useQuery(api.sessions.list) ?? []) as any[];
  const products = (useQuery(api.products.list) ?? []) as Product[];
  return (
    <div>
      <SalesAnalytics />
      <div className="border-t border-natural-border" />
      <AnalyticsView sessions={sessions} products={products} />
    </div>
  );
}

// ─── Site-only analytics (traffic + AI) — no sales, for Site Analytics tab ──
export function SiteAnalytics() {
  const sessions = (useQuery(api.sessions.list) ?? []) as any[];
  const products = (useQuery(api.products.list) ?? []) as Product[];
  return <AnalyticsView sessions={sessions} products={products} />;
}

function AnalyticsView({
  sessions,
  products,
}: {
  sessions: any[];
  products: Product[];
}) {
  const pageStats = useQuery((api as any).pageViews.getStats) as any;

  const completionRate =
    sessions.length > 0
      ? Math.round(
          (sessions.filter((s: any) => s.completed).length / sessions.length) *
            100
        )
      : 0;

  const ratedProducts = products.filter((p) => p.rating && p.reviewCount);
  const avgRating =
    ratedProducts.length > 0
      ? (
          ratedProducts.reduce((sum, p) => sum + (p.rating ?? 0), 0) /
          ratedProducts.length
        ).toFixed(1)
      : "–";
  const totalReviews = ratedProducts.reduce(
    (sum, p) => sum + (p.reviewCount ?? 0),
    0
  );

  const formatDuration = (secs: number) => {
    if (!secs) return "–";
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  const siteStats = [
    {
      label: "Total Visits",
      value: pageStats?.totalViews?.toLocaleString() ?? "–",
      icon: <Eye className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-600",
      sub: pageStats ? `${pageStats.todayViews} today` : "collecting data…",
    },
    {
      label: "Unique Visitors",
      value: pageStats?.uniqueSessions?.toLocaleString() ?? "–",
      icon: <Users className="w-5 h-5" />,
      color: "bg-violet-50 text-violet-600",
      sub: pageStats ? `${pageStats.weekViews} this week` : "",
    },
    {
      label: "Avg Time on Site",
      value: formatDuration(pageStats?.avgDurationSec ?? 0),
      icon: <Clock className="w-5 h-5" />,
      color: "bg-emerald-50 text-emerald-600",
      sub: "per session",
    },
    {
      label: "Avg Rating",
      value: avgRating,
      icon: <Star className="w-5 h-5" />,
      color: "bg-amber-50 text-amber-600",
      sub: `${totalReviews} reviews`,
    },
  ];

  const widgetStats = [
    { label: "AI Sessions", value: sessions.length, icon: <BarChart2 className="w-5 h-5" />, color: "bg-sky-50 text-sky-600" },
    { label: "Completion Rate", value: `${completionRate}%`, icon: <CheckCircle2 className="w-5 h-5" />, color: "bg-green-50 text-green-600" },
    { label: "Conversion Lift", value: "14.2%", icon: <TrendingUp className="w-5 h-5" />, color: "bg-orange-50 text-orange-600" },
    { label: "Catalog Size", value: products.length, icon: <Package className="w-5 h-5" />, color: "bg-stone-50 text-stone-600" },
  ];

  return (
    <div className="p-8 space-y-12">
      <section>
        <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
          <Globe className="w-5 h-5 text-natural-accent" /> Website Traffic
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {siteStats.map((stat, i) => (
            <div key={i} className="bg-white border border-stone-100 p-5 rounded-3xl shadow-sm">
              <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>{stat.icon}</div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{stat.label}</p>
              <h4 className="text-3xl font-extrabold mt-1">{stat.value}</h4>
              {stat.sub && <p className="text-xs text-stone-400 mt-0.5">{stat.sub}</p>}
            </div>
          ))}
        </div>
        {pageStats?.dailyViews?.length > 0 ? (
          <div className="bg-white border border-stone-100 rounded-3xl p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">7-Day Traffic</p>
            <BarChart data={pageStats.dailyViews} />
          </div>
        ) : (
          <div className="bg-stone-50 border border-dashed border-stone-200 rounded-3xl p-8 text-center">
            <Globe className="w-10 h-10 text-stone-200 mx-auto mb-3" />
            <p className="font-bold text-stone-500">Traffic data will appear after visitors load the site</p>
            <p className="text-xs text-stone-400 mt-1">Page views are tracked automatically on every visit.</p>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-natural-accent" /> Visitors by Geography
          {pageStats && (pageStats.gpsCount > 0 || pageStats.ipCount > 0) && (
            <span className="text-xs font-normal text-stone-400 ml-2">
              {pageStats.gpsCount} GPS · {pageStats.ipCount} IP
            </span>
          )}
        </h3>
        {pageStats && (pageStats.knownGeo > 0 || pageStats.mapPoints?.length > 0) ? (
          <div className="space-y-4">
            {pageStats.mapPoints?.length > 0 && <VisitorMap points={pageStats.mapPoints} />}
            <div className="grid md:grid-cols-2 gap-4">
              <GeoList
                title="Top Countries"
                rows={pageStats.topCountries ?? []}
                renderLabel={(r: any) => (
                  <span className="flex items-center gap-2">
                    {r.code && (
                      <span className="text-base leading-none">{flagEmoji(r.code)}</span>
                    )}
                    <span>{r.name}</span>
                  </span>
                )}
                total={pageStats.knownGeo}
              />
              <GeoList
                title="Top Regions / States"
                rows={pageStats.topRegions ?? []}
                renderLabel={(r: any) => (
                  <span>
                    {r.name}
                    {r.country && <span className="text-stone-400 font-normal"> · {r.country}</span>}
                  </span>
                )}
                total={pageStats.knownGeo}
              />
              <GeoList
                title="Top Cities"
                rows={pageStats.topCities ?? []}
                renderLabel={(r: any) => (
                  <span>
                    {r.name}
                    {r.country && <span className="text-stone-400 font-normal"> · {r.country}</span>}
                  </span>
                )}
                total={pageStats.knownGeo}
              />
              <GeoList
                title="Top Localities"
                rows={pageStats.topLocalities ?? []}
                renderLabel={(r: any) => (
                  <span>
                    {r.name}
                    {r.city && <span className="text-stone-400 font-normal"> · {r.city}</span>}
                  </span>
                )}
                total={pageStats.knownGeo}
              />
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 border border-dashed border-stone-200 rounded-3xl p-8 text-center">
            <MapPin className="w-10 h-10 text-stone-200 mx-auto mb-3" />
            <p className="font-bold text-stone-500">Geography data will appear after visitors load the site</p>
            <p className="text-xs text-stone-400 mt-1">GPS is used when allowed; otherwise IP-based location is used.</p>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-natural-accent" /> AI Discovery Widget
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {widgetStats.map((stat, i) => (
            <div key={i} className="bg-white border border-stone-100 p-5 rounded-3xl shadow-sm">
              <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>{stat.icon}</div>
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{stat.label}</p>
              <h4 className="text-3xl font-extrabold mt-1">{stat.value}</h4>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
          <Star className="w-5 h-5 text-natural-accent" /> Reviews Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-stone-100 p-6 rounded-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Average Rating</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold">{avgRating}</span>
              <span className="text-stone-400 font-medium">/ 5</span>
            </div>
            <div className="flex gap-0.5 mt-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${avgRating !== "–" && s <= Math.round(parseFloat(avgRating)) ? "fill-amber-400 text-amber-400" : "text-stone-200"}`} />
              ))}
            </div>
          </div>
          <div className="bg-white border border-stone-100 p-6 rounded-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Total Reviews</p>
            <span className="text-5xl font-extrabold">{totalReviews.toLocaleString()}</span>
            <p className="text-xs text-stone-400 mt-2">Across {ratedProducts.length} rated products</p>
          </div>
          <div className="bg-white border border-stone-100 p-6 rounded-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Top-Rated Products</p>
            <div className="space-y-2 mt-1">
              {[...products].filter((p) => p.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3).map((p) => (
                <div key={p._id} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[140px]">{p.name}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{p.rating}</span>
                </div>
              ))}
              {products.filter((p) => p.rating).length === 0 && <p className="text-xs text-stone-400">No rated products yet. Add ratings via Edit.</p>}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ListIcon className="w-5 h-5 text-natural-accent" /> Recent AI Sessions
        </h3>
        <div className="bg-white border border-stone-100 rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-stone-400">Time</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-stone-400">Preferences</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-stone-400">Matches</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-stone-400 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 20).map((session: any) => (
                <tr key={session._id} className="border-b last:border-0 border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-stone-500">{session._creationTime ? new Date(session._creationTime).toLocaleString() : "Just now"}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5 flex-wrap">
                      {Object.entries(session.answers || {}).slice(0, 3).map(([k, v]: any) => (
                        <span key={k} className="px-2 py-0.5 bg-stone-100 rounded text-[10px] font-bold text-stone-600 uppercase tracking-tight">{v.toString()}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-sm">{session.recommendations?.length || 0}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${session.completed ? "bg-green-50 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                      {session.completed ? "Completed" : "Partial"}
                    </span>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-stone-400 text-sm">No sessions yet. Use the &ldquo;Find My Match&rdquo; widget.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function RulesManager() {
  return (
    <div className="p-12 text-center space-y-4">
      <div className="bg-stone-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <Settings className="w-10 h-10 text-stone-300 animate-spin-slow" />
      </div>
      <h3 className="text-2xl font-bold">Hybrid Rule Engine</h3>
      <p className="text-stone-500 max-w-sm mx-auto">
        Manual overrides allow you to force specific product suggestions during
        high-stock periods.
        <br />
        <br />
        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">
          Feature Preview
        </span>
      </p>
      <div className="pt-8 max-w-md mx-auto space-y-4">
        {[
          { cond: "IF Espresso AND Dark Roast", result: "Espresso Roma Blend" },
          {
            cond: "IF French Press AND Fruity",
            result: "Ethiopian Yirgacheffe",
          },
        ].map((rule, i) => (
          <div
            key={i}
            className="flex justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100 opacity-50 grayscale"
          >
            <span className="font-mono text-xs">{rule.cond}</span>
            <span className="font-bold text-xs uppercase tracking-widest">
              Suggest {rule.result}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─── Orders view ──────────────────────────────────────────────────────────────
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

interface Order {
  _id: string;
  _creationTime: number;
  orderId: string;
  customer: { name: string; phone: string; email: string; address: { line1: string; line2?: string; city: string; state: string; pincode: string } };
  items: { productId: string; name: string; imageUrl?: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-green-50 text-green-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
};

export function OrdersView() {
  const orders = useQuery((api as any).orders.listOrders) as Order[] | undefined;
  const updateStatus = useMutation((api as any).orders.updateStatus);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!orders) {
    return (
      <div className="p-10 flex items-center justify-center text-natural-text/40 text-sm">
        Loading orders…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center gap-3 text-natural-text/40">
        <ShoppingBag className="w-10 h-10 opacity-30" />
        <p className="text-sm font-medium">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-serif font-bold text-2xl text-natural-text">Orders</h3>
      <div className="overflow-x-auto rounded-2xl border border-natural-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-natural-muted/50 border-b border-natural-border text-natural-text/50 text-xs uppercase tracking-wider">
              <th className="px-5 py-3 text-left">Order #</th>
              <th className="px-5 py-3 text-left">Customer</th>
              <th className="px-5 py-3 text-center">Items</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <>
                <tr
                  key={order._id}
                  className="border-b last:border-0 border-stone-50 hover:bg-stone-50/50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                >
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-natural-accent">{order.orderId}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-natural-text">{order.customer.name}</div>
                    <div className="text-xs text-natural-text/50">{order.customer.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-center">{order.items.length}</td>
                  <td className="px-5 py-3.5 text-right font-bold">₹{order.total.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-natural-text/50">
                    {new Date(order._creationTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
                {expanded === order._id && (
                  <tr key={`${order._id}-detail`} className="bg-natural-muted/30">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-natural-text/40 mb-2">Delivery Address</p>
                          <p className="text-sm text-natural-text">{order.customer.address.line1}</p>
                          {order.customer.address.line2 && <p className="text-sm text-natural-text/70">{order.customer.address.line2}</p>}
                          <p className="text-sm text-natural-text/70">{order.customer.address.city}, {order.customer.address.state} – {order.customer.address.pincode}</p>
                          <p className="text-xs text-natural-text/50 pt-1">📞 {order.customer.phone}</p>
                          {order.paymentMethod && <p className="text-xs text-natural-text/50">Payment: {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod === "upi" ? "UPI" : "Card"}</p>}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-natural-text/40 mb-2">Items</p>
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover shrink-0 bg-natural-paper" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{item.name}</p>
                                <p className="text-xs text-natural-text/50">×{item.qty} · ₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between pt-2 border-t border-natural-border text-xs text-natural-text/60">
                            <span>Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-xs text-natural-text/60">
                            <span>Shipping</span><span>{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span>
                          </div>
                          <div className="flex justify-between font-bold text-sm">
                            <span>Total</span><span>₹{order.total.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3 flex-wrap">
                        <p className="text-xs font-bold uppercase tracking-wider text-natural-text/40">Update Status:</p>
                        {(["pending", "confirmed", "shipped", "delivered", "cancelled"] as OrderStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); updateStatus({ id: order._id as any, status: s }); }}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold capitalize transition-all border ${
                              order.status === s
                                ? `${STATUS_COLORS[s]} border-transparent`
                                : "border-natural-border text-natural-text/40 hover:border-natural-accent/40"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}