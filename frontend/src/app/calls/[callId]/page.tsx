import { staticCalls } from "../../../lib/api/static-fixtures";
import { CallDetailClient } from "./call-detail-client";

export function generateStaticParams() {
  return staticCalls.map((call) => ({ callId: call.id }));
}

export const dynamicParams = false;

interface CallDetailPageProps {
  params: { callId: string };
}

export default function CallDetailPage({ params }: CallDetailPageProps) {
  return <CallDetailClient callId={params.callId} />;
}
