from __future__ import annotations

import json
import re
from pathlib import Path
from xml.etree import ElementTree as ET

import polars as pl

from salesforce.scripts.upload_salesforce_crma import build_external_data_metadata


ROOT = Path(__file__).resolve().parents[2]
SALESFORCE_DIR = ROOT / "salesforce"
WAVE_DIR = SALESFORCE_DIR / "force-app" / "main" / "default" / "wave"
XMD_NS = {"m": "http://soap.sforce.com/2006/04/metadata"}

DASHBOARDS = {
    "Landing_Page",
    "At_Risk_Account_Dashboard",
    "Expansion_Pipeline_Dashboard",
    "Retention_Cohort_Dashboard",
}
DATASETS = {
    "Customer_360",
    "Churn_Risk_Accounts",
    "Retention_Cohorts",
    "LTV_By_Segment",
    "Expansion_Opportunities",
    "Support_Impact_On_Churn",
}


def _dashboard(name: str) -> dict:
    return json.loads((WAVE_DIR / f"{name}.wdash").read_text(encoding="utf-8"))


def _xmd(name: str) -> ET.Element:
    return ET.parse(WAVE_DIR / f"{name}.xmd-meta.xml").getroot()


def test_required_salesforce_assets_and_api_version_exist() -> None:
    assert json.loads((SALESFORCE_DIR / "sfdx-project.json").read_text())[
        "sourceApiVersion"
    ] == "66.0"

    assert {
        path.stem for path in WAVE_DIR.glob("*.wdash")
    } == DASHBOARDS
    assert {
        path.name.removesuffix(".xmd-meta.xml")
        for path in WAVE_DIR.glob("*.xmd-meta.xml")
    } == DATASETS

    package = ET.parse(SALESFORCE_DIR / "manifest" / "package.xml")
    package_text = ET.tostring(package.getroot(), encoding="unicode")
    for asset in DASHBOARDS | DATASETS | {"Customer_Success_Command_Center"}:
        assert asset in package_text


def test_dashboards_have_bounded_desktop_and_mobile_layouts() -> None:
    for dashboard_name in DASHBOARDS:
        dashboard = _dashboard(dashboard_name)
        layouts = {layout["name"]: layout for layout in dashboard["gridLayouts"]}

        assert set(layouts) == {"Default", "Mobile"}
        assert layouts["Default"]["numColumns"] == 48
        assert layouts["Default"]["maxWidth"] == 1600
        assert layouts["Mobile"]["numColumns"] == 12
        assert dashboard["gridLayouts"][0]["style"]["backgroundColor"] == "#F7F8FA"

        for layout in layouts.values():
            columns = layout["numColumns"]
            for page in layout["pages"]:
                for placement in page["widgets"]:
                    assert placement["column"] >= 0
                    assert placement["colspan"] > 0
                    assert placement["column"] + placement["colspan"] <= columns
                    assert placement["row"] >= 0
                    assert placement["rowspan"] > 0
                    assert placement["name"] in dashboard["widgets"]


def test_command_center_pages_links_and_snapshot_note_are_present() -> None:
    dashboard = _dashboard("Landing_Page")
    expected_pages = [
        "Executive Overview",
        "Health & Risk",
        "Retention & LTV",
        "Expansion",
        "Support Impact",
        "Metric Guide",
    ]
    for layout in dashboard["gridLayouts"]:
        assert [page["label"] for page in layout["pages"]] == expected_pages

    serialized = json.dumps(dashboard)
    assert serialized.count("Illustrative 2025 portfolio snapshot") >= 6
    for destination in (
        "At_Risk_Account_Dashboard",
        "Expansion_Pipeline_Dashboard",
        "Retention_Cohort_Dashboard",
    ):
        assert destination in serialized

    for detail_name in DASHBOARDS - {"Landing_Page"}:
        detail = json.dumps(_dashboard(detail_name))
        assert "Landing_Page" in detail
        assert "Reset filters" in detail


def test_widget_steps_and_dataset_references_are_valid() -> None:
    referenced_datasets: set[str] = set()
    for dashboard_name in DASHBOARDS:
        dashboard = _dashboard(dashboard_name)
        steps = dashboard["steps"]

        for widget in dashboard["widgets"].values():
            step_name = widget.get("parameters", {}).get("step")
            if step_name:
                assert step_name in steps
            if widget["type"] == "table":
                assert steps[step_name]["type"] == "grain"

        for step in steps.values():
            for dataset in step.get("datasets", []):
                referenced_datasets.add(dataset["name"])
                assert dataset["name"] in DATASETS

    assert "LTV_By_Segment" in referenced_datasets
    assert "LTV_By_Segment" in json.dumps(_dashboard("Landing_Page"))
    assert "LTV_By_Segment" in json.dumps(
        _dashboard("Retention_Cohort_Dashboard")
    )


def test_arr_steps_use_current_revenue_and_annualize_it() -> None:
    landing = _dashboard("Landing_Page")
    current_arr = landing["steps"]["kpi_current_arr"]
    at_risk_arr = landing["steps"]["kpi_at_risk_arr"]

    assert current_arr["type"] == "saql"
    assert "sum(q.'Current_MRR__c') * 12" in current_arr["query"]
    assert "Current_ARR" in current_arr["query"]
    assert "sum(q.'Current_MRR__c') * 12" in at_risk_arr["query"]
    assert '"Critical", "At Risk"' in at_risk_arr["query"]
    assert "filter q by 'Risk_Band__c'" in at_risk_arr["query"]
    assert "filter q by q.'Risk_Band__c'" not in at_risk_arr["query"]

    customer_360 = pl.read_csv(ROOT / "data" / "salesforce_crma" / "Customer_360.csv")
    current_arr_value = customer_360["Current_MRR__c"].sum() * 12
    at_risk_arr_value = (
        customer_360.filter(
            pl.col("Risk_Band__c").is_in(["Critical", "At Risk"])
        )["Current_MRR__c"].sum()
        * 12
    )
    assert customer_360.height == 100
    assert current_arr_value > 7_000_000
    assert 0 < at_risk_arr_value < current_arr_value * 0.25


def test_xmd_labels_and_percentage_formats_are_readable() -> None:
    for dataset in DATASETS:
        root = _xmd(dataset)
        fields = root.findall("m:dimensions", XMD_NS) + root.findall(
            "m:measures", XMD_NS
        )
        assert fields
        for field in fields:
            api_name = field.findtext("m:field", namespaces=XMD_NS)
            label = field.findtext("m:label", namespaces=XMD_NS)
            assert api_name
            assert label
            assert "__c" not in label

    for dataset in ("Churn_Risk_Accounts", "Expansion_Opportunities"):
        fields = {
            node.findtext("m:field", namespaces=XMD_NS)
            for node in _xmd(dataset).findall("m:dimensions", XMD_NS)
        }
        assert "Customer_Success_Manager__c" in fields

    support = _xmd("Support_Impact_On_Churn")
    resolution = next(
        measure
        for measure in support.findall("m:measures", XMD_NS)
        if measure.findtext("m:field", namespaces=XMD_NS)
        == "Avg_Resolution_Rate__c"
    )
    assert (
        resolution.findtext("m:formatCustomFormat", namespaces=XMD_NS)
        == '["0.0%",1]'
    )


def test_metadata_contains_no_org_specific_identity_or_sharing_data() -> None:
    contents = "\n".join(
        path.read_text(encoding="utf-8")
        for path in SALESFORCE_DIR.rglob("*")
        if path.is_file()
        and "__pycache__" not in path.parts
        and "tests" not in path.parts
        and "node_modules" not in path.parts
        and "output" not in path.parts
        and path.suffix != ".pyc"
    )
    assert "<shares>" not in contents
    assert not re.search(r"\b00D[A-Za-z0-9]{12,15}\b", contents)
    assert not re.search(r"\b005[A-Za-z0-9]{12,15}\b", contents)
    assert not re.search(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}", contents)


def test_external_data_metadata_matches_exported_fields() -> None:
    for dataset in ("Churn_Risk_Accounts", "Expansion_Opportunities"):
        metadata = build_external_data_metadata(
            dataset,
            ROOT / "data" / "salesforce_crma" / f"{dataset}.csv",
            ROOT
            / "data"
            / "salesforce_crma"
            / "schemas"
            / f"{dataset}.schema.json",
        )
        metadata_fields = [
            field["name"] for field in metadata["objects"][0]["fields"]
        ]
        csv_fields = pl.read_csv(
            ROOT / "data" / "salesforce_crma" / f"{dataset}.csv"
        ).columns
        assert metadata_fields == csv_fields
        assert "Customer_Success_Manager__c" in metadata_fields


def test_filters_and_time_dimensions_render_as_supported_dashboard_fields() -> None:
    for dashboard_name in DASHBOARDS:
        dashboard = _dashboard(dashboard_name)
        for widget_name, widget in dashboard["widgets"].items():
            if widget["type"] == "listselector":
                assert widget["parameters"]["compact"] is False, widget_name

    checks = (
        ("Landing_Page", ("retention_heatmap", "retention_trend"), "Month_Since_Acquisition__c"),
        (
            "Retention_Cohort_Dashboard",
            ("ret_detail_heatmap", "ret_detail_trend"),
            "Month_Since_Acquisition__c",
        ),
        ("Landing_Page", ("exp_timeline",), "Close_Month__c"),
        ("Expansion_Pipeline_Dashboard", ("exp_detail_timeline",), "Close_Month__c"),
    )
    for dashboard_name, step_names, field in checks:
        dashboard = _dashboard(dashboard_name)
        for step_name in step_names:
            query = json.loads(dashboard["steps"][step_name]["query"]["query"])
            assert field in query["groups"]


def test_drilldown_tables_fill_the_desktop_canvas() -> None:
    table_widgets = (
        ("At_Risk_Account_Dashboard", "risk_detail_table"),
        ("Expansion_Pipeline_Dashboard", "exp_detail_table"),
        ("Retention_Cohort_Dashboard", "ret_detail_table_widget"),
    )
    for dashboard_name, widget_name in table_widgets:
        parameters = _dashboard(dashboard_name)["widgets"][widget_name]["parameters"]
        rendered_width = sum(
            column["parameters"]["width"]
            for column in parameters["columnProperties"].values()
        )
        assert rendered_width >= 1500


def test_retention_heatmaps_use_readable_quarter_cohorts() -> None:
    for dashboard_name, step_name in (
        ("Landing_Page", "retention_heatmap"),
        ("Retention_Cohort_Dashboard", "ret_detail_heatmap"),
    ):
        dashboard = _dashboard(dashboard_name)
        query = json.loads(dashboard["steps"][step_name]["query"]["query"])
        assert query["groups"] == [
            "Cohort_Quarter__c",
            "Month_Since_Acquisition__c",
        ]
        widget_name = (
            "retention_chart_heatmap"
            if dashboard_name == "Landing_Page"
            else "ret_detail_chart_heatmap"
        )
        assert dashboard["widgets"][widget_name]["parameters"]["columnMap"]["y"] == [
            "Cohort_Quarter__c"
        ]
