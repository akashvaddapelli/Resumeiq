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
];

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
    root.style.setProperty("--accent-foreground", "240 20% 3.5%");
    root.style.setProperty("--ring", theme.ring);
    root.style.setProperty("--sidebar-primary", theme.primary);
    root.style.setProperty("--sidebar-ring", theme.ring);
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
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: theme.preview }} />
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
