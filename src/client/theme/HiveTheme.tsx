import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * HiveTheme — runtime theme engine for the HERMES-HIVE dashboard.
 *
 * Three design variants (mirroring the homepage briefs):
 *   A — Minimal Precision : deep navy/black, cyan + single gold accent
 *   B — Organic Energy    : amber heart, violet secondary (default)
 *   C — Technical HUD     : emerald-teal phosphor, schematic
 *
 * The active theme is written as `data-theme` on <html>; CSS
 * overrides the Tailwind v4 color variables under [data-theme],
 * so every utility class re-themes live. Choice persists in
 * localStorage and is applied before first paint in main.tsx.
 */
export type HiveThemeId = 'A' | 'B' | 'C';

export const HIVE_THEMES: Record<HiveThemeId, { label: string; name: string; swatch: string }> = {
  A: { label: 'A', name: 'Minimal Precision', swatch: 'linear-gradient(135deg, #22d3ee, #d4af37)' },
  B: { label: 'B', name: 'Organic Energy', swatch: 'linear-gradient(135deg, #ffb347, #a86cff)' },
  C: { label: 'C', name: 'Technical HUD', swatch: 'linear-gradient(135deg, #34d399, #2dd4bf)' },
};

const STORAGE_KEY = 'hermes-hive-theme';

export function getStoredTheme(): HiveThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'A' || stored === 'B' || stored === 'C') return stored;
  } catch {
    /* storage unavailable — fall through */
  }
  return 'B';
}

export function applyTheme(theme: HiveThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* non-fatal */
  }
  window.dispatchEvent(new CustomEvent('hh:theme', { detail: { theme } }));
}

interface HiveThemeCtx {
  theme: HiveThemeId;
  setTheme: (t: HiveThemeId) => void;
}

const Ctx = createContext<HiveThemeCtx>({ theme: 'B', setTheme: () => {} });

export const HiveThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<HiveThemeId>(() => {
    if (typeof document !== 'undefined') return getStoredTheme();
    return 'B';
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((t: HiveThemeId) => setThemeState(t), []);

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
};

export const useHiveTheme = () => useContext(Ctx);
