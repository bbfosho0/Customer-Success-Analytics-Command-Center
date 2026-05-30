"use client";

import { useRouter } from "next/navigation";

import { FigmaShell } from "../../figma/figma-shell";
import { DashboardPage } from "../../figma/pages/dashboard";

export default function DashboardRoute() {
  const router = useRouter();
  return (
    <FigmaShell>
      <DashboardPage
        onOpenCall={(id) => router.push(`/calls/${id}`)}
        onAllCalls={() => router.push("/calls")}
      />
    </FigmaShell>
  );
}
