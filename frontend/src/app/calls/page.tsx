"use client";

import { useRouter } from "next/navigation";

import { FigmaShell } from "../../figma/figma-shell";
import { CallsPage } from "../../figma/pages/calls";

export default function CallsRoute() {
  const router = useRouter();
  return (
    <FigmaShell>
      <CallsPage onOpen={(id) => router.push(`/calls/${id}`)} />
    </FigmaShell>
  );
}
