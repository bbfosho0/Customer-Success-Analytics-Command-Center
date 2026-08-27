"use client";

import type { ReactNode } from "react";

import { cn } from "../lib/utils";

export function RedesignTheme({ children, theme, className }: { children: ReactNode; theme?: "light" | "dark"; className?: string }) {
  return (
    <div
      data-redesign-theme={theme ?? "inherit"}
      className={cn("redesign-theme min-h-screen bg-background text-foreground", theme === "dark" && "dark", className)}
    >
      {children}
    </div>
  );
}
