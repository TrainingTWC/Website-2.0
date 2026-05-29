"use client";
import { useState, useEffect, useCallback } from "react";
import { useQuery, useConvex } from "convex/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Tag,
  X,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Ticket,
  Sparkles,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useDiscount, type Discount } from "../context/DiscountContext";

// Cast to any to work before Convex types regenerate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convexApi = api as any;

// ── Reason → friendly message ──────────────────────────────────────────────
function mapReason(reason: string, extra?: Record<string, unknown>): string {
  switch (reason) {
    case "not-found":
      return "This code doesn't exist. Check for typos.";
    case "expired":
      return "This offer has expired.";
    case "max-uses-reached":
      return "This offer has been fully claimed.";
    case "first-order-only":
      return "This code is valid for first-time orders only.";
    case "min-order-not-met":
      return extra?.minOrderValue
        ? `Minimum order of ₹${(extra.minOrderValue as number).toLocaleString("en-IN")} required.`
        : "Minimum order value not met.";
    default:
      return "This code is not valid.";
  }
}

// ── offerKind badge ─────────────────────────────────────────────────────────
const KIND_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  coupon:       { label: "Coupon",      bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200" },
  cashback:     { label: "Cashback",    bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  auto:         { label: "Auto",        bg: "bg-green-50",  text: "text-green-600",  border: "border-green-200" },
  freeShipping: { label: "Free Ship",   bg: "bg-amber-50",  text: "text-amber-600",  border: "border-amber-200" },
};

function OfferKindBadge({ kind }: { kind: string }) {
  const c = KIND_CONFIG[kind] ?? { label: kind, bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${c.bg} ${c.text} ${c.border}`}
    >
      {c.label}
    </span>
  );
}

// ── Types ───────────────────────────────────────────────────────────────────
interface SuggestedOffer {
  _id: string;
  code: string;
  discountType: "percent" | "flat";
  amount: number;
  description?: string;
  minOrderValue?: number;
  maxDiscount?: number;
  offerKind: string;
  firstOrderOnly: boolean;
  eligible: boolean;
  savings: number;
  ineligibleReason?: string;
}

export interface DiscountPanelProps {
  subtotal: number;
  phone: string;
  email: string;
}

// ── DiscountPanel ───────────────────────────────────────────────────────────
export function DiscountPanel({ subtotal, phone, email }: DiscountPanelProps) {
  const { activeDiscount, setActiveDiscount, clearDiscount, computeDiscountedSubtotal } =
    useDiscount();

  const [codeInput, setCodeInput] = useState("");
  const [codeErr, setCodeErr] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const convex = useConvex();

  const hasPhone = /^\d{10}$/.test(phone);
  const hasEmail = email.includes("@") && email.includes(".");

  // ── Live suggestions from the discount engine ─────────────────────────────
  const suggestions: SuggestedOffer[] | undefined = useQuery(
    convexApi.discounts.suggestDiscounts,
    subtotal > 0
      ? {
          cartSubtotal: subtotal,
          customerPhone: hasPhone ? phone : undefined,
          customerEmail: hasEmail ? email : undefined,
        }
      : "skip"
  );

  // Auto-apply the best eligible "auto" offer once, when no discount is active
  useEffect(() => {
    if (activeDiscount || !suggestions) return;
    const autoOffer = suggestions.find((s) => s.offerKind === "auto" && s.eligible);
    if (autoOffer) {
      setActiveDiscount({
        code: autoOffer.code,
        discountType: autoOffer.discountType,
        amount: autoOffer.amount,
        offerKind: autoOffer.offerKind as Discount["offerKind"],
        description: autoOffer.description,
        maxDiscount: autoOffer.maxDiscount,
      });
    }
  // run once when suggestions first arrive
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions]);

  // ── Apply an offer from the suggestion list ───────────────────────────────
  const handleApplyFromList = useCallback(
    (offer: SuggestedOffer) => {
      if (!offer.eligible) return;
      setActiveDiscount({
        code: offer.code,
        discountType: offer.discountType,
        amount: offer.amount,
        offerKind: offer.offerKind as Discount["offerKind"],
        description: offer.description,
        maxDiscount: offer.maxDiscount,
      });
      setCodeErr(null);
    },
    [setActiveDiscount]
  );

  // ── Apply a manually entered code ─────────────────────────────────────────
  const handleApplyCode = async () => {
    const trimmed = codeInput.trim().toUpperCase();
    if (!trimmed) {
      setCodeErr("Please enter a coupon code.");
      return;
    }
    setApplying(true);
    setCodeErr(null);
    try {
      const result = await convex.query(convexApi.discounts.validateDiscount, {
        code: trimmed,
        customerPhone: hasPhone ? phone : undefined,
        customerEmail: hasEmail ? email : undefined,
        cartSubtotal: subtotal,
      });
      if (result.valid) {
        setActiveDiscount({
          code: trimmed,
          discountType: result.discountType,
          amount: result.amount,
          offerKind: result.offerKind ?? "coupon",
          description: result.description,
          maxDiscount: result.maxDiscount,
        });
        setCodeInput("");
      } else {
        setCodeErr(mapReason(result.reason, result));
      }
    } catch (err) {
      setCodeErr(err instanceof Error ? err.message : "This code is not valid.");
    } finally {
      setApplying(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const activeSavings = activeDiscount
    ? subtotal - computeDiscountedSubtotal(subtotal)
    : 0;

  const eligibleOffers =
    suggestions?.filter((s) => s.eligible && s.code !== activeDiscount?.code) ?? [];
  const ineligibleOffers = suggestions?.filter((s) => !s.eligible) ?? [];
  const totalEligible = eligibleOffers.length + (activeDiscount ? 1 : 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-natural-paper border border-natural-border rounded-2xl overflow-hidden">
      {/* ── Collapsible header ── */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-natural-muted/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-natural-accent" />
          <span className="font-serif font-bold text-base text-natural-text">
            Offers &amp; Coupons
          </span>
          {totalEligible > 0 && (
            <span className="bg-natural-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {totalEligible}
            </span>
          )}
          {activeDiscount && (
            <span className="flex items-center gap-1 text-green-600 text-[11px] font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Applied
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-natural-text/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-natural-text/40" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-natural-border pt-4">

              {/* ── Active discount banner ── */}
              {activeDiscount && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-green-700 leading-tight">
                        <span className="font-mono">{activeDiscount.code}</span>
                        {activeDiscount.offerKind === "cashback" && (
                          <span className="ml-1 font-sans font-semibold">— Cashback</span>
                        )}
                        {activeDiscount.offerKind === "auto" && (
                          <span className="ml-1 font-sans font-semibold">— Auto-applied</span>
                        )}
                      </p>
                      {activeSavings > 0 && (
                        <p className="text-xs text-green-600 mt-0.5">
                          You save ₹{Math.round(activeSavings).toLocaleString("en-IN")}
                          {activeDiscount.offerKind === "cashback" ? " as cashback" : ""}
                        </p>
                      )}
                      {activeDiscount.description && (
                        <p className="text-xs text-green-600/70 mt-0.5">{activeDiscount.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearDiscount}
                    className="text-natural-text/40 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
                    aria-label="Remove discount"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ── Loading state ── */}
              {subtotal > 0 && !suggestions && (
                <div className="flex items-center gap-2 text-natural-text/40 text-sm py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Finding best offers…</span>
                </div>
              )}

              {/* ── Eligible offers ── */}
              {eligibleOffers.length > 0 && (
                <div className="space-y-2">
                  {eligibleOffers.map((offer, i) => {
                    const isApplied = activeDiscount?.code === offer.code;
                    return (
                      <OfferCard
                        key={offer._id}
                        offer={offer}
                        isBestDeal={i === 0 && !activeDiscount}
                        isApplied={isApplied}
                        onApply={() => handleApplyFromList(offer)}
                        onRemove={clearDiscount}
                      />
                    );
                  })}
                </div>
              )}

              {/* ── Ineligible offers (grayed out, shows unlock hint) ── */}
              {ineligibleOffers.length > 0 && (
                <div className="space-y-2">
                  {ineligibleOffers.map((offer) => (
                    <IneligibleOfferCard key={offer._id} offer={offer} />
                  ))}
                </div>
              )}

              {/* ── No offers at all ── */}
              {suggestions && suggestions.length === 0 && (
                <p className="text-xs text-natural-text/40 py-1">
                  No active offers right now.
                </p>
              )}

              {/* ── Manual code input ── */}
              <div className="pt-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-natural-text/40 mb-2">
                  Have a different code?
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value.toUpperCase());
                      setCodeErr(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleApplyCode();
                      }
                    }}
                    placeholder="ENTER CODE"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="flex-1 bg-natural-bg border border-natural-border rounded-xl px-3 py-2.5 text-sm font-mono uppercase text-natural-text placeholder:text-natural-text/25 focus:outline-none focus:ring-2 focus:ring-natural-accent/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyCode()}
                    disabled={applying || !codeInput.trim()}
                    className="px-4 py-2.5 bg-natural-text text-white rounded-xl text-sm font-bold hover:bg-natural-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                  >
                    {applying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Tag className="w-3.5 h-3.5" />
                    )}
                    Apply
                  </button>
                </div>
                {codeErr && (
                  <p className="mt-1.5 text-[11px] text-red-500 font-medium">{codeErr}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Eligible offer card ─────────────────────────────────────────────────────
function OfferCard({
  offer,
  isBestDeal,
  isApplied,
  onApply,
  onRemove,
}: {
  offer: SuggestedOffer;
  isBestDeal: boolean;
  isApplied: boolean;
  onApply: () => void;
  onRemove: () => void;
}) {
  const displayDesc =
    offer.description ||
    (offer.discountType === "percent"
      ? `${offer.amount}% off${offer.maxDiscount ? ` (up to ₹${offer.maxDiscount.toLocaleString("en-IN")})` : ""}${offer.minOrderValue ? ` on orders above ₹${offer.minOrderValue.toLocaleString("en-IN")}` : ""}`
      : `₹${offer.amount.toLocaleString("en-IN")} off${offer.minOrderValue ? ` on orders above ₹${offer.minOrderValue.toLocaleString("en-IN")}` : ""}`);

  return (
    <div
      className={`border rounded-xl p-3.5 transition-all ${
        isApplied
          ? "border-green-300 bg-green-50"
          : "border-natural-border bg-natural-bg hover:border-natural-accent/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="font-mono text-sm font-bold text-natural-text">{offer.code}</span>
            <OfferKindBadge kind={offer.offerKind} />
            {offer.firstOrderOnly && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-yellow-50 text-yellow-600 border border-yellow-200">
                1st Order
              </span>
            )}
            {isBestDeal && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-natural-accent/10 text-natural-accent border border-natural-accent/20">
                <Sparkles className="w-2.5 h-2.5" />
                Best Deal
              </span>
            )}
          </div>
          <p className="text-xs text-natural-text/60 leading-relaxed mb-1">{displayDesc}</p>
          {offer.savings > 0 && (
            <p className="text-xs font-semibold text-green-600">
              {offer.offerKind === "cashback" ? "Cashback " : "Save "}
              ₹{Math.round(offer.savings).toLocaleString("en-IN")}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={isApplied ? onRemove : onApply}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isApplied
              ? "bg-green-600 text-white hover:bg-red-500"
              : "bg-natural-text text-white hover:bg-natural-accent"
          }`}
        >
          {isApplied ? "✓ Applied" : "Apply"}
        </button>
      </div>
    </div>
  );
}

// ── Ineligible offer card (locked / grayed out) ─────────────────────────────
function IneligibleOfferCard({ offer }: { offer: SuggestedOffer }) {
  const displayDesc =
    offer.description ||
    (offer.discountType === "percent"
      ? `${offer.amount}% off${offer.maxDiscount ? ` (up to ₹${offer.maxDiscount.toLocaleString("en-IN")})` : ""}`
      : `₹${offer.amount.toLocaleString("en-IN")} off`);

  return (
    <div className="border border-natural-border rounded-xl p-3.5 opacity-55">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="font-mono text-sm font-bold text-natural-text/70">{offer.code}</span>
            <OfferKindBadge kind={offer.offerKind} />
          </div>
          <p className="text-xs text-natural-text/50 leading-relaxed mb-1">{displayDesc}</p>
          {offer.ineligibleReason && (
            <p className="text-[11px] text-amber-600/90 font-medium">{offer.ineligibleReason}</p>
          )}
        </div>
      </div>
    </div>
  );
}
