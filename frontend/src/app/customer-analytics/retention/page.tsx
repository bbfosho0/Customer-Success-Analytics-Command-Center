"use client";

import { FigmaShell } from "../../../figma/figma-shell";
import { CustomerAnalyticsPage } from "../../../figma/pages/customer-analytics";

export default function RetentionPage() {
  return (
    <FigmaShell>
      <CustomerAnalyticsPage initialTab="retention" />
    </FigmaShell>
  );
}
