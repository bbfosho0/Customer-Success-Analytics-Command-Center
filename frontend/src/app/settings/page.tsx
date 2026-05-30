"use client";

import { isRefreshManifestEnabled, isStaticDemoMode } from "../../lib/utils/env";
import { FigmaShell } from "../../figma/figma-shell";
import { SettingsPage as FigmaSettingsPage } from "../../figma/pages/settings";

export default function SettingsPage() {
  return (
    <FigmaShell>
      <FigmaSettingsPage
        mode={isStaticDemoMode() ? "demo" : "live"}
        refreshDisabled={!isRefreshManifestEnabled()}
      />
    </FigmaShell>
  );
}
