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

export function UnifiedCMS() {
  const [active, setActive] = useState<TabId>("home");
  const activeDef = TABS.find((t) => t.id === active)!;

  return (
    <div className="relative">
      {/* Top tab strip (sticky) */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-3 mb-1 border-b border-stone-200/70 bg-white/70 backdrop-blur-xl">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const on = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                title={t.hint}
                className={
                  "group inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold tracking-wide border transition " +
                  (on
                    ? "bg-stone-900 text-white border-stone-900 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.35)]"
                    : "bg-white/80 text-stone-700 border-stone-200 hover:bg-white hover:border-stone-300")
                }
              >
                <span className={on ? "text-white" : "text-stone-500 group-hover:text-stone-700"}>
                  {t.icon}
                </span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-stone-400 font-semibold">
          Editing · {activeDef.label} <span className="text-stone-300">— {activeDef.hint}</span>
        </p>
      </div>

      {/* Active editor */}
      <div className="relative">
        {active === "home" && <HomeContentCMS />}
        {active === "third-circle" && <EditorialCMS />}
        {active === "story" && <AboutCMS page="story" />}
        {active === "coffee" && <AboutCMS page="coffee" />}
        {active === "careers" && <AboutCMS page="careers" />}
        {active === "newsroom" && <AboutCMS page="newsroom" />}
      </div>
    </div>
  );
}

export default UnifiedCMS;
