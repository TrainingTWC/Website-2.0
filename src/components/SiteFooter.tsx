"use client";
import { Info, Heart, Instagram, Mail, MapPin, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { asset } from "../lib/asset";
import { hrefForNavTarget } from "../lib/navigation";

interface SiteFooterProps {
  /** When provided, used for in-page anchor jumps (home only). Falls back to router push. */
  onNavigate?: (target: string) => void;
  /** Explicit anchor scroll handler (home only). */
  onScrollTo?: (id: string) => void;
}

type Col = {
  heading: string;
  links: {
    label: string;
    /** Either a section id (anchors home), an internal route ("/about/..."), or "mailto:" / "https://". */
    target: string;
    /** If true and target is a section id, dispatches via onScrollTo (only useful on home). */
    anchor?: boolean;
  }[];
};

const COLUMNS: Col[] = [
  {
    heading: "Shop",
    links: [
      { label: "Coffee Beans",       target: "section-coffee-beans",   anchor: true },
      { label: "Easy Coffee Bags",   target: "section-coffee-ecb",     anchor: true },
      { label: "Drinkware",          target: "section-merch-drinkware", anchor: true },
      { label: "Keychains",          target: "section-merch-keychains", anchor: true },
      { label: "Shop All",           target: "/shop" },
      { label: "Track your order",   target: "/orders" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Our Story",   target: "/about/our-story" },
      { label: "Our Coffee",  target: "/about/our-coffee" },
      { label: "Careers",     target: "/about/careers" },
      { label: "Newsroom",    target: "/about/newsroom" },
      { label: "Third Circle", target: "/third-circle" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact",          target: "mailto:hello@thirdwavecoffee.in" },
      { label: "FAQ",              target: "/about/newsroom" },
      { label: "Shipping & Returns", target: "/about/newsroom" },
      { label: "Privacy Policy",   target: "/about/newsroom" },
      { label: "Terms of Service", target: "/about/newsroom" },
    ],
  },
];

export function SiteFooter({ onNavigate, onScrollTo }: SiteFooterProps) {
  const router = useRouter();

  const handle = (target: string, anchor?: boolean) => {
    if (target.startsWith("mailto:") || target.startsWith("https://") || target.startsWith("http://")) {
      window.location.href = target;
      return;
    }
    if (anchor && onScrollTo) {
      onScrollTo(target);
      return;
    }
    if (onNavigate) {
      onNavigate(target);
      return;
    }
    router.push(hrefForNavTarget(target));
  };

  return (
    <footer
      className="relative pt-20 pb-10 border-t border-natural-border bg-natural-paper overflow-hidden"
      id="footer"
    >
      {/* subtle topline glow */}
      <span
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(168,118,68,0.45) 50%, transparent 100%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-14">
          {/* Brand block */}
          <div className="md:col-span-4 space-y-5">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 group"
              aria-label="Third Wave Coffee — home"
            >
              <img
                src={asset("logo.png")}
                alt="Third Wave Coffee"
                className="h-9 w-auto transition-transform group-hover:scale-105"
              />
            </button>
            <p className="text-natural-text/55 text-sm leading-relaxed max-w-xs">
              India's finest specialty coffee. We source, roast, and deliver premium beans to your doorstep.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://instagram.com/thirdwavecoffeeroasters"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid place-items-center w-9 h-9 rounded-full border border-natural-border text-natural-text/60 hover:text-natural-accent hover:border-natural-accent/40 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:hello@thirdwavecoffee.in"
                aria-label="Email"
                className="grid place-items-center w-9 h-9 rounded-full border border-natural-border text-natural-text/60 hover:text-natural-accent hover:border-natural-accent/40 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-natural-text/45 ml-1">
                <MapPin className="w-3 h-3" /> Bengaluru, India
              </span>
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {COLUMNS.map((col) => (
              <div key={col.heading} className="space-y-4">
                <h4 className="font-bold uppercase tracking-[0.18em] text-[10px] text-natural-text/40">
                  {col.heading}
                </h4>
                <ul className="flex flex-col gap-2.5 text-sm text-natural-text/65 font-medium">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <button
                        onClick={() => handle(l.target, l.anchor)}
                        className="text-left hover:text-natural-accent transition-colors"
                      >
                        {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-natural-border pt-7 flex flex-col md:flex-row justify-between items-center gap-3 text-natural-text/40 text-xs">
          <span className="flex items-center gap-1.5">
            <Info className="w-3 h-3" /> © {new Date().getFullYear()} Third Wave Coffee. All rights reserved.
          </span>
          <a
            href="/admin"
            className="flex items-center gap-1 opacity-40 hover:opacity-70 transition-opacity"
            title="Staff login"
          >
            <Lock className="w-3 h-3" />
            <span>Staff</span>
          </a>
          <span className="flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 fill-red-400 text-red-400" /> in India
          </span>
        </div>
      </div>
    </footer>
  );
}
