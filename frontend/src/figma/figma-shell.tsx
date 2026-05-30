"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppShell, type Route } from "./shell";
import { isStaticDemoMode } from "../lib/utils/env";

function routeFromPath(pathname: string): Route {
  if (pathname.startsWith("/calls/")) return { name: "call", id: pathname.split("/").at(-1) ?? "detail" };
  if (pathname.startsWith("/calls")) return { name: "calls" };
  if (pathname.startsWith("/agents")) return { name: "agents" };
  if (pathname.startsWith("/metrics")) return { name: "metrics" };
  if (pathname.startsWith("/customer-analytics")) return { name: "customer360" };
  if (pathname.startsWith("/settings")) return { name: "settings" };
  return { name: "dashboard" };
}

function pathFromRoute(route: Route): string {
  switch (route.name) {
    case "dashboard":
      return "/dashboard";
    case "calls":
      return "/calls";
    case "call":
      return `/calls/${route.id}`;
    case "agents":
      return "/agents";
    case "metrics":
      return "/metrics";
    case "customer360":
      return "/customer-analytics";
    case "settings":
      return "/settings";
    default:
      return "/dashboard";
  }
}

export function FigmaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = useState<"live" | "demo">(isStaticDemoMode() ? "demo" : "live");
  const route = useMemo(() => routeFromPath(pathname ?? "/"), [pathname]);

  return (
    <AppShell
      route={route}
      navigate={(next) => router.push(pathFromRoute(next) as any)}
      mode={mode}
      setMode={setMode}
    >
      {children}
    </AppShell>
  );
}
