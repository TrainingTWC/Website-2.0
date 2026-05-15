import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convexApi = api as any;

// ─── Types ──────────────────────────────────────────────────────────────────
export interface BannerSlide {
  storageId?: string;
  imageUrl: string;
  partner?: string;     // "THIRD WAVE × Schweppes"
  headline: string;     // "FIND YOUR FIZZ."
  headlineItalic?: string; // optional italicized last word(s)
  subhead?: string;     // "Espresso Tonics have arrived."
  tagline?: string;     // "In stores now"
  // Gradient overlay (two hex colors)
  gradientFrom?: string;  // "#1a3a8a"
  gradientTo?: string;    // "#ff6fa4"
  gradientOpacity?: number; // 0..1, default 0.6
}

export interface HeroContent {
  eyebrow: string;
  wordmarkLine1: string;
  wordmarkLine2: string;
}

export interface SectionHeading {
  eyebrow: string;
  title: string;
}

export interface SectionsContent {
  catalogBanner: SectionHeading;
  categories: SectionHeading;
}

// ─── Defaults ───────────────────────────────────────────────────────────────
const DEFAULT_HERO: HeroContent = {
  eyebrow: "A daily ritual · est. 2016",
  wordmarkLine1: "THIRD WAVE",
  wordmarkLine2: "coffee.",
};

const DEFAULT_SECTIONS: SectionsContent = {
  catalogBanner: {
    eyebrow: "The full library",
    title: "Browse the catalog.",
  },
  categories: {
    eyebrow: "Shop the catalog",
    title: "Pick your aisle.",
  },
};

const DEFAULT_BANNERS: BannerSlide[] = [];

// ─── Hooks ──────────────────────────────────────────────────────────────────
export function useBannerSlides(): BannerSlide[] {
  const entry = useQuery(convexApi.siteContent.get, { key: "banner.slides" });
  if (!entry?.value) return DEFAULT_BANNERS;
  const v = entry.value as { slides?: BannerSlide[] };
  return Array.isArray(v.slides) ? v.slides : DEFAULT_BANNERS;
}

export function useHeroContent(): HeroContent {
  const entry = useQuery(convexApi.siteContent.get, { key: "hero" });
  if (!entry?.value) return DEFAULT_HERO;
  const v = entry.value as Partial<HeroContent>;
  return {
    eyebrow: v.eyebrow?.trim() || DEFAULT_HERO.eyebrow,
    wordmarkLine1: v.wordmarkLine1?.trim() || DEFAULT_HERO.wordmarkLine1,
    wordmarkLine2: v.wordmarkLine2?.trim() || DEFAULT_HERO.wordmarkLine2,
  };
}

export function useSectionsContent(): SectionsContent {
  const entry = useQuery(convexApi.siteContent.get, { key: "sections" });
  if (!entry?.value) return DEFAULT_SECTIONS;
  const v = entry.value as Partial<SectionsContent>;
  return {
    catalogBanner: {
      eyebrow: v.catalogBanner?.eyebrow?.trim() || DEFAULT_SECTIONS.catalogBanner.eyebrow,
      title: v.catalogBanner?.title?.trim() || DEFAULT_SECTIONS.catalogBanner.title,
    },
    categories: {
      eyebrow: v.categories?.eyebrow?.trim() || DEFAULT_SECTIONS.categories.eyebrow,
      title: v.categories?.title?.trim() || DEFAULT_SECTIONS.categories.title,
    },
  };
}

export { DEFAULT_HERO, DEFAULT_SECTIONS };
