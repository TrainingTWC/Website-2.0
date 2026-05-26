import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { asset } from "./asset";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convexApi = api as any;

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface AboutHero {
  eyebrow: string;
  title: string;
  tagline: string;
  imageUrl: string;
  accentWord?: string;
  stickerText?: string;
}

export interface Founder {
  name: string;
  role: string;
  image: string;
  bio: string;
  quote: string;
  note: string;
}

export interface CoffeeRegion {
  name: string;
  elevation: string;
  varietals: string;
  harvest: string;
  profile: string;
  estates: string;
  image: string;
}

export interface CareerRole {
  title: string;
  team: string;
  location: string;
  salary: string;
  experience: string;
  posted: string;
}

export interface CareerBenefit {
  iconKey: string; // maps to lucide icon (Heart, Brain, Palmtree, BookOpen, Coffee, Globe, Sparkles, Shield, Star, Gift)
  title: string;
  detail: string;
  color: string;
  iconColor: string;
}

export interface CoffeeSchoolCard {
  number: string;
  title: string;
  description: string;
}

export interface CoffeeSchool {
  eyebrow: string;
  headline: string;
  tagline: string;
  cards: CoffeeSchoolCard[];
}

export interface OrientationModule {
  eyebrow: string;
  intro: string;
  title: string;
  description: string;
  durationLabel: string;
  /** Full URL to the training content. Empty string = use local /scorm/player.html */
  launchUrl: string;
}

export interface CareerStat {
  value: string;
  label: string;
}

export interface CareerStory {
  name: string;
  role: string;
  image: string;
  from: string;
  to: string;
  quote: string;
}

export interface PressItem {
  outlet: string;
  date: string;
  headline: string;
  excerpt: string;
  category: "Feature" | "Interview" | "Award" | "Industry";
  readTime: string;
  imageUrl: string;
  href: string;
}

export interface FactItem {
  label: string;
  value: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Defaults — current hardcoded content acts as fallback so site is unchanged
// when no CMS overrides exist.
// ────────────────────────────────────────────────────────────────────────────

const DEFAULT_STORY_HERO: AboutHero = {
  eyebrow: "Our Story",
  title: "A small Bengaluru roastery, ten years on.",
  tagline:
    "Made by people who care about the cup, the farm, and the person drinking it on a half-awake Tuesday.",
  imageUrl: asset("assets/our-story.png"),
  accentWord: "Bengaluru",
  stickerText: "EST. 2016",
};

const DEFAULT_FOUNDERS: Founder[] = [
  {
    name: "Sushant Goel",
    role: "Co-founder",
    image: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-14.jpg"),
    bio: "Sushant grew up around South Indian filter coffee in a household where the morning cup was non-negotiable. After Wharton and a stint in consumer investing, he came home convinced India deserved fresh, traceable coffee — not warehouse beans dressed up in nice bags.",
    quote:
      "We did not start a cafe chain. We started a roastery that opened cafes so people could taste what fresh actually means.",
    note: "now reading: The Monk of Mokha",
  },
  {
    name: "Anirudh Sharma",
    role: "Co-founder",
    image: asset("assets/our-story.png"),
    bio: "Anirudh runs the parts of the business that do not make it into the brand film — the logistics, the cafe playbook, the unglamorous spreadsheets that decide whether a 130-cafe network can still ship a bag roasted on Monday.",
    quote:
      "The romantic version is that we started with a dream. The honest version is that we started with a spreadsheet, a tiny roaster, and very little patience for stale coffee.",
    note: "now listening: Peter Cat Recording Co.",
  },
  {
    name: "Ayush Bathwal",
    role: "Co-founder",
    image: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-09.jpg"),
    bio: "Ayush leads sourcing, partnerships, and the slow work of turning estate relationships into seasonal pricing contracts. If a bag carries a farm name on its back, he probably knows the person who grew it.",
    quote:
      "Fourteen estates, fourteen relationships. None of them survive on price alone. They survive because we keep showing up the year after a bad monsoon.",
    note: "now drinking: Attikan washed lot 04",
  },
  {
    name: "Rajat Luthra",
    role: "Chief Executive Officer",
    image: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"),
    bio: "Rajat joined as CEO in late 2023 after years building consumer brands at scale. He runs the next chapter — more cafes, a second roastery, and a training school built so a barista in Indore tastes the same espresso a barista in Bandra pulls.",
    quote: "Growth is the easy part. Growing without losing the cup is the actual job.",
    note: "now obsessing over: dispatch SLAs",
  },
];

const DEFAULT_COFFEE_HERO: AboutHero = {
  eyebrow: "Our Coffee",
  title: "From bean to cup, with intention.",
  tagline: "Single-origin lots, small batches, and roast dates we are proud to print.",
  imageUrl: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"),
  accentWord: "intention",
  stickerText: "SCA 80+",
};

const DEFAULT_REGIONS: CoffeeRegion[] = [
  {
    name: "Chikmagalur",
    elevation: "1,000-1,500 m",
    varietals: "Arabica-heavy, SLN 795, Selection 9",
    harvest: "Nov-Feb",
    profile:
      "Citrus, cocoa, and a clean sweetness that works for people coming from both filter coffee and cafe lattes.",
    estates: "6 partner estates",
    image: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"),
  },
  {
    name: "Coorg / Kodagu",
    elevation: "900-1,200 m",
    varietals: "Arabica + shade-grown Robusta",
    harvest: "Dec-Mar",
    profile:
      "Deep body, spice, and nutty sweetness. The region that makes a French Press feel like a hug without turning muddy.",
    estates: "3 partner estates",
    image: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"),
  },
  {
    name: "Wayanad",
    elevation: "700-1,000 m",
    varietals: "Robusta-dominant",
    harvest: "Dec-Feb",
    profile:
      "Full-bodied, low-acid, and quietly powerful. Good Robusta is not a shortcut. Bad Robusta gave it a bad reputation.",
    estates: "2 partner estates",
    image: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"),
  },
  {
    name: "Araku Valley",
    elevation: "900-1,100 m",
    varietals: "Arabica, tribal cooperative lots",
    harvest: "Jan-Mar",
    profile:
      "Bright, floral, and easy to over-roast if you are impatient. We keep this one light and let it talk.",
    estates: "1 partner cooperative",
    image: asset("assets/SSIFB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-17.jpg"),
  },
];

const DEFAULT_CAREERS_HERO: AboutHero = {
  eyebrow: "Careers",
  title: "Make great coffee. Get paid.",
  tagline:
    "Real craft. Real growth. The best coffee education in the country — built into the job, from day one.",
  imageUrl: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"),
  accentWord: "great coffee",
  stickerText: "WE'RE HIRING",
};

const DEFAULT_ROLES: CareerRole[] = [
  { title: "Barista", team: "Cafe Operations", location: "Bengaluru · Multiple Locations", salary: "Rs 3.6–4.5L", experience: "0–2 yrs", posted: "2 days ago" },
  { title: "Cafe Manager", team: "Cafe Operations", location: "Mumbai · Bandra Flagship", salary: "Rs 8–11L", experience: "3–5 yrs", posted: "5 days ago" },
  { title: "Head Roaster", team: "Roastery", location: "Bengaluru · Whitefield", salary: "Rs 20–28L", experience: "7+ yrs", posted: "8 days ago" },
  { title: "Coffee Educator", team: "Coffee Education", location: "Delhi · Hauz Khas", salary: "Rs 8–12L", experience: "3–5 yrs", posted: "3 days ago" },
  { title: "Senior Frontend Engineer", team: "Technology", location: "Remote · India", salary: "Rs 32–42L", experience: "5+ yrs", posted: "6 days ago" },
  { title: "Origin & Trade Lead", team: "Supply Chain", location: "Chikmagalur · Field", salary: "Rs 22–32L", experience: "8+ yrs", posted: "12 days ago" },
];

const DEFAULT_BENEFITS: CareerBenefit[] = [
  { iconKey: "Heart", title: "Health cover", detail: "You + family. Same plan, barista to exec.", color: "bg-rose-50 border-rose-200", iconColor: "text-rose-500" },
  { iconKey: "Brain", title: "Mental health", detail: "Confidential sessions. No manager approval.", color: "bg-violet-50 border-violet-200", iconColor: "text-violet-500" },
  { iconKey: "Palmtree", title: "30 real days off", detail: "No fake unlimited. Actual 30 days.", color: "bg-sky-50 border-sky-200", iconColor: "text-sky-500" },
  { iconKey: "BookOpen", title: "Rs 50k/year to learn", detail: "Courses, books, certs, conferences.", color: "bg-amber-50 border-amber-200", iconColor: "text-amber-600" },
  { iconKey: "Coffee", title: "Free beans forever", detail: "Two bags a month + cafe meals on shift.", color: "bg-orange-50 border-orange-200", iconColor: "text-orange-500" },
  { iconKey: "Globe", title: "Sabbatical", detail: "Eligible every 5 years. Paid time to think.", color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-500" },
];

const DEFAULT_COFFEE_SCHOOL: CoffeeSchool = {
  eyebrow: "Before day one",
  headline: "3 paid\nweeks.",
  tagline: "Origins. Roasting. Extraction. Service. You get paid the whole time. Rs 0 cost to you.",
  cards: [
    { number: "01", title: "Origins & farm", description: "Where beans come from, why it matters, how to talk about it." },
    { number: "02", title: "Roast & grind", description: "Heat curves, extraction, what makes espresso go wrong." },
    { number: "03", title: "Service & team", description: "Hospitality as a skill, not a personality type." },
  ],
};

const DEFAULT_ORIENTATION: OrientationModule = {
  eyebrow: "Before you apply",
  intro: "We made a 20-min orientation anyone can take — no account, no email, no catch. Curious? Take it. Ready to apply? Take it first.",
  title: "Company Orientation",
  description: "Our sourcing philosophy, cafe standards, feedback culture, training programme, and what a genuinely good cup costs to make.",
  durationLabel: "~20 min",
  launchUrl: "",
};

const DEFAULT_CAREERS_MARQUEE: string[] = [
  "NO EXPERIENCE NEEDED",
  "DAY 1 PAID TRAINING",
  "FREE BEANS FOREVER",
  "GROW FAST",
  "130+ CAFES",
  "JOIN THE TEAM",
];

const DEFAULT_CAREERS_STATS: CareerStat[] = [
  { value: "Rs 3.6L+", label: "starting pay" },
  { value: "Day 1",    label: "training on salary" },
  { value: "3 weeks",  label: "paid coffee school" },
  { value: "130+",     label: "cafes to grow into" },
];

const DEFAULT_STORIES: CareerStory[] = [
  { name: "Meera D’Souza", role: "Regional Trainer", image: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-14.jpg"), from: "Barista, 2022", to: "Trains 80 people, 2026", quote: "I joined thinking coffee was a job. Three years later I train 80 people." },
  { name: "Aarav Menon", role: "Head of Roasting", image: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"), from: "Apprentice, 2021", to: "Runs Mumbai roastery, 2025", quote: "I was hired to clean machines. Now I own the roast profile." },
  { name: "Kabir Sethi", role: "Senior Engineer", image: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"), from: "Intern, 2023", to: "Senior Engineer, 2025", quote: "Three weeks on the cafe floor taught me more about UX than any course." },
];

const DEFAULT_NEWSROOM_HERO: AboutHero = {
  eyebrow: "Newsroom",
  title: "In the news, in our own words.",
  tagline: "Press, awards, talks, and the press kit if you need it.",
  imageUrl: asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg"),
  accentWord: "our own words",
  stickerText: "PRESS",
};

const DEFAULT_PRESS: PressItem[] = [
  { outlet: "Economic Times", date: "Feb 2026", headline: "How Third Wave's CEO is taking a Bengaluru roastery national", excerpt: "Rajat Luthra on scaling cafes without breaking the roast-to-dispatch promise.", category: "Interview", readTime: "7 min", imageUrl: asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg"), href: "#" },
  { outlet: "Mint Lounge", date: "Nov 2025", headline: "Inside the Bengaluru roastery that ships fresh beans across India", excerpt: "A long-read on the 48-hour roast-to-dispatch operation and the cupping protocol.", category: "Feature", readTime: "9 min", imageUrl: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"), href: "#" },
  { outlet: "Forbes India", date: "Apr 2025", headline: "30 Under 30: The founders redefining Indian cafe culture", excerpt: "Co-founders Sushant Goel, Anirudh Sharma, and Ayush Bathwal featured under Food & Beverage.", category: "Award", readTime: "5 min", imageUrl: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"), href: "#" },
  { outlet: "The Hindu", date: "Nov 2024", headline: "How a 28% premium to farmers is changing Chikmagalur", excerpt: "A field report on long-term estate partnerships and transparent pricing.", category: "Feature", readTime: "8 min", imageUrl: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"), href: "#" },
];

const DEFAULT_FACTS: FactItem[] = [
  { label: "Founded", value: "2016, Bengaluru" },
  { label: "Founders", value: "Sushant Goel, Anirudh Sharma, Ayush Bathwal" },
  { label: "CEO", value: "Rajat Luthra (since 2023)" },
  { label: "Cafes", value: "130+ across 18 cities · 14 partner estates" },
  { label: "Latest round", value: "Series B, Rs 120 cr, Jan 2025" },
  { label: "Press contact", value: "press@brewmatch.in" },
];

// ────────────────────────────────────────────────────────────────────────────
// Helper: merge override over default
// ────────────────────────────────────────────────────────────────────────────

function useContentValue<T>(key: string, fallback: T): T {
  const entry = useQuery(convexApi.siteContent.get, { key }) as
    | { value: unknown }
    | null
    | undefined;
  if (!entry || !entry.value) return fallback;
  return entry.value as T;
}

function useHeroValue(key: string, fallback: AboutHero): AboutHero {
  const v = useContentValue<Partial<AboutHero> | null>(key, null as never);
  if (!v) return fallback;
  return {
    eyebrow: v.eyebrow ?? fallback.eyebrow,
    title: v.title ?? fallback.title,
    tagline: v.tagline ?? fallback.tagline,
    imageUrl: v.imageUrl ?? fallback.imageUrl,
    accentWord: v.accentWord ?? fallback.accentWord,
    stickerText: v.stickerText ?? fallback.stickerText,
  };
}

function useListValue<T>(key: string, fallback: T[]): T[] {
  const v = useContentValue<{ items?: T[] } | null>(key, null as never);
  if (!v || !Array.isArray(v.items) || v.items.length === 0) return fallback;
  return v.items;
}

// ────────────────────────────────────────────────────────────────────────────
// Public hooks (per section)
// ────────────────────────────────────────────────────────────────────────────

// Our Story
export function useStoryHero() {
  return useHeroValue("about.story.hero", DEFAULT_STORY_HERO);
}
export function useFounders(): Founder[] {
  return useListValue<Founder>("about.story.founders", DEFAULT_FOUNDERS);
}

// Our Coffee
export function useCoffeeHero() {
  return useHeroValue("about.coffee.hero", DEFAULT_COFFEE_HERO);
}
export function useCoffeeRegions(): CoffeeRegion[] {
  return useListValue<CoffeeRegion>("about.coffee.regions", DEFAULT_REGIONS);
}

// Careers
export function useCareersHero() {
  return useHeroValue("about.careers.hero", DEFAULT_CAREERS_HERO);
}
export function useCareerRoles(): CareerRole[] {
  return useListValue<CareerRole>("about.careers.roles", DEFAULT_ROLES);
}
export function useCareerBenefits(): CareerBenefit[] {
  return useListValue<CareerBenefit>("about.careers.benefits", DEFAULT_BENEFITS);
}
export function useCareerStories(): CareerStory[] {
  return useListValue<CareerStory>("about.careers.stories", DEFAULT_STORIES);
}
export function useCoffeeSchool(): CoffeeSchool {
  return useContentValue<CoffeeSchool>("about.careers.coffeeSchool", DEFAULT_COFFEE_SCHOOL);
}
export function useOrientationModule(): OrientationModule {
  return useContentValue<OrientationModule>("about.careers.orientation", DEFAULT_ORIENTATION);
}
export function useCareerMarquee(): string[] {
  return useListValue<string>("about.careers.marquee", DEFAULT_CAREERS_MARQUEE);
}

export function useCareerMarqueeSpeed(): number {
  return useContentValue<number>("about.careers.marqueeSpeed", 28);
}
export function useCareerStats(): CareerStat[] {
  return useListValue<CareerStat>("about.careers.stats", DEFAULT_CAREERS_STATS);
}

export function useApplyLink(): string {
  return useContentValue<string>("about.careers.applyLink", "mailto:careers@brewmatch.in");
}

// Newsroom
export function useNewsroomHero() {
  return useHeroValue("about.newsroom.hero", DEFAULT_NEWSROOM_HERO);
}
export function usePressItems(): PressItem[] {
  return useListValue<PressItem>("about.newsroom.press", DEFAULT_PRESS);
}
export function useNewsroomFacts(): FactItem[] {
  return useListValue<FactItem>("about.newsroom.facts", DEFAULT_FACTS);
}

// Defaults exported for the CMS to render initial form state
export const AboutDefaults = {
  storyHero: DEFAULT_STORY_HERO,
  founders: DEFAULT_FOUNDERS,
  coffeeHero: DEFAULT_COFFEE_HERO,
  regions: DEFAULT_REGIONS,
  careersHero: DEFAULT_CAREERS_HERO,
  roles: DEFAULT_ROLES,
  benefits: DEFAULT_BENEFITS,
  stories: DEFAULT_STORIES,
  careersMarquee: DEFAULT_CAREERS_MARQUEE,
  careersStats: DEFAULT_CAREERS_STATS,
  applyLink: "mailto:careers@brewmatch.in",
  coffeeSchool: DEFAULT_COFFEE_SCHOOL,
  orientation: DEFAULT_ORIENTATION,
  newsroomHero: DEFAULT_NEWSROOM_HERO,
  press: DEFAULT_PRESS,
  facts: DEFAULT_FACTS,
};

// Map iconKey → lucide name for the CMS picker
export const BENEFIT_ICON_OPTIONS = [
  "Heart",
  "Brain",
  "Palmtree",
  "BookOpen",
  "Coffee",
  "Globe",
  "Sparkles",
  "Shield",
  "Star",
  "Gift",
  "Sun",
  "Award",
  "Briefcase",
  "GraduationCap",
] as const;
