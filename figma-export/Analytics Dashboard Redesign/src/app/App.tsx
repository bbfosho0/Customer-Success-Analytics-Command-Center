import { useState } from "react";
import { AppShell, Route } from "./components/shell";
import { DashboardPage } from "./components/pages/dashboard";
import { CallsPage } from "./components/pages/calls";
import { CallDetailPage } from "./components/pages/call-detail";
import { AgentsPage } from "./components/pages/agents";
import { MetricsPage } from "./components/pages/metrics";
import { SettingsPage } from "./components/pages/settings";

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "dashboard" });
  const [mode, setMode] = useState<"live" | "demo">("demo");

  const openCall = (id: string) => setRoute({ name: "call", id });

  return (
    <AppShell route={route} navigate={setRoute} mode={mode} setMode={setMode}>
      {route.name === "dashboard" && (
        <DashboardPage onOpenCall={openCall} onAllCalls={() => setRoute({ name: "calls" })} />
      )}
      {route.name === "calls" && <CallsPage onOpen={openCall} />}
      {route.name === "call" && (
        <CallDetailPage id={route.id} onBack={() => setRoute({ name: "calls" })} onOpen={openCall} />
      )}
      {route.name === "agents" && <AgentsPage />}
      {route.name === "metrics" && <MetricsPage />}
      {route.name === "settings" && <SettingsPage mode={mode} refreshDisabled={mode === "demo"} />}
    </AppShell>
  );
}
