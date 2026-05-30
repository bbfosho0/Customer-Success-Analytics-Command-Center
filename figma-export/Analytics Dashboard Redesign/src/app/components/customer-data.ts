// Customer Success Analytics data — Customer 360 model.
// Uses the same deterministic PRNG approach as data.ts for stable demo output.

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(137);

export type RiskLevel = "Healthy" | "Watch" | "At Risk" | "Critical";
export type CustomerSegment = "Enterprise" | "Mid-Market" | "SMB";
export type PlanTier = "Enterprise" | "Growth" | "Starter";

export interface CustomerAccount {
  id: string;
  name: string;
  segment: CustomerSegment;
  plan: PlanTier;
  region: string;
  mrr: number;
  healthScore: number;
  riskLevel: RiskLevel;
  riskDriver: string;
  recommendedAction: string;
  signupMonth: string;
  productUsageScore: number;
  paymentHealthScore: number;
  supportExperienceScore: number;
  csmEngagementScore: number;
  ltv: number;
  expansionReady: boolean;
  csm: string;
  restaurantType: string;
}

const NAMES = [
  "Harvest Table Group", "TableBird", "PinPoint POS", "CloudKitchen Co", "FlavorRoute",
  "QuickPlate Systems", "MenuFlow Inc", "NightOwl Bistro", "SpiceTrack", "FreshOrder",
  "RestaurantOS", "TableSync Pro", "DineSync Labs", "KitchenIQ", "OrderPilot",
  "GrillMaster Tech", "BistroBase", "DineMetrics", "PlateStack", "MenuMatrix",
  "FoodForward", "TableTech Solutions", "CloudDiner", "QuickServe AI", "FlavorStack",
];
const SEGMENTS: CustomerSegment[] = ["Enterprise", "Mid-Market", "SMB"];
const CS_REGIONS = ["North America", "EMEA", "APAC", "LATAM"];
const RESTAURANT_TYPES = ["QSR", "Full Service", "Fast Casual", "Ghost Kitchen", "Food Hall"];
const CSM_NAMES = ["Jordan Patel", "Mia Torres", "Sam Nguyen", "Alex Kim", "Riley Chen"];
const RISK_DRIVERS = [
  "Low product usage", "Failed payments", "High support burden", "Low CSM engagement",
  "Feature adoption declining", "Competitor evaluation", "Contract renewal approaching", "Champion departed",
];
const ACTIONS = [
  "Schedule QBR", "Escalate to CS Director", "Send health score report", "Offer training session",
  "Review pricing", "Monitor closely", "Enable expansion features", "Executive outreach",
];

function healthToRisk(score: number): RiskLevel {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Watch";
  if (score >= 40) return "At Risk";
  return "Critical";
}

export const SIGNUP_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1;
  return `2024-${String(m).padStart(2, "0")}`;
});

export const CUSTOMERS: CustomerAccount[] = NAMES.map((name, i) => {
  const segIdx = Math.floor(rand() * 3);
  const seg = SEGMENTS[segIdx];
  const plan: PlanTier =
    seg === "Enterprise" ? "Enterprise" : seg === "Mid-Market" ? "Growth" : rand() > 0.5 ? "Growth" : "Starter";
  const baseMrr =
    seg === "Enterprise" ? 3000 + rand() * 7000 : seg === "Mid-Market" ? 800 + rand() * 2200 : 100 + rand() * 700;

  const productUsageScore = Math.round(15 + rand() * 85);
  const paymentHealthScore = Math.round(35 + rand() * 65);
  const supportExperienceScore = Math.round(25 + rand() * 75);
  const csmEngagementScore = Math.round(15 + rand() * 85);

  const healthScore = Math.round(
    productUsageScore * 0.35 +
      paymentHealthScore * 0.2 +
      supportExperienceScore * 0.25 +
      csmEngagementScore * 0.2,
  );
  const riskLevel = healthToRisk(healthScore);
  const mrr = Math.round(baseMrr);
  const grossMargin = 0.75;
  const monthlyChurnRate =
    riskLevel === "Critical" ? 0.08 : riskLevel === "At Risk" ? 0.05 : riskLevel === "Watch" ? 0.02 : 0.01;
  const ltv = Math.round((mrr * grossMargin) / monthlyChurnRate);

  return {
    id: `CUST-${1000 + i}`,
    name,
    segment: seg,
    plan,
    region: CS_REGIONS[Math.floor(rand() * CS_REGIONS.length)],
    mrr,
    healthScore,
    riskLevel,
    riskDriver: RISK_DRIVERS[Math.floor(rand() * RISK_DRIVERS.length)],
    recommendedAction: ACTIONS[Math.floor(rand() * ACTIONS.length)],
    signupMonth: SIGNUP_MONTHS[Math.floor(rand() * SIGNUP_MONTHS.length)],
    productUsageScore,
    paymentHealthScore,
    supportExperienceScore,
    csmEngagementScore,
    ltv,
    expansionReady: healthScore >= 70 && mrr > 500,
    csm: CSM_NAMES[i % CSM_NAMES.length],
    restaurantType: RESTAURANT_TYPES[Math.floor(rand() * RESTAURANT_TYPES.length)],
  };
});

export function getHealthSummary() {
  const healthy = CUSTOMERS.filter((c) => c.riskLevel === "Healthy").length;
  const watch = CUSTOMERS.filter((c) => c.riskLevel === "Watch").length;
  const atRisk = CUSTOMERS.filter((c) => c.riskLevel === "At Risk").length;
  const critical = CUSTOMERS.filter((c) => c.riskLevel === "Critical").length;
  return { healthy, watch, atRisk, critical, total: CUSTOMERS.length };
}

export function getAtRiskMrr() {
  return CUSTOMERS.filter((c) => c.riskLevel === "At Risk" || c.riskLevel === "Critical").reduce(
    (s, c) => s + c.mrr,
    0,
  );
}

export function getAvgCustomerHealth() {
  return Math.round(CUSTOMERS.reduce((s, c) => s + c.healthScore, 0) / CUSTOMERS.length);
}

export function getChurnRatePercent() {
  const n = CUSTOMERS.filter((c) => c.riskLevel === "At Risk" || c.riskLevel === "Critical").length;
  return (n / CUSTOMERS.length) * 100;
}

const cohortRand = mulberry32(77);
export const RETENTION_COHORTS = SIGNUP_MONTHS.map((month, i) => {
  const base = 0.85 + cohortRand() * 0.1;
  const m1 = base;
  const m3 = m1 * (0.88 + cohortRand() * 0.08);
  const m6 = m3 * (0.84 + cohortRand() * 0.1);
  const m12 = i < 7 ? m6 * (0.8 + cohortRand() * 0.12) : null;
  return {
    month,
    size: 8 + Math.floor(cohortRand() * 20),
    m1: Math.round(m1 * 100),
    m3: Math.round(m3 * 100),
    m6: Math.round(m6 * 100),
    m12: m12 !== null ? Math.round(m12 * 100) : null,
  };
});

export function getLtvBySegment() {
  const groups: Record<string, CustomerAccount[]> = {};
  CUSTOMERS.forEach((c) => {
    const key = `${c.segment}|${c.plan}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });
  return Object.entries(groups)
    .map(([key, accts]) => {
      const [segment, plan] = key.split("|") as [CustomerSegment, PlanTier];
      return {
        segment,
        plan,
        label: `${segment} / ${plan}`,
        avgMrr: Math.round(accts.reduce((s, c) => s + c.mrr, 0) / accts.length),
        avgLtv: Math.round(accts.reduce((s, c) => s + c.ltv, 0) / accts.length),
        count: accts.length,
      };
    })
    .sort((a, b) => b.avgLtv - a.avgLtv);
}

export function getSegmentPerformance() {
  return SEGMENTS.map((seg) => {
    const group = CUSTOMERS.filter((c) => c.segment === seg);
    const atRisk = group.filter((c) => c.riskLevel === "At Risk" || c.riskLevel === "Critical").length;
    return {
      segment: seg,
      totalMrr: group.reduce((s, c) => s + c.mrr, 0),
      avgHealthScore: Math.round(group.reduce((s, c) => s + c.healthScore, 0) / group.length),
      churnRisk: Math.round((atRisk / group.length) * 100),
      avgLtv: Math.round(group.reduce((s, c) => s + c.ltv, 0) / group.length),
      count: group.length,
    };
  });
}

export function fmtMrr(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

export function fmtLtv(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}
