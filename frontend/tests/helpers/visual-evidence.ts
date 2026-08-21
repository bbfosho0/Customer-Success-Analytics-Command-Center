import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

import { openStory } from "./storybook";
import type { EvidenceEntry } from "../visual/evidence-manifest";

const evidenceRoot = path.resolve(process.cwd(), "visual-evidence");

export function writeEvidenceManifest(entries: EvidenceEntry[]) {
  mkdirSync(evidenceRoot, { recursive: true });
  writeFileSync(
    path.join(evidenceRoot, "manifest.json"),
    JSON.stringify({ version: 1, entries }, null, 2) + "\n",
    "utf8",
  );
}

export async function captureEvidence(page: Page, entry: EvidenceEntry) {
  const directory = path.join(evidenceRoot, entry.viewportName);
  mkdirSync(directory, { recursive: true });
  await openStory(page, entry.storyId, {
    theme: entry.theme,
    viewport: { width: entry.width, height: entry.height },
  });
  await page.screenshot({
    path: path.join(directory, entry.file),
    fullPage: true,
    animations: "disabled",
  });
}
