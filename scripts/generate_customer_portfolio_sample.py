"""Expand the checked-in customer analytics sample to a deterministic portfolio."""

from __future__ import annotations

import argparse
import csv
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Sequence


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
ANCHOR_ACCOUNT_COUNT = 12
DEFAULT_ACCOUNT_COUNT = 100

PREFIXES = (
    "Amber",
    "Atlas",
    "Bluebird",
    "Canyon",
    "Clover",
    "Ember",
    "Foundry",
    "Golden",
    "Juniper",
    "Maple",
    "Orchard",
)
CONCEPTS = (
    "Kitchen",
    "Table",
    "Bistro",
    "Hospitality",
    "Cafe Group",
    "Dining Collective",
    "Restaurant Co",
    "Food Hall",
)
RESTAURANT_TYPES = (
    "Fast Casual",
    "Fine Dining",
    "Casual Dining",
    "Quick Service",
    "Cafe",
)
REGIONS = ("North America", "Europe", "Asia Pacific", "Latin America")
SEGMENTS = ("SMB", "Mid-Market", "Enterprise")
ACCOUNT_OWNERS = (
    "Maya Chen",
    "Liam Brooks",
    "Noah Singh",
    "Sofia Reed",
    "Ethan Park",
    "Priya Shah",
    "Marcus Lee",
    "Elena Torres",
)
CSMS = (
    "Jordan Ellis",
    "Avery Morgan",
    "Riley Patel",
    "Taylor Kim",
    "Casey Nguyen",
    "Morgan Lee",
    "Drew Martinez",
    "Samira Khan",
)

HEADERS = {
    "accounts": [
        "account_id",
        "account_name",
        "restaurant_type",
        "region",
        "segment",
        "signup_date",
        "account_owner",
        "customer_success_manager",
    ],
    "subscriptions": [
        "subscription_id",
        "account_id",
        "plan_tier",
        "mrr",
        "start_date",
        "end_date",
        "status",
    ],
    "product_usage": [
        "usage_id",
        "account_id",
        "usage_month",
        "active_days",
        "orders_processed",
        "staff_logins",
        "features_used_count",
        "last_login_date",
    ],
    "invoices": [
        "invoice_id",
        "account_id",
        "invoice_month",
        "amount",
        "paid",
        "payment_failed",
        "payment_date",
    ],
    "opportunities": [
        "opportunity_id",
        "account_id",
        "opportunity_type",
        "stage",
        "amount",
        "close_date",
        "probability",
    ],
    "customer_success_touches": [
        "touch_id",
        "account_id",
        "touch_type",
        "touch_date",
        "outcome",
        "notes_category",
    ],
}


def _read_rows(raw_dir: Path, name: str) -> list[dict[str, str]]:
    with (raw_dir / f"{name}.csv").open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def _write_rows(raw_dir: Path, name: str, rows: list[dict[str, Any]]) -> None:
    path = raw_dir / f"{name}.csv"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=HEADERS[name])
        writer.writeheader()
        writer.writerows(rows)


def _profile(index: int) -> str:
    offset = index - ANCHOR_ACCOUNT_COUNT - 1
    bucket = (offset * 3) % 10
    if bucket < 4:
        return "healthy"
    if bucket < 7:
        return "watch"
    if bucket < 9:
        return "at_risk"
    return "critical"


def _segment(index: int) -> str:
    bucket = index % 5
    if bucket in {3, 4}:
        return "SMB"
    if bucket in {1, 2}:
        return "Mid-Market"
    return "Enterprise"


def _plan_and_mrr(index: int, segment: str) -> tuple[str, int]:
    variation = (index * 137) % 900
    if segment == "SMB":
        return "Starter", 850 + variation
    if segment == "Mid-Market":
        return "Pro", 3_400 + (variation * 3)
    return "Enterprise", 13_500 + (variation * 11)


def _status(index: int, profile: str) -> str:
    if profile == "critical" and index % 30 == 2:
        return "churned"
    if profile == "watch" and index % 17 == 0:
        return "paused"
    if profile == "watch" and index % 29 == 0:
        return "trial"
    return "active"


def _usage_values(
    index: int,
    profile: str,
    segment: str,
    month_offset: int,
) -> tuple[int, int, int, int]:
    base = {
        "healthy": (25, 140, 10),
        "watch": (18, 82, 7),
        "at_risk": (10, 34, 4),
        "critical": (4, 10, 2),
    }[profile]
    active_days = max(0, min(30, base[0] + ((index + month_offset) % 3) - 1))
    staff_logins = max(0, base[1] + ((index * 7 + month_offset * 11) % 25) - 12)
    features = max(0, base[2] + ((index + month_offset) % 2))
    segment_multiplier = {"SMB": 75, "Mid-Market": 260, "Enterprise": 720}[segment]
    orders = active_days * segment_multiplier + ((index * 53 + month_offset * 97) % 600)
    return active_days, orders, staff_logins, features


def _account_name(index: int) -> str:
    offset = index - ANCHOR_ACCOUNT_COUNT - 1
    return f"{PREFIXES[offset % len(PREFIXES)]} {CONCEPTS[offset // len(PREFIXES)]}"


def _new_rows(account_count: int) -> dict[str, list[dict[str, Any]]]:
    rows = {name: [] for name in HEADERS}
    usage_id = ANCHOR_ACCOUNT_COUNT * 2
    invoice_id = ANCHOR_ACCOUNT_COUNT
    opportunity_id = 8
    touch_id = ANCHOR_ACCOUNT_COUNT

    for index in range(ANCHOR_ACCOUNT_COUNT + 1, account_count + 1):
        account_id = f"acct_{index:03d}"
        profile = _profile(index)
        segment = _segment(index)
        plan, mrr = _plan_and_mrr(index, segment)
        status = _status(index, profile)
        signup = date(2022, 7, 1) + timedelta(days=(index * 41) % 850)
        region = REGIONS[(index * 3) % len(REGIONS)]
        csm = CSMS[(index * 5) % len(CSMS)]

        rows["accounts"].append(
            {
                "account_id": account_id,
                "account_name": _account_name(index),
                "restaurant_type": RESTAURANT_TYPES[index % len(RESTAURANT_TYPES)],
                "region": region,
                "segment": segment,
                "signup_date": signup.isoformat(),
                "account_owner": ACCOUNT_OWNERS[(index * 3) % len(ACCOUNT_OWNERS)],
                "customer_success_manager": csm,
            }
        )

        churned = status == "churned"
        rows["subscriptions"].append(
            {
                "subscription_id": f"sub_{index:03d}",
                "account_id": account_id,
                "plan_tier": plan,
                "mrr": mrr,
                "start_date": signup.isoformat(),
                "end_date": "2025-03-31" if churned else "",
                "status": status,
            }
        )

        for month_offset, month in enumerate((date(2025, 3, 1), date(2025, 4, 1))):
            usage_id += 1
            active_days, orders, staff_logins, features = _usage_values(
                index, profile, segment, month_offset
            )
            if churned and month_offset == 1:
                active_days = orders = staff_logins = features = 0
            last_login = (
                month + timedelta(days=min(29, max(1, active_days)))
                if active_days
                else None
            )
            rows["product_usage"].append(
                {
                    "usage_id": f"use_{usage_id:03d}",
                    "account_id": account_id,
                    "usage_month": month.isoformat(),
                    "active_days": active_days,
                    "orders_processed": orders,
                    "staff_logins": staff_logins,
                    "features_used_count": features,
                    "last_login_date": last_login.isoformat() if last_login else "",
                }
            )

        invoice_id += 1
        payment_failed = profile == "critical" and not churned
        paid = not churned and not payment_failed
        rows["invoices"].append(
            {
                "invoice_id": f"inv_{invoice_id:03d}",
                "account_id": account_id,
                "invoice_month": "2025-04-01",
                "amount": 0 if churned else mrr,
                "paid": str(paid).lower(),
                "payment_failed": str(payment_failed).lower(),
                "payment_date": f"2025-04-{2 + index % 6:02d}" if paid else "",
            }
        )

        if profile == "healthy" or (profile == "watch" and index % 2 == 0):
            opportunity_id += 1
            multiplier = {"SMB": 5, "Mid-Market": 8, "Enterprise": 11}[segment]
            amount = int(round((mrr * multiplier) / 500) * 500)
            probability = 0.68 if profile == "healthy" else 0.42
            rows["opportunities"].append(
                {
                    "opportunity_id": f"opp_{opportunity_id:03d}",
                    "account_id": account_id,
                    "opportunity_type": "upsell" if index % 2 else "cross_sell",
                    "stage": "Proposal" if profile == "healthy" else "Qualified",
                    "amount": amount,
                    "close_date": (
                        date(2025, 6, 15) + timedelta(days=(index * 13) % 150)
                    ).isoformat(),
                    "probability": probability,
                }
            )

        touch_specs = {
            "healthy": [
                ("qbr", "Expansion roadmap aligned", "positive"),
                ("check_in", "Adoption remains strong", "positive"),
            ],
            "watch": [
                ("check_in", "Adoption plan reviewed", "neutral"),
                ("training", "Workflow coaching scheduled", "positive"),
            ],
            "at_risk": [
                ("risk_review", "Adoption risk requires intervention", "risk")
            ],
            "critical": [
                ("risk_review", "Payment and adoption recovery plan", "risk")
            ],
        }[profile]
        for touch_type, outcome, category in touch_specs:
            touch_id += 1
            rows["customer_success_touches"].append(
                {
                    "touch_id": f"touch_{touch_id:03d}",
                    "account_id": account_id,
                    "touch_type": touch_type,
                    "touch_date": (
                        date(2025, 3, 1) + timedelta(days=(index * 7 + touch_id) % 58)
                    ).isoformat(),
                    "outcome": outcome,
                    "notes_category": category,
                }
            )

    return rows


def generate_portfolio(
    *,
    raw_dir: Path = RAW_DIR,
    account_count: int = DEFAULT_ACCOUNT_COUNT,
) -> dict[str, int]:
    if account_count < ANCHOR_ACCOUNT_COUNT:
        raise ValueError(
            f"account_count must be at least {ANCHOR_ACCOUNT_COUNT} to retain anchor accounts"
        )

    anchors = {
        name: [
            row
            for row in _read_rows(raw_dir, name)
            if int(row["account_id"].split("_")[1]) <= ANCHOR_ACCOUNT_COUNT
        ]
        for name in HEADERS
    }
    generated = _new_rows(account_count)
    for name in HEADERS:
        _write_rows(raw_dir, name, [*anchors[name], *generated[name]])

    return {
        name: len(anchors[name]) + len(generated[name])
        for name in HEADERS
    }


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--accounts", type=int, default=DEFAULT_ACCOUNT_COUNT)
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    args = parser.parse_args(argv)

    try:
        counts = generate_portfolio(
            raw_dir=args.raw_dir.resolve(),
            account_count=args.accounts,
        )
    except (FileNotFoundError, ValueError) as exc:
        parser.error(str(exc))

    print(
        f"Generated {args.accounts} customer accounts with "
        f"{counts['product_usage']} usage rows, "
        f"{counts['opportunities']} opportunities, and "
        f"{counts['customer_success_touches']} CSM touches."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
