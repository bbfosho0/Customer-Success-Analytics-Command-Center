import type { StoryTheme } from "../helpers/storybook";

export type EvidenceEntry = {
  surface: string;
  storyId: string;
  theme: StoryTheme;
  viewportName: "desktop" | "tablet" | "mobile";
  width: number;
  height: number;
  file: string;
};

export const evidenceManifest: EvidenceEntry[] = [
  { surface: "dashboard", storyId: "pages-dashboard--normal", theme: "dark", viewportName: "desktop", width: 1440, height: 1000, file: "dashboard-normal-dark-1440.png" },
  { surface: "dashboard", storyId: "pages-dashboard--normal", theme: "light", viewportName: "desktop", width: 1280, height: 900, file: "dashboard-normal-light-1280.png" },
  { surface: "calls", storyId: "pages-calls--normal", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "calls-normal-dark-1280.png" },
  { surface: "agents", storyId: "pages-agents--normal", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "agents-normal-dark-1280.png" },
  { surface: "metrics", storyId: "pages-metrics--normal", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "metrics-normal-dark-1280.png" },
  { surface: "customer-analytics", storyId: "pages-customer-analytics--overview", theme: "dark", viewportName: "desktop", width: 1440, height: 1000, file: "customer-analytics-overview-dark-1440.png" },
  { surface: "customer-analytics", storyId: "pages-customer-analytics--high-risk", theme: "dark", viewportName: "desktop", width: 1440, height: 1000, file: "customer-analytics-high-risk-dark-1440.png" },
  { surface: "settings", storyId: "pages-settings--demo", theme: "dark", viewportName: "tablet", width: 1024, height: 768, file: "settings-demo-dark-1024.png" },
  { surface: "dashboard", storyId: "pages-dashboard--normal", theme: "dark", viewportName: "mobile", width: 390, height: 844, file: "dashboard-normal-dark-390.png" },
  { surface: "calls", storyId: "pages-calls--normal", theme: "dark", viewportName: "mobile", width: 390, height: 844, file: "calls-normal-dark-390.png" },
  { surface: "customer-analytics", storyId: "pages-customer-analytics--overview", theme: "light", viewportName: "mobile", width: 360, height: 800, file: "customer-analytics-overview-light-360.png" }
];
