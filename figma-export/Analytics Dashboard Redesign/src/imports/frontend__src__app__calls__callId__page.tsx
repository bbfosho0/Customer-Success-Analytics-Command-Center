import { AppShell } from "../../../components/layout/app-shell";
import { callsDataset } from "../../../lib/data/calls-data";

export function generateStaticParams() {
  return callsDataset.map((call) => ({ callId: call.id }));
}

export const dynamicParams = false;

interface CallDetailPageProps {
  params: { callId: string };
}

export default function CallDetailPage({ params }: CallDetailPageProps) {
  const call = callsDataset.find((entry) => entry.id === params.callId) ?? callsDataset[0];

  return (
    <AppShell title={`Case ${call.caseId}`} description={`Handled by ${call.agent} (${call.region})`}>
      <article className="grid gap-6 rounded-3xl border border-border/70 bg-surface p-6 shadow-card md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Timeline</p>
          <ul className="mt-4 space-y-3 text-sm text-foreground">
            <li>
              <strong>Opened</strong> · {new Date(call.openedAt).toLocaleString()}
            </li>
            <li>
              <strong>Closed</strong> · {new Date(call.closedAt).toLocaleString()}
            </li>
            <li>
              <strong>Duration</strong> · {Math.round(call.durationSeconds / 60)} minutes
            </li>
            <li>
              <strong>First response</strong> · {call.firstResponseMinutes} minutes
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.4rem] text-muted-foreground">Signal</p>
          <div className="mt-4 grid gap-3 text-sm">
            <Metric label="Priority" value={call.priority} />
            <Metric label="Issue" value={call.issue} />
            <Metric label="Sentiment" value={call.sentiment} />
            <Metric label="Status" value={call.status} />
            <Metric label="CSAT" value={`${call.csat}%`} />
          </div>
        </div>
      </article>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 px-4 py-3 text-foreground">
      <p className="text-xs uppercase tracking-[0.35rem] text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold capitalize">{value}</p>
    </div>
  );
}
