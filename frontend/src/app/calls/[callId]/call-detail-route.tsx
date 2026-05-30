"use client";

import { useRouter } from "next/navigation";

import { FigmaShell } from "../../../figma/figma-shell";
import { CallDetailPage } from "../../../figma/pages/call-detail";

interface CallDetailRouteProps {
  callId: string;
}

export function CallDetailRoute({ callId }: CallDetailRouteProps) {
  const router = useRouter();
  return (
    <FigmaShell>
      <CallDetailPage
        id={callId}
        onBack={() => router.push("/calls")}
        onOpen={(id) => router.push(`/calls/${id}`)}
      />
    </FigmaShell>
  );
}
