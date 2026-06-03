import type { AgentPerformance } from "./types";
import { AGENT_ROSTER_SIZE, buildAgentName } from "./identity";

const regions = ["NA", "EMEA", "APAC", "LATAM"];
const focuses = [
  ["Billing mastery", "AI co-pilot"],
  ["Voice empathy", "Premium accounts"],
  ["Fraud playbooks", "Escalation sweeps"],
  ["Workflow automations", "Multi-channel"],
];

export const agentsPerformance: AgentPerformance[] = Array.from({ length: AGENT_ROSTER_SIZE }, (_, index) => {
  const base = 72 + (index % 7) * 3;
  return {
    id: `agent_${String(index + 1).padStart(3, "0")}`,
    name: buildAgentName(index),
    region: regions[index % regions.length],
    role: index % 3 === 0 ? "Escalations" : index % 3 === 1 ? "Enterprise" : "Core",
    callsHandled: 320 + index * 18,
    avgHandleTime: 9 + (index % 5),
    csat: parseFloat((base + (index % 4) * 1.2).toFixed(1)),
    sla: 88 + (index % 6),
    scheduleAdherence: 92 - (index % 5),
    sentimentLift: parseFloat(((index % 6) * 0.7 + 1.2).toFixed(1)),
    focusAreas: focuses[index % focuses.length],
  };
});

export const topAgents = agentsPerformance.slice(0, 6);
