import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Package, MapPin, MessageCircle, X, Send,
  CheckCircle, Truck, Clock, Ban, ChevronRight, Mail, ShoppingBag, User,
} from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface OrderPortalProps {
  initialOrderId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800 border border-amber-300",
  confirmed: "bg-blue-100 text-blue-700 border border-blue-300",
  shipped:   "bg-violet-100 text-violet-700 border border-violet-300",
  delivered: "bg-green-100 text-green-700 border border-green-300",
  cancelled: "bg-red-100 text-red-700 border border-red-300",
};

function goToStorefront() {
  window.history.pushState({ scrollY: 0 }, "", window.location.pathname);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

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
// Lookup screen — two tabs: Order ID | Email / Phone
// ──────────────────────────────────────────────────────────────────────────────
type ContactOrder = NonNullable<ReturnType<typeof useQuery<typeof api.orders.getOrdersByContact>>>[-1];

function LookupScreen({
  onFound,
  onFoundByContact,
}: {
  onFound: (id: string) => void;
  onFoundByContact: (orders: ContactOrder[], contact: string) => void;
}) {
  const [tab, setTab] = useState<"orderId" | "contact">("orderId");

  // Order ID tab
  const [orderIdValue, setOrderIdValue] = useState("");
  const [orderIdError, setOrderIdError] = useState<string | null>(null);

  // Contact tab
  const [contactValue, setContactValue] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // Always call hook; pass "skip" until user searches
  const ordersByContact = useQuery(
    api.orders.getOrdersByContact,
    contactSubmitted ? { contact: contactValue.trim() } : "skip"
  );

  // Auto-navigate to My Orders dashboard as soon as results arrive
  useEffect(() => {
    if (contactSubmitted && ordersByContact && ordersByContact.length > 0) {
      onFoundByContact(ordersByContact as ContactOrder[], contactValue.trim());
    }
  }, [ordersByContact, contactSubmitted]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(t: "orderId" | "contact") {
    setTab(t);
    setOrderIdError(null);
    setContactError(null);
    setContactSubmitted(false);
  }

  function handleOrderIdSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orderIdValue.trim().toUpperCase();
    if (!ORDER_ID_RE.test(trimmed)) {
      setOrderIdError("Enter a valid order ID — format: TWC-XXXXXXXX");
      return;
    }
    setOrderIdError(null);
    onFound(trimmed);
  }

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = contactValue.trim();
    if (!trimmed) {
      setContactError("Enter your email address or phone number");
      return;
    }
    setContactError(null);
    setContactSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-natural-paper rounded-2xl shadow-xl border border-natural-border overflow-hidden"
      >
        {/* Card header */}
        <div className="px-8 pt-8 pb-5">
          <div className="flex items-center gap-3 mb-1.5">
            <Package className="w-6 h-6 text-natural-accent" />
            <h1 className="font-serif font-bold text-2xl text-natural-text">Track your order</h1>
          </div>
          <p className="text-natural-text/55 text-sm">Look up by order ID or the email/phone used at checkout.</p>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-natural-border mx-8">
          {(["orderId", "contact"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-natural-accent text-natural-accent"
                  : "border-transparent text-natural-text/45 hover:text-natural-text/70"
              }`}
            >
              {t === "orderId" ? <Package className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
              {t === "orderId" ? "Order ID" : "Email / Phone"}
            </button>
          ))}
        </div>

        <div className="px-8 py-6">
          {/* ── Tab: Order ID ── */}
          {tab === "orderId" && (
            <form onSubmit={handleOrderIdSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-natural-text/45 mb-2">
                  Order ID
                </label>
                <input
                  type="text"
                  value={orderIdValue}
                  onChange={(e) => { setOrderIdValue(e.target.value); setOrderIdError(null); }}
                  placeholder="TWC-XXXXXXXX"
                  className="w-full bg-natural-bg border border-natural-border rounded-xl px-4 py-3 text-natural-text placeholder:text-natural-text/30 focus:outline-none focus:ring-2 focus:ring-natural-accent/40 font-mono uppercase tracking-widest text-sm"
                  maxLength={12}
                  autoFocus
                />
                {orderIdError && <p className="text-red-500 text-xs mt-1.5">{orderIdError}</p>}
                <p className="text-natural-text/40 text-xs mt-1.5">You can find this in your confirmation email.</p>
              </div>
              <button
                type="submit"
                className="w-full bg-natural-accent text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Track Order <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ── Tab: Email / Phone ── */}
          {tab === "contact" && (
            <div className="space-y-4">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-natural-text/45 mb-2">
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    value={contactValue}
                    onChange={(e) => {
                      setContactValue(e.target.value);
                      setContactError(null);
                      setContactSubmitted(false);
                    }}
                    placeholder="name@email.com or 9XXXXXXXXX"
                    className="w-full bg-natural-bg border border-natural-border rounded-xl px-4 py-3 text-natural-text placeholder:text-natural-text/30 focus:outline-none focus:ring-2 focus:ring-natural-accent/40 text-sm"
                    autoFocus
                  />
                  {contactError && <p className="text-red-500 text-xs mt-1.5">{contactError}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full bg-natural-accent text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Find My Orders <ChevronRight className="w-4 h-4" />
                </button>
              </form>

              {/* Loading */}
              {contactSubmitted && ordersByContact === undefined && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-natural-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* No results */}
              {contactSubmitted && ordersByContact !== undefined && ordersByContact.length === 0 && (
                <div className="text-center py-8">
                  <Package className="w-9 h-9 text-natural-text/20 mx-auto mb-3" />
                  <p className="text-natural-text/60 text-sm font-medium">No orders found</p>
                  <p className="text-natural-text/40 text-xs mt-1">
                    Double-check the email or phone used when placing the order.
                  </p>
                </div>
              )}

              {/* Results found → spinner stays until useEffect navigates away */}
              {contactSubmitted && ordersByContact && ordersByContact.length > 0 && (
                <div className="flex items-center justify-center py-6">
                  <div className="w-6 h-6 border-2 border-natural-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Back to shop */}
      <button
        onClick={goToStorefront}
        className="mt-6 flex items-center gap-1.5 text-natural-text/50 hover:text-natural-accent text-sm transition-colors"
      >
        <ShoppingBag className="w-4 h-4" /> Continue Shopping
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// My Orders — full order management dashboard (after email/phone login)
// ──────────────────────────────────────────────────────────────────────────────
function MyOrdersScreen({
  orders,
  contact,
  onViewOrder,
  onBack,
}: {
  orders: ContactOrder[];
  contact: string;
  onViewOrder: (orderId: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-natural-bg pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-natural-bg/95 backdrop-blur-sm border-b border-natural-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-natural-text/65 hover:text-natural-text transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-natural-text/40 leading-none">My Orders</p>
            <p className="text-natural-text text-sm font-medium truncate mt-0.5">{contact}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-natural-accent/10 flex items-center justify-center">
            <User className="w-4 h-4 text-natural-accent" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Summary strip */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-natural-text">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Order cards */}
        {orders.map((order) => (
          <motion.button
            key={order._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onViewOrder(order.orderId)}
            className="w-full bg-natural-paper border border-natural-border rounded-2xl p-5 hover:border-natural-accent hover:shadow-md transition-all group text-left"
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono font-bold text-sm text-natural-text tracking-wider">{order.orderId}</p>
                <p className="text-natural-text/45 text-xs mt-0.5">
                  {new Date(order._creationTime).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] ?? "bg-natural-stone/10 text-natural-text/60"}` }>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <ChevronRight className="w-4 h-4 text-natural-text/30 group-hover:text-natural-accent transition-colors" />
              </div>
            </div>

            {/* Items preview */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex -space-x-2">
                {order.items.slice(0, 3).map((item, i) => (
                  <img
                    key={i}
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-9 h-9 rounded-lg object-cover border-2 border-natural-paper"
                  />
                ))}
                {order.items.length > 3 && (
                  <div className="w-9 h-9 rounded-lg bg-natural-muted border-2 border-natural-paper flex items-center justify-center">
                    <span className="text-[10px] font-bold text-natural-text/60">+{order.items.length - 3}</span>
                  </div>
                )}
              </div>
              <p className="text-natural-text/55 text-xs ml-1">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </p>
              <p className="ml-auto text-natural-text font-semibold text-sm">
                ₹{order.total.toLocaleString("en-IN")}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Continue shopping */}
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={goToStorefront}
          className="w-full flex items-center justify-center gap-2 bg-natural-accent text-white rounded-2xl py-4 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
        </button>
      </div>
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
      {/* Sticky nav */}
      <div className="sticky top-0 z-10 bg-natural-bg/95 backdrop-blur-sm border-b border-natural-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-natural-text/65 hover:text-natural-text transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-natural-text/40 leading-none">
              Your Order
            </p>
            <p className="font-mono font-bold text-natural-text text-sm tracking-wider truncate mt-0.5">
              {order.orderId}
            </p>
          </div>
          <span
            className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
              STATUS_COLORS[order.status] ?? "bg-natural-stone/10 text-natural-text/60"
            }`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Timeline */}
        {!isCancelled ? (
          <div className="bg-natural-paper rounded-2xl border border-natural-border p-5">
            <h2 className="font-semibold text-natural-text mb-4 text-xs uppercase tracking-widest">Order Timeline</h2>
            <div className="flex items-start gap-0">
              {TIMELINE_STEPS.map((step, idx) => {
                const done = currentStep >= idx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${done ? "bg-natural-accent border-natural-accent text-white" : "bg-natural-bg border-natural-border text-natural-muted"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className={`text-xs text-center mt-1.5 ${done ? "text-natural-accent font-semibold" : "text-natural-text/45"}`}>
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
            <div>
              <p className="text-red-700 text-sm font-semibold">Order Cancelled</p>
              <p className="text-red-600/75 text-xs mt-0.5">This order has been cancelled and will not be processed.</p>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-natural-paper rounded-2xl border border-natural-border p-5">
            <h2 className="font-semibold text-natural-text mb-4 text-xs uppercase tracking-widest">Items Ordered</h2>
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
                  <p className="text-natural-text/55 text-xs mt-0.5">Qty: {item.qty}</p>
                </div>
                <p className="text-natural-text text-sm font-semibold">₹{(item.price * item.qty).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-natural-border mt-4 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-natural-text/60">Subtotal</span>
              <span className="text-natural-text">₹{order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-natural-text/60">Shipping</span>
              <span className="text-natural-text">{order.shipping === 0 ? "Free" : `₹${order.shipping}`}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-natural-border">
              <span className="text-natural-text">Total</span>
              <span className="text-natural-text">₹{order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Delivery address */}
        <div className="bg-natural-paper rounded-2xl border border-natural-border p-5">
            <h2 className="font-semibold text-natural-text mb-3 text-xs uppercase tracking-widest flex items-center gap-2">
            <MapPin className="w-4 h-4 text-natural-accent" /> Delivery Address
          </h2>
          <p className="text-natural-text text-sm font-medium">{order.customer.name}</p>
          <p className="text-natural-text/75 text-sm mt-1">{order.customer.address.line1}</p>
          {order.customer.address.line2 && (
            <p className="text-natural-text/75 text-sm">{order.customer.address.line2}</p>
          )}
          <p className="text-natural-text/75 text-sm">
            {order.customer.address.city}, {order.customer.address.state} — {order.customer.address.pincode}
          </p>
          {order.customer.phone && (
            <p className="text-natural-text/55 text-xs mt-2">{order.customer.phone}</p>
          )}
        </div>

        {/* Payment */}
        <div className="bg-natural-paper rounded-2xl border border-natural-border p-5 flex items-center justify-between">
          <span className="text-sm text-natural-text/60">Payment</span>
          {order.razorpayPaymentId ? (
            <span className="text-sm font-semibold text-green-600">Paid ✓</span>
          ) : (
            <span className="text-sm font-medium text-natural-text">
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
                    className="flex-1 border border-natural-border py-2 rounded-lg text-sm hover:bg-natural-bg text-natural-text"
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

        {/* Continue shopping CTA */}
        <button
          onClick={goToStorefront}
          className="w-full flex items-center justify-center gap-2 bg-natural-accent text-white rounded-2xl py-4 font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <ShoppingBag className="w-4 h-4" /> Continue Shopping
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
// Public export — orchestrates lookup ↔ my-orders ↔ detail navigation
// ──────────────────────────────────────────────────────────────────────────────
export function OrderPortal({ initialOrderId }: OrderPortalProps) {
  type View = "lookup" | "my-orders" | "order-detail";
  const [view, setView] = useState<View>(initialOrderId ? "order-detail" : "lookup");
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const [contactOrders, setContactOrders] = useState<ContactOrder[]>([]);
  const [contactQuery, setContactQuery] = useState("");
  // Track where order-detail was entered from so Back goes to the right place
  const [detailFrom, setDetailFrom] = useState<"lookup" | "my-orders">("lookup");

  function handleFoundById(id: string) {
    window.history.pushState({}, "", `${window.location.pathname}?page=order-portal&id=${id}`);
    setOrderId(id);
    setDetailFrom("lookup");
    setView("order-detail");
  }

  function handleFoundByContact(orders: ContactOrder[], contact: string) {
    window.history.pushState({}, "", `${window.location.pathname}?page=order-portal&contact=1`);
    setContactOrders(orders);
    setContactQuery(contact);
    setView("my-orders");
  }

  function handleViewOrder(id: string) {
    window.history.pushState({}, "", `${window.location.pathname}?page=order-portal&id=${id}`);
    setOrderId(id);
    setDetailFrom("my-orders");
    setView("order-detail");
  }

  function handleBackFromDetail() {
    if (detailFrom === "my-orders") {
      window.history.pushState({}, "", `${window.location.pathname}?page=order-portal&contact=1`);
      setView("my-orders");
    } else {
      window.history.pushState({}, "", `${window.location.pathname}?page=order-portal`);
      setView("lookup");
    }
  }

  function handleBackFromMyOrders() {
    window.history.pushState({}, "", `${window.location.pathname}?page=order-portal`);
    setView("lookup");
  }

  if (view === "order-detail" && orderId) {
    return <OrderDetail orderId={orderId} onBack={handleBackFromDetail} />;
  }
  if (view === "my-orders") {
    return (
      <MyOrdersScreen
        orders={contactOrders}
        contact={contactQuery}
        onViewOrder={handleViewOrder}
        onBack={handleBackFromMyOrders}
      />
    );
  }
  return <LookupScreen onFound={handleFoundById} onFoundByContact={handleFoundByContact} />;
}
