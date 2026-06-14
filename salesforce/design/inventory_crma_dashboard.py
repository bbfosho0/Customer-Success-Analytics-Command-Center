from __future__ import annotations

import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR.parent / "output"
DEFAULT_JSON_OUTPUT = OUTPUT_DIR / "crma_widget_inventory.json"
DEFAULT_MD_OUTPUT = OUTPUT_DIR / "crma_widget_inventory.md"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read-only inventory for Salesforce CRM Analytics dashboard JSON."
    )
    parser.add_argument("dashboard_json", help="Path to the .wdash JSON file to inspect.")
    parser.add_argument(
        "--json-output",
        default=str(DEFAULT_JSON_OUTPUT),
        help="Path for structured inventory output JSON.",
    )
    parser.add_argument(
        "--md-output",
        default=str(DEFAULT_MD_OUTPUT),
        help="Path for markdown inventory report.",
    )
    return parser.parse_args()


def safe_load_json(path: Path) -> dict[str, Any]:
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise RuntimeError(f"Failed to read dashboard JSON: {exc}") from exc
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Failed to parse JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}"
        ) from exc
    if not isinstance(data, dict):
        raise RuntimeError("Dashboard JSON root must be an object.")
    return data


def classify_widget(name: str, widget: dict[str, Any]) -> str:
    widget_type = str(widget.get("type", "")).lower()
    lower_name = name.lower()
    params = widget.get("parameters", {})

    if widget_type == "container":
        return "container/background"
    if widget_type == "number":
        return "KPI/number"
    if widget_type == "table":
        return "table"
    if widget_type in {"chart"}:
        return "chart"
    if widget_type in {"listselector", "selector"}:
        return "filter"
    if widget_type == "link":
        if "nav" in lower_name or "reset" in lower_name:
            return "header/title"
        return "unknown"
    if widget_type == "text":
        title = str(params.get("title", "")).lower()
        text_blob = json.dumps(params, sort_keys=True).lower()
        if (
            "title" in lower_name
            or "header" in lower_name
            or "heading" in lower_name
            or "masthead" in lower_name
            or "toolbar_label" in lower_name
            or "illustrative" in text_blob
            or "command center" in text_blob
            or "dashboard" in title
        ):
            return "header/title"
    return "unknown"


def collect_layouts(dashboard: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    placements: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for layout in dashboard.get("gridLayouts", []):
        if not isinstance(layout, dict):
            continue
        layout_name = layout.get("name")
        num_columns = layout.get("numColumns")
        for page in layout.get("pages", []):
            if not isinstance(page, dict):
                continue
            page_name = page.get("name")
            page_label = page.get("label")
            for widget in page.get("widgets", []):
                if not isinstance(widget, dict):
                    continue
                widget_name = widget.get("name")
                if not widget_name:
                    continue
                placements[str(widget_name)].append(
                    {
                        "layout": layout_name,
                        "pageName": page_name,
                        "pageLabel": page_label,
                        "numColumns": num_columns,
                        "row": widget.get("row"),
                        "column": widget.get("column"),
                        "rowspan": widget.get("rowspan"),
                        "colspan": widget.get("colspan"),
                        "widgetStyle": widget.get("widgetStyle", {}),
                    }
                )
    return placements


def collect_color_values(widget: dict[str, Any], placements: list[dict[str, Any]]) -> dict[str, Any]:
    params = widget.get("parameters", {})
    colors: dict[str, Any] = {}

    def maybe_add(key: str, value: Any) -> None:
        if value not in (None, "", [], {}):
            colors[key] = value

    for key in (
        "backgroundColor",
        "borderColor",
        "textColor",
        "titleColor",
        "numberColor",
        "highColor",
        "lowColor",
        "valueType",
    ):
        maybe_add(key, params.get(key))

    for key in ("cell", "header", "filterStyle", "tooltipStyle", "legend", "measureAxis1", "measureAxis2", "dimensionAxis"):
        value = params.get(key)
        if isinstance(value, dict):
            nested = {
                nested_key: nested_value
                for nested_key, nested_value in value.items()
                if "color" in nested_key.lower() or nested_key in {"backgroundColor", "fontColor"}
            }
            maybe_add(key, nested)

    placement_styles = []
    for placement in placements:
        style = placement.get("widgetStyle")
        if isinstance(style, dict) and style:
            placement_styles.append(
                {
                    nested_key: nested_value
                    for nested_key, nested_value in style.items()
                    if "color" in nested_key.lower() or "border" in nested_key.lower()
                }
            )
    if placement_styles:
        colors["placementWidgetStyles"] = placement_styles
    return colors


def collect_text_values(widget: dict[str, Any]) -> dict[str, Any]:
    params = widget.get("parameters", {})
    text_values: dict[str, Any] = {}

    def maybe_add(key: str, value: Any) -> None:
        if value not in (None, "", [], {}):
            text_values[key] = value

    for key in (
        "title",
        "text",
        "numberSize",
        "titleSize",
        "fontSize",
        "textAlignment",
        "numberColor",
        "titleColor",
    ):
        maybe_add(key, params.get(key))

    for key in ("title", "header", "cell", "filterStyle", "tooltip"):
        value = params.get(key)
        if isinstance(value, dict):
            nested = {
                nested_key: nested_value
                for nested_key, nested_value in value.items()
                if any(
                    token in nested_key.lower()
                    for token in ("title", "text", "font", "label", "size", "color", "alignment")
                )
            }
            maybe_add(f"{key}Details", nested)
    return text_values


def collect_functional_refs(widget: dict[str, Any]) -> dict[str, Any]:
    params = widget.get("parameters", {})
    refs: dict[str, Any] = {}
    for key in (
        "step",
        "measureField",
        "columns",
        "columnMap",
        "destinationType",
        "destinationLink",
        "includeState",
        "interactions",
    ):
        value = params.get(key)
        if value not in (None, "", [], {}):
            refs[key] = value
    return refs


def infer_notes(widget: dict[str, Any], placements: list[dict[str, Any]], refs: dict[str, Any]) -> list[str]:
    notes: list[str] = []
    params = widget.get("parameters", {})
    widget_type = str(widget.get("type", "")).lower()

    if placements:
        notes.append("layout: has explicit placement entries in gridLayouts")
    else:
        notes.append("layout: no placement entry found in gridLayouts")

    visual_keys = [
        "backgroundColor",
        "borderColor",
        "title",
        "text",
        "numberColor",
        "filterStyle",
        "header",
        "cell",
        "legend",
        "measureAxis1",
        "dimensionAxis",
    ]
    if any(key in params for key in visual_keys):
        notes.append("visual: has style or presentation-oriented parameter fields")

    if refs:
        notes.append("functional: references steps, bindings, columns, or navigation targets")

    if widget_type in {"number", "chart", "table", "listselector"}:
        notes.append("functional: widget type commonly depends on underlying step query output")

    if widget_type == "link":
        notes.append("functional: link destination affects navigation behavior")

    return notes


def build_inventory(path: Path, dashboard: dict[str, Any]) -> dict[str, Any]:
    widgets = dashboard.get("widgets", {})
    if not isinstance(widgets, dict):
        widgets = {}
    placements = collect_layouts(dashboard)
    inventory_widgets = []
    counts = Counter()

    for name, widget in widgets.items():
        if not isinstance(widget, dict):
            continue
        category = classify_widget(name, widget)
        counts[category] += 1
        widget_placements = placements.get(name, [])
        refs = collect_functional_refs(widget)
        inventory_widgets.append(
            {
                "name": name,
                "type": widget.get("type"),
                "category": category,
                "placements": widget_placements,
                "colors": collect_color_values(widget, widget_placements),
                "textStyle": collect_text_values(widget),
                "references": refs,
                "notes": infer_notes(widget, widget_placements, refs),
            }
        )

    inventory_widgets.sort(key=lambda item: (item["category"], item["name"]))
    layout_summary = []
    for layout in dashboard.get("gridLayouts", []):
        if not isinstance(layout, dict):
            continue
        layout_summary.append(
            {
                "name": layout.get("name"),
                "numColumns": layout.get("numColumns"),
                "rowHeight": layout.get("rowHeight"),
                "selectors": layout.get("selectors"),
                "style": layout.get("style"),
                "pageCount": len(layout.get("pages", [])),
                "pages": [
                    {
                        "name": page.get("name"),
                        "label": page.get("label"),
                        "widgetCount": len(page.get("widgets", [])),
                    }
                    for page in layout.get("pages", [])
                    if isinstance(page, dict)
                ],
            }
        )

    return {
        "dashboardPath": str(path),
        "topLevelKeys": list(dashboard.keys()),
        "widgetCount": len(inventory_widgets),
        "stepCount": len(dashboard.get("steps", {})) if isinstance(dashboard.get("steps"), dict) else 0,
        "layoutCount": len(layout_summary),
        "categoryCounts": dict(counts),
        "layouts": layout_summary,
        "widgets": inventory_widgets,
    }


def render_markdown(inventory: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("# CRM Analytics Widget Inventory")
    lines.append("")
    lines.append(f"- Dashboard: `{inventory['dashboardPath']}`")
    lines.append(f"- Top-level keys: `{', '.join(inventory['topLevelKeys'])}`")
    lines.append(f"- Layouts: `{inventory['layoutCount']}`")
    lines.append(f"- Steps: `{inventory['stepCount']}`")
    lines.append(f"- Widgets: `{inventory['widgetCount']}`")
    lines.append("")
    lines.append("## Category Counts")
    lines.append("")
    for category, count in sorted(inventory["categoryCounts"].items()):
        lines.append(f"- `{category}`: {count}")
    lines.append("")
    lines.append("## Layout Summary")
    lines.append("")
    for layout in inventory["layouts"]:
        lines.append(
            f"- `{layout['name']}`: {layout['pageCount']} pages, `{layout['numColumns']}` columns, selectors `{layout['selectors']}`"
        )
    lines.append("")
    lines.append("## Widgets")
    lines.append("")
    for widget in inventory["widgets"]:
        lines.append(f"### `{widget['name']}`")
        lines.append("")
        lines.append(f"- Type: `{widget.get('type')}`")
        lines.append(f"- Category: `{widget['category']}`")
        if widget["placements"]:
            primary = widget["placements"][0]
            lines.append(
                "- Primary placement: "
                f"`layout={primary.get('layout')}`, `page={primary.get('pageName')}`, "
                f"`x={primary.get('column')}`, `y={primary.get('row')}`, "
                f"`w={primary.get('colspan')}`, `h={primary.get('rowspan')}`"
            )
            if len(widget["placements"]) > 1:
                lines.append(f"- Placement variants: `{len(widget['placements'])}`")
        else:
            lines.append("- Primary placement: none found")
        lines.append(f"- Colors/style: `{json.dumps(widget['colors'], sort_keys=True)}`")
        lines.append(f"- Text/font/title: `{json.dumps(widget['textStyle'], sort_keys=True)}`")
        lines.append(f"- Step/query/binding refs: `{json.dumps(widget['references'], sort_keys=True)}`")
        lines.append("- Notes:")
        for note in widget["notes"]:
            lines.append(f"  - {note}")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def write_outputs(inventory: dict[str, Any], json_path: Path, md_path: Path) -> None:
    json_path.write_text(json.dumps(inventory, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown(inventory), encoding="utf-8")


def main() -> int:
    args = parse_args()
    dashboard_path = Path(args.dashboard_json).resolve()
    json_output = Path(args.json_output).resolve()
    md_output = Path(args.md_output).resolve()

    try:
        dashboard = safe_load_json(dashboard_path)
        inventory = build_inventory(dashboard_path, dashboard)
        json_output.parent.mkdir(parents=True, exist_ok=True)
        md_output.parent.mkdir(parents=True, exist_ok=True)
        write_outputs(inventory, json_output, md_output)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"Error writing outputs: {exc}", file=sys.stderr)
        return 1

    print(f"Wrote {json_output}")
    print(f"Wrote {md_output}")
    print(
        "Summary: "
        f"{inventory['widgetCount']} widgets, "
        f"{inventory['stepCount']} steps, "
        f"{inventory['layoutCount']} layouts."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
