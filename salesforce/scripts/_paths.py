from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SALESFORCE_DIR = ROOT / "salesforce"
WAVE_DIR = SALESFORCE_DIR / "force-app" / "main" / "default" / "wave"
EXPORT_DIR = ROOT / "data" / "salesforce_crma"
XMD_NS = "http://soap.sforce.com/2006/04/metadata"
