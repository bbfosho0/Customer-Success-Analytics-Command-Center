"""Generate larger deterministic support sample data (calls + agents)."""

from __future__ import annotations

import argparse
import csv
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path


REGIONS = [
    "us-east-1",
    "us-west-2",
    "eu-west-1",
    "eu-central-1",
    "ap-southeast-1",
    "ap-northeast-1",
]

ISSUES = [
    "Lambda timeout",
    "API Gateway 5xx",
    "Cold start",
    "IAM permission",
    "DynamoDB throttle",
    "S3 access",
    "Step Functions",
    "CloudWatch logs",
]

STATUSES = ["resolved", "escalated", "pending", "open"]

AGENT_NAMES = [
    "Aaliyah Alvarez",
    "Adrian Bennett",
    "Bella Chen",
    "Caleb Desai",
    "Danica El-Sayed",
    "Elias Fletcher",
    "Farah Gupta",
    "Gianna Hassan",
    "Hugo Iqbal",
    "Imani Johnson",
    "Jalen Khan",
    "Keira Laurent",
    "Lucian Morales",
    "Mireya Nakamura",
    "Nadia Osei",
    "Omar Patel",
    "Priya Quinn",
    "Rowan Rivera",
    "Samir Silva",
    "Talia Thompson",
    "Valeria Ueda",
    "Wen Vasquez",
    "Xavier Williams",
    "Yara Zhao",
    "Zuri Anderson",
    "Amir Bose",
    "Leila Chowdhury",
    "Noah Diaz",
]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate deterministic support sample dataset.")
    parser.add_argument("--calls", type=int, default=420, help="Number of support calls.")
    parser.add_argument("--agents", type=int, default=28, help="Number of agents.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for deterministic output.")
    parser.add_argument("--calls-output", type=Path, default=Path("data/sample_calls.json"))
    parser.add_argument("--agents-output", type=Path, default=Path("data/agents.csv"))
    return parser


def generate_agents(count: int, rng: random.Random) -> list[dict[str, object]]:
    agents = []
    for idx in range(count):
        if idx < len(AGENT_NAMES):
            name = AGENT_NAMES[idx]
        else:
            name = f"{AGENT_NAMES[idx % len(AGENT_NAMES)]} {idx // len(AGENT_NAMES) + 2}"
        agents.append(
            {
                "agent_id": f"agent_{idx+1:03d}",
                "agent_name": name,
                "agent_region": REGIONS[idx % len(REGIONS)],
                "skill_rating": round(rng.uniform(3.1, 4.9), 2),
            }
        )
    return agents


def generate_calls(count: int, agents: list[dict[str, object]], rng: random.Random) -> list[dict[str, object]]:
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    calls: list[dict[str, object]] = []
    for idx in range(count):
        agent = agents[idx % len(agents)]
        started_at = now - timedelta(hours=idx * 2 + rng.randint(0, 3))
        duration_seconds = rng.randint(120, 1700)
        status = rng.choices(STATUSES, weights=[58, 16, 20, 6], k=1)[0]
        calls.append(
            {
                "id": f"CALL_{idx+1:04d}",
                "agent_id": agent["agent_id"],
                "customer_region": REGIONS[(idx + rng.randint(0, 3)) % len(REGIONS)],
                "issue_type": rng.choices(ISSUES, weights=[20, 16, 14, 12, 12, 10, 8, 8], k=1)[0],
                "duration_seconds": duration_seconds,
                "resolution_status": status,
                "started_at": started_at.isoformat().replace("+00:00", "Z"),
                "channel": rng.choice(["voice", "chat", "email"]),
                "priority": rng.choice(["low", "normal", "high", "urgent"]),
                "sentiment": rng.choice(["positive", "neutral", "negative"]),
                "csat": round(rng.uniform(2.6, 4.9), 2),
                "first_response_minutes": rng.randint(1, 30),
                "first_contact_resolution": status == "resolved" and rng.random() > 0.35,
            }
        )
    return calls


def main() -> None:
    args = build_parser().parse_args()
    rng = random.Random(args.seed)

    agents = generate_agents(args.agents, rng)
    calls = generate_calls(args.calls, agents, rng)

    args.calls_output.parent.mkdir(parents=True, exist_ok=True)
    args.agents_output.parent.mkdir(parents=True, exist_ok=True)

    with args.calls_output.open("w", encoding="utf-8") as fh:
        json.dump(calls, fh, indent=2)

    with args.agents_output.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=["agent_id", "agent_name", "agent_region", "skill_rating"])
        writer.writeheader()
        writer.writerows(agents)

    print(f"Generated {len(calls)} calls -> {args.calls_output}")
    print(f"Generated {len(agents)} agents -> {args.agents_output}")


if __name__ == "__main__":
    main()
