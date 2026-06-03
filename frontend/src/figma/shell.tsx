import { useState } from "react";
import {
  LayoutDashboard,
  PhoneCall,
  Users,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Wifi,
  Database,
  Search,
  ChevronsLeft,
  ChevronsRight,
  HeartHandshake,
} from "lucide-react";
import { cn } from "./ui/utils";
import { useTheme } from "next-themes";

export type Route =
  | { name: "dashboard" }
  | { name: "calls" }
  | { name: "call"; id: string }
  | { name: "agents" }
  | { name: "metrics" }
  | { name: "customer360" }
  | { name: "settings" };

const NAV: { name: Route["name"]; label: string; icon: any }[] = [
  { name: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { name: "calls", label: "Calls", icon: PhoneCall },
  { name: "agents", label: "Agents", icon: Users },
  { name: "metrics", label: "Metrics", icon: BarChart3 },
  { name: "customer360", label: "Customer 360", icon: HeartHandshake },
  { name: "settings", label: "Settings", icon: Settings },
];

export function AppShell({
  route,
  navigate,
  mode,
  setMode,
  children,
}: {
  route: Route;
  navigate: (r: Route) => void;
  mode: "live" | "demo";
  setMode: (m: "live" | "demo") => void;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme === "light" ? "light" : "dark";

  const activeName = route.name === "call" ? "calls" : route.name;
  const crumb =
    route.name === "call"
      ? ["Calls", route.id]
      : [NAV.find((n) => n.name === route.name)?.label ?? route.name];

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden md:flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-150",
          collapsed ? "w-[56px]" : "w-[220px]",
        )}
      >
          <div className="flex items-center gap-2 border-b border-border px-3 h-12">
          <div className="grid h-6 w-6 place-items-center rounded-sm bg-foreground text-background text-[11px] tracking-tight">
            AS
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="break-words text-[13px] leading-tight text-foreground">Support Analytics</p>
              <p className="break-words text-[10px] leading-tight text-muted-foreground">AWS Serverless</p>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = activeName === item.name;
            return (
              <button
                key={item.name}
                onClick={() => navigate({ name: item.name } as Route)}
                className={cn(
                  "mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                  active
                    ? "bg-foreground/5 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
                {!collapsed && <span className="break-words leading-tight">{item.label}</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-border p-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-2 rounded-md p-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <><ChevronsLeft className="h-3.5 w-3.5" /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[240px] border-r border-border bg-card p-2">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = activeName === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate({ name: item.name } as Route);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm",
                    active ? "bg-foreground/5 text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-12 items-center gap-3 border-b border-border bg-card px-3 md:px-4">
          <button
            className="md:hidden inline-flex h-7 w-7 items-center justify-center rounded-md border border-border"
            onClick={() => setMobileOpen(true)}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
          </button>
          <nav className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
            {crumb.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground/40">/</span>}
                <span className={i === crumb.length - 1 ? "text-foreground" : ""}>{c}</span>
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Jump to call, agent, region…"
                className="h-7 w-[260px] rounded-md border border-border bg-input-background pl-7 pr-2 text-xs outline-none focus:border-foreground/30"
              />
              <kbd className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground">⌘K</kbd>
            </div>
            <ModeToggle mode={mode} setMode={setMode} />
            <button
              onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            </button>
            <div className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background text-[11px]">
              JL
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function ModeToggle({ mode, setMode }: { mode: "live" | "demo"; setMode: (m: "live" | "demo") => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5 text-xs">
      <button
        onClick={() => setMode("live")}
        className={cn(
          "inline-flex items-center gap-1 rounded px-2 py-1",
          mode === "live" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Wifi className="h-3 w-3" /> Live
      </button>
      <button
        onClick={() => setMode("demo")}
        className={cn(
          "inline-flex items-center gap-1 rounded px-2 py-1",
          mode === "demo" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Database className="h-3 w-3" /> Demo
      </button>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  titleClassName,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  titleClassName?: string;
}) {
  return (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className={cn("font-display break-words text-[18px] font-semibold leading-tight tracking-tight", titleClassName)}>{title}</h1>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
