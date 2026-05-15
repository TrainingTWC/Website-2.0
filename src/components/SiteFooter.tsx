import { Info, Heart } from "lucide-react";
import { asset } from "../lib/asset";

interface SiteFooterProps {
  onNavigate: (target: string) => void;
  onScrollTo?: (id: string) => void;
}

/**
 * Shared site footer — rendered on every customer-facing route
 * (storefront, shop, product, checkout, order portal, order confirmation).
 * Intentionally NOT rendered on the Third Intelligence (TI) full-screen route.
 */
export function SiteFooter({ onNavigate, onScrollTo }: SiteFooterProps) {
  const scroll = (id: string) => {
    if (onScrollTo) onScrollTo(id);
    else {
      // If we're not on a page that has these sections, route home and let the
      // hash do the work after navigation.
      onNavigate("home");
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      });
    }
  };

  return (
    <footer
      className="py-16 border-t border-natural-border bg-natural-paper"
      id="footer"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-2">
              <img src={asset("logo.png")} alt="Third Wave Coffee" className="h-8 w-auto" />
            </div>
            <p className="text-natural-text/50 text-sm leading-relaxed">
              India's finest specialty coffee. We source, roast, and deliver premium beans to your doorstep.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:flex sm:gap-16 text-sm">
            <div className="space-y-4">
              <h4 className="font-bold uppercase tracking-widest text-[10px] text-natural-text/40">Shop</h4>
              <div className="flex flex-col gap-2.5 text-natural-text/60 font-medium">
                <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => scroll("section-coffee-beans")}>Coffee Beans</span>
                <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => scroll("section-coffee-ecb")}>Easy Coffee Bags</span>
                <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => scroll("section-merch-drinkware")}>Drinkware</span>
                <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => scroll("section-merch-keychains")}>Keychains</span>
                <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => onNavigate("order-portal")}>Track your order</span>
                <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => onNavigate("shop")}>Shop All</span>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold uppercase tracking-widest text-[10px] text-natural-text/40">Company</h4>
              <div className="flex flex-col gap-2.5 text-natural-text/60 font-medium">
                <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => scroll("our-story")}>Our Story</span>
                <span className="cursor-pointer hover:text-natural-accent transition-colors" onClick={() => onNavigate("editorial")}>Journal</span>
                <span className="cursor-pointer hover:text-natural-accent transition-colors">Contact</span>
                <span className="cursor-pointer hover:text-natural-accent transition-colors">Careers</span>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold uppercase tracking-widest text-[10px] text-natural-text/40">Legal</h4>
              <div className="flex flex-col gap-2.5 text-natural-text/60 font-medium">
                <span className="cursor-pointer hover:text-natural-accent transition-colors">Privacy Policy</span>
                <span className="cursor-pointer hover:text-natural-accent transition-colors">Terms of Service</span>
                <span className="cursor-pointer hover:text-natural-accent transition-colors">Shipping Policy</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-natural-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-natural-text/40 text-xs">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" /> © 2026 Third Wave Coffee. All rights reserved.
          </span>
          <span className="flex items-center gap-1">
            Made with <Heart className="w-3 h-3 fill-red-400 text-red-400" /> in India
          </span>
        </div>
      </div>
    </footer>
  );
}
