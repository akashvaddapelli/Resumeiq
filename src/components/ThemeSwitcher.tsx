import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const DARK_THEME = {
  background: "240 20% 3.5%",
  foreground: "210 40% 96%",
  card: "240 15% 6%",
  cardForeground: "210 40% 96%",
  popover: "240 15% 6%",
  popoverForeground: "210 40% 96%",
  primary: "155 100% 50%",
  primaryForeground: "240 20% 3.5%",
  secondary: "190 100% 50%",
  secondaryForeground: "240 20% 3.5%",
  muted: "240 10% 12%",
  mutedForeground: "220 10% 55%",
  accent: "155 100% 50%",
  accentForeground: "240 20% 3.5%",
  border: "240 10% 14%",
  input: "240 10% 14%",
  ring: "155 100% 50%",
  glassBg: "240 15% 8%",
  glassBorder: "240 10% 18%",
  sidebarBg: "240 15% 5%",
  sidebarForeground: "210 40% 96%",
  sidebarAccent: "240 10% 10%",
  sidebarAccentForeground: "210 40% 96%",
  sidebarBorder: "240 10% 14%",
  glowPrimary: "155 100% 50%",
  glowSecondary: "190 100% 50%",
};

const LIGHT_THEME = {
  background: "0 0% 98%",
  foreground: "220 13% 10%",
  card: "0 0% 100%",
  cardForeground: "220 13% 10%",
  popover: "0 0% 100%",
  popoverForeground: "220 13% 10%",
  primary: "155 100% 40%",
  primaryForeground: "0 0% 100%",
  secondary: "190 100% 40%",
  secondaryForeground: "0 0% 100%",
  muted: "220 10% 93%",
  mutedForeground: "220 10% 40%",
  accent: "155 100% 40%",
  accentForeground: "0 0% 100%",
  border: "220 10% 88%",
  input: "220 10% 88%",
  ring: "155 100% 40%",
  glassBg: "0 0% 96%",
  glassBorder: "220 10% 85%",
  sidebarBg: "0 0% 97%",
  sidebarForeground: "220 13% 10%",
  sidebarAccent: "220 10% 93%",
  sidebarAccentForeground: "220 13% 10%",
  sidebarBorder: "220 10% 88%",
  glowPrimary: "155 100% 40%",
  glowSecondary: "190 100% 40%",
};

const VAR_MAP: Record<string, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  glassBg: "--glass-bg",
  glassBorder: "--glass-border",
  sidebarBg: "--sidebar-background",
  sidebarForeground: "--sidebar-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  glowPrimary: "--glow-primary",
  glowSecondary: "--glow-secondary",
};

function applyTheme(theme: Record<string, string>) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme)) {
    const cssVar = VAR_MAP[key];
    if (cssVar) root.style.setProperty(cssVar, value);
  }
  root.style.setProperty("--sidebar-primary", theme.primary);
  root.style.setProperty("--sidebar-ring", theme.ring);
  root.style.setProperty("--sidebar-primary-foreground", theme.primaryForeground);
}

const ThemeSwitcher = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("resumiq-mode");
    const dark = saved ? saved === "dark" : true;
    setIsDark(dark);
    applyTheme(dark ? DARK_THEME : LIGHT_THEME);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next ? DARK_THEME : LIGHT_THEME);
    localStorage.setItem("resumiq-mode", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-muted/50"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

export default ThemeSwitcher;
