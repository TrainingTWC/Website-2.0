import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Product } from "../types";
import { snapshotCart, track } from "../lib/analytics";
import { useCart } from "../context/CartContext";

export interface CartItem {
  productId: string;
  qty: number;
}

interface CartPanelProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  onRemove: (productId: string) => void;
  onUpdateQty: (productId: string, delta: number) => void;
  onCheckout?: () => void;
  activeDiscount?: { code: string; discountType: "percent" | "flat"; amount: number } | null;
  clearDiscount?: () => void;
  discountedSubtotal?: number;
}

export function CartPanel({
  open,
  onClose,
  cart,
  products,
  onRemove,
  onUpdateQty,
  onCheckout,
  activeDiscount,
  clearDiscount,
  discountedSubtotal,
}: CartPanelProps) {
  const { getMOQ, cartWarnings } = useCart();

  const cartProducts = cart
    .map((c) => ({ ...c, product: products.find((p) => p._id === c.productId) }))
    .filter((c): c is { productId: string; qty: number; product: Product } => c.product != null);

  const subtotal = cartProducts.reduce((s, c) => s + c.product.price * c.qty, 0);
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);

  // Disable checkout when any item has a blocking stock/availability warning
  const hasBlockingWarning = cartWarnings.some(
    (w) =>
      w.status === "out-of-stock" ||
      w.status === "removed" ||
      w.status === "insufficient-stock"
  );

  // ── v8.0 funnel: snapshot cart on every change + emit cart_viewed when opened
  const snapKey = useRef<string>("");
  useEffect(() => {
    if (cartProducts.length === 0) return;
    const key = cartProducts.map((c) => `${c.productId}:${c.qty}`).join("|");
    if (key === snapKey.current) return;
    snapKey.current = key;
    void snapshotCart(
      cartProducts.map((c) => ({
        productId: c.productId,
        qty: c.qty,
        price: c.product.price,
        name: c.product.name,
      })),
      subtotal,
      "cart_changed"
    );
  }, [cartProducts, subtotal]);

  useEffect(() => {
    if (open) track("cart_viewed", { itemCount: totalQty, subtotal }, { stage: 3 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-70 bg-black/40 backdrop-blur-sm"
          />

          {/* Slide-out panel */}
          <motion.div
            key="cart-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-80 w-full max-w-[26rem] bg-natural-paper shadow-2xl flex flex-col font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-natural-border">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-natural-accent" />
                <span className="font-serif font-bold text-xl text-natural-text">Your Cart</span>
                {totalQty > 0 && (
                  <span className="bg-natural-accent text-white text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">
                    {totalQty}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-natural-muted transition-colors text-natural-text/50 hover:text-natural-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {cartProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 py-20 text-center">
                  <ShoppingCart className="w-14 h-14 text-natural-stone/30" />
                  <div>
                    <p className="font-serif font-bold text-lg text-natural-text/55">
                      Your cart is empty
                    </p>
                    <p className="text-sm text-natural-text/35 mt-1">
                      Add some coffee to get started.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 px-7 py-3 rounded-full bg-natural-text text-white font-bold text-sm hover:bg-natural-accent transition-colors active:scale-[0.98]"
                  >
                    Browse Collection
                  </button>
                </div>
              ) : (
                cartProducts.map(({ productId, qty, product: p }) => {
                  const maxQty = getMOQ(productId);
                  const atMax = qty >= maxQty && maxQty > 0;
                  const warning = cartWarnings.find((w) => w.productId === productId);
                  const isOutOfStock =
                    warning?.status === "out-of-stock" || p.stockStatus === "out-of-stock";

                  return (
                    <motion.div
                      key={productId}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      className="flex items-center gap-3 bg-natural-bg rounded-2xl p-3"
                    >
                      {p.imageUrl && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-natural-muted">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-serif font-bold text-sm text-natural-text leading-snug line-clamp-2">
                            {p.name}
                          </p>
                          {isOutOfStock && (
                            <span className="text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                              Out of stock
                            </span>
                          )}
                        </div>
                        <p className="text-natural-accent font-bold text-sm mt-0.5">
                          ₹{(p.price * qty).toLocaleString("en-IN")}
                        </p>
                        {atMax && !isOutOfStock && (
                          <p className="text-xs text-amber-600 mt-0.5">Max {maxQty} per order</p>
                        )}
                        {warning?.status === "insufficient-stock" &&
                          warning.remainingQty != null && (
                            <p className="text-xs text-amber-500 mt-0.5">
                              Only {warning.remainingQty} left
                            </p>
                          )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            qty === 1 ? onRemove(productId) : onUpdateQty(productId, -1)
                          }
                          className="w-7 h-7 rounded-full bg-natural-paper border border-natural-border flex items-center justify-center hover:border-red-300 transition-colors"
                        >
                          {qty === 1 ? (
                            <Trash2 className="w-3 h-3 text-red-400" />
                          ) : (
                            <Minus className="w-3 h-3 text-natural-text/60" />
                          )}
                        </button>
                        <span className="w-7 text-center font-bold text-sm tabular-nums text-natural-text">
                          {qty}
                        </span>
                        <button
                          onClick={() => {
                            if (!atMax && !isOutOfStock) onUpdateQty(productId, 1);
                          }}
                          disabled={atMax || isOutOfStock}
                          aria-label="Increase quantity"
                          className={`w-7 h-7 rounded-full bg-natural-paper border border-natural-border flex items-center justify-center transition-colors ${
                            atMax || isOutOfStock
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:border-natural-accent/50"
                          }`}
                        >
                          <Plus className="w-3 h-3 text-natural-text/60" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {cartProducts.length > 0 && (
              <div className="border-t border-natural-border px-6 py-5 space-y-4 bg-natural-paper">
                {activeDiscount && (
                  <div className="flex items-center justify-between bg-natural-accent/10 border border-natural-accent/25 rounded-2xl px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-natural-accent uppercase tracking-widest">
                        {activeDiscount.code}
                      </span>
                      <span className="text-xs text-natural-text/50">✓ applied</span>
                    </div>
                    <button
                      onClick={clearDiscount}
                      className="text-natural-text/35 hover:text-red-400 transition-colors text-xl leading-none -mr-1"
                      aria-label="Remove discount"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-natural-text/55 font-medium text-sm">
                    Subtotal ({totalQty} {totalQty === 1 ? "item" : "items"})
                  </span>
                  {activeDiscount ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm text-natural-text/40 line-through">
                        ₹{subtotal.toLocaleString("en-IN")}
                      </span>
                      <span className="font-serif font-black text-2xl text-natural-accent">
                        ₹{(discountedSubtotal ?? subtotal).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ) : (
                    <span className="font-serif font-black text-2xl text-natural-text">
                      ₹{subtotal.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                {activeDiscount && discountedSubtotal !== undefined && (
                  <p className="text-xs text-green-600 font-medium -mt-2">
                    You save ₹{(subtotal - discountedSubtotal).toLocaleString("en-IN")}
                  </p>
                )}
                <p className="text-natural-text/35 text-xs">
                  Taxes &amp; shipping calculated at checkout.
                </p>
                {hasBlockingWarning && (
                  <p className="text-xs text-red-500 font-medium -mt-1">
                    Some items are unavailable. Please remove them to continue.
                  </p>
                )}
                <button
                  onClick={() => {
                    if (!hasBlockingWarning) {
                      onClose();
                      onCheckout?.();
                    }
                  }}
                  disabled={hasBlockingWarning}
                  className={`w-full bg-natural-text text-white py-4 rounded-full font-bold text-sm transition-colors active:scale-[0.98] ${
                    hasBlockingWarning
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-natural-accent"
                  }`}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
