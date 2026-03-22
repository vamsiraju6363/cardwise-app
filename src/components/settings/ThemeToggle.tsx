"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
        {OPTIONS.map((o) => (
          <div
            key={o.value}
            className="h-9 w-[76px] rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className="inline-flex gap-1 p-1 rounded-xl bg-muted"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-all",
            theme === value
              ? "bg-background text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
