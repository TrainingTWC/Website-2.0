import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Package, MapPin, MessageCircle, X, Send,
  CheckCircle, Truck, Clock, Ban, ChevronRight,
} from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface OrderPortalProps {
  initialOrderId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const ORDER_ID_RE = /^TWC-[A-Z0-9]{8}$/i;

const TIMELINE_STEPS = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
];

const STEP_ORDER = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function stepIndex(status: string) {
  return STEP_ORDER.indexOf(status);
}

// ──────────────────────────────────────────────────────────────────────────────
// Lookup screen
// ──────────────────────────────────────────────────────────────────────────────
function LookupScreen({ onFound }: { onFound: (id: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim().toUpperCase();
    if (!ORDER_ID_RE.test(trimmed)) {
      setError("Enter a valid order ID in the format TWC-XXXXXXXX");
      return;
    }
    setError(null);
    onFound(trimmed);
  }

  return (
    <div className="min-h-screen bg-natural-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-natural-paper rounded-2xl shadow-xl p-8 border border-natural-border"
      >
        <div className="flex items-center gap-3 mb-6">
          <Package className="w-7 h-7 text-natural-accent" />
          <h1 className="font-serif font-bold text-2xl text-natural-text">Track your order</h1>
        </div>
        <p className="text-natural-muted text-sm mb-6">
          Enter your order ID from your confirmation email (e.g. TWC-AB12CD34).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              placeholder="TWC-XXXXXXXX"
              className="w-full bg-natural-bg border border-natural-border rounded-lg px-4 py-3 text-natural-text placeholder:text-natural-muted focus:outline-none focus:ring-2 focus:ring-natural-accent/40 font-mono uppercase tracking-widest text-sm"
              maxLength={12}
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-natural-accent text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            Track Order <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Support chat panel
// ──────────────────────────────────────────────────────────────────────────────
interface ChatMessage { role: "customer" | "system"; text: string }

const SUGGESTED_CHIPS = [
  "When will my order ship?",
  "Can I change my delivery address?",
  "How do I return an item?",
  "What's my estimated delivery time?",
];

function SupportChat({
  orderId, status, itemCount, total, customerName, city, onClose,
}: {
  orderId: string; status: string; itemCount: number; total: number;
  customerName: string; city: string; onClose: () => void;
}) {
  const answerQuery = useAction(api.support.answerSupportQuery);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      text: `Hi ${customerName.split(" ")[0]}! 👋 I'm here to help with your order ${orderId}. What can I assist you with?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function send(text: string) {
    if (!text.trim() || typing) return;
    const question = text.trim();
    setInput("");
    setMessages((m) => [...m, { role: "customer", text: question }]);
    setTyping(true);
    try {
      const { answer } = await answerQuery({
        question,
        orderContext: { orderId, status, itemCount, total, customerName, city },
      });
      setMessages((m) => [...m, { role: "system", text: answer }]);
    } catch {
      setMessages((m) => [...m, { role: "system", text: "Sorry, I couldn't process your request. Please try again." }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      className="fixed bottom-4 right-4 w-full max-w-sm bg-natural-paper rounded-2xl shadow-2xl border border-natural-border flex flex-col overflow-hidden z-50"
      style={{ maxHeight: "70vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-natural-accent text-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <span className="font-semibold text-sm">Order Support</span>
        </div>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "customer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "customer"
                  ? "bg-natural-accent text-white rounded-br-sm"
                  : "bg-natural-bg text-natural-text rounded-bl-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-natural-bg rounded-2xl rounded-bl-sm px-4 py-2 text-natural-muted text-sm flex gap-1">
              <span className="animate-bounce [animation-delay:0ms]">·</span>
              <span className="animate-bounce [animation-delay:100ms]">·</span>
              <span className="animate-bounce [animation-delay:200ms]">·</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {/* Suggested chips */}
      {messages.length <= 1 && !typing && (
        <div className="px-3 pb-1 flex flex-wrap gap-1.5">
          {SUGGESTED_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => send(chip)}
              className="text-xs bg-natural-bg border border-natural-border rounded-full px-3 py-1 text-natural-text hover:bg-natural-accent hover:text-white hover:border-natural-accent transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}
      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 px-3 py-2 border-t border-natural-border"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 bg-natural-bg rounded-full px-4 py-2 text-sm text-natural-text placeholder:text-natural-muted focus:outline-none focus:ring-2 focus:ring-natural-accent/30"
          disabled={typing}
        />
        <button
          type="submit"
          disabled={!input.trim() || typing}
          className="bg-natural-accent text-white rounded-full p-2 disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Order detail screen
// ──────────────────────────────────────────────────────────────────────────────
function OrderDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const order = useQuery(api.orders.getOrder, { orderId });
  const cancelOrder = useMutation(api.orders.cancelOrder);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrder({ orderId });
      setShowConfirm(false);
    } catch (e: unknown) {
      setCancelError(e instanceof Error ? e.message : "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  }

  if (order === undefined) {
    return (
      <div className="min-h-screen bg-natural-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-natural-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center px-4 text-center gap-4">
        <Package className="w-12 h-12 text-natural-muted" />
        <p className="text-natural-text font-semibold">Order not found</p>
        <p className="text-natural-muted text-sm">Check your order ID and try again.</p>
        <button onClick={onBack} className="flex items-center gap-1 text-natural-accent underline text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    );
  }

  const currentStep = stepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen bg-natural-bg pb-32">
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-natural-bg/90 backdrop-blur-sm border-b border-natural-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-natural-muted hover:text-natural-text transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-serif font-bold text-natural-text">{order.orderId}</span>
        <span className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-natural-stone/10 text-natural-muted"}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Timeline */}
        {!isCancelled ? (
          <div className="bg-natural-paper rounded-2xl border border-natural-border p-5">
            <h2 className="font-semibold text-natural-text mb-4 text-sm uppercase tracking-wide">Order Timeline</h2>
            <div className="flex items-start gap-0">
              {TIMELINE_STEPS.map((step, idx) => {
                const done = currentStep >= idx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${done ? "bg-natural-accent border-natural-accent text-white" : "bg-natural-bg border-natural-border text-natural-muted"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className={`text-xs text-center mt-1.5 ${done ? "text-natural-accent font-semibold" : "text-natural-muted"}`}>
                      {step.label}
                    </p>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <div className={`hidden`} />
                    )}
                  </div>
                );
              })}
            </div>
            {/* connector line */}
            <div className="relative -mt-14 mb-8 mx-4 flex items-center" aria-hidden>
              <div className="h-0.5 w-full bg-natural-border absolute" />
              {TIMELINE_STEPS.slice(0, -1).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-0.5 flex-1 transition-colors ${currentStep > idx ? "bg-natural-accent" : "bg-natural-border"}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
            <Ban className="w-6 h-6 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm font-medium">This order has been cancelled.</p>
          </div>
        )}

        {/* Items */}
        <div className="bg-natural-paper rounded-2xl border border-natural-border p-5">
          <h2 className="font-semibold text-natural-text mb-4 text-sm uppercase tracking-wide">Items Ordered</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover border border-natural-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-natural-text text-sm font-medium truncate">{item.name}</p>
                  <p className="text-natural-muted text-xs">Qty: {item.qty}</p>
                </div>
                <p className="text-natural-text text-sm font-semibold">₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-natural-border mt-4 pt-3 flex justify-between text-sm">
            <span className="text-natural-muted">Subtotal</span>
            <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-natural-muted">Shipping</span>
            <span>{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span>
          </div>
          <div className="flex justify-between font-bold mt-2">
            <span>Total</span>
            <span>₹{order.total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-natural-paper rounded-2xl border border-natural-border p-5">
          <h2 className="font-semibold text-natural-text mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
            <MapPin className="w-4 h-4 text-natural-accent" /> Delivery Address
          </h2>
          <p className="text-natural-text text-sm">{order.customer.name}</p>
          <p className="text-natural-muted text-sm">{order.customer.address.line1}</p>
          {order.customer.address.line2 && (
            <p className="text-natural-muted text-sm">{order.customer.address.line2}</p>
          )}
          <p className="text-natural-muted text-sm">
            {order.customer.address.city}, {order.customer.address.state} — {order.customer.address.pincode}
          </p>
        </div>

        {/* Payment */}
        <div className="bg-natural-paper rounded-2xl border border-natural-border p-5 flex items-center justify-between">
          <span className="text-sm text-natural-muted">Payment</span>
          {order.razorpayPaymentId ? (
            <span className="text-sm font-semibold text-green-600">Paid ✓</span>
          ) : (
            <span className="text-sm text-natural-muted">
              {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod ?? "—"}
            </span>
          )}
        </div>

        {/* Cancel */}
        {order.status === "pending" && (
          <div className="bg-natural-paper rounded-2xl border border-natural-border p-5">
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 text-red-500 text-sm hover:underline"
              >
                <Ban className="w-4 h-4" /> Cancel this order
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-natural-text text-sm font-medium">Are you sure you want to cancel?</p>
                {cancelError && <p className="text-red-500 text-xs">{cancelError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
                  >
                    {cancelling ? "Cancelling…" : "Yes, cancel"}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 border border-natural-border py-2 rounded-lg text-sm hover:bg-natural-bg"
                  >
                    Keep order
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Support chat trigger */}
        <button
          onClick={() => setChatOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-natural-paper border border-natural-border rounded-2xl py-4 text-natural-accent font-semibold text-sm hover:bg-natural-accent hover:text-white transition-colors"
        >
          <MessageCircle className="w-4 h-4" /> Chat with support
        </button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <SupportChat
            orderId={order.orderId}
            status={order.status}
            itemCount={order.items.reduce((s, i) => s + i.qty, 0)}
            total={order.total}
            customerName={order.customer.name}
            city={order.customer.address.city}
            onClose={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Public export — orchestrates lookup ↔ detail navigation
// ──────────────────────────────────────────────────────────────────────────────
export function OrderPortal({ initialOrderId }: OrderPortalProps) {
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);

  function handleFound(id: string) {
    window.history.pushState({}, "", `${window.location.pathname}?page=order-portal&id=${id}`);
    setOrderId(id);
  }

  function handleBack() {
    window.history.pushState({}, "", `${window.location.pathname}?page=order-portal`);
    setOrderId(undefined);
  }

  if (orderId) {
    return <OrderDetail orderId={orderId} onBack={handleBack} />;
  }
  return <LookupScreen onFound={handleFound} />;
}
