"use client";

import { FigmaShell } from "../../figma/figma-shell";
import { AgentsPage } from "../../figma/pages/agents";

export default function AgentsRoute() {
  return (
    <FigmaShell>
      <AgentsPage />
    </FigmaShell>
  );
}
