"use client";

import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Database,
  LayoutDashboard,
  Moon,
  PhoneCall,
  Search,
  Settings,
  Sun,
  Target,
  Users,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "../../lib/utils/cn";

interface AppShellProps {
  children: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}

type PageHeaderProps = Omit<AppShellProps, "children">;

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer-analytics", label: "Customer 360", icon: Target },
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children, title, description, actions }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-150 md:flex",
          collapsed ? "w-[56px]" : "w-[220px]",
        )}
      >
        <Link href="/dashboard" className="flex h-12 items-center gap-2 border-b border-border px-3">
          <div className="grid h-6 w-6 place-items-center rounded-sm bg-foreground text-[11px] tracking-tight text-background">
            CS
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="break-words text-[13px] leading-tight text-foreground">Command Center</p>
              <p className="break-words text-[10px] leading-tight text-muted-foreground">Customer Success</p>
            </div>
          )}
        </Link>
        <nav className="flex-1 overflow-y-auto p-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                  active ? "bg-foreground/5 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
                {!collapsed && <span className="break-words leading-tight">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-2">
          <button
            onClick={() => setCollapsed((current) => !current)}
            className="flex w-full items-center justify-center gap-2 rounded-md p-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <><ChevronsLeft className="h-3.5 w-3.5" /> Collapse</>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[240px] border-r border-border bg-card p-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn("mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm", active ? "bg-foreground/5 text-foreground" : "text-muted-foreground")}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-3 border-b border-border bg-card px-3 md:px-4">
          <button
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
          </button>
          <nav className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            {crumbs.map((crumb, index) => (
              <span key={`${crumb}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && <span className="text-muted-foreground/40">/</span>}
                <span className={index === crumbs.length - 1 ? "text-foreground" : ""}>{crumb}</span>
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:flex">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Jump to account, call, agent..."
                className="h-7 w-[260px] rounded-md border border-border bg-input-background pl-7 pr-2 text-xs outline-none focus:border-foreground/30"
              />
              <kbd className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground">
                Ctrl K
              </kbd>
            </div>
            <ModeToggle mode={mode} setMode={setMode} />
            <button
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
            <div className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[11px] text-background">
              CS
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6">
          <PageHeader title={title} description={description} actions={actions} />
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
        <h1 className="break-words text-[18px] font-semibold leading-tight tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function ModeToggle({ mode, setMode }: { mode: "live" | "demo"; setMode: (mode: "live" | "demo") => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 text-xs">
      <button
        onClick={() => setMode("live")}
        className={cn("inline-flex items-center gap-1 rounded px-2 py-1", mode === "live" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
      >
        <Wifi className="h-3 w-3" /> Live
      </button>
      <button
        onClick={() => setMode("demo")}
        className={cn("inline-flex items-center gap-1 rounded px-2 py-1", mode === "demo" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
      >
        <Database className="h-3 w-3" /> Demo
      </button>
    </div>
  );
}

function buildCrumbs(pathname: string) {
  if (pathname.startsWith("/customer-analytics/churn-risk")) return ["Customer 360", "Churn risk"];
  if (pathname.startsWith("/customer-analytics/retention")) return ["Customer 360", "Retention"];
  if (pathname.startsWith("/customer-analytics/ltv")) return ["Customer 360", "LTV"];
  if (pathname.startsWith("/customer-analytics")) return ["Customer 360"];
  if (pathname.startsWith("/calls/")) return ["Calls", pathname.split("/").at(-1) ?? "Detail"];
  if (pathname.startsWith("/calls")) return ["Calls"];
  if (pathname.startsWith("/agents")) return ["Agents"];
  if (pathname.startsWith("/metrics")) return ["Metrics"];
  if (pathname.startsWith("/settings")) return ["Settings"];
  return ["Dashboard"];
}
