import { agentHandlers } from "./handlers/agents";
import { callHandlers } from "./handlers/calls";
import { customerAnalyticsHandlers } from "./handlers/customer-analytics";
import { dashboardHandlers } from "./handlers/dashboard";
import { metricHandlers } from "./handlers/metrics";

export const handlers = [
  ...callHandlers,
  ...metricHandlers,
  ...agentHandlers,
  ...dashboardHandlers,
  ...customerAnalyticsHandlers,
];
