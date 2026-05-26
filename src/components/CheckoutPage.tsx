import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ShoppingCart, MapPin, Phone, Mail, User, CreditCard, Truck, Smartphone, Loader2 } from "lucide-react";
import { useGeoAddress } from "../lib/useGeoAddress";
import { track, snapshotCart, markConverted, logError } from "../lib/analytics";
import type { Product } from "../types";
import type { CartItem } from "./CartPanel";

interface CheckoutPageProps {
  cart: CartItem[];
  products: Product[];
  onClose: () => void;
  onOrderCreated: (orderId: string) => void;
  activeDiscount?: { code: string; discountType: "percent" | "flat"; amount: number } | null;
  clearDiscount?: () => void;
  discountedSubtotal?: number;
  onShowToast?: (msg: string) => void;
}

type PaymentMethod = "cod" | "upi" | "card";

export function CheckoutPage({ cart, products, onClose, onOrderCreated, activeDiscount, clearDiscount, discountedSubtotal, onShowToast }: CheckoutPageProps) {
  const cartProducts = cart
    .map((c) => ({ ...c, product: products.find((p) => p._id === c.productId) }))
    .filter((c): c is { productId: string; qty: number; product: Product } => c.product != null);

  const subtotal = cartProducts.reduce((s, c) => s + c.product.price * c.qty, 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const total = subtotal + shipping;

  const effectiveSubtotal = activeDiscount && discountedSubtotal !== undefined
    ? discountedSubtotal
    : subtotal;
  const discountedTotal = effectiveSubtotal + shipping;
  const savings = subtotal - effectiveSubtotal;

  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    address1: "", address2: "", city: "", state: "", pincode: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  // ── v8.0 funnel: emit checkout_initiated once on mount
  useEffect(() => {
    track("checkout_initiated", {
      itemCount: cartProducts.reduce((s, c) => s + c.qty, 0),
      subtotal,
    }, { stage: 5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── v8.0 funnel: emit payment_method_selected on change
  useEffect(() => {
    track("payment_method_selected", { method: payment }, { stage: 8 });
  }, [payment]);

  const { loading: geoLoading, error: geoError, address: geoAddress, requestLocation, clearCache } = useGeoAddress();
  const geoApplied = useRef(false);
  useEffect(() => {
    if (geoAddress && !geoApplied.current) {
      setForm((f) => ({
        ...f,
        address1: geoAddress.address1 || f.address1,
        address2: geoAddress.address2 || f.address2,
        city: geoAddress.city || f.city,
        state: geoAddress.state || f.state,
        pincode: geoAddress.pincode || f.pincode,
      }));
      geoApplied.current = true;
    }
  }, [geoAddress]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((err) => ({ ...err, [k]: undefined }));
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Valid email required";
    if (!form.phone.match(/^\d{10}$/)) e.phone = "10-digit number required";
    if (!form.address1.trim()) e.address1 = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!form.pincode.match(/^\d{6}$/)) e.pincode = "6-digit pincode required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      track("checkout_validation_failed", { fields: Object.keys(errors) }, { stage: 7 });
      return;
    }
    setSubmitting(true);
    track("payment_initiated", { method: payment, total: discountedTotal }, { stage: 8 });
    // Capture identity tuple onto the cart snapshot (used for recovery comms).
    void snapshotCart(
      cartProducts.map((c) => ({
        productId: c.productId,
        qty: c.qty,
        price: c.product.price,
        name: c.product.name,
      })),
      subtotal,
      "checkout_submit",
      { phone: form.phone, email: form.email }
    );
    try {
      const doSubmit = async (withDiscount: boolean): Promise<{ orderId: string }> => {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: {
              name: form.name,
              phone: form.phone,
              email: form.email,
              address: {
                line1: form.address1,
                line2: form.address2 || undefined,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
              },
            },
            items: cartProducts.map((c) => ({
              productId: c.productId,
              name: c.product.name,
              imageUrl: c.product.imageUrl,
              qty: c.qty,
              price: c.product.price,
            })),
            subtotal,
            paymentMethod: payment,
            ...(withDiscount && activeDiscount ? { discountCode: activeDiscount.code } : {}),
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Order submission failed");
        return body as { orderId: string };
      };

      let result: { orderId: string };

      try {
        result = await doSubmit(true);
      } catch (err: unknown) {
        // D-03: If discount-related ConvexError, toast + clear + retry without discount
        const msg = err instanceof Error ? err.message : String(err);
        const isDiscountError = /discount|offer/i.test(msg);

        if (isDiscountError && activeDiscount) {
          onShowToast?.(
            "This offer is no longer available. Your order has been placed without the discount."
          );
          clearDiscount?.();
          result = await doSubmit(false);
        } else {
          throw err; // re-throw non-discount errors
        }
      }

      onOrderCreated(result.orderId);
      track("order_confirmed", {
        orderId: result.orderId,
        method: payment,
        total: discountedTotal,
      }, { stage: 10 });
      void markConverted();
    } catch (err) {
      console.error("submitOrder failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      track("payment_failed", { method: payment, reason: msg.slice(0, 120) }, { stage: 9 });
      void logError(err, { type: "api", extra: { mutation: "submitOrder", method: payment } });
      setErrors({ name: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-natural-bg scrollbar-none">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-natural-paper/95 backdrop-blur-md border-b border-natural-border px-4 sm:px-6 py-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-natural-text/60 hover:text-natural-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Edit Cart
        </button>
        <div className="flex items-center gap-2 text-natural-text">
          <ShoppingCart className="w-4 h-4 text-natural-accent" />
          <span className="font-serif font-bold text-base">Checkout</span>
        </div>
        <div className="w-20" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 lg:items-start"
      >
        {/* ── Left: Form ─────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact */}
          <section>
            <h2 className="font-serif font-bold text-xl text-natural-text mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-natural-accent" /> Contact
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" icon={<User className="w-4 h-4" />} value={form.name} onChange={set("name")} error={errors.name} placeholder="Arjun Sharma" />
                  <Field label="Email" icon={<Mail className="w-4 h-4" />} value={form.email} onChange={set("email")} error={errors.email} placeholder="you@email.com" type="email" />
                  <Field label="Phone" icon={<Phone className="w-4 h-4" />} value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="9876543210" type="tel" className="sm:col-span-2" />
                </div>
          </section>

          {/* Delivery */}
          <section>
            <h2 className="font-serif font-bold text-xl text-natural-text mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-natural-accent" /> Delivery Address
            </h2>
            {/* GPS autofill button */}
            {typeof navigator !== "undefined" && "geolocation" in navigator && (
              <div className="flex items-center gap-2 mb-3">
                {geoAddress ? (
                  <>
                    <button
                      type="button"
                      onClick={() => { geoApplied.current = false; requestLocation(); }}
                      className="flex items-center gap-1.5 text-xs font-medium text-natural-accent underline underline-offset-2"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Update location
                    </button>
                    <span className="text-natural-muted text-xs">·</span>
                    <button
                      type="button"
                      onClick={clearCache}
                      className="text-xs text-natural-muted hover:text-red-500 transition-colors"
                    >
                      Clear saved address
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={requestLocation}
                    disabled={geoLoading}
                    className="flex items-center gap-1.5 text-xs font-medium text-natural-accent hover:underline underline-offset-2 disabled:opacity-60"
                  >
                    {geoLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                    {geoLoading ? "Detecting location…" : "Use my location"}
                  </button>
                )}
              </div>
            )}
            {geoError && <p className="text-red-500 text-xs mb-3">{geoError}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Address Line 1" value={form.address1} onChange={set("address1")} error={errors.address1} placeholder="House / Flat / Office No." className="sm:col-span-2" />
              <Field label="Address Line 2" value={form.address2} onChange={set("address2")} placeholder="Area, Colony (optional)" className="sm:col-span-2" />
              <Field label="City" value={form.city} onChange={set("city")} error={errors.city} placeholder="Bengaluru" />
              <Field label="State" value={form.state} onChange={set("state")} error={errors.state} placeholder="Karnataka" />
              <Field label="Pincode" value={form.pincode} onChange={set("pincode")} error={errors.pincode} placeholder="560001" />
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="font-serif font-bold text-xl text-natural-text mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-natural-accent" /> Payment
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { id: "cod", label: "Cash on Delivery", icon: <Truck className="w-5 h-5" /> },
                { id: "upi", label: "UPI / GPay", icon: <Smartphone className="w-5 h-5" /> },
                { id: "card", label: "Credit / Debit Card", icon: <CreditCard className="w-5 h-5" /> },
              ] as { id: PaymentMethod; label: string; icon: React.ReactNode }[]).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPayment(opt.id)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                    payment === opt.id
                      ? "border-natural-accent bg-natural-accent/8 shadow-sm"
                      : "border-natural-border bg-natural-paper hover:border-natural-accent/40"
                  }`}
                >
                  <span className={payment === opt.id ? "text-natural-accent" : "text-natural-text/50"}>
                    {opt.icon}
                  </span>
                  <span className={`text-sm font-semibold ${payment === opt.id ? "text-natural-text" : "text-natural-text/60"}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
            {payment === "upi" && (
              <p className="mt-3 text-xs text-natural-text/50 bg-natural-paper border border-natural-border rounded-xl px-4 py-3">
                UPI QR / payment link will be shared after order placement.
              </p>
            )}
            {payment === "card" && (
              <p className="mt-3 text-xs text-natural-text/50 bg-natural-paper border border-natural-border rounded-xl px-4 py-3">
                Secure card payment via Razorpay will open after placing the order.
              </p>
            )}
          </section>

          {/* Mobile CTA */}
          <div className="lg:hidden">
            <OrderSummaryCard cartProducts={cartProducts} subtotal={subtotal} shipping={shipping} total={discountedTotal} activeDiscount={activeDiscount} savings={savings} />
            <button
              type="submit"
              disabled={submitting}
              className="mt-5 w-full bg-natural-text text-white py-4 rounded-full font-bold text-base hover:bg-natural-accent transition-colors active:scale-[0.98] shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
              {submitting ? "Placing Order..." : `Place Order · ₹${discountedTotal.toLocaleString("en-IN")}`}
            </button>
          </div>
        </form>

        {/* ── Right: Order Summary (desktop) ─── */}
        <div className="hidden lg:block sticky top-24 space-y-4">
          <OrderSummaryCard cartProducts={cartProducts} subtotal={subtotal} shipping={shipping} total={discountedTotal} activeDiscount={activeDiscount} savings={savings} />
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={submitting}
            className="w-full bg-natural-text text-white py-4 rounded-full font-bold text-base hover:bg-natural-accent transition-colors active:scale-[0.98] shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
            {submitting ? "Placing Order..." : `Place Order · ₹${discountedTotal.toLocaleString("en-IN")}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function Field({
  label, value, onChange, error, placeholder, type = "text", className = "", icon,
}: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; placeholder?: string; type?: string; className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-natural-text/50">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-natural-text/30">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-natural-paper border rounded-xl py-3 text-sm text-natural-text placeholder:text-natural-text/25 focus:outline-none focus:ring-2 focus:ring-natural-accent/40 transition-all ${
            icon ? "pl-10 pr-4" : "px-4"
          } ${error ? "border-red-400" : "border-natural-border"}`}
        />
      </div>
      {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
    </div>
  );
}

function OrderSummaryCard({
  cartProducts, subtotal, shipping, total, activeDiscount, savings,
}: {
  cartProducts: { productId: string; qty: number; product: Product }[];
  subtotal: number; shipping: number; total: number;
  activeDiscount?: { code: string; discountType: "percent" | "flat"; amount: number } | null;
  savings?: number;
}) {
  return (
    <div className="bg-natural-paper border border-natural-border rounded-2xl p-5 space-y-4">
      <h3 className="font-serif font-bold text-base text-natural-text">Your Order</h3>
      <div className="space-y-3 max-h-52 overflow-y-auto scrollbar-none">
        {cartProducts.map(({ productId, qty, product: p }) => (
          <div key={productId} className="flex items-center gap-3">
            {p.imageUrl && (
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-natural-muted">
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-natural-text line-clamp-1">{p.name}</p>
              <p className="text-xs text-natural-text/50">Qty {qty}</p>
            </div>
            <p className="text-sm font-bold text-natural-text shrink-0">₹{(p.price * qty).toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-natural-border pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-natural-text/60">
          <span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        {activeDiscount && savings !== undefined && savings > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <span>Discount ({activeDiscount.code})</span>
            <span>−₹{savings.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex justify-between text-natural-text/60">
          <span>Shipping</span>
          <span>{shipping === 0 ? <span className="text-green-500 font-semibold">Free</span> : `₹${shipping}`}</span>
        </div>
        {shipping === 0 && (
          <p className="text-[11px] text-green-500">Free shipping on orders above ₹499</p>
        )}
        <div className="flex justify-between font-bold text-natural-text text-base pt-1 border-t border-natural-border">
          <span>Total</span><span>₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}
