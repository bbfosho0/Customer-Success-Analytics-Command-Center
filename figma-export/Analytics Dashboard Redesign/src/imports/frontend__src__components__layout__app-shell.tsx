import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "../ui/button";
import { PrimaryNav } from "./primary-nav";

interface AppShellProps {
  children: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function AppShell({ children, title, description, actions }: AppShellProps) {
  return (
    <div className="grid min-h-screen w-full bg-gradient-to-br from-background via-surface to-background/60 md:grid-cols-[260px_1fr]">
      <aside className="hidden flex-col border-r border-border/60 bg-surface px-6 py-8 md:flex">
        <Link href="/dashboard" className="mb-8 inline-flex flex-col">
          <span className="text-sm uppercase tracking-widest text-muted-foreground">AWS Support</span>
          <span className="font-display text-2xl font-semibold tracking-tight">Command Room</span>
        </Link>
        <PrimaryNav />
        <div className="mt-auto rounded-2xl border border-border/70 bg-surface-strong/50 p-4 text-sm text-muted-foreground">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Response target</p>
          <p className="mt-2 text-3xl font-display text-foreground">97.4%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Portion of calls answered within the promised time window.
          </p>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex flex-col gap-4 border-b border-border/60 bg-surface/80 px-4 py-6 backdrop-blur md:px-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Situation Room</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="surface" className="hidden border border-border/60 md:inline-flex">
                Export snapshot
              </Button>
              {actions ?? (
                <Button>
                  Schedule briefing
                </Button>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-8 md:px-10 md:py-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
