import type { BannerSlide } from "../lib/useSiteContent";

/**
 * Data-driven banner — renders one CMS-managed slide.
 * Used inside BannerSlideshow on the homepage hero.
 */
export function DataBanner({ slide }: { slide: BannerSlide }) {
  const from = slide.gradientFrom || "#1a1a1a";
  const to = slide.gradientTo || "#000000";
  const opacity = typeof slide.gradientOpacity === "number" ? slide.gradientOpacity : 0.6;
  const overlay = `linear-gradient(90deg, ${hexA(from, opacity)} 0%, ${hexA(from, opacity * 0.6)} 45%, ${hexA(to, opacity * 0.55)} 100%)`;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {slide.imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.imageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: from }} />
      )}
      <div className="absolute inset-0" style={{ background: overlay }} />

      <div className="relative z-10 h-full flex flex-col justify-center px-8 sm:px-14 text-white">
        {slide.partner && (
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.45em] uppercase text-amber-100/90 mb-4">
            {slide.partner}
          </p>
        )}
        <h3 className="font-serif font-black leading-[0.9] tracking-tight text-[clamp(2.2rem,7vw,6rem)]">
          {slide.headline}
          {slide.headlineItalic && (
            <>
              <br />
              <span className="italic text-amber-100">{slide.headlineItalic}</span>
            </>
          )}
        </h3>
        {slide.subhead && (
          <p className="mt-5 text-base sm:text-xl font-light tracking-wide text-white/90 max-w-xl">
            {slide.subhead}
          </p>
        )}
        {slide.tagline && (
          <div className="mt-6 inline-flex w-fit items-center gap-3 px-5 py-2.5 rounded-full border border-white/40 backdrop-blur-sm">
            <span className="text-[10px] font-bold tracking-[0.35em] uppercase">
              {slide.tagline}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Hex (#rrggbb) + alpha 0..1 → rgba()
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(0,0,0,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
