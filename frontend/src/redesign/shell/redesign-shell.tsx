"use client";

import type { ReactNode } from "react";
import { BarChart3, Building2, Headphones, Home, Menu, Settings, Users } from "lucide-react";

import { RedesignTheme } from "../foundations/redesign-theme";
import { cn } from "../lib/utils";
import { Button } from "../ui/primitives";

export type RedesignRoute = "dashboard" | "calls" | "call-detail" | "agent-intelligence" | "metrics" | "customer-360" | "settings";

const navItems: Array<{ route: RedesignRoute; label: string; icon: typeof Home }> = [
  { route: "dashboard", label: "Overview", icon: Home },
  { route: "calls", label: "Calls", icon: Headphones },
  { route: "agent-intelligence", label: "Agents", icon: Users },
  { route: "metrics", label: "Metrics", icon: BarChart3 },
  { route: "customer-360", label: "Customer 360", icon: Building2 },
  { route: "settings", label: "Settings", icon: Settings },
];

export function RedesignShell({
  route,
  children,
  theme,
  onNavigate,
}: {
  route: RedesignRoute;
  children: ReactNode;
  theme?: "light" | "dark";
  onNavigate?: (route: RedesignRoute) => void;
}) {
  return (
    <RedesignTheme theme={theme}>
      <div className="min-h-screen bg-background lg:grid lg:grid-cols-[64px_minmax(0,1fr)] xl:grid-cols-[216px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] lg:flex lg:flex-col">
          <div className="flex h-16 items-center border-b border-[var(--sidebar-border)] px-3 xl:px-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">SA</div>
            <div className="ml-3 hidden min-w-0 xl:block">
              <p className="truncate text-xs font-semibold text-foreground">Support Analytics</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">Command Center</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-2 xl:p-3" aria-label="Redesign navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = route === item.route || (route === "call-detail" && item.route === "calls");
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate?.(item.route)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-md px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] lg:justify-center lg:px-0 xl:justify-start xl:px-3",
                    active ? "bg-[var(--sidebar-active)] text-foreground shadow-[inset_0_0_0_1px_var(--sidebar-border)]" : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-active)] hover:text-foreground",
                  )}
                  title={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="border-t border-[var(--sidebar-border)] p-3">
            <div className="hidden xl:block">
              <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
              <p className="mt-1 text-[11px] text-foreground">Demo dataset</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Open navigation"><Menu className="h-4 w-4" /></Button>
              <div>
                <p className="text-xs font-semibold">Support Analytics</p>
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Command Center</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.08)]" aria-label="System healthy" />
          </header>
          <main className="mx-auto min-w-0 max-w-[1600px] p-3 sm:p-4 md:p-5 xl:p-6 2xl:p-8">{children}</main>
        </div>
      </div>
    </RedesignTheme>
  );
}

export function RedesignPageHeader({ title, description, eyebrow, actions }: { title: string; description?: string; eyebrow?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
