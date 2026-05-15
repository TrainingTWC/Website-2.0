import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convexApi = api as any;

export type StoryStat = { value: string; label: string };
export type StorySlide = { storageId?: string; url: string };

export interface StoryContent {
  headline: string;
  paragraphs: string[];
  stats: StoryStat[];
  slides: StorySlide[];
}

const DEFAULTS: StoryContent = {
  headline: "From bean to cup, with intention.",
  paragraphs: [
    "Third Wave Coffee was born from a simple belief: everyone deserves a great cup of coffee. We set out to build something special — a coffee experience that focuses on quality, from farm to cup.",
    "We source directly from farms across Ethiopia, Colombia, Guatemala, and India. Every batch is roasted in small lots at our facility in Bangalore, packed within 48 hours, and shipped to your doorstep at peak freshness.",
    "Whether you're a pour-over purist, an espresso devotee, or someone who just wants great coffee without the fuss — we've got you.",
  ],
  stats: [
    { value: "12+", label: "Origins" },
    { value: "48hr", label: "Roast-to-ship" },
    { value: "4.7★", label: "Avg. rating" },
  ],
  slides: [],
};

export function useStoryContent(): StoryContent {
  const entry = useQuery(convexApi.siteContent.get, { key: "story" });
  if (!entry?.value) return DEFAULTS;
  const v = entry.value as Partial<StoryContent>;
  return {
    headline: v.headline?.trim() || DEFAULTS.headline,
    paragraphs: Array.isArray(v.paragraphs) && v.paragraphs.length > 0
      ? v.paragraphs
      : DEFAULTS.paragraphs,
    stats: Array.isArray(v.stats) && v.stats.length > 0
      ? v.stats
      : DEFAULTS.stats,
    slides: Array.isArray(v.slides) ? v.slides : DEFAULTS.slides,
  };
}
