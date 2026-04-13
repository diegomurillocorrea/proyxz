"use client";

import { useTheme } from "@/components/theme-provider";

type Props = {
  /** login: icon top-right; sidebar: labeled row */
  placement: "login" | "sidebar";
};

export function ThemeToggleButton({ placement }: Props) {
  const { theme, toggleTheme, mounted } = useTheme();

  const label =
    theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  const busyUntilMounted = !mounted;

  if (placement === "login") {
    return (
      <button
        type="button"
        onClick={() => {
          if (!mounted) return;
          toggleTheme();
        }}
        aria-disabled={busyUntilMounted}
        className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:focus:ring-offset-zinc-950 ${busyUntilMounted ? "pointer-events-none opacity-50" : ""}`}
        aria-label={label}
      >
        {theme === "dark" ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (!mounted) return;
        toggleTheme();
      }}
      aria-disabled={busyUntilMounted}
      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:focus:ring-offset-zinc-900 ${busyUntilMounted ? "pointer-events-none opacity-50" : ""}`}
      aria-label={label}
    >
      <span>Modo oscuro</span>
      <span className="text-zinc-400" aria-hidden>
        {theme === "dark" ? "✓" : ""}
      </span>
    </button>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
