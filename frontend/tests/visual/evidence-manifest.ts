import type { StoryTheme } from "../helpers/storybook";

export type EvidenceEntry = {
  surface: string;
  storyId: string;
  state: string;
  theme: StoryTheme;
  viewportName: "desktop" | "tablet" | "mobile";
  width: number;
  height: number;
  file: string;
};

export const evidenceManifest: EvidenceEntry[] = [
  { surface: "dashboard", storyId: "canonical-pages-dashboard--normal", state: "normal", theme: "dark", viewportName: "desktop", width: 1440, height: 1000, file: "dashboard-normal-dark-1440.png" },
  { surface: "dashboard", storyId: "canonical-pages-dashboard--normal", state: "normal", theme: "light", viewportName: "desktop", width: 1280, height: 900, file: "dashboard-normal-light-1280.png" },
  { surface: "dashboard", storyId: "canonical-pages-dashboard--sparse", state: "sparse", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "dashboard-sparse-dark-1280.png" },
  { surface: "dashboard", storyId: "canonical-pages-dashboard--high-risk", state: "high-risk", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "dashboard-high-risk-dark-1280.png" },
  { surface: "dashboard", storyId: "canonical-pages-dashboard--normal", state: "normal", theme: "dark", viewportName: "mobile", width: 390, height: 844, file: "dashboard-normal-dark-390.png" },
  { surface: "calls", storyId: "canonical-pages-calls--normal", state: "normal", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "calls-normal-dark-1280.png" },
  { surface: "calls", storyId: "canonical-pages-calls--long-content", state: "long-content", theme: "dark", viewportName: "mobile", width: 390, height: 844, file: "calls-long-content-dark-390.png" },
  { surface: "call-detail", storyId: "canonical-pages-call-detail--normal", state: "normal", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "call-detail-normal-dark-1280.png" },
  { surface: "call-detail", storyId: "canonical-pages-call-detail--long-content", state: "long-content", theme: "dark", viewportName: "mobile", width: 390, height: 844, file: "call-detail-long-content-dark-390.png" },
  { surface: "agents", storyId: "canonical-pages-agents--normal", state: "normal", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "agents-normal-dark-1280.png" },
  { surface: "agents", storyId: "canonical-pages-agents--mixed-performance", state: "mixed-performance", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "agents-mixed-performance-dark-1280.png" },
  { surface: "metrics", storyId: "canonical-pages-metrics--normal", state: "normal", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "metrics-normal-dark-1280.png" },
  { surface: "metrics", storyId: "canonical-pages-metrics--zero-heavy", state: "zero-heavy", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "metrics-zero-heavy-dark-1280.png" },
  { surface: "metrics", storyId: "canonical-pages-metrics--extreme-numeric", state: "extreme-numeric", theme: "dark", viewportName: "mobile", width: 390, height: 844, file: "metrics-extreme-numeric-dark-390.png" },
  { surface: "customer-analytics", storyId: "canonical-pages-customer-360--normal", state: "normal", theme: "dark", viewportName: "desktop", width: 1440, height: 1000, file: "customer-analytics-normal-dark-1440.png" },
  { surface: "customer-analytics", storyId: "canonical-pages-customer-360--high-risk", state: "high-risk", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "customer-analytics-high-risk-dark-1280.png" },
  { surface: "customer-analytics", storyId: "canonical-pages-customer-360--no-risk", state: "no-risk", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "customer-analytics-no-risk-dark-1280.png" },
  { surface: "customer-analytics", storyId: "canonical-pages-customer-360--normal", state: "normal", theme: "light", viewportName: "mobile", width: 360, height: 800, file: "customer-analytics-normal-light-360.png" },
  { surface: "settings", storyId: "canonical-pages-settings--default", state: "default", theme: "dark", viewportName: "tablet", width: 1024, height: 768, file: "settings-default-dark-1024.png" },
  { surface: "settings", storyId: "canonical-pages-settings--error", state: "error", theme: "dark", viewportName: "desktop", width: 1280, height: 900, file: "settings-error-dark-1280.png" }
];
