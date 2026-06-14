from __future__ import annotations

import argparse
import copy
import json
import sys
from pathlib import Path
from typing import Any

if __package__ in (None, ""):
    from inventory_crma_dashboard import classify_widget, safe_load_json
else:
    from .inventory_crma_dashboard import classify_widget, safe_load_json


SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR.parent / "output"
DEFAULT_DESIGN_SYSTEM = SCRIPT_DIR / "design-system.json"
DEFAULT_REPORT_JSON = OUTPUT_DIR / "style_change_report.json"
DEFAULT_REPORT_MD = OUTPUT_DIR / "style_change_report.md"

STYLE_ONLY = "style-only"
LAYOUT_DESKTOP = "layout-desktop"
LAYOUT_TABLET = "layout-tablet"
LAYOUT_MOBILE = "layout-mobile"
VALID_MODES = (STYLE_ONLY, LAYOUT_DESKTOP, LAYOUT_TABLET, LAYOUT_MOBILE)
OVERVIEW_PAGE = "cscc-overview"
OVERVIEW_PREFIX = "overview_"

OVERVIEW_MOBILE_LAYOUT = {
    "overview_header_container": (0, 0, 12, 13),
    "overview_title_mobile": (1, 1, 10, 3),
    "overview_nav_risk": (1, 8, 3, 3),
    "overview_nav_retention": (4, 8, 4, 3),
    "overview_nav_expansion": (8, 8, 3, 3),
    "overview_filter_container": (0, 14, 12, 35),
    "overview_selector_csm": (1, 15, 10, 6),
    "overview_selector_segment": (1, 22, 10, 6),
    "overview_selector_region": (1, 29, 10, 6),
    "overview_selector_plan": (1, 36, 10, 6),
    "overview_reset": (1, 43, 10, 5),
    "overview_kpi_arr_number": (0, 50, 12, 7),
    "overview_kpi_customers_number": (0, 58, 6, 6),
    "overview_kpi_health_number": (6, 58, 6, 6),
    "overview_kpi_risk_number": (0, 65, 6, 6),
    "overview_kpi_expansion_number": (6, 65, 6, 6),
    "overview_chart_arr_risk": (0, 72, 12, 22),
    "overview_health_container": (0, 95, 12, 20),
    "overview_health_heading": (1, 96, 10, 4),
    "overview_health_healthy": (1, 101, 5, 6),
    "overview_health_watch": (6, 101, 5, 6),
    "overview_health_at_risk": (1, 108, 5, 6),
    "overview_health_critical": (6, 108, 5, 6),
    "overview_chart_owner_attention": (0, 116, 12, 22),
    "overview_queue_heading": (0, 139, 12, 4),
    "overview_table_risk_mobile": (0, 143, 12, 34),
}

FORBIDDEN_TOP_LEVEL_KEYS = (
    "dataSourceLinksInfo",
    "filters",
    "steps",
)
FORBIDDEN_WIDGET_PARAM_KEYS = {
    "columns",
    "columnMap",
    "customBulkActions",
    "destinationLink",
    "destinationType",
    "includeState",
    "interactions",
    "measureField",
    "step",
}
FORBIDDEN_WIDGET_KEYS = {
    "type",
}
VISUAL_KEY_NAMES = {
    "backgroundColor",
    "borderColor",
    "borderEdges",
    "borderRadius",
    "borderWidth",
    "fontColor",
    "fontSize",
    "highColor",
    "innerMajorBorderColor",
    "innerMinorBorderColor",
    "labelColor",
    "lowColor",
    "numberColor",
    "numberSize",
    "show",
    "showAxis",
    "showHeader",
    "showTitle",
    "textAlignment",
    "textColor",
    "title",
    "titleColor",
    "titleSize",
    "titleWeight",
    "tooltipStyle",
    "valueColor",
    "verticalPadding",
    "numberOfLines",
    "maxColumnWidth",
    "minColumnWidth",
}
LAYOUT_KEY_NAMES = {
    "row",
    "column",
    "rowspan",
    "colspan",
    "width",
    "height",
    "x",
    "y",
    "w",
    "h",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Apply a controlled visual design system to a CRM Analytics dashboard JSON."
    )
    parser.add_argument("dashboard_json", help="Path to the dashboard .wdash JSON file.")
    parser.add_argument(
        "--design-system",
        default=str(DEFAULT_DESIGN_SYSTEM),
        help="Path to design-system.json.",
    )
    parser.add_argument(
        "--mode",
        required=True,
        choices=VALID_MODES,
        help="Compiler mode.",
    )
    parser.add_argument(
        "--overview-only",
        action="store_true",
        help="Limit changes to overview_* widgets and cscc-overview placements.",
    )
    parser.add_argument(
        "--output",
        help="Path for the styled dashboard JSON output. Defaults to salesforce/output/<stem>.<mode>.wdash",
    )
    parser.add_argument(
        "--report-json",
        default=str(DEFAULT_REPORT_JSON),
        help="Path for the structured style change report.",
    )
    parser.add_argument(
        "--report-md",
        default=str(DEFAULT_REPORT_MD),
        help="Path for the markdown style change report.",
    )
    return parser.parse_args()


def safe_load_design_system(path: Path) -> dict[str, Any]:
    data = safe_load_json(path)
    if not isinstance(data.get("tokens"), dict):
        raise RuntimeError("Design system JSON is missing top-level 'tokens'.")
    return data


def default_output_path(dashboard_path: Path, mode: str) -> Path:
    return OUTPUT_DIR / f"{dashboard_path.stem}.{mode}.wdash"


def json_deep_equal(left: Any, right: Any) -> bool:
    return json.dumps(left, sort_keys=True) == json.dumps(right, sort_keys=True)


def format_px(value: str) -> int:
    return int(str(value).replace("px", "").strip())


def set_if_changed(
    target: dict[str, Any],
    key: str,
    new_value: Any,
    path: str,
    reason: str,
    change_type: str,
    changes: list[dict[str, Any]],
) -> None:
    old_value = target.get(key)
    if old_value == new_value:
        return
    target[key] = new_value
    changes.append(
        {
            "path": path,
            "oldValue": old_value,
            "newValue": new_value,
            "reason": reason,
            "changeType": change_type,
        }
    )


def collect_allowed_keys(dashboard: dict[str, Any]) -> tuple[set[str], set[str]]:
    visual_keys: set[str] = set()
    layout_keys: set[str] = set()

    def walk(value: Any) -> None:
        if isinstance(value, dict):
            for key, nested in value.items():
                if key in VISUAL_KEY_NAMES:
                    visual_keys.add(key)
                if key in LAYOUT_KEY_NAMES:
                    layout_keys.add(key)
                walk(nested)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(dashboard)
    return visual_keys, layout_keys


def collect_widget_placements(
    dashboard: dict[str, Any],
) -> dict[str, list[tuple[dict[str, Any], str, str, str]]]:
    placements: dict[str, list[tuple[dict[str, Any], str, str, str]]] = {}
    for layout_index, layout in enumerate(dashboard.get("gridLayouts", [])):
        if not isinstance(layout, dict):
            continue
        layout_name = str(layout.get("name"))
        for page_index, page in enumerate(layout.get("pages", [])):
            if not isinstance(page, dict):
                continue
            page_name = str(page.get("name"))
            for widget_index, widget in enumerate(page.get("widgets", [])):
                if not isinstance(widget, dict):
                    continue
                name = widget.get("name")
                if not name:
                    continue
                placements.setdefault(str(name), []).append(
                    (
                        widget,
                        layout_name,
                        page_name,
                        f"$.gridLayouts[{layout_index}].pages[{page_index}].widgets[{widget_index}]",
                    )
                )
    return placements


def apply_global_style(
    dashboard: dict[str, Any],
    design_system: dict[str, Any],
    allowed_visual_keys: set[str],
    changes: list[dict[str, Any]],
) -> None:
    tokens = design_system["tokens"]["colors"]
    widget_style = dashboard.get("widgetStyle")
    if isinstance(widget_style, dict):
        if "backgroundColor" in allowed_visual_keys:
            set_if_changed(
                widget_style,
                "backgroundColor",
                tokens["cardBackground"],
                "$.widgetStyle.backgroundColor",
                "Apply global card background token",
                "style",
                changes,
            )
        if "borderColor" in allowed_visual_keys:
            set_if_changed(
                widget_style,
                "borderColor",
                tokens["border"],
                "$.widgetStyle.borderColor",
                "Apply global border color token",
                "style",
                changes,
            )
        if "borderRadius" in allowed_visual_keys:
            set_if_changed(
                widget_style,
                "borderRadius",
                format_px(design_system["tokens"]["cards"]["cardRadius"]),
                "$.widgetStyle.borderRadius",
                "Normalize global card radius",
                "style",
                changes,
            )
        if "tooltipStyle" in widget_style and isinstance(widget_style["tooltipStyle"], dict):
            tooltip = widget_style["tooltipStyle"]
            set_if_changed(
                tooltip,
                "backgroundColor",
                tokens["primaryAccent"],
                "$.widgetStyle.tooltipStyle.backgroundColor",
                "Apply tooltip background token",
                "style",
                changes,
            )
            set_if_changed(
                tooltip,
                "labelColor",
                tokens["mutedText"],
                "$.widgetStyle.tooltipStyle.labelColor",
                "Apply tooltip label color token",
                "style",
                changes,
            )
            set_if_changed(
                tooltip,
                "valueColor",
                tokens["cardBackground"],
                "$.widgetStyle.tooltipStyle.valueColor",
                "Apply tooltip value color token",
                "style",
                changes,
            )

    for layout_index, layout in enumerate(dashboard.get("gridLayouts", [])):
        if not isinstance(layout, dict):
            continue
        style = layout.get("style")
        if not isinstance(style, dict):
            continue
        set_if_changed(
            style,
            "backgroundColor",
            tokens["pageBackground"],
            f"$.gridLayouts[{layout_index}].style.backgroundColor",
            "Apply page background token",
            "style",
            changes,
        )
        set_if_changed(
            style,
            "gutterColor",
            tokens["pageBackground"],
            f"$.gridLayouts[{layout_index}].style.gutterColor",
            "Match gutter color to page background token",
            "style",
            changes,
        )


def widget_role_color(category: str, name: str, design_system: dict[str, Any]) -> str:
    colors = design_system["tokens"]["colors"]
    semantic = design_system["kpiSemanticColors"]
    lower_name = name.lower()

    if category == "header/title":
        return colors["primaryAccent"]
    if category == "container/background":
        if "header" in lower_name:
            return colors["primaryAccent"]
        return colors["cardBackground"]
    if category == "KPI/number":
        if any(token in lower_name for token in ("risk", "critical", "churn")):
            return colors[semantic["atRiskCriticalChurnRisk"]]
        if any(token in lower_name for token in ("watch", "warning")):
            return colors[semantic["watchMediumRisk"]]
        if any(token in lower_name for token in ("health", "healthy", "ready")):
            return colors[semantic["healthGoodStatus"]]
        if any(token in lower_name for token in ("pipeline", "expansion")):
            return colors[semantic["expansionPipeline"]]
        if any(token in lower_name for token in ("arr", "mrr", "revenue")):
            return colors[semantic["revenueArrMrr"]]
        return colors[semantic["customerCountNeutralCount"]]
    if category == "chart":
        if lower_name.startswith(OVERVIEW_PREFIX):
            return colors["neutralChartFill"]
        if any(token in lower_name for token in ("risk", "churn", "support")):
            return colors["negativeRiskMetric"]
        return colors["neutralChartFill"]
    if category == "table":
        return colors["secondaryText"]
    if category == "filter":
        return colors["primaryText"]
    return colors["secondaryText"]


def apply_widget_style(
    name: str,
    widget: dict[str, Any],
    category: str,
    design_system: dict[str, Any],
    allowed_visual_keys: set[str],
    changes: list[dict[str, Any]],
    skipped: list[dict[str, Any]],
) -> None:
    params = widget.get("parameters")
    if not isinstance(params, dict):
        skipped.append(
            {
                "widget": name,
                "path": "$.widgets." + name,
                "reason": "Widget has no parameters object to style.",
                "changeType": "style",
            }
        )
        return

    colors = design_system["tokens"]["colors"]
    typography = design_system["tokens"]["typography"]
    title_tokens = design_system["tokens"]["titles"]
    role_color = widget_role_color(category, name, design_system)
    widget_path = f"$.widgets.{name}.parameters"
    widget_type = str(widget.get("type", "")).lower()

    if widget_type == "number":
        if name == "overview_kpi_arr_number":
            number_size = 36
            title_color = "#CBD5E1"
            value_color = colors["cardBackground"]
        elif name.startswith("overview_health_"):
            number_size = 34
            title_color = colors["secondaryText"]
            value_color = role_color
        else:
            number_size = format_px(design_system["tokens"]["kpi"]["kpiValueSizeDesktop"])
            title_color = colors["secondaryText"]
            value_color = role_color
        for key, value, reason in (
            ("numberColor", value_color, "Apply KPI semantic value color"),
            ("numberSize", number_size, "Normalize KPI value size"),
            ("titleColor", title_color, "Normalize KPI label color"),
            ("titleSize", format_px(typography["sizes"]["kpiLabel"]), "Normalize KPI label size"),
            ("textAlignment", "left", "Normalize KPI alignment"),
        ):
            if key in params and key in allowed_visual_keys:
                set_if_changed(params, key, value, f"{widget_path}.{key}", reason, "style", changes)
            else:
                skipped.append({"widget": name, "path": f"{widget_path}.{key}", "reason": "Key not present in dashboard JSON.", "changeType": "style"})
        return

    if widget_type == "chart":
        for key, value, reason in (
            ("highColor", role_color, "Apply chart primary fill color"),
            ("lowColor", colors["border"], "Normalize chart low/reference color"),
        ):
            if key in params and key in allowed_visual_keys:
                set_if_changed(params, key, value, f"{widget_path}.{key}", reason, "style", changes)
        if isinstance(params.get("title"), dict):
            title = params["title"]
            mapping = (
                ("fontSize", format_px(design_system["tokens"]["charts"]["title"]["chartTitleSize"]), "Normalize chart title size"),
                ("subtitleFontSize", format_px(design_system["tokens"]["charts"]["title"]["chartSubtitleSize"]), "Normalize chart subtitle size"),
            )
            for key, value, reason in mapping:
                if key in title:
                    set_if_changed(title, key, value, f"{widget_path}.title.{key}", reason, "style", changes)
        for axis_key in ("measureAxis1", "measureAxis2", "dimensionAxis", "x", "y"):
            axis = params.get(axis_key)
            if isinstance(axis, dict):
                if "titleColor" in axis:
                    set_if_changed(axis, "titleColor", colors["mutedText"], f"{widget_path}.{axis_key}.titleColor", "Normalize axis title color", "style", changes)
                if "labelColor" in axis:
                    set_if_changed(axis, "labelColor", colors["mutedText"], f"{widget_path}.{axis_key}.labelColor", "Normalize axis label color", "style", changes)
                if "titleFontSize" in axis:
                    set_if_changed(axis, "titleFontSize", format_px(design_system["tokens"]["charts"]["axis"]["axisTitleSize"]), f"{widget_path}.{axis_key}.titleFontSize", "Normalize axis title size", "style", changes)
                if "fontSize" in axis:
                    set_if_changed(axis, "fontSize", format_px(design_system["tokens"]["charts"]["axis"]["axisLabelSize"]), f"{widget_path}.{axis_key}.fontSize", "Normalize axis label size", "style", changes)
        legend = params.get("legend")
        if isinstance(legend, dict) and "show" in legend:
            if params.get("columnMap", {}).get("split") in ([], None):
                set_if_changed(legend, "show", False, f"{widget_path}.legend.show", "Hide legend for single-series chart", "style", changes)
        return

    if widget_type == "table":
        body_lines = 3 if name.endswith("_mobile") else 1
        for key, value, reason in (
            ("borderColor", colors["border"], "Normalize table border color"),
            ("innerMajorBorderColor", colors["border"], "Normalize major table divider color"),
            ("innerMinorBorderColor", colors["gridlineColor"], "Normalize minor table divider color"),
            ("verticalPadding", 8, "Normalize table cell vertical padding"),
            ("numberOfLines", body_lines, "Normalize table body line count"),
        ):
            if key in params:
                set_if_changed(params, key, value, f"{widget_path}.{key}", reason, "style", changes)
        for nested_key, nested_color, nested_size, nested_weight, scope in (
            ("header", colors["tableHeaderBackground"], format_px(typography["sizes"]["tableHeader"]), design_system["tokens"]["tables"]["header"]["fontWeight"], "header"),
            ("cell", colors["cardBackground"], format_px(typography["sizes"]["tableBody"]), None, "body"),
        ):
            nested = params.get(nested_key)
            if isinstance(nested, dict):
                if "backgroundColor" in nested:
                    set_if_changed(nested, "backgroundColor", nested_color, f"{widget_path}.{nested_key}.backgroundColor", f"Normalize table {scope} background", "style", changes)
                if "fontColor" in nested:
                    target_color = colors["primaryText"] if nested_key == "header" else colors["secondaryText"]
                    set_if_changed(nested, "fontColor", target_color, f"{widget_path}.{nested_key}.fontColor", f"Normalize table {scope} text color", "style", changes)
                if "fontSize" in nested:
                    set_if_changed(nested, "fontSize", nested_size, f"{widget_path}.{nested_key}.fontSize", f"Normalize table {scope} font size", "style", changes)
        return

    if widget_type == "listselector":
        filter_style = params.get("filterStyle")
        if isinstance(filter_style, dict):
            if "titleColor" in filter_style:
                set_if_changed(filter_style, "titleColor", colors["secondaryText"], f"{widget_path}.filterStyle.titleColor", "Normalize filter title color", "style", changes)
            if "valueColor" in filter_style:
                set_if_changed(filter_style, "valueColor", colors["primaryText"], f"{widget_path}.filterStyle.valueColor", "Normalize filter value color", "style", changes)
        if "fontSize" in params:
            set_if_changed(params, "fontSize", format_px(typography["sizes"]["kpiLabel"]), f"{widget_path}.fontSize", "Normalize filter font size", "style", changes)
        return

    if widget_type == "text":
        if "textColor" in params:
            color = colors["cardBackground"] if category == "header/title" and "title" in name.lower() else colors["secondaryText"]
            set_if_changed(params, "textColor", color, f"{widget_path}.textColor", "Normalize text color", "style", changes)
        if "fontSize" in params:
            target_size = format_px(typography["sizes"]["chartTitle"]) if category == "header/title" else format_px(typography["sizes"]["tableBody"])
            set_if_changed(params, "fontSize", target_size, f"{widget_path}.fontSize", "Normalize text font size", "style", changes)
        return

    if widget_type == "link":
        if "textColor" in params:
            target_color = colors["cardBackground"] if "nav" in name.lower() else colors["primaryText"]
            set_if_changed(params, "textColor", target_color, f"{widget_path}.textColor", "Normalize link text color", "style", changes)
        if "fontSize" in params:
            target_size = 13 if "_nav_" in name else format_px(typography["sizes"]["kpiLabel"])
            set_if_changed(params, "fontSize", target_size, f"{widget_path}.fontSize", "Normalize link font size", "style", changes)
        return

    if widget_type == "container":
        skipped.append(
            {
                "widget": name,
                "path": widget_path,
                "reason": "Container styling is primarily handled through placement widgetStyle blocks.",
                "changeType": "style",
            }
        )
        return

    skipped.append(
        {
            "widget": name,
            "path": widget_path,
            "reason": f"Unknown or unsupported widget type '{widget_type}'.",
            "changeType": "style",
        }
    )


def apply_placement_style(
    name: str,
    placement: dict[str, Any],
    placement_path: str,
    category: str,
    design_system: dict[str, Any],
    changes: list[dict[str, Any]],
) -> None:
    style = placement.get("widgetStyle")
    if not isinstance(style, dict):
        return

    colors = design_system["tokens"]["colors"]
    card_radius = format_px(design_system["tokens"]["cards"]["cardRadius"])
    role_color = widget_role_color(category, name, design_system)
    path_prefix = placement_path + ".widgetStyle"
    component_colors = design_system["tokens"].get("componentColors", {})
    transparent = component_colors.get("transparent", "rgba(255, 255, 255, 0)")

    if name.endswith("_header_container"):
        target_background = colors["primaryAccent"]
        target_border = colors["primaryAccent"]
        target_edges = ["all"]
    elif name in {"overview_title", "overview_title_mobile", "overview_health_heading", "overview_queue_heading"}:
        target_background = transparent
        target_border = transparent
        target_edges = []
    elif "_nav_" in name:
        target_background = component_colors.get("navigationBackground", colors["primaryAccent"])
        target_border = component_colors.get("navigationBorder", colors["border"])
        target_edges = ["all"]
    elif name.endswith("_reset"):
        target_background = component_colors.get("secondaryActionBackground", colors["cardBackground"])
        target_border = component_colors.get("secondaryActionBorder", colors["border"])
        target_edges = ["all"]
    elif name.endswith("_filter_container"):
        target_background = component_colors.get("filterToolbarBackground", colors["cardBackground"])
        target_border = colors["border"]
        target_edges = ["all"]
    elif name.endswith("_health_container"):
        target_background = component_colors.get("subtlePanelBackground", colors["cardBackground"])
        target_border = colors["border"]
        target_edges = ["all"]
    else:
        target_background = colors["cardBackground"]
        target_border = colors["border"]
        target_edges = ["all"] if style.get("borderEdges", ["all"]) else style.get("borderEdges", [])

    if name.startswith("overview_health_") and name not in {"overview_health_heading", "overview_health_container"}:
        target_background = component_colors.get("healthTileBackground", colors["cardBackground"])
        target_border = role_color
        target_edges = ["all"]
        if "borderWidth" in style:
            set_if_changed(style, "borderWidth", 1, f"{path_prefix}.borderWidth", "Normalize health tile border width", "style", changes)
    elif category == "KPI/number" and name != "overview_kpi_arr_number":
        target_border = role_color
        target_edges = ["left"]
        if "borderWidth" in style:
            set_if_changed(style, "borderWidth", 4, f"{path_prefix}.borderWidth", "Normalize KPI accent border width", "style", changes)
    elif name == "overview_kpi_arr_number":
        target_background = colors["primaryAccent"]
        target_border = colors["primaryAccent"]
        target_edges = ["all"]
        if "borderWidth" in style:
            set_if_changed(style, "borderWidth", 1, f"{path_prefix}.borderWidth", "Normalize primary revenue KPI surface", "style", changes)

    if "backgroundColor" in style:
        set_if_changed(style, "backgroundColor", target_background, f"{path_prefix}.backgroundColor", "Normalize card background", "style", changes)
    if "borderColor" in style:
        set_if_changed(style, "borderColor", target_border, f"{path_prefix}.borderColor", "Normalize card border color", "style", changes)
    if "borderRadius" in style:
        set_if_changed(style, "borderRadius", card_radius, f"{path_prefix}.borderRadius", "Normalize card radius", "style", changes)
    if "borderEdges" in style:
        set_if_changed(style, "borderEdges", target_edges, f"{path_prefix}.borderEdges", "Normalize card border edges", "style", changes)
    if "_nav_" in name and "borderWidth" in style:
        set_if_changed(style, "borderWidth", 1, f"{path_prefix}.borderWidth", "Normalize navigation button border width", "style", changes)


def layout_target(layout_name: str, mode: str) -> bool:
    if mode == LAYOUT_DESKTOP:
        return layout_name == "Default"
    if mode in (LAYOUT_TABLET, LAYOUT_MOBILE):
        return layout_name == "Mobile"
    return False


def compute_layout_updates(
    category: str,
    page_name: str,
    placement: dict[str, Any],
    mode: str,
) -> dict[str, int]:
    current = {
        "column": placement.get("column"),
        "row": placement.get("row"),
        "colspan": placement.get("colspan"),
        "rowspan": placement.get("rowspan"),
    }
    if any(not isinstance(value, int) for value in current.values()):
        return {}

    if mode == LAYOUT_DESKTOP:
        return {}

    if mode == LAYOUT_TABLET:
        if category in {"chart", "table", "filter"}:
            return {"column": 0, "colspan": 12}
        if category == "KPI/number":
            return {"colspan": min(6, current["colspan"]) if current["colspan"] > 6 else current["colspan"]}
        return {}

    if mode == LAYOUT_MOBILE:
        updates = {"column": 0, "colspan": 12}
        if category == "KPI/number":
            updates["colspan"] = 12
        if category == "table":
            updates["colspan"] = 12
        return updates

    return {}


def sort_mobile_rows(dashboard: dict[str, Any], changes: list[dict[str, Any]]) -> None:
    layout_index = None
    layout = None
    for index, candidate in enumerate(dashboard.get("gridLayouts", [])):
        if isinstance(candidate, dict) and candidate.get("name") == "Mobile":
            layout = candidate
            layout_index = index
            break
    if layout is None or layout_index is None:
        return

    placements_by_name = {widget.get("name"): widget for page in layout.get("pages", []) if isinstance(page, dict) for widget in page.get("widgets", []) if isinstance(widget, dict)}
    for page_index, page in enumerate(layout.get("pages", [])):
        if not isinstance(page, dict):
            continue
        widgets = [widget for widget in page.get("widgets", []) if isinstance(widget, dict)]
        decorated = []
        for widget in widgets:
            name = str(widget.get("name", ""))
            category = classify_widget(name, dashboard.get("widgets", {}).get(name, {}))
            if category == "header/title":
                bucket = 0
            elif category == "filter":
                bucket = 1
            elif category == "KPI/number":
                bucket = 2
            elif name.endswith("health_container") or "health" in name:
                bucket = 3
            elif category == "chart":
                bucket = 4
            elif category == "table":
                bucket = 5
            else:
                bucket = 6
            decorated.append((bucket, int(widget.get("row", 0)), name, widget))

        decorated.sort(key=lambda item: (item[0], item[1], item[2]))
        current_row = 0
        for _, _, _, widget in decorated:
            old_row = widget.get("row")
            rowspan = widget.get("rowspan", 6)
            widget["column"] = 0
            widget["colspan"] = 12
            widget["row"] = current_row
            current_row += int(rowspan) + 1
            if old_row != widget["row"]:
                changes.append(
                    {
                        "path": f"$.gridLayouts[{layout_index}].pages[{page_index}].widgets[{page['widgets'].index(widget)}].row",
                        "oldValue": old_row,
                        "newValue": widget["row"],
                        "reason": "Reorder mobile widgets into a readable single-column flow",
                        "changeType": "layout",
                    }
                )


def apply_overview_mobile_layout(
    dashboard: dict[str, Any],
    changes: list[dict[str, Any]],
    skipped: list[dict[str, Any]],
) -> None:
    mobile_layout = next(
        (
            (layout_index, layout)
            for layout_index, layout in enumerate(dashboard.get("gridLayouts", []))
            if isinstance(layout, dict) and layout.get("name") == "Mobile"
        ),
        None,
    )
    if mobile_layout is None:
        skipped.append(
            {
                "widget": None,
                "path": "$.gridLayouts",
                "reason": "No separate Mobile layout exists; overview layout was not changed.",
                "changeType": "layout",
            }
        )
        return

    layout_index, layout = mobile_layout
    page_entry = next(
        (
            (page_index, page)
            for page_index, page in enumerate(layout.get("pages", []))
            if isinstance(page, dict) and page.get("name") == OVERVIEW_PAGE
        ),
        None,
    )
    if page_entry is None:
        skipped.append(
            {
                "widget": None,
                "path": f"$.gridLayouts[{layout_index}].pages",
                "reason": "Mobile layout has no cscc-overview page.",
                "changeType": "layout",
            }
        )
        return

    page_index, page = page_entry
    for widget_index, placement in enumerate(page.get("widgets", [])):
        if not isinstance(placement, dict):
            continue
        name = str(placement.get("name", ""))
        target = OVERVIEW_MOBILE_LAYOUT.get(name)
        if target is None:
            skipped.append(
                {
                    "widget": name,
                    "path": f"$.gridLayouts[{layout_index}].pages[{page_index}].widgets[{widget_index}]",
                    "reason": "Widget is not part of the approved overview mobile placement map.",
                    "changeType": "layout",
                }
            )
            continue
        for key, new_value in zip(("column", "row", "colspan", "rowspan"), target):
            if key not in placement:
                skipped.append(
                    {
                        "widget": name,
                        "path": f"$.gridLayouts[{layout_index}].pages[{page_index}].widgets[{widget_index}].{key}",
                        "reason": "Approved layout key is absent from the current placement.",
                        "changeType": "layout",
                    }
                )
                continue
            set_if_changed(
                placement,
                key,
                new_value,
                f"$.gridLayouts[{layout_index}].pages[{page_index}].widgets[{widget_index}].{key}",
                "Apply approved Executive Overview mobile placement",
                "layout",
                changes,
            )


def apply_layout_mode(
    dashboard: dict[str, Any],
    mode: str,
    changes: list[dict[str, Any]],
    skipped: list[dict[str, Any]],
    overview_only: bool = False,
) -> None:
    if overview_only and mode == LAYOUT_MOBILE:
        apply_overview_mobile_layout(dashboard, changes, skipped)
        return
    for layout_index, layout in enumerate(dashboard.get("gridLayouts", [])):
        if not isinstance(layout, dict):
            continue
        layout_name = str(layout.get("name"))
        if not layout_target(layout_name, mode):
            continue
        for page_index, page in enumerate(layout.get("pages", [])):
            if not isinstance(page, dict):
                continue
            if overview_only and page.get("name") != OVERVIEW_PAGE:
                continue
            for widget_index, placement in enumerate(page.get("widgets", [])):
                if not isinstance(placement, dict):
                    continue
                name = str(placement.get("name", ""))
                widget = dashboard.get("widgets", {}).get(name, {})
                category = classify_widget(name, widget)
                updates = compute_layout_updates(category, str(page.get("name")), placement, mode)
                if not updates:
                    skipped.append(
                        {
                            "widget": name,
                            "path": f"$.gridLayouts[{layout_index}].pages[{page_index}].widgets[{widget_index}]",
                            "reason": "No safe layout adjustment inferred from current mode and widget shape.",
                            "changeType": "layout",
                        }
                    )
                    continue
                for key, new_value in updates.items():
                    if key not in placement:
                        skipped.append(
                            {
                                "widget": name,
                                "path": f"$.gridLayouts[{layout_index}].pages[{page_index}].widgets[{widget_index}].{key}",
                                "reason": "Layout key is not present in current dashboard JSON.",
                                "changeType": "layout",
                            }
                        )
                        continue
                    set_if_changed(
                        placement,
                        key,
                        new_value,
                        f"$.gridLayouts[{layout_index}].pages[{page_index}].widgets[{widget_index}].{key}",
                        f"Apply {mode} placement normalization for {category} widget",
                        "layout",
                        changes,
                    )
    if mode == LAYOUT_MOBILE and not overview_only:
        sort_mobile_rows(dashboard, changes)


def collect_forbidden_snapshot(dashboard: dict[str, Any]) -> dict[str, Any]:
    snapshot: dict[str, Any] = {}
    for key in FORBIDDEN_TOP_LEVEL_KEYS:
        snapshot[key] = copy.deepcopy(dashboard.get(key))
    snapshot["widgetsFunctional"] = {}
    for widget_name, widget in dashboard.get("widgets", {}).items():
        if not isinstance(widget, dict):
            continue
        snapshot["widgetsFunctional"][widget_name] = {
            "type": copy.deepcopy(widget.get("type")),
            "parameters": {
                key: copy.deepcopy(widget.get("parameters", {}).get(key))
                for key in FORBIDDEN_WIDGET_PARAM_KEYS
                if key in widget.get("parameters", {})
            },
        }
    return snapshot


def verify_forbidden_unchanged(before: dict[str, Any], after: dict[str, Any]) -> list[str]:
    violations: list[str] = []
    for key in FORBIDDEN_TOP_LEVEL_KEYS:
        if not json_deep_equal(before.get(key), after.get(key)):
            violations.append(f"Forbidden top-level section changed: $.{key}")

    before_widgets = before.get("widgetsFunctional", {})
    after_widgets = after.get("widgetsFunctional", {})
    if set(before_widgets.keys()) != set(after_widgets.keys()):
        violations.append("Forbidden widget ID set changed under $.widgets")
        return violations

    for widget_name, before_widget in before_widgets.items():
        after_widget = after_widgets.get(widget_name, {})
        if before_widget.get("type") != after_widget.get("type"):
            violations.append(f"Forbidden widget type changed: $.widgets.{widget_name}.type")
        before_params = before_widget.get("parameters", {})
        after_params = after_widget.get("parameters", {})
        for key in FORBIDDEN_WIDGET_PARAM_KEYS:
            if not json_deep_equal(before_params.get(key), after_params.get(key)):
                violations.append(f"Forbidden widget parameter changed: $.widgets.{widget_name}.parameters.{key}")
    return violations


def build_after_forbidden_snapshot(dashboard: dict[str, Any]) -> dict[str, Any]:
    return collect_forbidden_snapshot(dashboard)


def render_report_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# CRM Analytics Style Change Report",
        "",
        f"- Dashboard source: `{report['dashboardSource']}`",
        f"- Dashboard output: `{report['dashboardOutput']}`",
        f"- Mode: `{report['mode']}`",
        f"- Changed paths: `{len(report['changes'])}`",
        f"- Skipped changes: `{len(report['skippedChanges'])}`",
        "",
        "## Changes",
        "",
    ]
    if not report["changes"]:
        lines.append("- No changes applied.")
    else:
        for change in report["changes"]:
            lines.append(f"### `{change['path']}`")
            lines.append("")
            lines.append(f"- Type: `{change['changeType']}`")
            lines.append(f"- Reason: {change['reason']}")
            lines.append(f"- Old: `{json.dumps(change['oldValue'], sort_keys=True)}`")
            lines.append(f"- New: `{json.dumps(change['newValue'], sort_keys=True)}`")
            lines.append("")
    lines.extend(["## Skipped Desired Changes", ""])
    if not report["skippedChanges"]:
        lines.append("- None.")
    else:
        for skipped in report["skippedChanges"]:
            lines.append(
                f"- `{skipped['path']}`: {skipped['reason']} (`{skipped['changeType']}`)"
            )
    lines.append("")
    if report["violations"]:
        lines.extend(["## Violations", ""])
        for violation in report["violations"]:
            lines.append(f"- {violation}")
        lines.append("")
    return "\n".join(lines)


def build_report(
    dashboard_source: Path,
    dashboard_output: Path,
    mode: str,
    changes: list[dict[str, Any]],
    skipped: list[dict[str, Any]],
    violations: list[str],
    allowed_visual_keys: set[str],
    allowed_layout_keys: set[str],
    overview_only: bool,
) -> dict[str, Any]:
    return {
        "dashboardSource": str(dashboard_source),
        "dashboardOutput": str(dashboard_output),
        "mode": mode,
        "overviewOnly": overview_only,
        "allowedVisualKeys": sorted(allowed_visual_keys),
        "allowedLayoutKeys": sorted(allowed_layout_keys),
        "forbiddenPathPrefixes": [
            "$.dataSourceLinksInfo",
            "$.filters",
            "$.steps",
            "$.widgets.*.type",
            "$.widgets.*.parameters.step",
            "$.widgets.*.parameters.destinationLink",
            "$.widgets.*.parameters.destinationType",
            "$.widgets.*.parameters.includeState",
            "$.widgets.*.parameters.interactions",
            "$.widgets.*.parameters.measureField",
            "$.widgets.*.parameters.columnMap",
            "$.widgets.*.parameters.columns",
        ],
        "changes": changes,
        "skippedChanges": skipped,
        "violations": violations,
    }


def run_compiler(
    dashboard_path: Path,
    design_system_path: Path,
    mode: str,
    output_path: Path,
    report_json_path: Path,
    report_md_path: Path,
    overview_only: bool = False,
) -> dict[str, Any]:
    original = safe_load_json(dashboard_path)
    design_system = safe_load_design_system(design_system_path)
    styled = copy.deepcopy(original)
    allowed_visual_keys, allowed_layout_keys = collect_allowed_keys(original)
    forbidden_before = collect_forbidden_snapshot(original)
    changes: list[dict[str, Any]] = []
    skipped: list[dict[str, Any]] = []

    if mode == STYLE_ONLY:
        if not overview_only:
            apply_global_style(styled, design_system, allowed_visual_keys, changes)
        placements = collect_widget_placements(styled)
        for name, widget in styled.get("widgets", {}).items():
            if not isinstance(widget, dict):
                continue
            if overview_only and not name.startswith(OVERVIEW_PREFIX):
                continue
            category = classify_widget(name, widget)
            apply_widget_style(name, widget, category, design_system, allowed_visual_keys, changes, skipped)
            for placement, layout_name, page_name, placement_path in placements.get(name, []):
                if overview_only and page_name != OVERVIEW_PAGE:
                    continue
                apply_placement_style(
                    name,
                    placement,
                    placement_path,
                    category,
                    design_system,
                    changes,
                )
    else:
        apply_layout_mode(styled, mode, changes, skipped, overview_only=overview_only)

    violations = verify_forbidden_unchanged(forbidden_before, build_after_forbidden_snapshot(styled))
    report = build_report(
        dashboard_source=dashboard_path,
        dashboard_output=output_path,
        mode=mode,
        changes=changes,
        skipped=skipped,
        violations=violations,
        allowed_visual_keys=allowed_visual_keys,
        allowed_layout_keys=allowed_layout_keys,
        overview_only=overview_only,
    )

    report_json_path.parent.mkdir(parents=True, exist_ok=True)
    report_md_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    report_json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    report_md_path.write_text(render_report_markdown(report), encoding="utf-8")

    if violations:
        raise RuntimeError(
            "Forbidden functional changes detected:\n- " + "\n- ".join(violations)
        )

    output_path.write_text(json.dumps(styled, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> int:
    args = parse_args()
    dashboard_path = Path(args.dashboard_json).resolve()
    design_system_path = Path(args.design_system).resolve()
    output_path = Path(args.output).resolve() if args.output else default_output_path(dashboard_path, args.mode)
    report_json_path = Path(args.report_json).resolve()
    report_md_path = Path(args.report_md).resolve()

    try:
        report = run_compiler(
            dashboard_path=dashboard_path,
            design_system_path=design_system_path,
            mode=args.mode,
            output_path=output_path,
            report_json_path=report_json_path,
            report_md_path=report_md_path,
            overview_only=args.overview_only,
        )
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(f"Wrote styled dashboard: {output_path}")
    print(f"Wrote JSON report: {report_json_path}")
    print(f"Wrote markdown report: {report_md_path}")
    print(f"Summary: {len(report['changes'])} changes, {len(report['skippedChanges'])} skipped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
