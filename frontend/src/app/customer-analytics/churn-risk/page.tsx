"use client";

import { FigmaShell } from "../../../figma/figma-shell";
import { CustomerAnalyticsPage } from "../../../figma/pages/customer-analytics";

export default function ChurnRiskRoute() {
  return (
    <FigmaShell>
      <CustomerAnalyticsPage initialTab="churn-risk" />
    </FigmaShell>
  );
}
