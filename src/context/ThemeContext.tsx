"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeId = "cream" | "mocha" | "coastal" | "sunset";

export type ThemeDef = {
  id: ThemeId;
  label: string;
  tagline: string;
  /** Six representative swatches shown in the picker (bg, paper, muted, stone, text, accent). */
  swatches: [string, string, string, string, string, string];
};

export const THEMES: ThemeDef[] = [
  {
    id: "cream",
    label: "Cream Roast",
    tagline: "Warm paper · olive accent",
    swatches: ["#F5F2ED", "#FAF9F6", "#EBE7E0", "#D9D1C7", "#2C1810", "#5A5A40"],
  },
  {
    id: "mocha",
    label: "Midnight Brew",
    tagline: "Deep espresso · copper",
    swatches: ["#1E1612", "#2A1F18", "#3B2C22", "#5A463A", "#F1E8DC", "#D7A86E"],
  },
  {
    id: "coastal",
    label: "Coastal Pour",
    tagline: "Sea glass · slate teal",
    swatches: ["#EEF3F2", "#F8FBFA", "#DDE8E6", "#B8C9C5", "#1B2B2D", "#2F6F73"],
  },
  {
    id: "sunset",
    label: "Sunset Crema",
    tagline: "Dusty rose · amber clay",
    swatches: ["#F5EBE3", "#FBF4ED", "#ECDDD0", "#D8B9A0", "#3B1F1C", "#B85C3C"],
  },
];

const STORAGE_KEY = "brewmatch:theme";
const DEFAULT_THEME: ThemeId = "cream";

type Ctx = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: ThemeDef[];
};

const ThemeContext = createContext<Ctx>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  themes: THEMES,
});

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEMES.some((t) => t.id === value);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Read the data-theme attribute that was set by the inline boot script in
  // app/layout.tsx so initial render matches the painted DOM (no flash).
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof document === "undefined") return DEFAULT_THEME;
    const attr = document.documentElement.getAttribute("data-theme");
    return isThemeId(attr) ? attr : DEFAULT_THEME;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage disabled — in-memory only */
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Inline script source that applies the saved theme before React hydrates.
 * Injected in app/layout.tsx <head> to prevent FOUC on dark themes.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var ok=${JSON.stringify(
  THEMES.map((t) => t.id),
)}.indexOf(t)>=0;document.documentElement.setAttribute('data-theme',ok?t:'${DEFAULT_THEME}');}catch(e){document.documentElement.setAttribute('data-theme','${DEFAULT_THEME}');}})();`;
