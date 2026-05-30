"use client";

import { FigmaShell } from "../../figma/figma-shell";
import { CustomerAnalyticsPage } from "../../figma/pages/customer-analytics";

export default function CustomerAnalyticsRoute() {
  return (
    <FigmaShell>
      <CustomerAnalyticsPage initialTab="overview" />
    </FigmaShell>
  );
}
