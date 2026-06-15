from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "data" / "salesforce_crma"
STATIC_RESOURCES_DIR = ROOT / "salesforce" / "force-app" / "main" / "default" / "staticresources"
OUTPUT_PATH = STATIC_RESOURCES_DIR / "CustomerSuccessDashboardSampleData.resource"

REGION_MAP = {
    "North America": "north-america",
    "Europe": "emea",
    "Asia Pacific": "apj",
    "Latin America": "latam",
}

SEGMENT_MAP = {
    "Enterprise": "strategic",
    "Mid-Market": "growth",
    "SMB": "scaled",
}

PORTFOLIO_MAP = {
    "Enterprise": "enterprise",
    "Pro": "commercial",
    "Starter": "digital-native",
}

RISK_MAP = {
    "At Risk": "at-risk",
    "Critical": "critical",
    "Healthy": "healthy",
    "Watch": "watch",
}

READINESS_MAP = {
    "Expansion Ready": "Ready",
    "Nurture": "Priming",
    "Not Ready": "Blocked",
}

RENEWAL_MONTHS = ["Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026", "Jan 2027"]
REGION_ROTATION = ["north-america", "emea", "apj"]


@dataclass(frozen=True)
class SegmentProfile:
    source_segment: str
    segment: str
    region_seed: int
    offset: int
    average_mrr: float
    estimated_ltv: float
    customers: int


def read_csv_rows(name: str) -> list[dict[str, str]]:
    with (SOURCE_DIR / f"{name}.csv").open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def to_float(value: str | None) -> float:
    if not value:
        return 0.0
    return float(value)


def to_int(value: str | None) -> int:
    return int(round(to_float(value)))


def to_region(value: str) -> str:
    return REGION_MAP.get(value, "north-america")


def to_segment(value: str) -> str:
    return SEGMENT_MAP.get(value, "growth")


def to_portfolio(value: str) -> str:
    return PORTFOLIO_MAP.get(value, "commercial")


def to_risk(value: str) -> str:
    return RISK_MAP.get(value, "watch")


def to_health_bucket(risk_band: str, health_score: int) -> str:
    if risk_band in {"critical", "at-risk"} or health_score <= 62:
        return "at-risk"
    if risk_band == "watch" or health_score <= 78:
        return "watch"
    return "healthy"


def format_month_year(raw_date: str) -> str:
    if not raw_date:
        return "Dec 2026"
    parsed = datetime.strptime(raw_date, "%Y-%m-%d").date()
    return parsed.strftime("%b %Y")


def classify_stage(readiness: str, next_close_date: str, weighted_amount: float, open_amount: float) -> str:
    if next_close_date:
        close_date = datetime.strptime(next_close_date, "%Y-%m-%d").date()
        days_to_close = (close_date - date(2025, 6, 1)).days
    else:
        days_to_close = 210
    ratio = 0 if open_amount == 0 else weighted_amount / open_amount

    if readiness == "Expansion Ready":
        if days_to_close <= 75 or ratio >= 0.72:
            return "Commit"
        return "Proposal"
    if readiness == "Nurture":
        if days_to_close <= 90:
            return "Proposal"
        return "Solution Review"
    if ratio >= 0.45:
        return "Solution Review"
    return "Qualified"


def derive_use_case(segment: str, plan_tier: str) -> str:
    if segment == "strategic":
        return "Platform expansion"
    if plan_tier == "Pro":
        return "Workspace upgrade"
    if plan_tier == "Starter":
        return "Adoption expansion"
    return "Analytics rollout"


def build_customer_360_rows(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    output: list[dict[str, object]] = []
    for index, row in enumerate(rows):
        risk_band = to_risk(row["Risk_Band__c"])
        health_score = to_int(row["Health_Score__c"])
        output.append(
            {
                "id": row["Account_Id__c"],
                "accountName": row["Account_Name__c"],
                "csm": row["Customer_Success_Manager__c"],
                "portfolio": to_portfolio(row["Plan_Tier__c"]),
                "segment": to_segment(row["Segment__c"]),
                "region": to_region(row["Region__c"]),
                "riskBand": risk_band,
                "healthBucket": to_health_bucket(risk_band, health_score),
                "primaryRisk": row["Main_Risk_Driver__c"],
                "arr": round(to_float(row["Current_MRR__c"]) * 12, 2),
                "expansionPipeline": round(to_float(row["Open_Pipeline_Amount__c"]), 2),
                "healthScore": health_score,
                "openCases": to_int(row["Support_Calls__c"]),
                "renewalMonth": RENEWAL_MONTHS[index % len(RENEWAL_MONTHS)],
                "lastTouchDays": 4 + ((index * 3) % 24),
                "snapshotAgeDays": 6 + ((index * 7) % 80),
                "nextStep": row["Recommended_Action__c"],
            }
        )
    return output


def build_risk_rows(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    severity_open_cases = {"critical": 6, "at-risk": 4, "watch": 2, "healthy": 1}
    output: list[dict[str, object]] = []
    sorted_rows = sorted(rows, key=lambda item: int(item["Priority_Rank__c"]))
    for index, row in enumerate(sorted_rows):
        risk_band = to_risk(row["Risk_Band__c"])
        output.append(
            {
                "id": row["Account_Id__c"],
                "accountName": row["Account_Name__c"],
                "csm": row["Customer_Success_Manager__c"],
                "portfolio": to_portfolio(row["Plan_Tier__c"]),
                "segment": to_segment(row["Segment__c"]),
                "region": to_region(row["Region__c"]),
                "riskBand": risk_band,
                "healthBucket": to_health_bucket(risk_band, to_int(row["Health_Score__c"])),
                "primaryRisk": row["Main_Risk_Driver__c"],
                "arr": round(to_float(row["MRR__c"]) * 12, 2),
                "expansionPipeline": 0,
                "healthScore": to_int(row["Health_Score__c"]),
                "openCases": severity_open_cases[risk_band],
                "renewalMonth": RENEWAL_MONTHS[index % len(RENEWAL_MONTHS)],
                "lastTouchDays": 7 + ((index * 2) % 22),
                "snapshotAgeDays": 8 + ((index * 5) % 60),
                "nextStep": row["Recommended_Action__c"],
            }
        )
    return output


def build_expansion_rows(rows: list[dict[str, str]]) -> list[dict[str, object]]:
    output: list[dict[str, object]] = []
    sorted_rows = sorted(rows, key=lambda item: to_float(item["Weighted_Pipeline_Amount__c"]), reverse=True)
    for row in sorted_rows:
        readiness_value = READINESS_MAP.get(row["Expansion_Readiness__c"], "Priming")
        weighted_amount = round(to_float(row["Weighted_Pipeline_Amount__c"]), 2)
        open_amount = round(to_float(row["Open_Pipeline_Amount__c"]), 2)
        output.append(
            {
                "id": row["Account_Id__c"],
                "accountId": row["Account_Id__c"],
                "accountName": row["Account_Name__c"],
                "owner": row["Customer_Success_Manager__c"],
                "region": to_region(row["Region__c"]),
                "stage": classify_stage(row["Expansion_Readiness__c"], row["Next_Close_Date__c"], weighted_amount, open_amount),
                "weighted": weighted_amount,
                "readiness": readiness_value,
                "useCase": derive_use_case(to_segment(row["Segment__c"]), row["Plan_Tier__c"]),
                "closeWindow": format_month_year(row["Next_Close_Date__c"]),
            }
        )
    return output


def build_segment_profiles(rows: list[dict[str, str]]) -> list[SegmentProfile]:
    profiles: list[SegmentProfile] = []
    region_seed = {"Enterprise": 0, "Mid-Market": 1, "SMB": 2}
    offset = {"Enterprise": 2, "Mid-Market": 0, "SMB": -4}
    for row in rows:
        profiles.append(
            SegmentProfile(
                source_segment=row["Segment__c"],
                segment=to_segment(row["Segment__c"]),
                region_seed=region_seed[row["Segment__c"]],
                offset=offset[row["Segment__c"]],
                average_mrr=to_float(row["Average_MRR__c"]),
                estimated_ltv=to_float(row["Estimated_LTV__c"]),
                customers=to_int(row["Customers__c"]),
            )
        )
    return profiles


def build_retention_rows(
    retention_rows: list[dict[str, str]],
    ltv_rows: list[dict[str, str]],
) -> list[dict[str, object]]:
    grouped: dict[str, dict[int, dict[str, str]]] = {}
    for row in retention_rows:
        grouped.setdefault(row["Cohort_Quarter__c"], {})[int(row["Month_Number__c"])] = row

    ordered_quarters = sorted(grouped.keys())
    selected_quarters = ordered_quarters[-6:]
    recent_quarters = set(selected_quarters[-3:])
    profiles = build_segment_profiles(ltv_rows)
    total_profile_customers = sum(profile.customers for profile in profiles)

    output: list[dict[str, object]] = []
    counter = 1
    for quarter_index, quarter in enumerate(selected_quarters):
        month_rows = grouped[quarter]
        month3_row = month_rows.get(3) or month_rows[max(month for month in month_rows if month <= 3)]
        month6_row = month_rows.get(6) or month_rows[max(month for month in month_rows if month <= 6)]
        cohort_size = to_int(month6_row["Cohort_Size__c"])

        for profile in profiles:
            customer_share = profile.customers / total_profile_customers if total_profile_customers else 0.33
            allocated_customers = max(1, round(cohort_size * customer_share))
            region = REGION_ROTATION[(quarter_index + profile.region_seed) % len(REGION_ROTATION)]
            month3 = max(55, min(100, round(to_float(month3_row["Retention_Rate__c"]) * 100) + profile.offset))
            month6 = max(45, min(98, round(to_float(month6_row["Retention_Rate__c"]) * 100) + profile.offset))
            output.append(
                {
                    "id": f"RC-{counter:03d}",
                    "cohortLabel": quarter,
                    "segment": profile.segment,
                    "region": region,
                    "customers": allocated_customers,
                    "month3": month3,
                    "month6": month6,
                    "ltv": round((profile.estimated_ltv * allocated_customers) / 1_000_000, 1),
                    "arr": round((profile.average_mrr * allocated_customers * 12) / 1_000_000, 1),
                    "window": "6m" if quarter in recent_quarters else "12m",
                }
            )
            counter += 1
    return output


def build_payload() -> dict[str, object]:
    customer_360 = read_csv_rows("Customer_360")
    churn_risk = read_csv_rows("Churn_Risk_Accounts")
    expansion = read_csv_rows("Expansion_Opportunities")
    retention = read_csv_rows("Retention_Cohorts")
    ltv = read_csv_rows("LTV_By_Segment")

    return {
        "meta": {
            "resourceName": "CustomerSuccessDashboardSampleData",
            "sourceDirectory": "data/salesforce_crma",
            "generatedBy": "salesforce/scripts/build_dashboard_sample_resources.py",
            "datasets": {
                "customer360": len(customer_360),
                "churnRiskAccounts": len(churn_risk),
                "expansionOpportunities": len(expansion),
                "retentionCohorts": len(retention),
                "ltvBySegment": len(ltv),
            },
        },
        "datasets": {
            "customer360": build_customer_360_rows(customer_360),
            "churnRiskAccounts": build_risk_rows(churn_risk),
            "expansionOpportunities": build_expansion_rows(expansion),
            "retentionCohorts": build_retention_rows(retention, ltv),
            "ltvBySegment": ltv,
        },
    }


def write_payload(output_path: Path = OUTPUT_PATH) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = build_payload()
    output_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return output_path


def main() -> None:
    path = write_payload()
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
