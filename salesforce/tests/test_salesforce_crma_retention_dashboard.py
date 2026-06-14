from __future__ import annotations

import json
from pathlib import Path
from xml.etree import ElementTree as ET

from salesforce.scripts import build_salesforce_crma_metadata as metadata


ROOT = Path(__file__).resolve().parents[2]
WAVE_DIR = ROOT / "salesforce" / "force-app" / "main" / "default" / "wave"
DASHBOARD_PATH = WAVE_DIR / "Retention_Cohort_Dashboard.wdash"


def _dashboard() -> dict:
    return json.loads(DASHBOARD_PATH.read_text(encoding="utf-8"))


def _placements(dashboard: dict, layout_name: str) -> dict[str, dict]:
    layout = next(
        layout for layout in dashboard["gridLayouts"] if layout["name"] == layout_name
    )
    return {
        placement["name"]: placement
        for placement in layout["pages"][0]["widgets"]
    }


def test_retention_only_generation_is_isolated_and_idempotent(
    tmp_path: Path, monkeypatch
) -> None:
    temp_wave = tmp_path / "wave"
    temp_wave.mkdir()
    for source in WAVE_DIR.iterdir():
        if source.is_file():
            (temp_wave / source.name).write_bytes(source.read_bytes())

    untouched_names = {
        path.name
        for path in temp_wave.iterdir()
        if path.name != "Retention_Cohort_Dashboard.wdash"
    }
    untouched_before = {
        name: (temp_wave / name).read_bytes() for name in untouched_names
    }

    monkeypatch.setattr(metadata, "WAVE_DIR", temp_wave)
    metadata.build(retention_only=True)
    first = (temp_wave / "Retention_Cohort_Dashboard.wdash").read_bytes()
    metadata.build(retention_only=True)
    second = (temp_wave / "Retention_Cohort_Dashboard.wdash").read_bytes()

    assert first == second
    assert {
        name: (temp_wave / name).read_bytes() for name in untouched_names
    } == untouched_before


def test_retention_redesign_preserves_steps_and_widget_contracts() -> None:
    dashboard = _dashboard()

    assert set(dashboard["steps"]) == {
        "ret_detail_filter",
        "ret_detail_rate",
        "ret_detail_size",
        "ret_detail_ltv_avg",
        "ret_detail_trend",
        "ret_detail_heatmap",
        "ret_detail_ltv",
        "ret_detail_table",
    }
    for widget_name, widget in dashboard["widgets"].items():
        parameters = widget.get("parameters", {})
        step_name = parameters.get("step")
        if step_name:
            assert step_name in dashboard["steps"], widget_name
        assert parameters.get("showActionMenu", False) is False

    assert dashboard["widgets"]["ret_detail_back"]["parameters"][
        "destinationLink"
    ]["name"] == "Landing_Page"
    assert dashboard["widgets"]["ret_detail_back"]["parameters"]["text"] == (
        "Command Center"
    )
    assert (
        dashboard["widgets"]["ret_detail_back"]["parameters"]["textColor"]
        == "#FFFFFF"
    )
    assert dashboard["widgets"]["ret_detail_reset"]["parameters"][
        "destinationLink"
    ]["name"] == "Retention_Cohort_Dashboard"


def test_retention_desktop_layout_has_executive_hierarchy() -> None:
    dashboard = _dashboard()
    placements = _placements(dashboard, "Default")

    assert (
        placements["ret_detail_chart_heatmap"]["column"],
        placements["ret_detail_chart_heatmap"]["colspan"],
    ) == (0, 16)
    assert (
        placements["ret_detail_chart_trend"]["column"],
        placements["ret_detail_chart_trend"]["colspan"],
    ) == (16, 32)
    assert placements["ret_detail_chart_ltv"]["rowspan"] == 15
    assert placements["ret_detail_table_widget"]["rowspan"] == 22

    for placement in placements.values():
        assert placement["column"] + placement["colspan"] <= 48
        assert placement["row"] >= 0
        assert placement["rowspan"] > 0

    for widget_name, accent in (
        ("ret_detail_number_rate", "#16A34A"),
        ("ret_detail_number_size", "#2563EB"),
        ("ret_detail_number_ltv", "#0D9488"),
    ):
        style = placements[widget_name]["widgetStyle"]
        assert style["backgroundColor"] == "#FFFFFF"
        assert style["borderEdges"] == ["left"]
        assert style["borderColor"] == accent
        assert style["borderRadius"] == 12


def test_retention_mobile_layout_prioritizes_summary_before_detail() -> None:
    dashboard = _dashboard()
    placements = _placements(dashboard, "Mobile")
    order = sorted(placements.values(), key=lambda placement: placement["row"])
    names = [placement["name"] for placement in order]

    assert names.index("ret_detail_selector") < names.index("ret_detail_number_rate")
    assert names.index("ret_detail_number_rate") < names.index("ret_detail_chart_trend")
    assert names.index("ret_detail_chart_trend") < names.index(
        "ret_detail_chart_heatmap"
    )
    assert names.index("ret_detail_chart_ltv") < names.index(
        "ret_detail_table_widget"
    )
    assert placements["ret_detail_number_size"]["colspan"] == 6
    assert placements["ret_detail_number_ltv"]["colspan"] == 6
    assert placements["ret_detail_header_container"]["rowspan"] == 13
    assert placements["ret_detail_title_mobile"]["rowspan"] == 6
    assert "ret_detail_title" not in placements

    for placement in placements.values():
        assert placement["column"] + placement["colspan"] <= 12
        assert placement["row"] >= 0
        assert placement["rowspan"] > 0


def test_retention_table_and_charts_use_compact_readable_presentation() -> None:
    dashboard = _dashboard()
    widgets = dashboard["widgets"]
    table = widgets["ret_detail_table_widget"]["parameters"]

    assert table["numberOfLines"] == 1
    assert table["verticalPadding"] == 6
    assert table["header"]["backgroundColor"] == "#F1F5F9"
    assert table["showActionMenu"] is False
    assert table["exploreLink"] is False
    assert sum(
        column["parameters"]["width"]
        for column in table["columnProperties"].values()
    ) == 1510

    assert widgets["ret_detail_chart_heatmap"]["parameters"]["highColor"] == "#0D9488"
    assert widgets["ret_detail_chart_heatmap"]["parameters"]["lowColor"] == "#E6FFFB"
    for widget_name in (
        "ret_detail_chart_heatmap",
        "ret_detail_chart_trend",
        "ret_detail_chart_ltv",
    ):
        parameters = widgets[widget_name]["parameters"]
        assert parameters["showActionMenu"] is False
        assert parameters["exploreLink"] is False


def test_retention_manifest_deploys_only_the_retention_dashboard() -> None:
    manifest = ROOT / "salesforce" / "manifest" / "retention-dashboard.xml"
    root = ET.parse(manifest).getroot()
    namespace = {"m": "http://soap.sforce.com/2006/04/metadata"}

    members = root.findall("m:types/m:members", namespace)
    metadata_types = root.findall("m:types/m:name", namespace)
    assert [member.text for member in members] == ["Retention_Cohort_Dashboard"]
    assert [metadata_type.text for metadata_type in metadata_types] == [
        "WaveDashboard"
    ]
    assert root.findtext("m:version", namespaces=namespace) == "66.0"
