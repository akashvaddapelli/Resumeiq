import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette } from "lucide-react";

const THEMES = [
  {
    name: "Emerald",
    primary: "155 100% 50%",
    secondary: "190 100% 50%",
    glowPrimary: "155 100% 50%",
    glowSecondary: "190 100% 50%",
    accent: "155 100% 50%",
    ring: "155 100% 50%",
    preview: "#00ff87",
  },
  {
    name: "Violet",
    primary: "270 100% 65%",
    secondary: "300 100% 60%",
    glowPrimary: "270 100% 65%",
    glowSecondary: "300 100% 60%",
    accent: "270 100% 65%",
    ring: "270 100% 65%",
    preview: "#7c3aed",
  },
  {
    name: "Amber",
    primary: "38 100% 55%",
    secondary: "25 100% 55%",
    glowPrimary: "38 100% 55%",
    glowSecondary: "25 100% 55%",
    accent: "38 100% 55%",
    ring: "38 100% 55%",
    preview: "#f59e0b",
  },
  {
    name: "Cyan",
    primary: "190 100% 50%",
    secondary: "210 100% 60%",
    glowPrimary: "190 100% 50%",
    glowSecondary: "210 100% 60%",
    accent: "190 100% 50%",
    ring: "190 100% 50%",
    preview: "#00d4ff",
  },
  {
    name: "Rose",
    primary: "340 80% 60%",
    secondary: "320 70% 55%",
    glowPrimary: "340 80% 60%",
    glowSecondary: "320 70% 55%",
    accent: "340 80% 60%",
    ring: "340 80% 60%",
    preview: "#e11d48",
  },
  {
    name: "White",
    primary: "220 13% 26%",
    secondary: "220 13% 40%",
    glowPrimary: "220 13% 26%",
    glowSecondary: "220 13% 40%",
    accent: "220 13% 26%",
    ring: "220 13% 26%",
    preview: "#ffffff",
    // Light theme overrides
    background: "0 0% 100%",
    foreground: "220 13% 10%",
    card: "0 0% 97%",
    cardForeground: "220 13% 10%",
    popover: "0 0% 97%",
    popoverForeground: "220 13% 10%",
    muted: "220 10% 93%",
    mutedForeground: "220 10% 45%",
    border: "220 10% 88%",
    input: "220 10% 88%",
    glassBg: "0 0% 95%",
    glassBorder: "220 10% 85%",
    sidebarBg: "0 0% 97%",
    sidebarForeground: "220 13% 10%",
    primaryForeground: "0 0% 100%",
    secondaryForeground: "0 0% 100%",
    accentForeground: "0 0% 100%",
    sidebarAccent: "220 10% 93%",
    sidebarAccentForeground: "220 13% 10%",
    sidebarBorder: "220 10% 88%",
  },
];

// Default dark theme values to restore
const DARK_DEFAULTS = {
  background: "240 20% 3.5%",
  foreground: "210 40% 96%",
  card: "240 15% 6%",
  cardForeground: "210 40% 96%",
  popover: "240 15% 6%",
  popoverForeground: "210 40% 96%",
  muted: "240 10% 12%",
  mutedForeground: "220 10% 55%",
  border: "240 10% 14%",
  input: "240 10% 14%",
  glassBg: "240 15% 8%",
  glassBorder: "240 10% 18%",
  sidebarBg: "240 15% 5%",
  sidebarForeground: "210 40% 96%",
  primaryForeground: "240 20% 3.5%",
  secondaryForeground: "240 20% 3.5%",
  accentForeground: "240 20% 3.5%",
  sidebarAccent: "240 10% 10%",
  sidebarAccentForeground: "210 40% 96%",
  sidebarBorder: "240 10% 14%",
};

const ThemeSwitcher = () => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("Emerald");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("resumiq-theme");
    if (saved) {
      const theme = THEMES.find((t) => t.name === saved);
      if (theme) applyTheme(theme);
    }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const applyTheme = (theme: (typeof THEMES)[0]) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--secondary", theme.secondary);
    root.style.setProperty("--glow-primary", theme.glowPrimary);
    root.style.setProperty("--glow-secondary", theme.glowSecondary);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--ring", theme.ring);
    root.style.setProperty("--sidebar-primary", theme.primary);
    root.style.setProperty("--sidebar-ring", theme.ring);

    // Apply light/dark background overrides
    const isLight = "background" in theme;
    const vals = isLight ? theme : DARK_DEFAULTS;
    root.style.setProperty("--background", (vals as any).background);
    root.style.setProperty("--foreground", (vals as any).foreground);
    root.style.setProperty("--card", (vals as any).card);
    root.style.setProperty("--card-foreground", (vals as any).cardForeground);
    root.style.setProperty("--popover", (vals as any).popover);
    root.style.setProperty("--popover-foreground", (vals as any).popoverForeground);
    root.style.setProperty("--muted", (vals as any).muted);
    root.style.setProperty("--muted-foreground", (vals as any).mutedForeground);
    root.style.setProperty("--border", (vals as any).border);
    root.style.setProperty("--input", (vals as any).input);
    root.style.setProperty("--glass-bg", (vals as any).glassBg);
    root.style.setProperty("--glass-border", (vals as any).glassBorder);
    root.style.setProperty("--sidebar-background", (vals as any).sidebarBg);
    root.style.setProperty("--sidebar-foreground", (vals as any).sidebarForeground);
    root.style.setProperty("--primary-foreground", (vals as any).primaryForeground);
    root.style.setProperty("--secondary-foreground", (vals as any).secondaryForeground);
    root.style.setProperty("--accent-foreground", (vals as any).accentForeground);
    root.style.setProperty("--sidebar-accent", (vals as any).sidebarAccent);
    root.style.setProperty("--sidebar-accent-foreground", (vals as any).sidebarAccentForeground);
    root.style.setProperty("--sidebar-border", (vals as any).sidebarBorder);

    setActive(theme.name);
    localStorage.setItem("resumiq-theme", theme.name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
        aria-label="Change theme"
      >
        <Palette className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 glass-card p-3 min-w-[140px]"
          >
            <p className="text-xs text-muted-foreground mb-2 px-1">Theme</p>
            <div className="flex flex-col gap-1">
              {THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => applyTheme(theme)}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                    active === theme.name ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span className="h-3 w-3 rounded-full flex-shrink-0 border border-border/50" style={{ backgroundColor: theme.preview }} />
                  {theme.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;
