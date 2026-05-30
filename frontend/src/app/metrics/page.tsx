"use client";

import { FigmaShell } from "../../figma/figma-shell";
import { MetricsPage } from "../../figma/pages/metrics";

export default function MetricsRoute() {
  return (
    <FigmaShell>
      <MetricsPage />
    </FigmaShell>
  );
}
