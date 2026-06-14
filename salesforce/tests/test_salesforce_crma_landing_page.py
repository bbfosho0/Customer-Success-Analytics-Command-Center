from __future__ import annotations

import json
import shutil
from pathlib import Path
from xml.etree import ElementTree as ET

from salesforce.scripts import build_salesforce_crma_metadata as metadata_builder


ROOT = Path(__file__).resolve().parents[2]
SALESFORCE_DIR = ROOT / "salesforce"
WAVE_DIR = SALESFORCE_DIR / "force-app" / "main" / "default" / "wave"
LANDING_PATH = WAVE_DIR / "Landing_Page.wdash"
XMD_NS = {"m": "http://soap.sforce.com/2006/04/metadata"}

EXPECTED_PAGES = [
    "Executive Overview",
    "Health & Risk",
    "Retention & LTV",
    "Expansion",
    "Support Impact",
    "Metric Guide",
]
EXPECTED_DESTINATIONS = {
    "At_Risk_Account_Dashboard",
    "Retention_Cohort_Dashboard",
    "Expansion_Pipeline_Dashboard",
}


def _landing() -> dict:
    return json.loads(LANDING_PATH.read_text(encoding="utf-8"))


def _layouts(dashboard: dict) -> dict[str, dict]:
    return {layout["name"]: layout for layout in dashboard["gridLayouts"]}


def _page(layout: dict, name: str) -> dict:
    return next(page for page in layout["pages"] if page["name"] == name)


def test_landing_has_six_bounded_desktop_and_mobile_pages() -> None:
    dashboard = _landing()
    layouts = _layouts(dashboard)

    assert layouts["Default"]["numColumns"] == 48
    assert layouts["Default"]["maxWidth"] == 1600
    assert layouts["Default"]["selectors"] == ["minWidth(600)"]
    assert layouts["Mobile"]["numColumns"] == 12
    assert layouts["Mobile"]["selectors"] == ["maxWidth(599)"]
    assert [page["label"] for page in layouts["Default"]["pages"]] == EXPECTED_PAGES
    assert [page["label"] for page in layouts["Mobile"]["pages"]] == EXPECTED_PAGES

    for layout in layouts.values():
        for page in layout["pages"]:
            for placement in page["widgets"]:
                assert placement["column"] >= 0
                assert placement["colspan"] > 0
                assert placement["column"] + placement["colspan"] <= layout["numColumns"]
                assert placement["row"] >= 0
                assert placement["rowspan"] > 0
                assert placement["name"] in dashboard["widgets"]


def test_every_page_has_persistent_drill_links_and_toolbar_reset() -> None:
    dashboard = _landing()
    widgets = dashboard["widgets"]

    for layout in dashboard["gridLayouts"]:
        for page in layout["pages"]:
            placements = {placement["name"]: placement for placement in page["widgets"]}
            destinations = {
                widgets[name]["parameters"]["destinationLink"]["name"]
                for name in placements
                if widgets[name]["parameters"].get("destinationType") == "dashboard"
                and name.endswith(("_nav_risk", "_nav_retention", "_nav_expansion"))
            }
            assert destinations == EXPECTED_DESTINATIONS

            reset_names = [name for name in placements if name.endswith("_reset")]
            assert len(reset_names) == 1
            reset_row = placements[reset_names[0]]["row"]
            if page["name"] == "cscc-overview":
                assert reset_row == (10 if layout["name"] == "Default" else 43)
                surface_name = "overview_present_reset_surface"
                label_name = "overview_present_reset_label"
                assert surface_name in placements
                assert label_name in placements
                assert placements[surface_name]["row"] == reset_row
                assert placements[label_name]["row"] == reset_row
            else:
                assert reset_row >= (11 if layout["name"] == "Default" else 15)


def test_widget_steps_and_grain_order_fields_are_valid() -> None:
    dashboard = _landing()
    steps = dashboard["steps"]

    for widget in dashboard["widgets"].values():
        step_name = widget["parameters"].get("step")
        if step_name:
            assert step_name in steps

    for step in steps.values():
        if step["type"] != "grain":
            continue
        query = json.loads(step["query"]["query"])
        selected_fields = set(query["values"])
        for order_field, _direction in query["order"]:
            assert order_field in selected_fields


def test_overview_queue_is_compact_readable_and_action_menu_free() -> None:
    dashboard = _landing()
    desktop_query = json.loads(
        dashboard["steps"]["overview_top_risk"]["query"]["query"]
    )
    mobile_query = json.loads(
        dashboard["steps"]["overview_top_risk_mobile"]["query"]["query"]
    )

    assert desktop_query["values"] == [
        "Priority_Rank__c",
        "Account_Name__c",
        "Risk_Band__c",
        "MRR__c",
        "Customer_Success_Manager__c",
        "Recommended_Action__c",
    ]
    assert mobile_query["values"] == [
        "Priority_Rank__c",
        "Account_Name__c",
        "Risk_Band__c",
        "Customer_Success_Manager__c",
        "Recommended_Action__c",
    ]

    desktop_columns = [
        "Account_Name__c",
        "Risk_Band__c",
        "MRR__c",
        "Customer_Success_Manager__c",
        "Recommended_Action__c",
    ]
    mobile_columns = [
        "Account_Name__c",
        "Risk_Band__c",
        "Customer_Success_Manager__c",
        "Recommended_Action__c",
    ]
    for name, columns in (
        ("overview_table_risk", desktop_columns),
        ("overview_table_risk_mobile", mobile_columns),
    ):
        parameters = dashboard["widgets"][name]["parameters"]
        assert parameters["columns"] == columns
        assert set(parameters["columnProperties"]) == set(columns)
        assert all(
            column["parameters"]["width"] > 0
            for column in parameters["columnProperties"].values()
        )
        assert parameters["showActionMenu"] is False

    mobile_widths = dashboard["widgets"]["overview_table_risk_mobile"]["parameters"][
        "columnProperties"
    ]
    desktop_widths = dashboard["widgets"]["overview_table_risk"]["parameters"][
        "columnProperties"
    ]
    assert (
        sum(column["parameters"]["width"] for column in desktop_widths.values())
        <= 1033
    )
    assert sum(column["parameters"]["width"] for column in mobile_widths.values()) <= 342
    assert (
        dashboard["widgets"]["overview_table_risk_mobile"]["parameters"]["header"][
            "fontSize"
        ]
        >= 11
    )
    assert "Priority_Rank__c" not in desktop_columns
    assert "Priority_Rank__c" not in mobile_columns

    for name, widget in dashboard["widgets"].items():
        if name.startswith("overview_") and "showActionMenu" in widget["parameters"]:
            assert widget["parameters"]["showActionMenu"] is False

    xmd = ET.parse(WAVE_DIR / "Churn_Risk_Accounts.xmd-meta.xml").getroot()
    labels = {
        node.findtext("m:field", namespaces=XMD_NS): node.findtext(
            "m:label", namespaces=XMD_NS
        )
        for node in xmd.findall("m:dimensions", XMD_NS)
        + xmd.findall("m:measures", XMD_NS)
    }
    for field in desktop_columns:
        assert labels[field]
        assert "__c" not in labels[field]


def test_overview_uses_compact_header_semantic_tiles_and_split_bottom_section() -> None:
    dashboard = _landing()
    layouts = _layouts(dashboard)
    desktop = {
        placement["name"]: placement
        for placement in _page(layouts["Default"], "cscc-overview")["widgets"]
    }
    mobile = {
        placement["name"]: placement
        for placement in _page(layouts["Mobile"], "cscc-overview")["widgets"]
    }

    assert desktop["overview_header_container"]["rowspan"] == 8
    assert mobile["overview_header_container"]["rowspan"] == 13
    assert desktop["overview_filter_container"]["colspan"] == 48
    assert desktop["overview_filter_container"]["rowspan"] == 8
    assert mobile["overview_filter_container"]["colspan"] == 12
    assert mobile["overview_filter_container"]["rowspan"] == 35
    for name in (
        "overview_selector_csm",
        "overview_selector_segment",
        "overview_selector_region",
        "overview_selector_plan",
    ):
        assert desktop[name]["rowspan"] == 6
        assert mobile[name]["rowspan"] == 6
        assert dashboard["widgets"][name]["parameters"]["compact"] is False
    assert desktop["overview_chart_arr_risk"]["colspan"] == 30
    assert desktop["overview_present_queue_card"]["colspan"] == 31
    assert desktop["overview_table_risk"]["colspan"] == 29
    assert desktop["overview_chart_owner_attention"]["column"] == 31
    assert desktop["overview_chart_owner_attention"]["colspan"] == 17
    assert desktop["overview_queue_heading"]["column"] == 1
    assert desktop["overview_table_risk"]["column"] == 1
    assert mobile["overview_present_queue_card"]["colspan"] == 12
    assert mobile["overview_table_risk_mobile"]["column"] == 1

    tile_steps = {
        "overview_health_healthy": "overview_count_healthy",
        "overview_health_watch": "overview_count_watch",
        "overview_health_at_risk": "overview_count_at_risk",
        "overview_health_critical": "overview_count_critical",
    }
    for widget_name, step_name in tile_steps.items():
        assert widget_name in desktop
        assert widget_name in mobile
        assert dashboard["widgets"][widget_name]["parameters"]["step"] == step_name

    assert "overview_chart_health" not in dashboard["widgets"]
    assert "overview_health_distribution" not in dashboard["steps"]


def test_overview_uses_one_consistent_light_surface_system() -> None:
    dashboard = _landing()
    layouts = _layouts(dashboard)

    for layout_name in ("Default", "Mobile"):
        placements = {
            placement["name"]: placement
            for placement in _page(layouts[layout_name], "cscc-overview")["widgets"]
        }
        assert placements["overview_header_container"]["widgetStyle"][
            "backgroundColor"
        ] == "#0B1F3A"
        assert placements["overview_filter_container"]["widgetStyle"][
            "backgroundColor"
        ] == "#FBFCFE"
        assert placements["overview_kpi_arr_number"]["widgetStyle"]["backgroundColor"] == "#0B1F3A"
        for name in (
            "overview_kpi_customers_number",
            "overview_kpi_health_number",
            "overview_kpi_risk_number",
            "overview_kpi_expansion_number",
        ):
            assert placements[name]["widgetStyle"]["backgroundColor"] == "#FFFFFF"

        for name in (
            "overview_health_healthy",
            "overview_health_watch",
            "overview_health_at_risk",
            "overview_health_critical",
        ):
            assert placements[name]["widgetStyle"]["backgroundColor"] == "#F8FAFC"

        for name in (
            "overview_selector_csm",
            "overview_selector_segment",
            "overview_selector_region",
            "overview_selector_plan",
        ):
            assert placements[name]["widgetStyle"]["borderEdges"] == ["all"]
            assert placements[name]["widgetStyle"]["backgroundColor"] == "#FFFFFF"

        assert placements["overview_present_reset_surface"]["widgetStyle"]["backgroundColor"] == "#FFFFFF"
        assert placements["overview_reset"]["widgetStyle"]["backgroundColor"] == "#F8FAFC"
        for name in (
            "overview_present_nav_risk_surface",
            "overview_present_nav_retention_surface",
            "overview_present_nav_expansion_surface",
        ):
            assert placements[name]["widgetStyle"]["backgroundColor"] == "#1E293B"
        for name in (
            "overview_nav_risk",
            "overview_nav_retention",
            "overview_nav_expansion",
        ):
            assert placements[name]["widgetStyle"]["backgroundColor"] == "#1E293B"
            assert dashboard["widgets"][name]["parameters"]["textColor"] == "#FFFFFF"

        assert placements["overview_present_queue_card"]["widgetStyle"]["backgroundColor"] == "#FFFFFF"
        assert placements["overview_present_queue_card"]["widgetStyle"]["borderEdges"] == ["all"]


def test_overview_owner_chart_groups_attention_mrr_by_csm() -> None:
    dashboard = _landing()
    query = json.loads(
        dashboard["steps"]["overview_owner_attention"]["query"]["query"]
    )
    widget = dashboard["widgets"]["overview_chart_owner_attention"]["parameters"]

    assert query == {
        "measures": [["sum", "MRR__c"]],
        "groups": ["Customer_Success_Manager__c"],
        "filters": [
            [
                "Risk_Band__c",
                ["Critical", "At Risk", "Watch"],
                "in",
            ]
        ],
        "order": [["sum_MRR__c", {"ascending": False}]],
    }
    assert widget["visualizationType"] == "hbar"
    assert widget["title"]["label"] == "Revenue Requiring Attention by Owner"
    assert widget["showActionMenu"] is False


def test_landing_manifest_contains_only_the_command_center() -> None:
    root = ET.parse(SALESFORCE_DIR / "manifest" / "landing-page.xml").getroot()
    namespace = {"m": "http://soap.sforce.com/2006/04/metadata"}
    types = root.findall("m:types", namespace)

    assert len(types) == 1
    assert types[0].findtext("m:name", namespaces=namespace) == "WaveDashboard"
    assert [
        member.text for member in types[0].findall("m:members", namespace)
    ] == ["Landing_Page"]
    assert root.findtext("m:version", namespaces=namespace) == "66.0"


def test_landing_only_build_does_not_rewrite_drilldowns_or_xmd(
    tmp_path: Path,
    monkeypatch,
) -> None:
    isolated_wave_dir = tmp_path / "wave"
    shutil.copytree(WAVE_DIR, isolated_wave_dir)
    protected_paths = [
        path
        for path in isolated_wave_dir.iterdir()
        if path.name != "Landing_Page.wdash"
    ]
    before = {path.name: path.read_bytes() for path in protected_paths}

    monkeypatch.setattr(metadata_builder, "WAVE_DIR", isolated_wave_dir)
    metadata_builder.build(landing_only=True)

    assert (isolated_wave_dir / "Landing_Page.wdash").is_file()
    assert {path.name: path.read_bytes() for path in protected_paths} == before


def test_overview_only_preserves_other_pages_widgets_steps_and_files(
    tmp_path: Path,
    monkeypatch,
) -> None:
    isolated_wave_dir = tmp_path / "wave"
    shutil.copytree(WAVE_DIR, isolated_wave_dir)
    landing_path = isolated_wave_dir / "Landing_Page.wdash"
    before = json.loads(landing_path.read_text(encoding="utf-8"))
    protected_paths = [
        path for path in isolated_wave_dir.iterdir() if path.name != landing_path.name
    ]
    protected_before = {path.name: path.read_bytes() for path in protected_paths}

    monkeypatch.setattr(metadata_builder, "WAVE_DIR", isolated_wave_dir)
    metadata_builder.build(overview_only=True)
    after = json.loads(landing_path.read_text(encoding="utf-8"))

    before_layouts = _layouts(before)
    after_layouts = _layouts(after)
    non_overview_widgets: set[str] = set()
    for layout_name in before_layouts:
        for before_page in before_layouts[layout_name]["pages"]:
            if before_page["name"] == "cscc-overview":
                continue
            after_page = _page(after_layouts[layout_name], before_page["name"])
            assert after_page == before_page
            non_overview_widgets.update(
                placement["name"] for placement in before_page["widgets"]
            )

    non_overview_steps = {
        before["widgets"][name]["parameters"]["step"]
        for name in non_overview_widgets
        if before["widgets"][name]["parameters"].get("step")
    }
    for name in non_overview_widgets:
        assert after["widgets"][name] == before["widgets"][name]
    for name in non_overview_steps:
        assert after["steps"][name] == before["steps"][name]
    assert {path.name: path.read_bytes() for path in protected_paths} == protected_before


def test_overview_only_build_is_idempotent(tmp_path: Path, monkeypatch) -> None:
    isolated_wave_dir = tmp_path / "wave"
    shutil.copytree(WAVE_DIR, isolated_wave_dir)
    landing_path = isolated_wave_dir / "Landing_Page.wdash"
    monkeypatch.setattr(metadata_builder, "WAVE_DIR", isolated_wave_dir)

    metadata_builder.build(overview_only=True)
    first = landing_path.read_bytes()
    metadata_builder.build(overview_only=True)

    assert landing_path.read_bytes() == first
