from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

if __package__ in (None, ""):
    from apply_crma_style import (
        LAYOUT_DESKTOP,
        LAYOUT_MOBILE,
        LAYOUT_TABLET,
        OVERVIEW_PAGE,
        OVERVIEW_PREFIX,
        STYLE_ONLY,
        VALID_MODES,
    )
    from inventory_crma_dashboard import safe_load_json
else:
    from .apply_crma_style import (
        LAYOUT_DESKTOP,
        LAYOUT_MOBILE,
        LAYOUT_TABLET,
        OVERVIEW_PAGE,
        OVERVIEW_PREFIX,
        STYLE_ONLY,
        VALID_MODES,
    )
    from .inventory_crma_dashboard import safe_load_json


SCRIPT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = SCRIPT_DIR.parent / "output"
DEFAULT_REPORT_JSON = OUTPUT_DIR / "validation_report.json"
DEFAULT_REPORT_MD = OUTPUT_DIR / "validation_report.md"

FORBIDDEN_PREFIXES = (
    "$.dataSourceLinksInfo",
    "$.filters",
    "$.steps",
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
ALLOWED_LAYOUT_LEAF_KEYS = {
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
ALLOWED_LAYOUT_STYLE_KEYS = {
    "alignmentX",
    "alignmentY",
    "backgroundColor",
    "cellSpacingX",
    "cellSpacingY",
    "fit",
    "gutterColor",
}
ALLOWED_VISUAL_LEAF_KEYS = {
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
    "maxColumnWidth",
    "minColumnWidth",
    "numberColor",
    "numberOfLines",
    "numberSize",
    "show",
    "showAxis",
    "showHeader",
    "showTitle",
    "textAlignment",
    "textColor",
    "titleColor",
    "titleSize",
    "titleWeight",
    "valueColor",
    "verticalPadding",
}
WARNING_KEYS = {
    "title",
    "subtitleLabel",
    "label",
    "text",
    "visualizationType",
    "valueType",
    "mode",
}
OVERVIEW_PRESENT_PREFIX = "overview_present_"
ALLOWED_PRESENT_WIDGET_TYPES = {"text", "container"}
FORBIDDEN_PRESENT_PARAM_KEYS = {
    "step",
    "destinationLink",
    "destinationType",
    "measureField",
    "columns",
    "columnMap",
    "interactions",
    "includeState",
    "customBulkActions",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate that a styled CRM Analytics dashboard changed only approved areas."
    )
    parser.add_argument("original_dashboard_json", help="Path to the original .wdash JSON file.")
    parser.add_argument("styled_dashboard_json", help="Path to the styled .wdash JSON file.")
    parser.add_argument("--mode", required=True, choices=VALID_MODES, help="Validation mode.")
    parser.add_argument(
        "--overview-only",
        action="store_true",
        help="Fail if anything outside overview_* widgets or cscc-overview placements changed.",
    )
    parser.add_argument(
        "--report-json",
        default=str(DEFAULT_REPORT_JSON),
        help="Path for the structured validation report.",
    )
    parser.add_argument(
        "--report-md",
        default=str(DEFAULT_REPORT_MD),
        help="Path for the markdown validation report.",
    )
    return parser.parse_args()


def json_equal(left: Any, right: Any) -> bool:
    return json.dumps(left, sort_keys=True) == json.dumps(right, sort_keys=True)


def diff_json(left: Any, right: Any, path: str = "$") -> list[dict[str, Any]]:
    diffs: list[dict[str, Any]] = []
    if type(left) is not type(right):
        diffs.append({"path": path, "oldValue": left, "newValue": right, "kind": "type-change"})
        return diffs

    if isinstance(left, dict):
        left_keys = set(left.keys())
        right_keys = set(right.keys())
        for key in sorted(left_keys | right_keys):
            child_path = f"{path}.{key}"
            if key not in left:
                diffs.append({"path": child_path, "oldValue": None, "newValue": right[key], "kind": "added"})
            elif key not in right:
                diffs.append({"path": child_path, "oldValue": left[key], "newValue": None, "kind": "removed"})
            else:
                diffs.extend(diff_json(left[key], right[key], child_path))
        return diffs

    if isinstance(left, list):
        if len(left) != len(right):
            diffs.append({"path": path, "oldValue": left, "newValue": right, "kind": "list-length-change"})
            return diffs
        for index, (left_item, right_item) in enumerate(zip(left, right)):
            diffs.extend(diff_json(left_item, right_item, f"{path}[{index}]"))
        return diffs

    if left != right:
        diffs.append({"path": path, "oldValue": left, "newValue": right, "kind": "value-change"})
    return diffs


def path_segments(path: str) -> list[str]:
    segments: list[str] = []
    token = ""
    i = 0
    while i < len(path):
        char = path[i]
        if char == ".":
            if token:
                segments.append(token)
                token = ""
            i += 1
            continue
        if char == "[":
            if token:
                segments.append(token)
                token = ""
            end = path.find("]", i)
            if end == -1:
                segments.append(path[i:])
                break
            segments.append(path[i : end + 1])
            i = end + 1
            continue
        token += char
        i += 1
    if token:
        segments.append(token)
    return segments


def path_contains_widget_functional_key(path: str) -> bool:
    segments = path_segments(path)
    for index, segment in enumerate(segments):
        if segment == "widgets" and index + 3 < len(segments):
            if segments[index + 2] == "parameters" and segments[index + 3] in FORBIDDEN_WIDGET_PARAM_KEYS:
                return True
        if segment == "widgets" and index + 2 < len(segments):
            if segments[index + 2] in FORBIDDEN_WIDGET_KEYS:
                return True
    return False


def is_layout_path(path: str) -> bool:
    segments = path_segments(path)
    if "gridLayouts" not in segments:
        return False
    leaf = segments[-1]
    if leaf in ALLOWED_LAYOUT_LEAF_KEYS:
        return True
    if "style" in segments and leaf in {"alignmentX", "alignmentY", "cellSpacingX", "cellSpacingY", "fit"}:
        return True
    return False


def is_visual_path(path: str) -> bool:
    segments = path_segments(path)
    leaf = segments[-1]
    if leaf in ALLOWED_VISUAL_LEAF_KEYS:
        return True
    if leaf.startswith("[") and len(segments) >= 2 and segments[-2] in {"borderEdges"}:
        return True
    if "widgetStyle" in segments and leaf in ALLOWED_VISUAL_LEAF_KEYS:
        return True
    if "gridLayouts" in segments and "style" in segments and leaf in {"backgroundColor", "gutterColor"}:
        return True
    if "tooltipStyle" in segments and leaf in {"backgroundColor", "labelColor", "valueColor"}:
        return True
    if "header" in segments and leaf in {"backgroundColor", "fontColor", "fontSize"}:
        return True
    if "cell" in segments and leaf in {"backgroundColor", "fontColor", "fontSize"}:
        return True
    if "filterStyle" in segments and leaf in {"titleColor", "valueColor"}:
        return True
    if "legend" in segments and leaf in {"show", "showHeader"}:
        return True
    if leaf in {"fontSize", "textAlignment"}:
        return True
    return False


def is_warning_path(path: str) -> bool:
    leaf = path_segments(path)[-1]
    return leaf in WARNING_KEYS


def _subsequence(needle: list[str], haystack: list[str]) -> bool:
    iterator = iter(haystack)
    return all(any(candidate == item for candidate in iterator) for item in needle)


def _validate_present_widget(name: str, widget: Any) -> list[dict[str, Any]]:
    violations: list[dict[str, Any]] = []
    if not isinstance(widget, dict):
        return [
            {
                "path": f"$.widgets.{name}",
                "oldValue": None,
                "newValue": widget,
                "kind": "scope-change",
                "reason": "Added presentation widget must be a JSON object.",
            }
        ]

    widget_type = widget.get("type")
    if widget_type not in ALLOWED_PRESENT_WIDGET_TYPES:
        violations.append(
            {
                "path": f"$.widgets.{name}.type",
                "oldValue": None,
                "newValue": widget_type,
                "kind": "scope-change",
                "reason": "Added presentation widget type must be text or container.",
            }
        )

    parameters = widget.get("parameters", {})
    if not isinstance(parameters, dict):
        violations.append(
            {
                "path": f"$.widgets.{name}.parameters",
                "oldValue": None,
                "newValue": parameters,
                "kind": "scope-change",
                "reason": "Added presentation widget parameters must be an object.",
            }
        )
        return violations

    for key in sorted(FORBIDDEN_PRESENT_PARAM_KEYS):
        if key in parameters:
            violations.append(
                {
                    "path": f"$.widgets.{name}.parameters.{key}",
                    "oldValue": None,
                    "newValue": parameters.get(key),
                    "kind": "scope-change",
                    "reason": "Added presentation widgets may not carry functional bindings or table config.",
                }
            )
    return violations


def classify_diff(diff: dict[str, Any], mode: str) -> tuple[str, str]:
    path = diff["path"]
    if any(path == prefix or path.startswith(prefix + ".") or path.startswith(prefix + "[") for prefix in FORBIDDEN_PREFIXES):
        return "forbidden", "Functional top-level dashboard section changed."
    if path_contains_widget_functional_key(path):
        return "forbidden", "Functional widget binding or reference changed."
    if mode == STYLE_ONLY and is_layout_path(path):
        return "forbidden", "Layout changed in style-only mode."
    if is_layout_path(path):
        return "allowed-layout", "Layout-only path changed in layout mode."
    if is_visual_path(path):
        return "allowed-style", "Visual/style path changed."
    if is_warning_path(path):
        return "warning", "Path may be user-facing or semantic; manual review recommended."
    return "warning", "Path is not clearly functional or clearly approved visual/layout."


def build_report(
    original_path: Path,
    styled_path: Path,
    mode: str,
    diffs: list[dict[str, Any]],
) -> dict[str, Any]:
    forbidden_changes: list[dict[str, Any]] = []
    allowed_style_changes: list[dict[str, Any]] = []
    allowed_layout_changes: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []

    for diff in diffs:
        classification, reason = classify_diff(diff, mode)
        entry = {
            "path": diff["path"],
            "oldValue": diff["oldValue"],
            "newValue": diff["newValue"],
            "kind": diff["kind"],
            "reason": reason,
        }
        if classification == "forbidden":
            forbidden_changes.append(entry)
        elif classification == "allowed-style":
            allowed_style_changes.append(entry)
        elif classification == "allowed-layout":
            allowed_layout_changes.append(entry)
        else:
            warnings.append(entry)

    status = "FAIL" if forbidden_changes else "PASS"
    return {
        "status": status,
        "mode": mode,
        "originalDashboard": str(original_path),
        "styledDashboard": str(styled_path),
        "diffCount": len(diffs),
        "forbiddenChanges": forbidden_changes,
        "allowedStyleChanges": allowed_style_changes,
        "allowedLayoutChanges": allowed_layout_changes,
        "warnings": warnings,
    }


def overview_scope_violations(
    original: dict[str, Any],
    styled: dict[str, Any],
) -> list[dict[str, Any]]:
    violations: list[dict[str, Any]] = []
    original_widgets = original.get("widgets", {})
    styled_widgets = styled.get("widgets", {})
    original_names = set(original_widgets)
    styled_names = set(styled_widgets)
    removed_names = sorted(original_names - styled_names)
    extra_names = sorted(styled_names - original_names)

    if removed_names:
        violations.append(
            {
                "path": "$.widgets",
                "oldValue": sorted(original_widgets),
                "newValue": sorted(styled_widgets),
                "kind": "scope-change",
                "reason": "Existing widgets were removed during an overview-only run.",
            }
        )
        return violations

    invalid_extra_names = [
        name for name in extra_names if not name.startswith(OVERVIEW_PRESENT_PREFIX)
    ]
    if invalid_extra_names:
        violations.append(
            {
                "path": "$.widgets",
                "oldValue": sorted(original_widgets),
                "newValue": sorted(styled_widgets),
                "kind": "scope-change",
                "reason": "Only overview_present_* widgets may be added during an overview-only run.",
            }
        )
        return violations

    for name in extra_names:
        violations.extend(_validate_present_widget(name, styled_widgets.get(name)))

    for name, widget in original_widgets.items():
        if name.startswith(OVERVIEW_PREFIX):
            continue
        if not json_equal(widget, styled_widgets.get(name)):
            violations.append(
                {
                    "path": f"$.widgets.{name}",
                    "oldValue": widget,
                    "newValue": styled_widgets.get(name),
                    "kind": "scope-change",
                    "reason": "Non-overview widget changed during an overview-only run.",
                }
            )

    original_layouts = original.get("gridLayouts", [])
    styled_layouts = styled.get("gridLayouts", [])
    if len(original_layouts) != len(styled_layouts):
        violations.append(
            {
                "path": "$.gridLayouts",
                "oldValue": len(original_layouts),
                "newValue": len(styled_layouts),
                "kind": "scope-change",
                "reason": "Layout count changed during an overview-only run.",
            }
        )
        return violations

    for layout_index, (before_layout, after_layout) in enumerate(
        zip(original_layouts, styled_layouts)
    ):
        before_without_pages = {
            key: value for key, value in before_layout.items() if key != "pages"
        }
        after_without_pages = {
            key: value for key, value in after_layout.items() if key != "pages"
        }
        if not json_equal(before_without_pages, after_without_pages):
            violations.append(
                {
                    "path": f"$.gridLayouts[{layout_index}]",
                    "oldValue": before_without_pages,
                    "newValue": after_without_pages,
                    "kind": "scope-change",
                    "reason": "Layout-level settings changed during an overview-only run.",
                }
            )

        before_pages = before_layout.get("pages", [])
        after_pages = after_layout.get("pages", [])
        if len(before_pages) != len(after_pages):
            violations.append(
                {
                    "path": f"$.gridLayouts[{layout_index}].pages",
                    "oldValue": len(before_pages),
                    "newValue": len(after_pages),
                    "kind": "scope-change",
                    "reason": "Page count changed during an overview-only run.",
                }
            )
            continue

        for page_index, (before_page, after_page) in enumerate(
            zip(before_pages, after_pages)
        ):
            if before_page.get("name") != after_page.get("name"):
                violations.append(
                    {
                        "path": f"$.gridLayouts[{layout_index}].pages[{page_index}].name",
                        "oldValue": before_page.get("name"),
                        "newValue": after_page.get("name"),
                        "kind": "scope-change",
                        "reason": "Page identity changed during an overview-only run.",
                    }
                )
                continue
            if before_page.get("name") != OVERVIEW_PAGE:
                if not json_equal(before_page, after_page):
                    violations.append(
                        {
                            "path": f"$.gridLayouts[{layout_index}].pages[{page_index}]",
                            "oldValue": before_page,
                            "newValue": after_page,
                            "kind": "scope-change",
                            "reason": "Non-overview page changed during an overview-only run.",
                        }
                    )
                continue

            before_names = [
                placement.get("name") for placement in before_page.get("widgets", [])
            ]
            after_names = [
                placement.get("name") for placement in after_page.get("widgets", [])
            ]
            extra_placements = [name for name in after_names if name not in before_names]
            if any(
                not isinstance(name, str) or not name.startswith(OVERVIEW_PRESENT_PREFIX)
                for name in extra_placements
            ):
                violations.append(
                    {
                        "path": f"$.gridLayouts[{layout_index}].pages[{page_index}].widgets",
                        "oldValue": before_names,
                        "newValue": after_names,
                        "kind": "scope-change",
                        "reason": "Only overview_present_* placements may be added to the overview page.",
                    }
                )
                continue
            if not _subsequence(before_names, after_names):
                violations.append(
                    {
                        "path": f"$.gridLayouts[{layout_index}].pages[{page_index}].widgets",
                        "oldValue": before_names,
                        "newValue": after_names,
                        "kind": "scope-change",
                        "reason": "Existing overview placements must retain relative order.",
                    }
                )
                continue
    return violations


def render_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# CRM Analytics Validation Report",
        "",
        f"- Status: `{report['status']}`",
        f"- Mode: `{report['mode']}`",
        f"- Original dashboard: `{report['originalDashboard']}`",
        f"- Styled dashboard: `{report['styledDashboard']}`",
        f"- Total diffs: `{report['diffCount']}`",
        f"- Forbidden changes: `{len(report['forbiddenChanges'])}`",
        f"- Allowed style changes: `{len(report['allowedStyleChanges'])}`",
        f"- Allowed layout changes: `{len(report['allowedLayoutChanges'])}`",
        f"- Warnings: `{len(report['warnings'])}`",
        "",
        "## Forbidden Changes",
        "",
    ]
    if not report["forbiddenChanges"]:
        lines.append("- None.")
    else:
        for change in report["forbiddenChanges"]:
            lines.append(f"- `{change['path']}`: {change['reason']}")
    lines.extend(["", "## Allowed Style Changes", ""])
    if not report["allowedStyleChanges"]:
        lines.append("- None.")
    else:
        for change in report["allowedStyleChanges"]:
            lines.append(f"- `{change['path']}`")
    lines.extend(["", "## Allowed Layout Changes", ""])
    if not report["allowedLayoutChanges"]:
        lines.append("- None.")
    else:
        for change in report["allowedLayoutChanges"]:
            lines.append(f"- `{change['path']}`")
    lines.extend(["", "## Warnings", ""])
    if not report["warnings"]:
        lines.append("- None.")
    else:
        for change in report["warnings"]:
            lines.append(f"- `{change['path']}`: {change['reason']}")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    original_path = Path(args.original_dashboard_json).resolve()
    styled_path = Path(args.styled_dashboard_json).resolve()
    report_json_path = Path(args.report_json).resolve()
    report_md_path = Path(args.report_md).resolve()

    try:
        original = safe_load_json(original_path)
        styled = safe_load_json(styled_path)
        diffs = diff_json(original, styled)
        report = build_report(original_path, styled_path, args.mode, diffs)
        if args.overview_only:
            scope_violations = overview_scope_violations(original, styled)
            report["forbiddenChanges"].extend(scope_violations)
            report["status"] = "FAIL" if report["forbiddenChanges"] else "PASS"
            report["overviewOnly"] = True
        report_json_path.parent.mkdir(parents=True, exist_ok=True)
        report_md_path.parent.mkdir(parents=True, exist_ok=True)
        report_json_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
        report_md_path.write_text(render_markdown(report), encoding="utf-8")
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    except OSError as exc:
        print(f"Error writing report: {exc}", file=sys.stderr)
        return 1

    print(f"Status: {report['status']}")
    print(f"Wrote JSON report: {report_json_path}")
    print(f"Wrote markdown report: {report_md_path}")
    print(
        "Summary: "
        f"{len(report['forbiddenChanges'])} forbidden, "
        f"{len(report['allowedStyleChanges'])} allowed style, "
        f"{len(report['allowedLayoutChanges'])} allowed layout, "
        f"{len(report['warnings'])} warnings."
    )
    return 1 if report["status"] == "FAIL" else 0


if __name__ == "__main__":
    raise SystemExit(main())
