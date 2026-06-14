from __future__ import annotations

import copy
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TOOLS_DIR = ROOT / "salesforce" / "design"
sys.path.insert(0, str(TOOLS_DIR))

from apply_crma_style import (  # noqa: E402
    LAYOUT_MOBILE,
    OVERVIEW_MOBILE_LAYOUT,
    STYLE_ONLY,
    run_compiler,
)
from validate_crma_dashboard import (  # noqa: E402
    build_report,
    diff_json,
    overview_scope_violations,
)


LANDING_PATH = (
    ROOT
    / "salesforce"
    / "force-app"
    / "main"
    / "default"
    / "wave"
    / "Landing_Page.wdash"
)
DESIGN_SYSTEM_PATH = TOOLS_DIR / "design-system.json"


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _run(
    source: Path,
    output: Path,
    tmp_path: Path,
    mode: str,
) -> dict:
    return run_compiler(
        dashboard_path=source,
        design_system_path=DESIGN_SYSTEM_PATH,
        mode=mode,
        output_path=output,
        report_json_path=tmp_path / f"{mode}.report.json",
        report_md_path=tmp_path / f"{mode}.report.md",
        overview_only=True,
    )


def _overview_placements(dashboard: dict, layout_name: str) -> dict[str, dict]:
    layout = next(
        layout for layout in dashboard["gridLayouts"] if layout["name"] == layout_name
    )
    page = next(page for page in layout["pages"] if page["name"] == "cscc-overview")
    return {placement["name"]: placement for placement in page["widgets"]}


def test_overview_style_pass_is_scoped_and_preserves_functional_logic(
    tmp_path: Path,
) -> None:
    output = tmp_path / "Landing_Page.overview-style.wdash"
    report = _run(LANDING_PATH, output, tmp_path, STYLE_ONLY)
    original = _load(LANDING_PATH)
    styled = _load(output)

    assert report["violations"] == []
    assert report["overviewOnly"] is True
    assert overview_scope_violations(original, styled) == []

    for key in ("dataSourceLinksInfo", "filters", "steps"):
        assert styled.get(key) == original.get(key)
    original_widget_names = set(original["widgets"])
    styled_widget_names = set(styled["widgets"])
    assert styled_widget_names == original_widget_names
    for name in original["widgets"]:
        if not name.startswith("overview_"):
            assert styled["widgets"][name] == original["widgets"][name]

    validation = build_report(
        LANDING_PATH,
        output,
        STYLE_ONLY,
        diff_json(original, styled),
    )
    assert validation["status"] == "PASS"
    assert validation["forbiddenChanges"] == []
    assert validation["allowedLayoutChanges"] == []


def test_overview_style_roles_keep_masthead_and_navigation_readable(
    tmp_path: Path,
) -> None:
    output = tmp_path / "Landing_Page.overview-style.wdash"
    _run(LANDING_PATH, output, tmp_path, STYLE_ONLY)
    dashboard = _load(output)

    for layout_name, title_name in (
        ("Default", "overview_title"),
        ("Mobile", "overview_title_mobile"),
    ):
        placements = _overview_placements(dashboard, layout_name)
        assert placements["overview_header_container"]["widgetStyle"][
            "backgroundColor"
        ] == "#0B1F3A"
        assert placements[title_name]["widgetStyle"]["backgroundColor"] == (
            "rgba(255, 255, 255, 0)"
        )
        assert placements[title_name]["widgetStyle"]["borderEdges"] == []

        for surface_name, label_name, nav_name in (
            (
                "overview_present_nav_risk_surface",
                "overview_present_nav_risk_label",
                "overview_nav_risk",
            ),
            (
                "overview_present_nav_retention_surface",
                "overview_present_nav_retention_label",
                "overview_nav_retention",
            ),
            (
                "overview_present_nav_expansion_surface",
                "overview_present_nav_expansion_label",
                "overview_nav_expansion",
            ),
        ):
            assert placements[surface_name]["widgetStyle"]["backgroundColor"] == "#1E293B"
            assert placements[nav_name]["widgetStyle"]["backgroundColor"] == "#1E293B"
            assert dashboard["widgets"][nav_name]["parameters"]["textColor"] == "#FFFFFF"
            assert dashboard["widgets"][label_name]["type"] == "text"

        assert placements["overview_present_reset_surface"]["widgetStyle"]["backgroundColor"] == "#FFFFFF"
        assert placements["overview_reset"]["widgetStyle"]["backgroundColor"] == "#F8FAFC"
        assert dashboard["widgets"]["overview_reset"]["parameters"]["textColor"] == "#0F172A"
        assert dashboard["widgets"]["overview_present_reset_label"]["type"] == "text"


def test_overview_kpis_tables_and_charts_follow_design_tokens(
    tmp_path: Path,
) -> None:
    output = tmp_path / "Landing_Page.overview-style.wdash"
    _run(LANDING_PATH, output, tmp_path, STYLE_ONLY)
    dashboard = _load(output)
    placements = _overview_placements(dashboard, "Default")

    expected_accents = {
        "overview_kpi_arr_number": "#0B1F3A",
        "overview_kpi_customers_number": "#0F172A",
        "overview_kpi_health_number": "#16A34A",
        "overview_kpi_risk_number": "#DC2626",
        "overview_kpi_expansion_number": "#4FB6D3",
    }
    for name, accent in expected_accents.items():
        if name == "overview_kpi_arr_number":
            assert placements[name]["widgetStyle"]["backgroundColor"] == "#0B1F3A"
            assert placements[name]["widgetStyle"]["borderColor"] == "#0B1F3A"
            assert placements[name]["widgetStyle"]["borderEdges"] == ["all"]
            assert dashboard["widgets"][name]["parameters"]["numberColor"] == "#FFFFFF"
            assert dashboard["widgets"][name]["parameters"]["titleColor"] == "#CBD5E1"
            assert dashboard["widgets"][name]["parameters"]["numberSize"] == 36
        else:
            assert placements[name]["widgetStyle"]["backgroundColor"] == "#FFFFFF"
            assert placements[name]["widgetStyle"]["borderColor"] == accent
            assert placements[name]["widgetStyle"]["borderEdges"] == ["left"]
            assert dashboard["widgets"][name]["parameters"]["numberColor"] == accent
            assert dashboard["widgets"][name]["parameters"]["numberSize"] == 32

    for name, accent in (
        ("overview_health_healthy", "#16A34A"),
        ("overview_health_watch", "#F59E0B"),
        ("overview_health_at_risk", "#DC2626"),
        ("overview_health_critical", "#DC2626"),
    ):
        assert placements[name]["widgetStyle"]["backgroundColor"] == "#F8FAFC"
        assert placements[name]["widgetStyle"]["borderColor"] == accent
        assert placements[name]["widgetStyle"]["borderEdges"] == ["all"]

    for chart_name in (
        "overview_chart_arr_risk",
        "overview_chart_owner_attention",
    ):
        chart = dashboard["widgets"][chart_name]["parameters"]
        assert chart["legend"]["show"] is False
        assert chart["title"]["fontSize"] == 14
        assert chart["title"]["subtitleFontSize"] == 11

    table = dashboard["widgets"]["overview_table_risk"]["parameters"]
    assert table["header"] == {
        "backgroundColor": "#F1F5F9",
        "fontColor": "#0F172A",
        "fontSize": 11,
    }
    assert table["cell"]["fontColor"] == "#334155"
    assert table["verticalPadding"] == 8
    assert table["numberOfLines"] == 1


def test_overview_mobile_layout_map_is_idempotent_and_scoped(
    tmp_path: Path,
) -> None:
    first_output = tmp_path / "Landing_Page.mobile.first.wdash"
    first_report = _run(LANDING_PATH, first_output, tmp_path, LAYOUT_MOBILE)
    second_output = tmp_path / "Landing_Page.mobile.second.wdash"
    second_report = _run(first_output, second_output, tmp_path, LAYOUT_MOBILE)

    assert len(first_report["changes"]) == 8
    assert second_report["changes"] == []
    assert first_output.read_bytes() == second_output.read_bytes()

    dashboard = _load(first_output)
    placements = _overview_placements(dashboard, "Mobile")
    for name, expected in OVERVIEW_MOBILE_LAYOUT.items():
        placement = placements[name]
        actual = tuple(
            placement[key] for key in ("column", "row", "colspan", "rowspan")
        )
        assert actual == expected


def test_overview_scope_validator_rejects_non_overview_widget_change() -> None:
    original = _load(LANDING_PATH)
    styled = copy.deepcopy(original)
    styled["widgets"]["risk_nav_risk"]["parameters"]["fontSize"] += 1

    violations = overview_scope_violations(original, styled)

    assert len(violations) == 1
    assert violations[0]["path"] == "$.widgets.risk_nav_risk"
