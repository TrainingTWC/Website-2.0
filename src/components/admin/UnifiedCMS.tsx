"use client";
/**
 * UnifiedCMS — single CMS surface for every editable page.
 *
 * Top-level tabs: Home | Third Circle | Our Story | Our Coffee | Careers | Newsroom
 *
 * Each tab embeds the dedicated editor:
 *   - HomeContentCMS  (hero, banners, scroll chapters)
 *   - EditorialCMS    (Third Circle posts)
 *   - AboutCMS        (4 about pages, with the inner page-tab strip hidden via `page` prop)
 *
 * Replaces the older split where "Home CMS" and "About Pages" were separate
 * nav items. One control surface, no hunting.
 */
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const convexApi = api as any;
import {
  Home as HomeIcon,
  Newspaper,
  BookOpen,
  Coffee,
  Briefcase,
  Megaphone,
} from "lucide-react";
import { HomeContentCMS } from "./HomeContentCMS";
import { EditorialCMS } from "./EditorialCMS";
import { AboutCMS } from "./AboutCMS";

type TabId =
  | "home"
  | "third-circle"
  | "story"
  | "coffee"
  | "careers"
  | "newsroom";

interface TabDef {
  id: TabId;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: "home",         label: "Home",          hint: "Hero, banners, scroll chapters",  icon: <HomeIcon className="w-4 h-4" /> },
  { id: "third-circle", label: "Third Circle",  hint: "Editorial feed & posts",          icon: <Newspaper className="w-4 h-4" /> },
  { id: "story",        label: "Our Story",     hint: "Founders, milestones, values",    icon: <BookOpen className="w-4 h-4" /> },
  { id: "coffee",       label: "Our Coffee",    hint: "Estates, varietals, the cup",     icon: <Coffee className="w-4 h-4" /> },
  { id: "careers",      label: "Careers",       hint: "Roles, benefits, stories",        icon: <Briefcase className="w-4 h-4" /> },
  { id: "newsroom",     label: "Newsroom",      hint: "Press, releases, facts",          icon: <Megaphone className="w-4 h-4" /> },
];

const ROLE_TAB_ALLOW: Partial<Record<string, TabId[]>> = {
  hr:        ["careers"],
  marketing: ["home", "third-circle", "story", "coffee"],
  pr:        ["newsroom"],
};

export function UnifiedCMS() {
  const me = useQuery(convexApi.admins.me) as any;
  const role: string = me?.admin?.role ?? "admin";
  const allowedIds = ROLE_TAB_ALLOW[role];
  const visibleTabs = allowedIds ? TABS.filter((t) => allowedIds.includes(t.id)) : TABS;

  const [active, setActive] = useState<TabId>("home");
  const effectiveActive: TabId = visibleTabs.some((t) => t.id === active)
    ? active
    : (visibleTabs[0]?.id ?? "home");
  const activeDef = visibleTabs.find((t) => t.id === effectiveActive) ?? TABS[0];

  return (
    <div className="space-y-0 rounded-2xl border border-stone-200 bg-white overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/60">
        <h2 className="text-base font-bold text-stone-900">Content Editor</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Edit every public-facing page from one place.
        </p>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex gap-0.5 px-4 pt-3 border-b border-stone-100 overflow-x-auto bg-white">
        {visibleTabs.map((t) => {
          const on = effectiveActive === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id as TabId)}
              title={t.hint}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 whitespace-nowrap transition-colors ${
                on
                  ? "border-stone-800 text-stone-900 bg-white"
                  : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span className={on ? "text-stone-700" : "text-stone-400"}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Section description bar ─────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-stone-100 bg-white flex items-center gap-2">
        <span className="text-stone-400">{activeDef.icon}</span>
        <div>
          <span className="text-sm font-semibold text-stone-800">{activeDef.label}</span>
          <span className="text-xs text-stone-400 ml-2">— {activeDef.hint}</span>
        </div>
      </div>

      {/* ── Active editor ────────────────────────────────────────────────── */}
      <div className="relative">
        {effectiveActive === "home" && <HomeContentCMS />}
        {effectiveActive === "third-circle" && <EditorialCMS />}
        {effectiveActive === "story" && <AboutCMS page="story" />}
        {effectiveActive === "coffee" && <AboutCMS page="coffee" />}
        {effectiveActive === "careers" && <AboutCMS page="careers" />}
        {effectiveActive === "newsroom" && <AboutCMS page="newsroom" />}
      </div>
    </div>
  );
}

export default UnifiedCMS;
