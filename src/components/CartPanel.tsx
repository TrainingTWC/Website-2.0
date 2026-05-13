import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import type { Product } from "../types";

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
}

export function CartPanel({
  open,
  onClose,
  cart,
  products,
  onRemove,
  onUpdateQty,
}: CartPanelProps) {
  const cartProducts = cart
    .map((c) => ({ ...c, product: products.find((p) => p._id === c.productId) }))
    .filter((c): c is { productId: string; qty: number; product: Product } => c.product != null);

  const subtotal = cartProducts.reduce((s, c) => s + c.product.price * c.qty, 0);
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);

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
                cartProducts.map(({ productId, qty, product: p }) => (
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
                      <p className="font-serif font-bold text-sm text-natural-text leading-snug line-clamp-2">
                        {p.name}
                      </p>
                      <p className="text-natural-accent font-bold text-sm mt-0.5">
                        ₹{(p.price * qty).toLocaleString("en-IN")}
                      </p>
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
                        onClick={() => onUpdateQty(productId, 1)}
                        className="w-7 h-7 rounded-full bg-natural-paper border border-natural-border flex items-center justify-center hover:border-natural-accent/50 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-natural-text/60" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {cartProducts.length > 0 && (
              <div className="border-t border-natural-border px-6 py-5 space-y-4 bg-natural-paper">
                <div className="flex items-center justify-between">
                  <span className="text-natural-text/55 font-medium text-sm">
                    Subtotal ({totalQty} {totalQty === 1 ? "item" : "items"})
                  </span>
                  <span className="font-serif font-black text-2xl text-natural-text">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-natural-text/35 text-xs">
                  Taxes &amp; shipping calculated at checkout.
                </p>
                <button className="w-full bg-natural-text text-white py-4 rounded-full font-bold text-sm hover:bg-natural-accent transition-colors active:scale-[0.98]">
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
