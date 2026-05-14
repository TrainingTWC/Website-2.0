import { useState } from "react";
import { motion } from "motion/react";
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
  Tag,
  Coffee as CoffeeIcon,
  IndianRupee,
  Database,
  X,
  Settings,
  Star,
  MapPin,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useProducts } from "../../lib/useProducts";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Product, ProductType, RoastLevel } from "../../types";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "inventory" | "analytics" | "rules"
  >("inventory");
  const products = useProducts();
  const sessions = useQuery(api.sessions.list);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-5xl font-serif font-bold tracking-tight">
            Merchant Control
          </h2>
          <p className="text-natural-text opacity-50 mt-2 font-medium">
            Manage your catalog and monitor AI recommendation performance.
          </p>
        </div>

        <div className="flex bg-natural-muted rounded-2xl p-1 border border-natural-stone shadow-inner">
          {[
            {
              id: "inventory",
              label: "Inventory",
              icon: <Package className="w-4 h-4" />,
            },
            {
              id: "analytics",
              label: "Analytics",
              icon: <TrendingUp className="w-4 h-4" />,
            },
            {
              id: "rules",
              label: "Logic Rules",
              icon: <Search className="w-4 h-4" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-natural-accent text-white shadow-lg"
                  : "hover:bg-natural-stone/40"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="bg-white rounded-[3rem] border border-natural-border shadow-sm min-h-[60vh] overflow-hidden">
        {activeTab === "inventory" && (
          <InventoryManager products={products ?? []} />
        )}
        {activeTab === "analytics" && (
          <AnalyticsView sessions={sessions ?? []} />
        )}
        {activeTab === "rules" && <RulesManager />}
      </div>
    </div>
  );
}

function InventoryManager({ products }: { products: Product[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<{
    name: string;
    description: string;
    type: ProductType;
    category: string;
    price: number;
    imageUrl: string;
    tags: string[];
    roastLevel?: RoastLevel;
    origin?: string;
    weight?: string;
    flavorNotes: string[];
    stockStatus: "in-stock" | "out-of-stock" | "low-stock";
  }>({
    name: "",
    description: "",
    type: "beans",
    category: "single-origin",
    price: 1499,
    imageUrl: "",
    tags: [],
    roastLevel: "medium",
    origin: "",
    weight: "250g",
    flavorNotes: [],
    stockStatus: "in-stock",
  });

  const addProduct = useMutation(api.products.add);
  const removeProduct = useMutation(api.products.remove);
  const updateStockMutation = useMutation(api.products.updateStock);

  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [editThreshold, setEditThreshold] = useState(10);

  const handleOpenStockEdit = (p: Product) => {
    if (editingStockId === p._id) { setEditingStockId(null); return; }
    setEditingStockId(p._id);
    setEditQty(p.stockQty ?? 0);
    setEditThreshold(p.lowStockThreshold ?? 10);
  };

  const handleSaveStock = async () => {
    if (!editingStockId) return;
    await updateStockMutation({
      id: editingStockId as Id<"products">,
      stockQty: editQty,
      lowStockThreshold: editThreshold,
    });
    setEditingStockId(null);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) return;
    try {
      await addProduct(newProduct);
      setIsAdding(false);
      setNewProduct({
        name: "",
        description: "",
        type: "beans",
        category: "single-origin",
        price: 1499,
        imageUrl: "",
        tags: [],
        roastLevel: "medium",
        origin: "",
        weight: "250g",
        flavorNotes: [],
        stockStatus: "in-stock",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (product: Product) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await removeProduct({ id: product._id as Id<"products"> });
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-3xl font-serif font-bold flex items-center gap-3">
          <Database className="w-7 h-7 text-natural-accent" />
          Product Catalog
          <span className="text-base font-sans text-natural-text/40 font-medium">
            ({products.length} items)
          </span>
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-natural-text text-white px-8 py-4 rounded-full font-bold hover:bg-natural-accent transition-all shadow-xl active:scale-95"
        >
          {isAdding ? (
            <X className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {isAdding ? "Cancel" : "Add New Product"}
        </button>
      </div>

      {products.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-bold text-green-700">
              {products.filter((p) => p.stockStatus === "in-stock").length} In Stock
            </span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">
              {products.filter((p) => p.stockStatus === "low-stock").length} Low Stock
            </span>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-3 flex items-center gap-2">
            <PackageX className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-700">
              {products.filter((p) => p.stockStatus === "out-of-stock").length} Out of Stock
            </span>
          </div>
        </div>
      )}

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-stone-50 p-8 rounded-3xl border-2 border-dashed border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="space-y-4">
            <label className="block text-sm font-bold uppercase tracking-wider text-stone-400">
              Product Name
            </label>
            <input
              type="text"
              placeholder="e.g. Ethiopian Yirgacheffe"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              className="w-full p-4 rounded-xl border border-stone-200 outline-none focus:ring-2 ring-[#5A5A40]/20"
            />

            <label className="block text-sm font-bold uppercase tracking-wider text-stone-400">
              Description
            </label>
            <textarea
              placeholder="Flavor notes, roast process..."
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              className="w-full p-4 rounded-xl border border-stone-200 h-32 outline-none focus:ring-2 ring-[#5A5A40]/20"
            />

            <label className="block text-sm font-bold uppercase tracking-wider text-stone-400">
              Image URL
            </label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={newProduct.imageUrl}
              onChange={(e) =>
                setNewProduct({ ...newProduct, imageUrl: e.target.value })
              }
              className="w-full p-4 rounded-xl border border-stone-200 outline-none focus:ring-2 ring-[#5A5A40]/20"
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Type
                </label>
                <select
                  value={newProduct.type}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      type: e.target.value as ProductType,
                    })
                  }
                  className="w-full p-4 rounded-xl border border-stone-200 bg-white"
                >
                  <option value="beans">Coffee Beans (Freshly Roasted)</option>
                  <option value="bags">Easy Coffee Bags (Ground & Packed)</option>
                  <option value="merch">Merch (Keychains, Cups, etc.)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      price: parseFloat(e.target.value),
                    })
                  }
                  className="w-full p-4 rounded-xl border border-stone-200"
                />
              </div>
            </div>

            {(newProduct.type === "beans" || newProduct.type === "bags") && (
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Roast Level
                </label>
                <div className="flex gap-2">
                  {(
                    ["light", "medium", "medium-dark", "dark"] as RoastLevel[]
                  ).map((level) => (
                    <button
                      key={level}
                      onClick={() =>
                        setNewProduct({ ...newProduct, roastLevel: level })
                      }
                      className={`flex-1 p-3 rounded-xl border-2 capitalize font-bold transition-all text-sm ${
                        newProduct.roastLevel === level
                          ? "bg-[#5A5A40] text-white border-[#5A5A40]"
                          : "bg-white text-stone-400 border-stone-100 hover:border-stone-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Origin
                </label>
                <input
                  type="text"
                  placeholder="e.g. Yirgacheffe, Ethiopia"
                  value={newProduct.origin || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, origin: e.target.value })
                  }
                  className="w-full p-4 rounded-xl border border-stone-200"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. single-origin, blend"
                  value={newProduct.category}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                  className="w-full p-4 rounded-xl border border-stone-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-stone-400 mb-2">
                Search Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="citrus, chocolatey, morning-brew"
                onBlur={(e) =>
                  setNewProduct({
                    ...newProduct,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full p-4 rounded-xl border border-stone-200"
              />
            </div>

            <button
              onClick={handleAddProduct}
              className="w-full bg-[#5A5A40] text-white py-4 rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-[0.99] transition-all"
            >
              Save Product to Catalog
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {products.map((p) => (
          <div key={p._id}>
          <div
            className={`group flex items-center justify-between p-6 bg-white border border-stone-100 rounded-3xl hover:border-[#5A5A40]/30 hover:shadow-xl transition-all ${editingStockId === p._id ? "rounded-b-none border-b-0" : ""}`}
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                    <CoffeeIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-xl font-bold">{p.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      p.type === "beans"
                        ? "bg-[#5A5A40]/10 text-[#5A5A40]"
                        : p.type === "bags"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {p.type}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-stone-400">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" /> {p.price.toLocaleString("en-IN")}
                  </span>
                  {p.roastLevel && (
                    <span className="flex items-center gap-1 capitalize">
                      <Tag className="w-3 h-3" /> {p.roastLevel} Roast
                    </span>
                  )}
                  {p.origin && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {p.origin}
                    </span>
                  )}
                  {p.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{" "}
                      {p.rating}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CheckCircle2
                      className={`w-3 h-3 ${p.stockStatus === "in-stock" ? "text-green-500" : p.stockStatus === "low-stock" ? "text-amber-500" : "text-red-500"}`}
                    />{" "}
                    {p.stockStatus}
                    {p.stockQty !== undefined && (
                      <span className="ml-1 text-stone-500">({p.stockQty} units)</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleOpenStockEdit(p)}
                title="Edit stock"
                className={`p-3 rounded-xl transition-all ${editingStockId === p._id ? "text-[#5A5A40] bg-[#5A5A40]/10" : "text-stone-400 hover:text-[#5A5A40] hover:bg-[#5A5A40]/5"}`}
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(p)}
                className="p-3 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          {editingStockId === p._id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-stone-50 p-6 rounded-b-3xl border-x border-b border-[#5A5A40]/20"
            >
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Stock Quantity
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditQty(Math.max(0, editQty - 1))}
                      className="w-10 h-10 rounded-xl bg-stone-200 hover:bg-stone-300 font-bold text-xl transition-all flex items-center justify-center"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={editQty}
                      onChange={(e) =>
                        setEditQty(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-20 text-center p-2 rounded-xl border border-stone-200 font-bold text-lg outline-none focus:ring-2 ring-[#5A5A40]/20"
                    />
                    <button
                      onClick={() => setEditQty(editQty + 1)}
                      className="w-10 h-10 rounded-xl bg-stone-200 hover:bg-stone-300 font-bold text-xl transition-all flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                    Low-Stock Alert Below
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={editThreshold}
                      onChange={(e) =>
                        setEditThreshold(
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="w-24 text-center p-2 rounded-xl border border-stone-200 font-bold outline-none focus:ring-2 ring-[#5A5A40]/20"
                    />
                    <span className="text-sm text-stone-400">units</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      editQty === 0
                        ? "bg-red-100 text-red-700"
                        : editQty <= editThreshold
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {editQty === 0
                      ? "→ Out of Stock"
                      : editQty <= editThreshold
                      ? "→ Low Stock"
                      : "→ In Stock"}
                  </span>
                  <button
                    onClick={handleSaveStock}
                    className="bg-[#5A5A40] text-white px-6 py-2.5 rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all"
                  >
                    Save Stock
                  </button>
                  <button
                    onClick={() => setEditingStockId(null)}
                    className="px-4 py-2.5 rounded-xl font-bold text-stone-500 hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          </div>
        ))}
        {products.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-stone-100 rounded-[2rem]">
            <Package className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400 font-medium">
              Your catalog is empty. Start adding products above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsView({ sessions }: { sessions: any[] }) {
  const completionRate =
    sessions.length > 0
      ? Math.round(
          (sessions.filter((s: any) => s.completed).length / sessions.length) *
            100
        )
      : 0;

  const stats = [
    {
      label: "Total Sessions",
      value: sessions.length,
      icon: <Users className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Conversion Lift",
      value: "14.2%",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="p-8 space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-stone-100 p-8 rounded-3xl shadow-sm space-y-4"
          >
            <div
              className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center`}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-stone-400">
                {stat.label}
              </p>
              <h4 className="text-4xl font-extrabold">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <ListIcon className="w-6 h-6 text-[#5A5A40]" />
          Recent Interactions
        </h3>
        <div className="bg-white border border-stone-100 rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">
                  Preferences
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400">
                  Match Count
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-stone-400 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session: any) => (
                <tr
                  key={session._id}
                  className="border-b last:border-0 border-stone-50 hover:bg-stone-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-stone-500">
                    {session._creationTime
                      ? new Date(session._creationTime).toLocaleString()
                      : "Just now"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(session.answers || {})
                        .slice(0, 3)
                        .map(([k, v]: any) => (
                          <span
                            key={k}
                            className="px-2 py-1 bg-stone-100 rounded text-[10px] font-bold text-stone-600 uppercase tracking-tight"
                          >
                            {v.toString()}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm">
                    {session.recommendations?.length || 0} Products
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#5A5A40] font-bold text-xs hover:underline">
                      View Log
                    </button>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-stone-400"
                  >
                    No sessions recorded yet. Use the "Find My Match" widget to
                    generate data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RulesManager() {
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
