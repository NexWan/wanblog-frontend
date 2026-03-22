"use client";

import { BulbFilled, BulbOutlined } from "@ant-design/icons";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "wanblog-theme";
const DARK_THEME = "wanblog-dark";
const LIGHT_THEME = "valentine";
const THEME_EVENT = "wanblog-theme-change";

function resolveTheme(value: string | null) {
  return value === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;
}

function getThemeSnapshot() {
  if (typeof document === "undefined") {
    return DARK_THEME;
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  const rootTheme = document.documentElement.getAttribute("data-theme");

  return resolveTheme(storedTheme ?? rootTheme);
}

function getServerThemeSnapshot() {
  return DARK_THEME;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === STORAGE_KEY) {
      onStoreChange();
    }
  }

  function handleThemeChange() {
    onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_EVENT, handleThemeChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_EVENT, handleThemeChange);
  };
}

function applyTheme(theme: string) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT));
}

export default function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme() {
    const nextTheme = theme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;

    applyTheme(nextTheme);
  }

  const isLightTheme = theme === LIGHT_THEME;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLightTheme ? "dark" : "light"} theme`}
      aria-pressed={isLightTheme}
      className={cn(
        "group relative inline-flex items-center rounded-full border border-outline-variant/40 bg-surface-container-low/70 text-on-surface transition-all hover:border-primary/40 hover:bg-surface-container-high/80",
        compact ? "h-10 w-[4.75rem] justify-start px-1.5 py-1" : "h-10 w-[4.75rem] justify-start px-1.5 py-1",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute flex items-center text-primary/55 transition-opacity duration-300",
          "left-3",
          isLightTheme ? "opacity-100" : "opacity-45",
        )}
      >
        <BulbOutlined className="text-sm" />
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute flex items-center text-primary/75 transition-opacity duration-300",
          "right-3",
          isLightTheme ? "opacity-45" : "opacity-100",
        )}
      >
        <BulbFilled className="text-sm" />
      </span>
      <span className="relative flex h-full w-full items-center rounded-full bg-surface-container-highest p-1 transition-colors">
        <span
          className={cn(
            "flex items-center justify-center rounded-full primary-gradient text-on-primary shadow-md transition-transform duration-300",
            "h-6 w-6",
            isLightTheme ? "translate-x-0" : "translate-x-[2rem]",
          )}
        >
          {isLightTheme ? (
            <BulbOutlined className="text-xs" />
          ) : (
            <BulbFilled className="text-xs" />
          )}
        </span>
      </span>
    </button>
  );
}
