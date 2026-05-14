import { motion } from "motion/react";
import { CheckCircle, ShoppingBag, MapPin, Package, ArrowRight } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { asset } from "../lib/asset";

interface OrderConfirmationProps {
  orderId: string;
  onContinueShopping: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Order Received",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export function OrderConfirmation({ orderId, onContinueShopping }: OrderConfirmationProps) {
  const order = useQuery((api as any).orders.getOrder, { orderId });

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-natural-paper/95 backdrop-blur-md border-b border-natural-border px-4 sm:px-6 py-4 flex items-center gap-3">
        <img src={asset("logo.png")} alt="Third Wave Coffee" className="h-8 w-auto" />
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col items-center">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center mb-8"
        >
          <h1 className="font-serif font-bold text-3xl text-natural-text mb-2">
            Order Received!
          </h1>
          <p className="text-natural-text/60 text-base">
            Thank you for your order. We'll confirm it shortly.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-natural-paper border border-natural-border rounded-full px-5 py-2">
            <Package className="w-4 h-4 text-natural-accent" />
            <span className="font-mono font-bold text-natural-text tracking-wider text-sm">
              {orderId}
            </span>
          </div>
        </motion.div>

        {order === undefined ? (
          <div className="w-full bg-natural-paper rounded-3xl border border-natural-border p-8 animate-pulse">
            <div className="h-4 bg-natural-muted rounded w-1/2 mb-4" />
            <div className="h-4 bg-natural-muted rounded w-3/4" />
          </div>
        ) : order === null ? (
          <div className="w-full bg-natural-paper rounded-3xl border border-natural-border p-8 text-center text-natural-text/50">
            Order details not found.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full space-y-5"
          >
            {/* Status + totals */}
            <div className="bg-natural-paper rounded-3xl border border-natural-border p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif font-bold text-lg text-natural-text flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-natural-accent" />
                  Order Summary
                </h2>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-natural-muted text-natural-text"}`}
                >
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-5">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-natural-muted">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-natural-text line-clamp-1">{item.name}</p>
                      <p className="text-xs text-natural-text/50">Qty: {item.qty}</p>
                    </div>
                    <p className="font-bold text-sm text-natural-text whitespace-nowrap">
                      ₹{(item.price * item.qty).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-natural-border pt-4 space-y-1.5">
                <div className="flex justify-between text-sm text-natural-text/60">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm text-natural-text/60">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span>
                </div>
                <div className="flex justify-between font-serif font-bold text-base text-natural-text border-t border-natural-border pt-2 mt-1">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div className="bg-natural-paper rounded-3xl border border-natural-border p-6">
              <h2 className="font-serif font-bold text-base text-natural-text flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-natural-accent" />
                Delivering to
              </h2>
              <p className="font-bold text-sm text-natural-text">{order.customer.name}</p>
              <p className="text-sm text-natural-text/60 mt-0.5">
                {order.customer.address.line1}
                {order.customer.address.line2 ? `, ${order.customer.address.line2}` : ""}
              </p>
              <p className="text-sm text-natural-text/60">
                {order.customer.address.city}, {order.customer.address.state} – {order.customer.address.pincode}
              </p>
              <p className="text-sm text-natural-text/60 mt-1">{order.customer.phone}</p>
            </div>

            {/* CTA */}
            <button
              onClick={onContinueShopping}
              className="w-full py-4 rounded-full bg-natural-text text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-natural-accent transition-colors active:scale-[0.98]"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                window.history.pushState(
                  {},
                  "",
                  `${window.location.pathname}?page=order-portal&id=${orderId}`
                );
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="text-sm text-natural-accent underline underline-offset-2 hover:opacity-80 transition-opacity mt-3"
            >
              Track your order →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
