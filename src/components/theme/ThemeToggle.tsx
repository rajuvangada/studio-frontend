import { Moon, Sun } from "lucide-react";

import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground/80 transition-all hover:border-foreground hover:text-foreground active:scale-95",
        className,
      )}
    >
      <span className="inline-flex transition-transform duration-300">
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </span>
    </button>
  );
}

