import { FigmaKpiCard } from "../ui/figma-primitives";
import type { DashboardKpi } from "../../lib/data/types";

type KpiCardProps = DashboardKpi;

export function KpiCard({ label, value, delta, descriptor, trend, goal }: KpiCardProps) {
  const signedDelta = trend === "down" ? -Math.abs(delta) : trend === "up" ? Math.abs(delta) : 0;
  return (
    <FigmaKpiCard
      label={label}
      value={value}
      delta={signedDelta}
      hint={goal ? `${descriptor} · Goal ${goal}` : descriptor}
    />
  );
}
