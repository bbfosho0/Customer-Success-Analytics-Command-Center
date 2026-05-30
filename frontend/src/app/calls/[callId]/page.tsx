import { staticCalls } from "../../../lib/api/static-fixtures";
import { CallDetailRoute } from "./call-detail-route";

interface CallDetailPageProps {
  params: { callId: string };
}

export function generateStaticParams() {
  return staticCalls.map((call) => ({ callId: call.id }));
}

export default function CallDetailPage({ params }: CallDetailPageProps) {
  return <CallDetailRoute callId={params.callId} />;
}
