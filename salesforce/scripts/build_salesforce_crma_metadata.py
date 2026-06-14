"""Build portable CRM Analytics dashboard and XMD metadata.

The generated assets retain the API names of the dashboards already installed in
the portfolio Developer Edition org. They intentionally reference datasets by
name rather than org-specific IDs.
"""

from __future__ import annotations

import argparse
import copy
import json
import sys
from pathlib import Path
from typing import Any

if __package__ in (None, ""):
    from _paths import ROOT, WAVE_DIR, XMD_NS
    from _xmd import build_xmd
    if str(ROOT) not in sys.path:
        sys.path.insert(0, str(ROOT))
    from salesforce.design.apply_crma_style import STYLE_ONLY, run_compiler
else:
    from ._paths import ROOT, WAVE_DIR, XMD_NS
    from ._xmd import build_xmd
    from salesforce.design.apply_crma_style import STYLE_ONLY, run_compiler

CANVAS = "#F7F8FA"
SURFACE = "#FFFFFF"
HEADER = "#0F172A"
TEXT = "#0F172A"
MUTED = "#64748B"
BORDER = "#E2E8F0"
SOFT_BORDER = "#D8E1EC"
TEAL = "#0D9488"
BLUE = "#2563EB"
AMBER = "#F59E0B"
RED = "#DC2626"
GREEN = "#16A34A"
DESIGN_SYSTEM_PATH = ROOT / "salesforce" / "design" / "design-system.json"
OUTPUT_DIR = ROOT / "salesforce" / "output"
OVERVIEW_PREFIXES = ("overview_", "overview_present_")


def _load(name: str) -> dict[str, Any]:
    return json.loads((WAVE_DIR / f"{name}.wdash").read_text(encoding="utf-8"))


def _write(name: str, dashboard: dict[str, Any]) -> None:
    (WAVE_DIR / f"{name}.wdash").write_text(
        json.dumps(dashboard, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )


def _dataset(name: str) -> list[dict[str, str]]:
    return [{"name": name}]


def _aggregate(
    dataset: str,
    query: dict[str, Any],
    *,
    broadcast: bool = False,
    visualization: str = "hbar",
) -> dict[str, Any]:
    return {
        "broadcastFacet": broadcast,
        "datasets": _dataset(dataset),
        "isGlobal": False,
        "query": {"query": json.dumps(query, separators=(",", ":")), "version": -1},
        "receiveFacetSource": {"mode": "all", "steps": []},
        "selectMode": "multi",
        "type": "aggregateflex",
        "useExternalFilters": True,
        "useGlobal": True,
        "visualizationParameters": {"options": {}, "visualizationType": visualization},
    }


def _grain(
    dataset: str,
    values: list[str],
    *,
    filters: list[list[Any]] | None = None,
    order: list[list[Any]] | None = None,
    limit: int = 50,
) -> dict[str, Any]:
    query: dict[str, Any] = {
        "measures": [],
        "values": values,
        "groups": [],
        "filters": filters or [],
        "order": order or [],
        "limit": limit,
    }
    return {
        "datasets": _dataset(dataset),
        "isFacet": False,
        "isGlobal": False,
        "label": "portfolio_table",
        "query": {"query": json.dumps(query, separators=(",", ":")), "version": -1},
        "selectMode": "none",
        "type": "grain",
        "useExternalFilters": True,
        "useGlobal": True,
        "visualizationParameters": {"options": {}, "visualizationType": "valuestable"},
    }


def _clone(base: dict[str, Any], widget_name: str) -> dict[str, Any]:
    return copy.deepcopy(base["widgets"][widget_name])


def _rich_text(
    lines: list[tuple[str, str, bool]],
    *,
    title_size: str = "22px",
    body_size: str = "12px",
) -> dict[str, Any]:
    content: list[dict[str, Any]] = []
    for text, color, bold in lines:
        content.append(
            {
                "attributes": {
                    "color": color,
                    "size": title_size if bold else body_size,
                    "bold": bold,
                },
                "insert": text,
            }
        )
        content.append({"attributes": {"align": "left"}, "insert": "\n"})
    return {
        "parameters": {
            "content": {"richTextContent": content},
            "interactions": [],
            "showActionMenu": False,
        },
        "type": "text",
    }


def _header_widget(title: str, subtitle: str) -> dict[str, Any]:
    return _rich_text(
        [
            (title, "#FFFFFF", True),
            (subtitle, "#CBD5E1", False),
            ("Illustrative 2025 portfolio snapshot", "#94A3B8", False),
        ],
        title_size="24px",
        body_size="12px",
    )


def _text_card(title: str, body: str) -> dict[str, Any]:
    return _rich_text(
        [(title, TEXT, True), (body, MUTED, False)],
        title_size="15px",
        body_size="12px",
    )


def _present_text(
    text: str,
    *,
    color: str,
    size: str = "12px",
    bold: bool = True,
) -> dict[str, Any]:
    return {
        "parameters": {
            "content": {
                "richTextContent": [
                    {
                        "attributes": {
                            "color": color,
                            "size": size,
                            "bold": bold,
                        },
                        "insert": text,
                    },
                    {"attributes": {"align": "center"}, "insert": "\n"},
                ]
            },
            "showActionMenu": False,
        },
        "type": "text",
    }


def _container_widget() -> dict[str, Any]:
    return {
        "parameters": {
            "alignmentX": "left",
            "alignmentY": "top",
            "fit": "original",
            "interactions": [],
        },
        "type": "container",
    }


def _present_container_widget() -> dict[str, Any]:
    return {
        "parameters": {
            "alignmentX": "left",
            "alignmentY": "top",
            "fit": "original",
        },
        "type": "container",
    }


def _link_widget(
    base: dict[str, Any],
    source: str,
    text: str,
    destination: str,
    *,
    font_size: int = 12,
    text_color: str = HEADER,
) -> dict[str, Any]:
    widget = _clone(base, source)
    widget["parameters"].update(
        {
            "destinationLink": {"name": destination, "namespace": ""},
            "destinationType": "dashboard",
            "fontSize": font_size,
            "includeState": False,
            "text": text,
            "textAlignment": "center",
            "textColor": text_color,
        }
    )
    return widget


def _number_widget(
    base: dict[str, Any],
    source: str,
    *,
    step: str,
    measure: str,
    title: str,
    color: str = TEXT,
    number_size: int = 30,
) -> dict[str, Any]:
    widget = _clone(base, source)
    widget["parameters"].update(
        {
            "compact": True,
            "exploreLink": False,
            "measureField": measure,
            "numberColor": color,
            "numberSize": number_size,
            "showActionMenu": False,
            "step": step,
            "textAlignment": "left",
            "title": title,
            "titleColor": MUTED,
            "titleSize": 12,
        }
    )
    return widget


def _selector_widget(
    base: dict[str, Any],
    source: str,
    *,
    step: str,
    title: str,
) -> dict[str, Any]:
    widget = _clone(base, source)
    widget["parameters"].update(
        {
            # Salesforce clips the selected value in compact combo selectors when
            # the widget also renders a title. The full-height control keeps both
            # lines legible at desktop and mobile breakpoints.
            "compact": False,
            "displayMode": "combo",
            "exploreLink": False,
            "filterStyle": {
                "titleColor": "#475569",
                "valueColor": TEXT,
            },
            "instant": True,
            "measureField": "count",
            "showActionMenu": False,
            "step": step,
            "title": title,
        }
    )
    return widget


def _chart_widget(
    base: dict[str, Any],
    source: str,
    *,
    step: str,
    title: str,
    subtitle: str,
    visualization: str,
    dimensions: list[str],
    plots: list[str],
    dimension_title: str,
    measure_title: str,
    value_type: str = "compactNumber",
    legend: bool | None = None,
) -> dict[str, Any]:
    widget = _clone(base, source)
    params = widget["parameters"]
    params.update(
        {
            "autoFitMode": "fit",
            "exploreLink": False,
            "showActionMenu": False,
            "step": step,
            "theme": "wave",
            "title": {
                "align": "left",
                "fontSize": 15,
                "label": title,
                "subtitleFontSize": 11,
                "subtitleLabel": subtitle,
            },
            "visualizationType": visualization,
            "valueType": value_type,
            "columnMap": {
                "split": [],
                "trellis": [],
                "dimension": dimensions,
                "dimensionAxis": dimensions,
                "plots": plots,
            },
        }
    )
    params.setdefault("legend", {})
    params["legend"].update(
        {
            "show": len(plots) > 1 if legend is None else legend,
            "showHeader": False,
            "position": "bottom-center",
            "inside": False,
        }
    )
    params.setdefault("measureAxis1", {})
    params["measureAxis1"].update({"showAxis": True, "showTitle": True, "title": measure_title})
    params.setdefault("dimensionAxis", {})
    params["dimensionAxis"].update({"showAxis": True, "showTitle": True, "title": dimension_title})
    return widget


def _matrix_widget(
    base: dict[str, Any],
    source: str,
    *,
    step: str,
    title: str,
) -> dict[str, Any]:
    widget = _clone(base, source)
    params = widget["parameters"]
    params.update(
        {
            "autoFitMode": "fit",
            "exploreLink": False,
            "showActionMenu": False,
            "step": step,
            "title": {
                "align": "left",
                "fontSize": 15,
                "label": title,
                "subtitleFontSize": 11,
                "subtitleLabel": "Rows are acquisition cohorts; columns are months since acquisition.",
            },
            "visualizationType": "matrix",
            "valueType": "percent",
            "highColor": TEAL,
            "lowColor": "#E6FFFB",
            "columnMap": {
                "r": ["avg_Retention_Rate__c"],
                "split": [],
                "color": ["avg_Retention_Rate__c"],
                "x": ["Month_Since_Acquisition__c"],
                "y": ["Cohort_Quarter__c"],
                "trellis": [],
                "dimensionAxis": [],
                "plots": ["avg_Retention_Rate__c"],
            },
        }
    )
    params.setdefault("legend", {})
    params["legend"]["show"] = False
    return widget


def _distribution_widget(
    base: dict[str, Any],
    source: str,
    *,
    step: str,
    title: str,
    subtitle: str,
) -> dict[str, Any]:
    widget = _clone(base, source)
    params = widget["parameters"]
    params.update(
        {
            "autoFitMode": "fit",
            "exploreLink": False,
            "showActionMenu": False,
            "step": step,
            "theme": "wave",
            "title": {
                "align": "left",
                "fontSize": 15,
                "label": title,
                "subtitleFontSize": 11,
                "subtitleLabel": subtitle,
            },
            "visualizationType": "donut",
            "valueType": "none",
            "columnMap": {
                "split": [],
                "trellis": [],
                "dimension": ["Risk_Band__c"],
                "dimensionAxis": ["Risk_Band__c"],
                "plots": ["count"],
            },
        }
    )
    params.setdefault("legend", {})
    params["legend"].update(
        {
            "show": True,
            "showHeader": False,
            "position": "right-center",
            "inside": False,
        }
    )
    params.setdefault("measureAxis1", {})
    params["measureAxis1"].update({"showAxis": False, "showTitle": False, "title": ""})
    params.setdefault("dimensionAxis", {})
    params["dimensionAxis"].update({"showAxis": False, "showTitle": False, "title": ""})
    return widget


def _table_widget(
    base: dict[str, Any],
    source: str,
    *,
    step: str,
    columns: list[str] | None = None,
    column_widths: dict[str, int] | None = None,
    max_column_width: int = 220,
    min_column_width: int = 64,
    number_of_lines: int = 2,
) -> dict[str, Any]:
    widget = _clone(base, source)
    widget["parameters"].update(
        {
            "borderColor": BORDER,
            "cell": {"backgroundColor": SURFACE, "fontColor": TEXT, "fontSize": 11},
            "columns": columns or [],
            "columnProperties": {
                field: {"type": "text", "parameters": {"width": width}}
                for field, width in (column_widths or {}).items()
            },
            "exploreLink": False,
            "header": {"backgroundColor": "#F1F5F9", "fontColor": TEXT, "fontSize": 10},
            "innerMajorBorderColor": BORDER,
            "innerMinorBorderColor": "#F1F5F9",
            "maxColumnWidth": max_column_width,
            "minColumnWidth": min_column_width,
            "mode": "variable",
            "numberOfLines": number_of_lines,
            "showActionMenu": False,
            "showRowIndexColumn": False,
            "step": step,
            "totals": False,
            "verticalPadding": 6,
        }
    )
    return widget


def _style(
    *,
    background: str = SURFACE,
    border: str = BORDER,
    edges: list[str] | None = None,
    radius: int = 8,
    width: int = 1,
) -> dict[str, Any]:
    return {
        "backgroundColor": background,
        "borderColor": border,
        "borderEdges": ["all"] if edges is None else edges,
        "borderRadius": radius,
        "borderWidth": width,
    }


def _accent_style(color: str) -> dict[str, Any]:
    return _style(border=color, edges=["top"], width=3)


HEADER_STYLE = _style(background=HEADER, border=HEADER, edges=[], radius=12)
OVERLAY_STYLE = _style(background="rgba(255, 255, 255, 0)", border=HEADER, edges=[])
BUTTON_STYLE = _style(background="#F8FAFC", border="#CBD5E1", radius=10)
RESET_BUTTON_STYLE = _style(background="#F8FAFC", border="#CBD5E1", radius=10)
NAV_BUTTON_STYLE = _style(background="#1E293B", border="#475569", radius=10)
PRESENT_BUTTON_STYLE = _style(background="#1E293B", border="#475569", radius=10)
PRESENT_RESET_STYLE = _style(background="#F8FAFC", border="#CBD5E1", radius=10)
FILTER_STYLE = _style(background=SURFACE, border=SOFT_BORDER, radius=10)
FILTER_TOOLBAR_STYLE = _style(background="#FBFCFE", border=SOFT_BORDER, radius=12)
FILTER_CONTROL_STYLE = _style(
    background=SURFACE,
    border="#CBD5E1",
    radius=10,
)
CARD_STYLE = _style(border=SOFT_BORDER, radius=12)
PRIMARY_KPI_STYLE = _style(background=HEADER, border=HEADER, radius=12)
HEALTH_MIX_STYLE = _style(background="#F8FAFC", border=SOFT_BORDER, radius=12)
HEALTH_TILE_STYLE = _style(background="#F8FAFC", border=SOFT_BORDER, radius=12)
OVERVIEW_CHART_STYLE = _style(background=SURFACE, border="#D8E1EC", radius=12)
OVERVIEW_TABLE_STYLE = _style(background=SURFACE, border="#D8E1EC", radius=12)
TRANSPARENT_STYLE = _style(
    background="rgba(255, 255, 255, 0)",
    border="rgba(255, 255, 255, 0)",
    edges=[],
    radius=10,
    width=0,
)
SECTION_HEADING_STYLE = _style(
    background=CANVAS,
    border=CANVAS,
    edges=[],
    radius=0,
    width=0,
)


def _overview_kpi_style(color: str) -> dict[str, Any]:
    return _style(background=SURFACE, border=color, edges=["left"], radius=12, width=4)


def _overview_health_tile_style(color: str) -> dict[str, Any]:
    return _style(background="#F8FAFC", border=color, edges=["all"], radius=12, width=1)


def _primary_kpi_style() -> dict[str, Any]:
    return _style(background=HEADER, border=HEADER, radius=12)


def _place(
    name: str,
    column: int,
    row: int,
    colspan: int,
    rowspan: int,
    style: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "colspan": colspan,
        "column": column,
        "name": name,
        "row": row,
        "rowspan": rowspan,
        "widgetStyle": copy.deepcopy(style or CARD_STYLE),
    }


def _header_places(
    prefix: str,
    *,
    action: str | None = None,
    back: str | None = None,
    mobile: bool = False,
    persistent_nav: bool = False,
) -> list[dict[str, Any]]:
    if persistent_nav:
        if mobile:
            return [
                _place(f"{prefix}_header_container", 0, 0, 12, 13, HEADER_STYLE),
                _place(f"{prefix}_title", 1, 1, 10, 6, OVERLAY_STYLE),
                _place(f"{prefix}_nav_risk", 1, 8, 3, 3, NAV_BUTTON_STYLE),
                _place(f"{prefix}_nav_retention", 4, 8, 4, 3, NAV_BUTTON_STYLE),
                _place(f"{prefix}_nav_expansion", 8, 8, 3, 3, NAV_BUTTON_STYLE),
            ]
        return [
            _place(f"{prefix}_header_container", 0, 0, 48, 10, HEADER_STYLE),
            _place(f"{prefix}_title", 1, 1, 24, 7, OVERLAY_STYLE),
            _place(f"{prefix}_nav_risk", 26, 3, 7, 3, NAV_BUTTON_STYLE),
            _place(f"{prefix}_nav_retention", 33, 3, 8, 3, NAV_BUTTON_STYLE),
            _place(f"{prefix}_nav_expansion", 41, 3, 6, 3, NAV_BUTTON_STYLE),
        ]

    if mobile:
        placements = [
            _place(f"{prefix}_header_container", 0, 0, 12, 10, HEADER_STYLE),
            _place(f"{prefix}_title", 1, 1, 10, 5, OVERLAY_STYLE),
            _place(f"{prefix}_reset", 6, 6, 5, 3, BUTTON_STYLE),
        ]
        if action:
            placements.append(_place(action, 1, 6, 5, 3, BUTTON_STYLE))
        elif back:
            placements.append(_place(back, 1, 6, 5, 3, BUTTON_STYLE))
        return placements

    placements = [
        _place(f"{prefix}_header_container", 0, 0, 48, 8, HEADER_STYLE),
        _place(f"{prefix}_title", 1, 1, 32, 6, OVERLAY_STYLE),
        _place(f"{prefix}_reset", 41, 2, 6, 3, BUTTON_STYLE),
    ]
    if action:
        placements.append(_place(action, 33, 2, 7, 3, BUTTON_STYLE))
    elif back:
        placements.append(_place(back, 33, 2, 7, 3, BUTTON_STYLE))
    return placements


def _overview_header_places(*, mobile: bool = False) -> list[dict[str, Any]]:
    if mobile:
        return [
            _place("overview_header_container", 0, 0, 12, 13, HEADER_STYLE),
            _place("overview_title_mobile", 1, 1, 10, 3, OVERLAY_STYLE),
            _place("overview_present_nav_risk_surface", 1, 8, 3, 3, PRESENT_BUTTON_STYLE),
            _place("overview_present_nav_retention_surface", 4, 8, 4, 3, PRESENT_BUTTON_STYLE),
            _place("overview_present_nav_expansion_surface", 8, 8, 3, 3, PRESENT_BUTTON_STYLE),
            _place("overview_present_nav_risk_label", 1, 8, 3, 3, TRANSPARENT_STYLE),
            _place("overview_present_nav_retention_label", 4, 8, 4, 3, TRANSPARENT_STYLE),
            _place("overview_present_nav_expansion_label", 8, 8, 3, 3, TRANSPARENT_STYLE),
            _place("overview_nav_risk", 1, 8, 3, 3, TRANSPARENT_STYLE),
            _place("overview_nav_retention", 4, 8, 4, 3, TRANSPARENT_STYLE),
            _place("overview_nav_expansion", 8, 8, 3, 3, TRANSPARENT_STYLE),
        ]
    return [
        _place("overview_header_container", 0, 0, 48, 8, HEADER_STYLE),
        _place("overview_title", 1, 1, 25, 6, OVERLAY_STYLE),
        _place("overview_present_nav_risk_surface", 27, 2, 6, 3, PRESENT_BUTTON_STYLE),
        _place("overview_present_nav_retention_surface", 33, 2, 8, 3, PRESENT_BUTTON_STYLE),
        _place("overview_present_nav_expansion_surface", 41, 2, 6, 3, PRESENT_BUTTON_STYLE),
        _place("overview_present_nav_risk_label", 27, 2, 6, 3, TRANSPARENT_STYLE),
        _place("overview_present_nav_retention_label", 33, 2, 8, 3, TRANSPARENT_STYLE),
        _place("overview_present_nav_expansion_label", 41, 2, 6, 3, TRANSPARENT_STYLE),
        _place("overview_nav_risk", 27, 2, 6, 3, TRANSPARENT_STYLE),
        _place("overview_nav_retention", 33, 2, 8, 3, TRANSPARENT_STYLE),
        _place("overview_nav_expansion", 41, 2, 6, 3, TRANSPARENT_STYLE),
    ]


def _layout(name: str, pages: list[dict[str, Any]], *, mobile: bool = False) -> dict[str, Any]:
    return {
        "maxWidth": 375 if mobile else 1600,
        "name": "Mobile" if mobile else "Default",
        "numColumns": 12 if mobile else 48,
        "pages": pages,
        "rowHeight": "fine",
        "selectors": ["maxWidth(599)"] if mobile else ["minWidth(600)"],
        "style": {
            "alignmentX": "left",
            "alignmentY": "top",
            "backgroundColor": CANVAS,
            "cellSpacingX": 3 if mobile else 4,
            "cellSpacingY": 3 if mobile else 4,
            "fit": "original",
            "gutterColor": CANVAS,
        },
        "version": 1,
    }


def _page(label: str, name: str, widgets: list[dict[str, Any]]) -> dict[str, Any]:
    return {"label": label, "name": name, "navigationHidden": False, "widgets": widgets}


def _base_dashboard(
    steps: dict[str, Any],
    widgets: dict[str, Any],
    desktop_pages: list[dict[str, Any]],
    mobile_pages: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "dataSourceLinksInfo": {
            "enableAutomaticLinking": True,
            "excludeRelationships": [],
            "links": [],
        },
        "filters": [],
        "gridLayouts": [
            _layout("Default", desktop_pages),
            _layout("Mobile", mobile_pages, mobile=True),
        ],
        "layouts": [],
        "steps": steps,
        "widgetStyle": {
            "backgroundColor": SURFACE,
            "borderColor": BORDER,
            "borderEdges": ["all"],
            "borderRadius": 8,
            "borderWidth": 1,
            "tooltipStyle": {
                "backgroundColor": HEADER,
                "labelColor": "#CBD5E1",
                "valueColor": "#FFFFFF",
            },
        },
        "widgets": widgets,
    }


def _query_sum(field: str, *, filters: list[list[Any]] | None = None) -> dict[str, Any]:
    return {"measures": [["sum", field]], "filters": filters or []}


def _query_count(*, filters: list[list[Any]] | None = None) -> dict[str, Any]:
    return {"measures": [["count", "*"]], "filters": filters or []}


def _query_avg(field: str, *, filters: list[list[Any]] | None = None) -> dict[str, Any]:
    return {"measures": [["avg", field]], "filters": filters or []}


def _arr_query(field: str, *, filters: list[list[Any]] | None = None, header: str) -> dict[str, Any]:
    return {
        "measures": [["sum", field, "A"]],
        "columns": [
            {"query": {"measures": [["sum", field]]}},
            {"query": {"measures": [["sum", field]], "formula": "A * 12"}, "header": header},
        ],
        "filters": filters or [],
    }


def _arr_step(
    dataset: str,
    field: str,
    alias: str,
    *,
    bands: list[str] | None = None,
) -> dict[str, Any]:
    lines = [f'q = load "{dataset}";']
    if bands:
        quoted_bands = ", ".join(f'"{band}"' for band in bands)
        lines.append(f"q = filter q by 'Risk_Band__c' in [{quoted_bands}];")
    lines.extend(
        [
            "q = group q by all;",
            f"q = foreach q generate sum(q.'{field}') * 12 as '{alias}';",
        ]
    )
    return {
        "broadcastFacet": False,
        "groups": [],
        "numbers": [alias],
        "query": " ".join(lines),
        "receiveFacetSource": {"mode": "all", "steps": []},
        "selectMode": "single",
        "strings": [],
        "type": "saql",
        "useGlobal": True,
        "visualizationParameters": {
            "options": {},
            "visualizationType": "hbar",
        },
    }


def _filter_step(dataset: str, field: str) -> dict[str, Any]:
    return _aggregate(
        dataset,
        {
            "measures": [["count", "*"]],
            "groups": [field],
            "order": [[field, {"ascending": True}]],
        },
        broadcast=True,
    )


def _mobile_stack(
    prefix: str,
    *,
    filters: list[str],
    kpis: list[str],
    charts: list[str],
    table: str | None,
    action: str | None = None,
    back: str | None = None,
    persistent_nav: bool = False,
    reset: str | None = None,
) -> list[dict[str, Any]]:
    placements = _header_places(
        prefix,
        action=action,
        back=back,
        mobile=True,
        persistent_nav=persistent_nav,
    )
    row = 14 if persistent_nav else 11
    for name in filters:
        placements.append(_place(name, 0, row, 12, 6, FILTER_STYLE))
        row += 7
    if reset:
        placements.append(_place(reset, 0, row, 12, 4, BUTTON_STYLE))
        row += 5
    for name in kpis:
        placements.append(_place(name, 0, row, 12, 6, CARD_STYLE))
        row += 7
    for name in charts:
        placements.append(_place(name, 0, row, 12, 22, CARD_STYLE))
        row += 23
    if table:
        placements.append(_place(table, 0, row, 12, 34, CARD_STYLE))
    return placements


def _merge_overview(
    existing: dict[str, Any],
    generated: dict[str, Any],
) -> dict[str, Any]:
    merged = copy.deepcopy(existing)

    generated_layouts = {layout["name"]: layout for layout in generated["gridLayouts"]}
    for layout in merged["gridLayouts"]:
        generated_layout = generated_layouts[layout["name"]]
        layout["selectors"] = copy.deepcopy(generated_layout["selectors"])
        generated_page = next(
            page for page in generated_layout["pages"] if page["name"] == "cscc-overview"
        )
        page_index = next(
            index
            for index, page in enumerate(layout["pages"])
            if page["name"] == "cscc-overview"
        )
        layout["pages"][page_index] = copy.deepcopy(generated_page)

    generated_widgets = {
        name: widget
        for name, widget in generated["widgets"].items()
        if name.startswith(OVERVIEW_PREFIXES)
    }
    merged["widgets"] = {
        name: widget
        for name, widget in merged["widgets"].items()
        if not name.startswith(OVERVIEW_PREFIXES)
    }
    merged["widgets"].update(copy.deepcopy(generated_widgets))

    generated_step_names = {
        widget["parameters"]["step"]
        for widget in generated_widgets.values()
        if widget["parameters"].get("step")
    }
    merged["steps"] = {
        name: step
        for name, step in merged["steps"].items()
        if not name.startswith("overview_") and name not in generated_step_names
    }
    merged["steps"].update(
        {
            name: copy.deepcopy(generated["steps"][name])
            for name in sorted(generated_step_names)
        }
    )
    return merged


def _build_landing(*, overview_only: bool = False) -> None:
    base = _load("Landing_Page")
    nonhealthy = [["Risk_Band__c", ["Critical", "At Risk", "Watch"], "in"]]
    severe = [["Risk_Band__c", ["Critical", "At Risk"], "in"]]

    steps = {
        "portfolio_filter_csm": _filter_step("Customer_360", "Customer_Success_Manager__c"),
        "portfolio_filter_segment": _filter_step("Customer_360", "Segment__c"),
        "portfolio_filter_region": _filter_step("Customer_360", "Region__c"),
        "portfolio_filter_plan": _filter_step("Customer_360", "Plan_Tier__c"),
        "kpi_current_arr": _arr_step(
            "Customer_360", "Current_MRR__c", "Current_ARR"
        ),
        "kpi_customers": _aggregate("Customer_360", _query_count()),
        "kpi_avg_health": _aggregate("Customer_360", _query_avg("Health_Score__c")),
        "kpi_at_risk_arr": _arr_step(
            "Customer_360",
            "Current_MRR__c",
            "At_Risk_ARR",
            bands=["Critical", "At Risk"],
        ),
        "kpi_open_expansion": _aggregate(
            "Expansion_Opportunities", _query_sum("Open_Pipeline_Amount__c")
        ),
        "overview_arr_risk": _aggregate(
            "Customer_360",
            {
                "measures": [["sum", "Current_MRR__c"]],
                "groups": ["Risk_Band__c"],
                "order": [["sum_Current_MRR__c", {"ascending": False}]],
            },
        ),
        "overview_count_healthy": _aggregate(
            "Customer_360",
            _query_count(filters=[["Risk_Band__c", ["Healthy"], "in"]]),
        ),
        "overview_count_watch": _aggregate(
            "Customer_360",
            _query_count(filters=[["Risk_Band__c", ["Watch"], "in"]]),
        ),
        "overview_count_at_risk": _aggregate(
            "Customer_360",
            _query_count(filters=[["Risk_Band__c", ["At Risk"], "in"]]),
        ),
        "overview_count_critical": _aggregate(
            "Customer_360",
            _query_count(filters=[["Risk_Band__c", ["Critical"], "in"]]),
        ),
        "overview_owner_attention": _aggregate(
            "Churn_Risk_Accounts",
            {
                "measures": [["sum", "MRR__c"]],
                "groups": ["Customer_Success_Manager__c"],
                "filters": nonhealthy,
                "order": [["sum_MRR__c", {"ascending": False}]],
            },
        ),
        "overview_top_risk": _grain(
            "Churn_Risk_Accounts",
            [
                "Priority_Rank__c",
                "Account_Name__c",
                "Risk_Band__c",
                "MRR__c",
                "Customer_Success_Manager__c",
                "Recommended_Action__c",
            ],
            filters=nonhealthy,
            order=[["Priority_Rank__c", {"ascending": True}]],
            limit=8,
        ),
        "overview_top_risk_mobile": _grain(
            "Churn_Risk_Accounts",
            [
                "Priority_Rank__c",
                "Account_Name__c",
                "Risk_Band__c",
                "Customer_Success_Manager__c",
                "Recommended_Action__c",
            ],
            filters=nonhealthy,
            order=[["Priority_Rank__c", {"ascending": True}]],
            limit=8,
        ),
        "risk_filter_csm": _filter_step("Churn_Risk_Accounts", "Customer_Success_Manager__c"),
        "risk_filter_segment": _filter_step("Churn_Risk_Accounts", "Segment__c"),
        "risk_filter_region": _filter_step("Churn_Risk_Accounts", "Region__c"),
        "risk_filter_plan": _filter_step("Churn_Risk_Accounts", "Plan_Tier__c"),
        "risk_attention_count": _aggregate(
            "Churn_Risk_Accounts", _query_count(filters=nonhealthy)
        ),
        "risk_critical_count": _aggregate(
            "Churn_Risk_Accounts",
            _query_count(filters=[["Risk_Band__c", ["Critical"], "in"]]),
        ),
        "risk_at_risk_arr": _arr_step(
            "Churn_Risk_Accounts",
            "MRR__c",
            "At_Risk_ARR",
            bands=["Critical", "At Risk"],
        ),
        "risk_avg_health": _aggregate(
            "Churn_Risk_Accounts", _query_avg("Health_Score__c", filters=nonhealthy)
        ),
        "risk_summary": _aggregate(
            "Churn_Risk_Accounts",
            {
                "measures": [["sum", "MRR__c"]],
                "groups": ["Risk_Band__c"],
                "filters": nonhealthy,
                "order": [["sum_MRR__c", {"ascending": False}]],
            },
        ),
        "risk_driver": _aggregate(
            "Churn_Risk_Accounts",
            {
                "measures": [["sum", "MRR__c"]],
                "groups": ["Main_Risk_Driver__c"],
                "filters": nonhealthy,
                "order": [["sum_MRR__c", {"ascending": False}]],
            },
        ),
        "risk_queue": _grain(
            "Churn_Risk_Accounts",
            [
                "Priority_Rank__c",
                "Account_Name__c",
                "Risk_Band__c",
                "MRR__c",
                "Health_Score__c",
                "Main_Risk_Driver__c",
                "Customer_Success_Manager__c",
                "Recommended_Action__c",
            ],
            filters=nonhealthy,
            order=[["Priority_Rank__c", {"ascending": True}]],
            limit=25,
        ),
        "retention_cohort_filter": _filter_step("Retention_Cohorts", "Cohort_Month__c"),
        "retention_heatmap": _aggregate(
            "Retention_Cohorts",
            {
                "measures": [["avg", "Retention_Rate__c"]],
                "groups": ["Cohort_Quarter__c", "Month_Since_Acquisition__c"],
                "order": [
                    ["Cohort_Quarter__c", {"ascending": True}],
                    ["Month_Since_Acquisition__c", {"ascending": True}],
                ],
            },
            visualization="matrix",
        ),
        "retention_trend": _aggregate(
            "Retention_Cohorts",
            {
                "measures": [["avg", "Retention_Rate__c"]],
                "groups": ["Month_Since_Acquisition__c"],
                "order": [["Month_Since_Acquisition__c", {"ascending": True}]],
            },
            visualization="line",
        ),
        "retention_ltv": _aggregate(
            "LTV_By_Segment",
            {
                "measures": [["avg", "Estimated_LTV__c"]],
                "groups": ["Segment__c"],
                "order": [["avg_Estimated_LTV__c", {"ascending": False}]],
            },
        ),
        "expansion_filter_csm": _filter_step(
            "Expansion_Opportunities", "Customer_Success_Manager__c"
        ),
        "expansion_filter_segment": _filter_step("Expansion_Opportunities", "Segment__c"),
        "expansion_filter_region": _filter_step("Expansion_Opportunities", "Region__c"),
        "expansion_filter_plan": _filter_step("Expansion_Opportunities", "Plan_Tier__c"),
        "exp_kpi_open": _aggregate(
            "Expansion_Opportunities", _query_sum("Open_Pipeline_Amount__c")
        ),
        "exp_kpi_weighted": _aggregate(
            "Expansion_Opportunities", _query_sum("Weighted_Pipeline_Amount__c")
        ),
        "exp_kpi_ready": _aggregate(
            "Expansion_Opportunities",
            _query_count(
                filters=[["Expansion_Readiness__c", ["Expansion Ready"], "in"]]
            ),
        ),
        "exp_kpi_health": _aggregate(
            "Expansion_Opportunities", _query_avg("Health_Score__c")
        ),
        "exp_readiness": _aggregate(
            "Expansion_Opportunities",
            {
                "measures": [
                    ["sum", "Open_Pipeline_Amount__c"],
                    ["sum", "Weighted_Pipeline_Amount__c"],
                ],
                "groups": ["Expansion_Readiness__c"],
                "order": [["sum_Open_Pipeline_Amount__c", {"ascending": False}]],
            },
        ),
        "exp_timeline": _aggregate(
            "Expansion_Opportunities",
            {
                "measures": [["sum", "Weighted_Pipeline_Amount__c"]],
                "groups": ["Close_Month__c"],
                "order": [["Close_Month__c", {"ascending": True}]],
            },
            visualization="vbar",
        ),
        "exp_queue": _grain(
            "Expansion_Opportunities",
            [
                "Account_Name__c",
                "Expansion_Readiness__c",
                "Open_Pipeline_Amount__c",
                "Weighted_Pipeline_Amount__c",
                "Health_Score__c",
                "Next_Close_Date__c",
                "Close_Month__c",
                "Customer_Success_Manager__c",
            ],
            order=[["Weighted_Pipeline_Amount__c", {"ascending": False}]],
            limit=25,
        ),
        "support_churn": _aggregate(
            "Support_Impact_On_Churn",
            {
                "measures": [["avg", "Churn_Rate__c"]],
                "groups": ["Segment__c"],
                "order": [["avg_Churn_Rate__c", {"ascending": False}]],
            },
        ),
        "support_health": _aggregate(
            "Support_Impact_On_Churn",
            {
                "measures": [["avg", "Avg_Health_Score__c"]],
                "groups": ["Segment__c"],
                "order": [["avg_Avg_Health_Score__c", {"ascending": False}]],
            },
        ),
        "support_table": _grain(
            "Support_Impact_On_Churn",
            [
                "Segment__c",
                "Plan_Tier__c",
                "Customers__c",
                "Churn_Rate__c",
                "Avg_Health_Score__c",
                "Avg_Support_Calls__c",
                "Avg_Escalated_Calls__c",
                "Avg_Resolution_Rate__c",
            ],
            order=[["Churn_Rate__c", {"ascending": False}]],
            limit=20,
        ),
    }

    widgets: dict[str, Any] = {}

    def add_header(prefix: str, title: str, subtitle: str) -> None:
        widgets[f"{prefix}_header_container"] = _container_widget()
        widgets[f"{prefix}_title"] = _header_widget(title, subtitle)
        widgets[f"{prefix}_reset"] = _link_widget(
            base, "overview_reset", "Reset filters", "Landing_Page"
        )
        widgets[f"{prefix}_nav_risk"] = _link_widget(
            base,
            "overview_reset",
            "Risk Queue",
            "At_Risk_Account_Dashboard",
            font_size=13,
            text_color="rgba(255, 255, 255, 0)",
        )
        widgets[f"{prefix}_nav_retention"] = _link_widget(
            base,
            "overview_reset",
            "Retention Cohorts",
            "Retention_Cohort_Dashboard",
            font_size=13,
            text_color="rgba(255, 255, 255, 0)",
        )
        widgets[f"{prefix}_nav_expansion"] = _link_widget(
            base,
            "overview_reset",
            "Expansion Pipeline",
            "Expansion_Pipeline_Dashboard",
            font_size=13,
            text_color="rgba(255, 255, 255, 0)",
        )
        widgets[f"{prefix}_toolbar_label"] = _rich_text(
            [("Portfolio controls | All customer records", MUTED, False)],
            body_size="11px",
        )

    add_header(
        "overview",
        "Customer Success Command Center",
        "Revenue, customer health, retention risk, and expansion opportunity across a 100-account portfolio.",
    )
    widgets["overview_filter_container"] = _container_widget()
    widgets["overview_present_nav_risk_surface"] = _present_container_widget()
    widgets["overview_present_nav_retention_surface"] = _present_container_widget()
    widgets["overview_present_nav_expansion_surface"] = _present_container_widget()
    widgets["overview_present_reset_surface"] = _present_container_widget()
    widgets["overview_present_queue_card"] = _present_container_widget()
    widgets["overview_present_nav_risk_label"] = _present_text(
        "Risk Queue", color="#F8FAFC", size="13px"
    )
    widgets["overview_present_nav_retention_label"] = _present_text(
        "Retention Cohorts", color="#F8FAFC", size="13px"
    )
    widgets["overview_present_nav_expansion_label"] = _present_text(
        "Expansion Pipeline", color="#F8FAFC", size="13px"
    )
    widgets["overview_present_reset_label"] = _present_text(
        "Reset filters", color=TEXT, size="12px"
    )
    widgets["overview_title_mobile"] = _rich_text(
        [
            ("Customer Success Command Center", "#FFFFFF", True),
            ("Illustrative 2025 portfolio snapshot", "#94A3B8", False),
        ],
        title_size="18px",
        body_size="10px",
    )
    widgets.pop("overview_toolbar_label", None)
    add_header(
        "risk",
        "Health & Risk",
        "Prioritize accounts by current recurring revenue exposure, severity, and ownership.",
    )
    add_header(
        "retention",
        "Retention & LTV",
        "Connect cohort behavior with segment-level lifetime value assumptions.",
    )
    add_header(
        "expansion",
        "Expansion",
        "Focus growth effort on healthy accounts with material probability-adjusted pipeline.",
    )
    add_header(
        "support",
        "Support Impact",
        "Compare churn and health outcomes by segment while keeping sample limitations visible.",
    )
    add_header(
        "guide",
        "Metric Guide",
        "Definitions, formulas, interpretation guidance, and portfolio-scope caveats.",
    )

    for name, step, title in (
        ("overview_selector_csm", "portfolio_filter_csm", "Customer Success Manager"),
        ("overview_selector_segment", "portfolio_filter_segment", "Customer Segment"),
        ("overview_selector_region", "portfolio_filter_region", "Region"),
        ("overview_selector_plan", "portfolio_filter_plan", "Plan Tier"),
        ("risk_selector_csm", "risk_filter_csm", "Customer Success Manager"),
        ("risk_selector_segment", "risk_filter_segment", "Customer Segment"),
        ("risk_selector_region", "risk_filter_region", "Region"),
        ("risk_selector_plan", "risk_filter_plan", "Plan Tier"),
        ("retention_selector_cohort", "retention_cohort_filter", "Customer Cohort"),
        ("exp_selector_csm", "expansion_filter_csm", "Customer Success Manager"),
        ("exp_selector_segment", "expansion_filter_segment", "Customer Segment"),
        ("exp_selector_region", "expansion_filter_region", "Region"),
        ("exp_selector_plan", "expansion_filter_plan", "Plan Tier"),
    ):
        widgets[name] = _selector_widget(
            base, "overview_selector_segment", step=step, title=title
        )

    for name, step, measure, title, color in (
        (
            "overview_kpi_arr_number",
            "kpi_current_arr",
            "Current_ARR",
            "Current ARR (USD)",
            TEXT,
        ),
        ("overview_kpi_customers_number", "kpi_customers", "count", "Customers", TEXT),
        (
            "overview_kpi_health_number",
            "kpi_avg_health",
            "avg_Health_Score__c",
            "Average Health Score",
            GREEN,
        ),
        (
            "overview_kpi_risk_number",
            "kpi_at_risk_arr",
            "At_Risk_ARR",
            "At-Risk ARR (USD)",
            RED,
        ),
        (
            "overview_kpi_expansion_number",
            "kpi_open_expansion",
            "sum_Open_Pipeline_Amount__c",
            "Open Expansion Pipeline",
            TEAL,
        ),
        ("risk_kpi_attention", "risk_attention_count", "count", "Accounts Requiring Attention", TEXT),
        ("risk_kpi_critical", "risk_critical_count", "count", "Critical Accounts", RED),
        ("risk_kpi_arr", "risk_at_risk_arr", "At_Risk_ARR", "At-Risk ARR", RED),
        (
            "risk_kpi_health",
            "risk_avg_health",
            "avg_Health_Score__c",
            "Average Queue Health",
            AMBER,
        ),
        (
            "exp_number_open",
            "exp_kpi_open",
            "sum_Open_Pipeline_Amount__c",
            "Open Expansion Pipeline",
            TEAL,
        ),
        (
            "exp_number_weighted",
            "exp_kpi_weighted",
            "sum_Weighted_Pipeline_Amount__c",
            "Weighted Pipeline",
            BLUE,
        ),
        ("exp_number_ready", "exp_kpi_ready", "count", "Expansion-Ready Accounts", GREEN),
        (
            "exp_number_health",
            "exp_kpi_health",
            "avg_Health_Score__c",
            "Average Health Score",
            GREEN,
        ),
    ):
        widgets[name] = _number_widget(
            base,
            "overview_kpi_arr_number",
            step=step,
            measure=measure,
            title=title,
            color=color,
        )
    widgets["overview_kpi_arr_number"]["parameters"]["numberSize"] = 36
    widgets["overview_kpi_arr_number"]["parameters"].update(
        {"numberColor": "#FFFFFF", "titleColor": "#CBD5E1"}
    )

    for name, step, title, color in (
        ("overview_health_healthy", "overview_count_healthy", "Healthy", GREEN),
        ("overview_health_watch", "overview_count_watch", "Watch", AMBER),
        ("overview_health_at_risk", "overview_count_at_risk", "At Risk", "#EA580C"),
        ("overview_health_critical", "overview_count_critical", "Critical", RED),
    ):
        widgets[name] = _number_widget(
            base,
            "overview_kpi_arr_number",
            step=step,
            measure="count",
            title=title,
            color=color,
            number_size=28,
        )

    widgets["overview_chart_arr_risk"] = _chart_widget(
        base,
        "overview_chart_arr_risk",
        step="overview_arr_risk",
        title="Current MRR Exposure by Risk Band",
        subtitle="Current MRR; churned accounts contribute zero.",
        visualization="hbar",
        dimensions=["Risk_Band__c"],
        plots=["sum_Current_MRR__c"],
        dimension_title="Risk Band",
        measure_title="Current Monthly Recurring Revenue",
    )
    widgets["overview_chart_arr_risk"]["parameters"]["measureAxis1"].update(
        {"showTitle": False, "title": ""}
    )
    widgets["overview_chart_arr_risk"]["parameters"]["dimensionAxis"].update(
        {"showTitle": False, "title": ""}
    )
    widgets["overview_health_container"] = _container_widget()
    widgets["overview_health_heading"] = _text_card(
        "Portfolio Health Mix",
        "Customer count by modeled risk band.",
    )
    widgets["overview_chart_owner_attention"] = _chart_widget(
        base,
        "overview_chart_arr_risk",
        step="overview_owner_attention",
        title="Revenue Requiring Attention by Owner",
        subtitle="Watch, At Risk, and Critical current MRR.",
        visualization="hbar",
        dimensions=["Customer_Success_Manager__c"],
        plots=["sum_MRR__c"],
        dimension_title="Customer Success Manager",
        measure_title="Current Monthly Recurring Revenue",
        legend=False,
    )
    widgets["overview_chart_owner_attention"]["parameters"]["measureAxis1"].update(
        {"showTitle": False, "title": ""}
    )
    widgets["overview_chart_owner_attention"]["parameters"]["dimensionAxis"].update(
        {"showTitle": False, "title": ""}
    )
    widgets["risk_chart_summary"] = _chart_widget(
        base,
        "overview_chart_arr_risk",
        step="risk_summary",
        title="Current MRR by Risk Band",
        subtitle="Revenue exposure among accounts requiring attention.",
        visualization="hbar",
        dimensions=["Risk_Band__c"],
        plots=["sum_MRR__c"],
        dimension_title="Risk Band",
        measure_title="Current Monthly Recurring Revenue",
    )
    widgets["risk_chart_driver"] = _chart_widget(
        base,
        "overview_chart_arr_risk",
        step="risk_driver",
        title="Revenue Exposure by Primary Risk Driver",
        subtitle="Issues associated with the largest current recurring revenue exposure.",
        visualization="hbar",
        dimensions=["Main_Risk_Driver__c"],
        plots=["sum_MRR__c"],
        dimension_title="Primary Risk Driver",
        measure_title="Current Monthly Recurring Revenue",
    )
    widgets["retention_chart_heatmap"] = _matrix_widget(
        base,
        "retention_chart_heatmap",
        step="retention_heatmap",
        title="Cohort Retention Heatmap",
    )
    widgets["retention_chart_trend"] = _chart_widget(
        base,
        "retention_chart_trend",
        step="retention_trend",
        title="Average Retention Curve",
        subtitle="Typical retained share as customer tenure progresses.",
        visualization="line",
        dimensions=["Month_Since_Acquisition__c"],
        plots=["avg_Retention_Rate__c"],
        dimension_title="Month Since Acquisition",
        measure_title="Retention Rate",
        value_type="percent",
        legend=False,
    )
    widgets["retention_chart_ltv"] = _chart_widget(
        base,
        "overview_chart_arr_risk",
        step="retention_ltv",
        title="Estimated LTV by Customer Segment",
        subtitle="Illustrative LTV based on average MRR, 75% gross margin, and churn assumptions.",
        visualization="hbar",
        dimensions=["Segment__c"],
        plots=["avg_Estimated_LTV__c"],
        dimension_title="Customer Segment",
        measure_title="Estimated Lifetime Value",
    )
    widgets["exp_chart_readiness"] = _chart_widget(
        base,
        "overview_chart_arr_risk",
        step="exp_readiness",
        title="Open and Weighted Pipeline by Readiness",
        subtitle="Full potential value compared with probability-adjusted value.",
        visualization="hbar",
        dimensions=["Expansion_Readiness__c"],
        plots=["sum_Open_Pipeline_Amount__c", "sum_Weighted_Pipeline_Amount__c"],
        dimension_title="Expansion Readiness",
        measure_title="Pipeline Value",
    )
    widgets["exp_chart_timeline"] = _chart_widget(
        base,
        "overview_chart_arr_risk",
        step="exp_timeline",
        title="Weighted Pipeline by Expected Close Month",
        subtitle="Monthly timing view of the illustrative 2025 opportunity pipeline.",
        visualization="vbar",
        dimensions=["Close_Month__c"],
        plots=["sum_Weighted_Pipeline_Amount__c"],
        dimension_title="Expected Close Month",
        measure_title="Weighted Expansion Pipeline",
        legend=False,
    )
    widgets["support_chart_churn"] = _chart_widget(
        base,
        "overview_chart_arr_risk",
        step="support_churn",
        title="Churn Rate by Customer Segment",
        subtitle="Observed churn in the illustrative customer portfolio.",
        visualization="hbar",
        dimensions=["Segment__c"],
        plots=["avg_Churn_Rate__c"],
        dimension_title="Customer Segment",
        measure_title="Churn Rate",
        value_type="percent",
        legend=False,
    )
    widgets["support_chart_health"] = _chart_widget(
        base,
        "overview_chart_arr_risk",
        step="support_health",
        title="Average Health Score by Customer Segment",
        subtitle="Health combines usage, payment, support, and customer-success signals.",
        visualization="hbar",
        dimensions=["Segment__c"],
        plots=["avg_Avg_Health_Score__c"],
        dimension_title="Customer Segment",
        measure_title="Average Health Score",
        value_type="none",
        legend=False,
    )

    widgets["overview_table_risk"] = _table_widget(
        base,
        "overview_table_risk",
        step="overview_top_risk",
        columns=[
            "Account_Name__c",
            "Risk_Band__c",
            "MRR__c",
            "Customer_Success_Manager__c",
            "Recommended_Action__c",
        ],
        column_widths={
            "Account_Name__c": 150,
            "Risk_Band__c": 90,
            "MRR__c": 210,
            "Customer_Success_Manager__c": 210,
            "Recommended_Action__c": 360,
        },
        max_column_width=360,
        min_column_width=90,
    )
    widgets["overview_table_risk_mobile"] = _table_widget(
        base,
        "overview_table_risk",
        step="overview_top_risk_mobile",
        columns=[
            "Account_Name__c",
            "Risk_Band__c",
            "Customer_Success_Manager__c",
            "Recommended_Action__c",
        ],
        column_widths={
            "Account_Name__c": 88,
            "Risk_Band__c": 58,
            "Customer_Success_Manager__c": 96,
            "Recommended_Action__c": 100,
        },
        max_column_width=108,
        min_column_width=54,
        number_of_lines=3,
    )
    widgets["overview_table_risk_mobile"]["parameters"]["header"]["fontSize"] = 8
    widgets["risk_table_queue"] = _table_widget(
        base,
        "risk_table_queue",
        step="risk_queue",
        columns=[
            "Account_Name__c",
            "Risk_Band__c",
            "MRR__c",
            "Health_Score__c",
            "Main_Risk_Driver__c",
            "Customer_Success_Manager__c",
            "Recommended_Action__c",
        ],
        column_widths={
            "Account_Name__c": 150,
            "Risk_Band__c": 90,
            "MRR__c": 125,
            "Health_Score__c": 100,
            "Main_Risk_Driver__c": 170,
            "Customer_Success_Manager__c": 170,
            "Recommended_Action__c": 300,
        },
        max_column_width=300,
    )
    widgets["exp_table_queue"] = _table_widget(
        base,
        "exp_table_queue",
        step="exp_queue",
        columns=[
            "Account_Name__c",
            "Expansion_Readiness__c",
            "Open_Pipeline_Amount__c",
            "Weighted_Pipeline_Amount__c",
            "Health_Score__c",
            "Customer_Success_Manager__c",
        ],
        column_widths={
            "Account_Name__c": 170,
            "Expansion_Readiness__c": 150,
            "Open_Pipeline_Amount__c": 150,
            "Weighted_Pipeline_Amount__c": 165,
            "Health_Score__c": 110,
            "Customer_Success_Manager__c": 190,
        },
        max_column_width=190,
    )
    widgets["support_table_detail"] = _table_widget(
        base, "support_table_detail", step="support_table"
    )
    widgets["support_note"] = _text_card(
        "Sample limitation",
        "The portfolio sample contains no support calls for these customer records, so support volume and escalation measures are zero. Use this page to review the modeled semantic layer and the churn/health segment comparison, not to claim a causal support relationship.",
    )
    widgets["overview_queue_heading"] = _text_card(
        "Priority Risk Queue",
        "Top Watch, At Risk, and Critical accounts ranked for customer-success intervention.",
    )
    widgets["risk_queue_heading"] = _text_card(
        "Actionable Account Queue",
        "Ownership, revenue exposure, root cause, and recommended next action in priority order.",
    )
    widgets["exp_queue_heading"] = _text_card(
        "Expansion Ownership Queue",
        "Highest-value opportunities with readiness, timing, health, and customer-success ownership.",
    )
    widgets["support_table_heading"] = _text_card(
        "Segment Comparison",
        "Concise portfolio-level health, churn, support-volume, escalation, and resolution measures.",
    )

    guide_cards = {
        "guide_finance": (
            "ARR and MRR",
            "Current ARR = current monthly recurring revenue x 12. At-risk ARR applies the same annualization only to Critical and At Risk accounts. Churned accounts have zero current MRR.",
        ),
        "guide_health": (
            "Health Score and Risk Band",
            "Health Score combines product usage, payment health, support experience, and customer-success engagement. Risk bands translate that score into Healthy, Watch, At Risk, and Critical.",
        ),
        "guide_retention": (
            "Retention Cohorts",
            "Rows group customers by acquisition month. Retention Rate is the share still retained at each month since acquisition. Small cohort sizes make this sample directional.",
        ),
        "guide_ltv": (
            "Estimated Lifetime Value",
            "Portfolio LTV uses average MRR x 75% gross margin divided by the assumed monthly churn rate. It is a modeling demonstration, not a finance forecast.",
        ),
        "guide_pipeline": (
            "Expansion Pipeline",
            "Open Pipeline is total potential opportunity value. Weighted Pipeline multiplies value by probability. Expansion Readiness combines health and opportunity value.",
        ),
        "guide_support": (
            "Support Impact",
            "Support measures include volume, escalations, resolution rate, health, and churn. The current sample has zero call volume, so interpretation must remain descriptive.",
        ),
        "guide_filters": (
            "Filters and Drilldowns",
            "Selectors facet compatible datasets by CSM, segment, region, and plan. Action buttons open focused risk, retention, and expansion dashboards.",
        ),
        "guide_scope": (
            "Portfolio Scope",
            "These assets demonstrate CRM Analytics readiness in a Developer Edition org. They are not a production connector, automated synchronization process, or causal model.",
        ),
    }
    for name, (title, body) in guide_cards.items():
        widgets[name] = _text_card(title, body)

    desktop_pages = [
        _page(
            "Executive Overview",
            "cscc-overview",
            _overview_header_places()
            + [
                _place("overview_filter_container", 0, 9, 48, 8, FILTER_TOOLBAR_STYLE),
                _place("overview_selector_csm", 1, 10, 9, 6, FILTER_CONTROL_STYLE),
                _place("overview_selector_segment", 10, 10, 10, 6, FILTER_CONTROL_STYLE),
                _place("overview_selector_region", 20, 10, 10, 6, FILTER_CONTROL_STYLE),
                _place("overview_selector_plan", 30, 10, 10, 6, FILTER_CONTROL_STYLE),
                _place("overview_present_reset_surface", 41, 10, 6, 6, PRESENT_RESET_STYLE),
                _place("overview_present_reset_label", 41, 10, 6, 6, TRANSPARENT_STYLE),
                _place("overview_reset", 41, 10, 6, 6, TRANSPARENT_STYLE),
                _place("overview_kpi_arr_number", 0, 18, 11, 7, _primary_kpi_style()),
                _place("overview_kpi_customers_number", 11, 18, 9, 7, _overview_kpi_style(BLUE)),
                _place("overview_kpi_health_number", 20, 18, 9, 7, _overview_kpi_style(GREEN)),
                _place("overview_kpi_risk_number", 29, 18, 9, 7, _overview_kpi_style(RED)),
                _place("overview_kpi_expansion_number", 38, 18, 10, 7, _overview_kpi_style(TEAL)),
                _place("overview_chart_arr_risk", 0, 26, 30, 20, OVERVIEW_CHART_STYLE),
                _place("overview_health_container", 30, 26, 18, 20, HEALTH_MIX_STYLE),
                _place("overview_health_heading", 31, 27, 16, 4, OVERLAY_STYLE),
                _place("overview_health_healthy", 31, 32, 7, 6, _overview_health_tile_style(GREEN)),
                _place("overview_health_watch", 39, 32, 8, 6, _overview_health_tile_style(AMBER)),
                _place("overview_health_at_risk", 31, 39, 7, 6, _overview_health_tile_style("#EA580C")),
                _place("overview_health_critical", 39, 39, 8, 6, _overview_health_tile_style(RED)),
                _place("overview_present_queue_card", 0, 47, 31, 25, OVERVIEW_TABLE_STYLE),
                _place("overview_queue_heading", 1, 48, 29, 3, TRANSPARENT_STYLE),
                _place("overview_table_risk", 1, 51, 29, 20, TRANSPARENT_STYLE),
                _place("overview_chart_owner_attention", 31, 47, 17, 25, OVERVIEW_CHART_STYLE),
            ],
        ),
        _page(
            "Health & Risk",
            "cscc-risk",
            _header_places("risk", persistent_nav=True)
            + [
                _place("risk_selector_csm", 0, 11, 10, 6, FILTER_STYLE),
                _place("risk_selector_segment", 10, 11, 10, 6, FILTER_STYLE),
                _place("risk_selector_region", 20, 11, 10, 6, FILTER_STYLE),
                _place("risk_selector_plan", 30, 11, 10, 6, FILTER_STYLE),
                _place("risk_reset", 40, 11, 8, 6, BUTTON_STYLE),
                _place("risk_kpi_attention", 0, 18, 12, 7, _accent_style(BLUE)),
                _place("risk_kpi_critical", 12, 18, 12, 7, _accent_style(RED)),
                _place("risk_kpi_arr", 24, 18, 12, 7, _accent_style(RED)),
                _place("risk_kpi_health", 36, 18, 12, 7, _accent_style(AMBER)),
                _place("risk_chart_summary", 0, 26, 24, 20),
                _place("risk_chart_driver", 24, 26, 24, 20),
                _place("risk_queue_heading", 0, 47, 48, 4, SECTION_HEADING_STYLE),
                _place("risk_table_queue", 0, 51, 48, 21),
            ],
        ),
        _page(
            "Retention & LTV",
            "cscc-retention",
            _header_places("retention", persistent_nav=True)
            + [
                _place("retention_selector_cohort", 0, 11, 16, 6, FILTER_STYLE),
                _place("retention_toolbar_label", 16, 11, 24, 6, SECTION_HEADING_STYLE),
                _place("retention_reset", 40, 11, 8, 6, BUTTON_STYLE),
                _place("retention_chart_heatmap", 0, 18, 48, 23),
                _place("retention_chart_trend", 0, 42, 24, 20),
                _place("retention_chart_ltv", 24, 42, 24, 20),
            ],
        ),
        _page(
            "Expansion",
            "cscc-expansion",
            _header_places("expansion", persistent_nav=True)
            + [
                _place("exp_selector_csm", 0, 11, 10, 6, FILTER_STYLE),
                _place("exp_selector_segment", 10, 11, 10, 6, FILTER_STYLE),
                _place("exp_selector_region", 20, 11, 10, 6, FILTER_STYLE),
                _place("exp_selector_plan", 30, 11, 10, 6, FILTER_STYLE),
                _place("expansion_reset", 40, 11, 8, 6, BUTTON_STYLE),
                _place("exp_number_open", 0, 18, 12, 7, _accent_style(TEAL)),
                _place("exp_number_weighted", 12, 18, 12, 7, _accent_style(BLUE)),
                _place("exp_number_ready", 24, 18, 12, 7, _accent_style(GREEN)),
                _place("exp_number_health", 36, 18, 12, 7, _accent_style(GREEN)),
                _place("exp_chart_readiness", 0, 26, 24, 20),
                _place("exp_chart_timeline", 24, 26, 24, 20),
                _place("exp_queue_heading", 0, 47, 48, 4, SECTION_HEADING_STYLE),
                _place("exp_table_queue", 0, 51, 48, 22),
            ],
        ),
        _page(
            "Support Impact",
            "cscc-support",
            _header_places("support", persistent_nav=True)
            + [
                _place("support_toolbar_label", 0, 11, 40, 4, SECTION_HEADING_STYLE),
                _place("support_reset", 40, 11, 8, 4, BUTTON_STYLE),
                _place("support_note", 0, 16, 48, 7, _style(background="#FFF7ED", border="#FDBA74", radius=10)),
                _place("support_chart_churn", 0, 24, 24, 22),
                _place("support_chart_health", 24, 24, 24, 22),
                _place("support_table_heading", 0, 47, 48, 4, SECTION_HEADING_STYLE),
                _place("support_table_detail", 0, 51, 48, 20),
            ],
        ),
        _page(
            "Metric Guide",
            "cscc-guide",
            _header_places("guide", persistent_nav=True)
            + [
                _place("guide_toolbar_label", 0, 11, 40, 4, SECTION_HEADING_STYLE),
                _place("guide_reset", 40, 11, 8, 4, BUTTON_STYLE),
                _place("guide_finance", 0, 16, 24, 9),
                _place("guide_health", 24, 16, 24, 9),
                _place("guide_retention", 0, 26, 24, 9),
                _place("guide_ltv", 24, 26, 24, 9),
                _place("guide_pipeline", 0, 36, 24, 9),
                _place("guide_support", 24, 36, 24, 9),
                _place("guide_filters", 0, 46, 24, 9),
                _place("guide_scope", 24, 46, 24, 9),
            ],
        ),
    ]

    mobile_pages = [
        _page(
            "Executive Overview",
            "cscc-overview",
            _overview_header_places(mobile=True)
            + [
                _place("overview_filter_container", 0, 14, 12, 35, FILTER_TOOLBAR_STYLE),
                _place("overview_selector_csm", 1, 15, 10, 6, FILTER_CONTROL_STYLE),
                _place("overview_selector_segment", 1, 22, 10, 6, FILTER_CONTROL_STYLE),
                _place("overview_selector_region", 1, 29, 10, 6, FILTER_CONTROL_STYLE),
                _place("overview_selector_plan", 1, 36, 10, 6, FILTER_CONTROL_STYLE),
                _place("overview_present_reset_surface", 1, 43, 10, 5, PRESENT_RESET_STYLE),
                _place("overview_present_reset_label", 1, 43, 10, 5, TRANSPARENT_STYLE),
                _place("overview_reset", 1, 43, 10, 5, TRANSPARENT_STYLE),
                _place("overview_kpi_arr_number", 0, 50, 12, 7, _primary_kpi_style()),
                _place("overview_kpi_customers_number", 0, 58, 6, 6, _overview_kpi_style(BLUE)),
                _place("overview_kpi_health_number", 6, 58, 6, 6, _overview_kpi_style(GREEN)),
                _place("overview_kpi_risk_number", 0, 65, 6, 6, _overview_kpi_style(RED)),
                _place("overview_kpi_expansion_number", 6, 65, 6, 6, _overview_kpi_style(TEAL)),
                _place("overview_chart_arr_risk", 0, 72, 12, 22, OVERVIEW_CHART_STYLE),
                _place("overview_health_container", 0, 95, 12, 20, HEALTH_MIX_STYLE),
                _place("overview_health_heading", 1, 96, 10, 4, OVERLAY_STYLE),
                _place("overview_health_healthy", 1, 101, 5, 6, _overview_health_tile_style(GREEN)),
                _place("overview_health_watch", 6, 101, 5, 6, _overview_health_tile_style(AMBER)),
                _place("overview_health_at_risk", 1, 108, 5, 6, _overview_health_tile_style("#EA580C")),
                _place("overview_health_critical", 6, 108, 5, 6, _overview_health_tile_style(RED)),
                _place("overview_chart_owner_attention", 0, 116, 12, 22, OVERVIEW_CHART_STYLE),
                _place("overview_present_queue_card", 0, 139, 12, 38, OVERVIEW_TABLE_STYLE),
                _place("overview_queue_heading", 1, 140, 10, 3, TRANSPARENT_STYLE),
                _place("overview_table_risk_mobile", 1, 144, 10, 32, TRANSPARENT_STYLE),
            ],
        ),
        _page(
            "Health & Risk",
            "cscc-risk",
            _mobile_stack(
                "risk",
                filters=[
                    "risk_selector_csm",
                    "risk_selector_segment",
                    "risk_selector_region",
                    "risk_selector_plan",
                ],
                kpis=["risk_kpi_attention", "risk_kpi_critical", "risk_kpi_arr", "risk_kpi_health"],
                charts=["risk_chart_summary", "risk_chart_driver"],
                table="risk_table_queue",
                persistent_nav=True,
                reset="risk_reset",
            ),
        ),
        _page(
            "Retention & LTV",
            "cscc-retention",
            _mobile_stack(
                "retention",
                filters=["retention_selector_cohort"],
                kpis=[],
                charts=[
                    "retention_chart_heatmap",
                    "retention_chart_trend",
                    "retention_chart_ltv",
                ],
                table=None,
                persistent_nav=True,
                reset="retention_reset",
            ),
        ),
        _page(
            "Expansion",
            "cscc-expansion",
            _mobile_stack(
                "expansion",
                filters=[
                    "exp_selector_csm",
                    "exp_selector_segment",
                    "exp_selector_region",
                    "exp_selector_plan",
                ],
                kpis=[
                    "exp_number_open",
                    "exp_number_weighted",
                    "exp_number_ready",
                    "exp_number_health",
                ],
                charts=["exp_chart_readiness", "exp_chart_timeline"],
                table="exp_table_queue",
                persistent_nav=True,
                reset="expansion_reset",
            ),
        ),
        _page(
            "Support Impact",
            "cscc-support",
            _header_places("support", mobile=True, persistent_nav=True)
            + [
                _place("support_toolbar_label", 0, 15, 12, 4, SECTION_HEADING_STYLE),
                _place("support_reset", 0, 20, 12, 4, BUTTON_STYLE),
                _place("support_note", 0, 25, 12, 12, _style(background="#FFF7ED", border="#FDBA74", radius=10)),
                _place("support_chart_churn", 0, 38, 12, 22),
                _place("support_chart_health", 0, 61, 12, 22),
                _place("support_table_detail", 0, 84, 12, 32),
            ],
        ),
        _page(
            "Metric Guide",
            "cscc-guide",
            _header_places("guide", mobile=True, persistent_nav=True)
            + [
                _place("guide_toolbar_label", 0, 15, 12, 4, SECTION_HEADING_STYLE),
                _place("guide_reset", 0, 20, 12, 4, BUTTON_STYLE),
            ]
            + [
                _place(name, 0, 25 + index * 10, 12, 9)
                for index, name in enumerate(guide_cards)
            ],
        ),
    ]

    generated = _base_dashboard(steps, widgets, desktop_pages, mobile_pages)
    _write(
        "Landing_Page",
        _merge_overview(base, generated) if overview_only else generated,
    )


def _style_landing(*, overview_only: bool = True) -> None:
    dashboard_path = WAVE_DIR / "Landing_Page.wdash"
    report_suffix = "overview" if overview_only else "landing"
    run_compiler(
        dashboard_path=dashboard_path,
        design_system_path=DESIGN_SYSTEM_PATH,
        mode=STYLE_ONLY,
        output_path=dashboard_path,
        report_json_path=OUTPUT_DIR / f"Landing_Page.{report_suffix}.style-report.json",
        report_md_path=OUTPUT_DIR / f"Landing_Page.{report_suffix}.style-report.md",
        overview_only=overview_only,
    )


def _build_risk_detail() -> None:
    base = _load("At_Risk_Account_Dashboard")
    nonhealthy = [["Risk_Band__c", ["Critical", "At Risk", "Watch"], "in"]]
    severe = [["Risk_Band__c", ["Critical", "At Risk"], "in"]]
    steps = {
        "risk_detail_filter_csm": _filter_step(
            "Churn_Risk_Accounts", "Customer_Success_Manager__c"
        ),
        "risk_detail_filter_segment": _filter_step("Churn_Risk_Accounts", "Segment__c"),
        "risk_detail_filter_region": _filter_step("Churn_Risk_Accounts", "Region__c"),
        "risk_detail_filter_plan": _filter_step("Churn_Risk_Accounts", "Plan_Tier__c"),
        "risk_detail_count": _aggregate(
            "Churn_Risk_Accounts", _query_count(filters=nonhealthy)
        ),
        "risk_detail_critical": _aggregate(
            "Churn_Risk_Accounts",
            _query_count(filters=[["Risk_Band__c", ["Critical"], "in"]]),
        ),
        "risk_detail_health": _aggregate(
            "Churn_Risk_Accounts", _query_avg("Health_Score__c", filters=nonhealthy)
        ),
        "risk_detail_arr": _arr_step(
            "Churn_Risk_Accounts",
            "MRR__c",
            "At_Risk_ARR",
            bands=["Critical", "At Risk"],
        ),
        "risk_detail_band": _aggregate(
            "Churn_Risk_Accounts",
            {
                "measures": [["sum", "MRR__c"]],
                "groups": ["Risk_Band__c"],
                "filters": nonhealthy,
                "order": [["sum_MRR__c", {"ascending": False}]],
            },
        ),
        "risk_detail_driver": _aggregate(
            "Churn_Risk_Accounts",
            {
                "measures": [["sum", "MRR__c"]],
                "groups": ["Main_Risk_Driver__c"],
                "filters": nonhealthy,
                "order": [["sum_MRR__c", {"ascending": False}]],
            },
        ),
        "risk_detail_queue": _grain(
            "Churn_Risk_Accounts",
            [
                "Priority_Rank__c",
                "Account_Name__c",
                "Risk_Band__c",
                "MRR__c",
                "Health_Score__c",
                "Main_Risk_Driver__c",
                "Customer_Success_Manager__c",
                "Recommended_Action__c",
            ],
            filters=nonhealthy,
            order=[["Priority_Rank__c", {"ascending": True}]],
            limit=50,
        ),
    }
    widgets = {
        "risk_detail_header_container": _container_widget(),
        "risk_detail_title": _header_widget(
            "At-Risk Account Dashboard",
            "A prioritized intervention queue ordered by modeled severity, current value, and ownership.",
        ),
        "risk_detail_reset": _link_widget(
            base, "risk_detail_reset", "Reset filters", "At_Risk_Account_Dashboard"
        ),
        "risk_detail_back": _link_widget(
            base, "risk_detail_back", "Back to command center", "Landing_Page"
        ),
    }
    for name, step, title in (
        ("risk_detail_selector_csm", "risk_detail_filter_csm", "Customer Success Manager"),
        ("risk_detail_selector_segment", "risk_detail_filter_segment", "Customer Segment"),
        ("risk_detail_selector_region", "risk_detail_filter_region", "Region"),
        ("risk_detail_selector_plan", "risk_detail_filter_plan", "Plan Tier"),
    ):
        widgets[name] = _selector_widget(base, "risk_detail_selector_segment", step=step, title=title)
    for name, step, measure, title, color in (
        (
            "risk_detail_number_arr",
            "risk_detail_arr",
            "At_Risk_ARR",
            "At-Risk ARR",
            RED,
        ),
        ("risk_detail_number_count", "risk_detail_count", "count", "Accounts Requiring Attention", BLUE),
        ("risk_detail_number_critical", "risk_detail_critical", "count", "Critical Accounts", RED),
        (
            "risk_detail_number_health",
            "risk_detail_health",
            "avg_Health_Score__c",
            "Average Queue Health",
            AMBER,
        ),
    ):
        widgets[name] = _number_widget(
            base,
            "risk_detail_number_arr",
            step=step,
            measure=measure,
            title=title,
            color=color,
        )
    widgets["risk_detail_chart_band"] = _chart_widget(
        base,
        "risk_detail_chart_driver",
        step="risk_detail_band",
        title="Current MRR by Risk Band",
        subtitle="Current recurring revenue among accounts requiring attention.",
        visualization="hbar",
        dimensions=["Risk_Band__c"],
        plots=["sum_MRR__c"],
        dimension_title="Risk Band",
        measure_title="Current Monthly Recurring Revenue",
    )
    widgets["risk_detail_chart_driver"] = _chart_widget(
        base,
        "risk_detail_chart_driver",
        step="risk_detail_driver",
        title="Revenue Exposure by Primary Risk Driver",
        subtitle="Issues associated with the greatest current recurring revenue exposure.",
        visualization="hbar",
        dimensions=["Main_Risk_Driver__c"],
        plots=["sum_MRR__c"],
        dimension_title="Primary Risk Driver",
        measure_title="Current Monthly Recurring Revenue",
    )
    widgets["risk_detail_table"] = _table_widget(
        base,
        "risk_detail_table",
        step="risk_detail_queue",
        columns=[
            "Account_Name__c",
            "Risk_Band__c",
            "MRR__c",
            "Health_Score__c",
            "Main_Risk_Driver__c",
            "Customer_Success_Manager__c",
            "Recommended_Action__c",
        ],
        column_widths={
            "Account_Name__c": 210,
            "Risk_Band__c": 120,
            "MRR__c": 160,
            "Health_Score__c": 130,
            "Main_Risk_Driver__c": 230,
            "Customer_Success_Manager__c": 230,
            "Recommended_Action__c": 460,
        },
        max_column_width=460,
    )
    desktop = _header_places("risk_detail", back="risk_detail_back") + [
        _place("risk_detail_selector_csm", 0, 9, 12, 6, FILTER_STYLE),
        _place("risk_detail_selector_segment", 12, 9, 12, 6, FILTER_STYLE),
        _place("risk_detail_selector_region", 24, 9, 12, 6, FILTER_STYLE),
        _place("risk_detail_selector_plan", 36, 9, 12, 6, FILTER_STYLE),
        _place("risk_detail_number_arr", 0, 16, 12, 7, _accent_style(RED)),
        _place("risk_detail_number_count", 12, 16, 12, 7, _accent_style(BLUE)),
        _place("risk_detail_number_critical", 24, 16, 12, 7, _accent_style(RED)),
        _place("risk_detail_number_health", 36, 16, 12, 7, _accent_style(AMBER)),
        _place("risk_detail_chart_band", 0, 24, 24, 20),
        _place("risk_detail_chart_driver", 24, 24, 24, 20),
        _place("risk_detail_table", 0, 45, 48, 28),
    ]
    mobile = _mobile_stack(
        "risk_detail",
        filters=[
            "risk_detail_selector_csm",
            "risk_detail_selector_segment",
            "risk_detail_selector_region",
            "risk_detail_selector_plan",
        ],
        kpis=[
            "risk_detail_number_arr",
            "risk_detail_number_count",
            "risk_detail_number_critical",
            "risk_detail_number_health",
        ],
        charts=["risk_detail_chart_band", "risk_detail_chart_driver"],
        table="risk_detail_table",
        back="risk_detail_back",
    )
    _write(
        "At_Risk_Account_Dashboard",
        _base_dashboard(
            steps,
            widgets,
            [_page("At-Risk Accounts", "at-risk-action-queue", desktop)],
            [_page("At-Risk Accounts", "at-risk-action-queue", mobile)],
        ),
    )


def _build_expansion_detail() -> None:
    base = _load("Expansion_Pipeline_Dashboard")
    steps = {
        "exp_detail_filter_csm": _filter_step(
            "Expansion_Opportunities", "Customer_Success_Manager__c"
        ),
        "exp_detail_filter_segment": _filter_step("Expansion_Opportunities", "Segment__c"),
        "exp_detail_filter_region": _filter_step("Expansion_Opportunities", "Region__c"),
        "exp_detail_filter_plan": _filter_step("Expansion_Opportunities", "Plan_Tier__c"),
        "exp_detail_open": _aggregate(
            "Expansion_Opportunities", _query_sum("Open_Pipeline_Amount__c")
        ),
        "exp_detail_weighted": _aggregate(
            "Expansion_Opportunities", _query_sum("Weighted_Pipeline_Amount__c")
        ),
        "exp_detail_ready": _aggregate(
            "Expansion_Opportunities",
            _query_count(
                filters=[["Expansion_Readiness__c", ["Expansion Ready"], "in"]]
            ),
        ),
        "exp_detail_health": _aggregate(
            "Expansion_Opportunities", _query_avg("Health_Score__c")
        ),
        "exp_detail_readiness": _aggregate(
            "Expansion_Opportunities",
            {
                "measures": [
                    ["sum", "Open_Pipeline_Amount__c"],
                    ["sum", "Weighted_Pipeline_Amount__c"],
                ],
                "groups": ["Expansion_Readiness__c"],
                "order": [["sum_Open_Pipeline_Amount__c", {"ascending": False}]],
            },
        ),
        "exp_detail_timeline": _aggregate(
            "Expansion_Opportunities",
            {
                "measures": [["sum", "Weighted_Pipeline_Amount__c"]],
                "groups": ["Close_Month__c"],
                "order": [["Close_Month__c", {"ascending": True}]],
            },
            visualization="vbar",
        ),
        "exp_detail_queue": _grain(
            "Expansion_Opportunities",
            [
                "Account_Name__c",
                "Expansion_Readiness__c",
                "Open_Pipeline_Amount__c",
                "Weighted_Pipeline_Amount__c",
                "Health_Score__c",
                "Next_Close_Date__c",
                "Close_Month__c",
                "Customer_Success_Manager__c",
            ],
            order=[["Weighted_Pipeline_Amount__c", {"ascending": False}]],
            limit=50,
        ),
    }
    widgets = {
        "exp_detail_header_container": _container_widget(),
        "exp_detail_title": _header_widget(
            "Expansion Pipeline Dashboard",
            "Prioritize growth opportunities by readiness, probability-adjusted value, timing, and owner.",
        ),
        "exp_detail_reset": _link_widget(
            base, "exp_detail_reset", "Reset filters", "Expansion_Pipeline_Dashboard"
        ),
        "exp_detail_back": _link_widget(
            base, "exp_detail_back", "Back to command center", "Landing_Page"
        ),
    }
    for name, step, title in (
        ("exp_detail_selector_csm", "exp_detail_filter_csm", "Customer Success Manager"),
        ("exp_detail_selector_segment", "exp_detail_filter_segment", "Customer Segment"),
        ("exp_detail_selector_region", "exp_detail_filter_region", "Region"),
        ("exp_detail_selector_plan", "exp_detail_filter_plan", "Plan Tier"),
    ):
        widgets[name] = _selector_widget(base, "exp_detail_selector_segment", step=step, title=title)
    for name, step, measure, title, color in (
        (
            "exp_detail_number_open",
            "exp_detail_open",
            "sum_Open_Pipeline_Amount__c",
            "Open Expansion Pipeline",
            TEAL,
        ),
        (
            "exp_detail_number_weighted",
            "exp_detail_weighted",
            "sum_Weighted_Pipeline_Amount__c",
            "Weighted Pipeline",
            BLUE,
        ),
        ("exp_detail_number_ready", "exp_detail_ready", "count", "Expansion-Ready Accounts", GREEN),
        (
            "exp_detail_number_health",
            "exp_detail_health",
            "avg_Health_Score__c",
            "Average Health Score",
            GREEN,
        ),
    ):
        widgets[name] = _number_widget(
            base,
            "exp_detail_number_open",
            step=step,
            measure=measure,
            title=title,
            color=color,
        )
    widgets["exp_detail_chart_readiness"] = _chart_widget(
        base,
        "exp_detail_chart_readiness",
        step="exp_detail_readiness",
        title="Open and Weighted Pipeline by Readiness",
        subtitle="Full potential value compared with probability-adjusted value.",
        visualization="hbar",
        dimensions=["Expansion_Readiness__c"],
        plots=["sum_Open_Pipeline_Amount__c", "sum_Weighted_Pipeline_Amount__c"],
        dimension_title="Expansion Readiness",
        measure_title="Pipeline Value",
    )
    widgets["exp_detail_chart_timeline"] = _chart_widget(
        base,
        "exp_detail_chart_timeline",
        step="exp_detail_timeline",
        title="Weighted Pipeline by Expected Close Month",
        subtitle="Monthly timing view of the illustrative 2025 opportunity pipeline.",
        visualization="vbar",
            dimensions=["Close_Month__c"],
        plots=["sum_Weighted_Pipeline_Amount__c"],
        dimension_title="Expected Close Month",
        measure_title="Weighted Expansion Pipeline",
        legend=False,
    )
    widgets["exp_detail_table"] = _table_widget(
        base,
        "exp_detail_table",
        step="exp_detail_queue",
        columns=[
            "Account_Name__c",
            "Expansion_Readiness__c",
            "Open_Pipeline_Amount__c",
            "Weighted_Pipeline_Amount__c",
            "Health_Score__c",
            "Customer_Success_Manager__c",
        ],
        column_widths={
            "Account_Name__c": 270,
            "Expansion_Readiness__c": 245,
            "Open_Pipeline_Amount__c": 245,
            "Weighted_Pipeline_Amount__c": 270,
            "Health_Score__c": 190,
            "Customer_Success_Manager__c": 300,
        },
        max_column_width=300,
    )
    desktop = _header_places("exp_detail", back="exp_detail_back") + [
        _place("exp_detail_selector_csm", 0, 9, 12, 6, FILTER_STYLE),
        _place("exp_detail_selector_segment", 12, 9, 12, 6, FILTER_STYLE),
        _place("exp_detail_selector_region", 24, 9, 12, 6, FILTER_STYLE),
        _place("exp_detail_selector_plan", 36, 9, 12, 6, FILTER_STYLE),
        _place("exp_detail_number_open", 0, 16, 12, 7, _accent_style(TEAL)),
        _place("exp_detail_number_weighted", 12, 16, 12, 7, _accent_style(BLUE)),
        _place("exp_detail_number_ready", 24, 16, 12, 7, _accent_style(GREEN)),
        _place("exp_detail_number_health", 36, 16, 12, 7, _accent_style(GREEN)),
        _place("exp_detail_chart_readiness", 0, 24, 24, 20),
        _place("exp_detail_chart_timeline", 24, 24, 24, 20),
        _place("exp_detail_table", 0, 45, 48, 28),
    ]
    mobile = _mobile_stack(
        "exp_detail",
        filters=[
            "exp_detail_selector_csm",
            "exp_detail_selector_segment",
            "exp_detail_selector_region",
            "exp_detail_selector_plan",
        ],
        kpis=[
            "exp_detail_number_open",
            "exp_detail_number_weighted",
            "exp_detail_number_ready",
            "exp_detail_number_health",
        ],
        charts=["exp_detail_chart_readiness", "exp_detail_chart_timeline"],
        table="exp_detail_table",
        back="exp_detail_back",
    )
    _write(
        "Expansion_Pipeline_Dashboard",
        _base_dashboard(
            steps,
            widgets,
            [_page("Expansion Pipeline", "expansion-action-queue", desktop)],
            [_page("Expansion Pipeline", "expansion-action-queue", mobile)],
        ),
    )


def _build_retention_detail() -> None:
    base = _load("Retention_Cohort_Dashboard")
    steps = {
        "ret_detail_filter": _filter_step("Retention_Cohorts", "Cohort_Month__c"),
        "ret_detail_rate": _aggregate(
            "Retention_Cohorts", _query_avg("Retention_Rate__c")
        ),
        "ret_detail_size": _aggregate(
            "Retention_Cohorts", {"measures": [["max", "Cohort_Size__c"]], "filters": []}
        ),
        "ret_detail_ltv_avg": _aggregate(
            "LTV_By_Segment", _query_avg("Estimated_LTV__c")
        ),
        "ret_detail_trend": _aggregate(
            "Retention_Cohorts",
            {
                "measures": [["avg", "Retention_Rate__c"]],
                "groups": ["Month_Since_Acquisition__c"],
                "order": [["Month_Since_Acquisition__c", {"ascending": True}]],
            },
            visualization="line",
        ),
        "ret_detail_heatmap": _aggregate(
            "Retention_Cohorts",
            {
                "measures": [["avg", "Retention_Rate__c"]],
                "groups": ["Cohort_Quarter__c", "Month_Since_Acquisition__c"],
                "order": [
                    ["Cohort_Quarter__c", {"ascending": True}],
                    ["Month_Since_Acquisition__c", {"ascending": True}],
                ],
            },
            visualization="matrix",
        ),
        "ret_detail_ltv": _aggregate(
            "LTV_By_Segment",
            {
                "measures": [["avg", "Estimated_LTV__c"]],
                "groups": ["Segment__c"],
                "order": [["avg_Estimated_LTV__c", {"ascending": False}]],
            },
        ),
        "ret_detail_table": _grain(
            "Retention_Cohorts",
            [
                "Cohort_Quarter__c",
                "Month_Since_Acquisition__c",
                "Cohort_Size__c",
                "Retained_Customers__c",
                "Retention_Rate__c",
            ],
            order=[
                ["Cohort_Quarter__c", {"ascending": True}],
                ["Month_Since_Acquisition__c", {"ascending": True}],
            ],
            limit=100,
        ),
    }
    widgets = {
        "ret_detail_header_container": _container_widget(),
        "ret_detail_title": _header_widget(
            "Retention Cohort Dashboard",
            "Explore acquisition cohorts over time with segment-level lifetime value context.",
        ),
        "ret_detail_title_mobile": _rich_text(
            [
                ("Retention Cohort Dashboard", "#FFFFFF", True),
                ("Illustrative 2025 portfolio snapshot", "#94A3B8", False),
            ],
            title_size="20px",
            body_size="10px",
        ),
        "ret_detail_reset": _link_widget(
            base, "ret_detail_reset", "Reset filters", "Retention_Cohort_Dashboard"
        ),
        "ret_detail_back": _link_widget(
            base,
            "ret_detail_back",
            "Command Center",
            "Landing_Page",
            text_color="#FFFFFF",
        ),
        "ret_detail_selector": _selector_widget(
            base, "ret_detail_selector", step="ret_detail_filter", title="Customer Cohort"
        ),
        "ret_detail_number_rate": _number_widget(
            base,
            "ret_detail_number_rate",
            step="ret_detail_rate",
            measure="avg_Retention_Rate__c",
            title="Average Retention Rate",
            color=GREEN,
            number_size=32,
        ),
        "ret_detail_number_size": _number_widget(
            base,
            "ret_detail_number_size",
            step="ret_detail_size",
            measure="max_Cohort_Size__c",
            title="Largest Starting Cohort",
            color=TEXT,
            number_size=32,
        ),
        "ret_detail_number_ltv": _number_widget(
            base,
            "ret_detail_number_ltv",
            step="ret_detail_ltv_avg",
            measure="avg_Estimated_LTV__c",
            title="Average Estimated LTV",
            color=TEAL,
            number_size=32,
        ),
        "ret_detail_chart_trend": _chart_widget(
            base,
            "ret_detail_chart_trend",
            step="ret_detail_trend",
            title="Average Retention Curve",
            subtitle="Typical retained share as customer tenure progresses.",
            visualization="line",
            dimensions=["Month_Since_Acquisition__c"],
            plots=["avg_Retention_Rate__c"],
            dimension_title="Month Since Acquisition",
            measure_title="Retention Rate",
            value_type="percent",
            legend=False,
        ),
        "ret_detail_chart_heatmap": _matrix_widget(
            base,
            "ret_detail_chart_heatmap",
            step="ret_detail_heatmap",
            title="Cohort Retention Heatmap",
        ),
        "ret_detail_chart_ltv": _chart_widget(
            base,
            "ret_detail_chart_trend",
            step="ret_detail_ltv",
            title="Estimated LTV by Customer Segment",
            subtitle="Illustrative LTV using average MRR, margin, and churn assumptions.",
            visualization="hbar",
            dimensions=["Segment__c"],
            plots=["avg_Estimated_LTV__c"],
            dimension_title="Customer Segment",
            measure_title="Estimated Lifetime Value",
            legend=False,
        ),
        "ret_detail_table_widget": _table_widget(
            base,
            "ret_detail_table_widget",
            step="ret_detail_table",
            columns=[
                "Cohort_Quarter__c",
                "Month_Since_Acquisition__c",
                "Cohort_Size__c",
                "Retained_Customers__c",
                "Retention_Rate__c",
            ],
            column_widths={
                "Cohort_Quarter__c": 290,
                "Month_Since_Acquisition__c": 310,
                "Cohort_Size__c": 280,
                "Retained_Customers__c": 300,
                "Retention_Rate__c": 330,
            },
            max_column_width=330,
            number_of_lines=1,
        ),
    }
    desktop = [
        _place("ret_detail_header_container", 0, 0, 48, 8, HEADER_STYLE),
        _place("ret_detail_title", 1, 1, 30, 6, OVERLAY_STYLE),
        _place("ret_detail_back", 32, 2, 8, 3, NAV_BUTTON_STYLE),
        _place("ret_detail_reset", 41, 2, 6, 3, RESET_BUTTON_STYLE),
        _place("ret_detail_selector", 0, 9, 12, 7, FILTER_STYLE),
        _place(
            "ret_detail_number_rate",
            12,
            9,
            12,
            7,
            _overview_kpi_style(GREEN),
        ),
        _place(
            "ret_detail_number_size",
            24,
            9,
            12,
            7,
            _overview_kpi_style(BLUE),
        ),
        _place(
            "ret_detail_number_ltv",
            36,
            9,
            12,
            7,
            _overview_kpi_style(TEAL),
        ),
        _place("ret_detail_chart_heatmap", 0, 17, 16, 23, CARD_STYLE),
        _place("ret_detail_chart_trend", 16, 17, 32, 23, CARD_STYLE),
        _place("ret_detail_chart_ltv", 0, 41, 48, 15, CARD_STYLE),
        _place("ret_detail_table_widget", 0, 57, 48, 22, CARD_STYLE),
    ]
    mobile = [
        _place("ret_detail_header_container", 0, 0, 12, 13, HEADER_STYLE),
        _place("ret_detail_title_mobile", 1, 1, 10, 6, OVERLAY_STYLE),
        _place("ret_detail_back", 1, 8, 5, 3, NAV_BUTTON_STYLE),
        _place("ret_detail_reset", 6, 8, 5, 3, RESET_BUTTON_STYLE),
        _place("ret_detail_selector", 0, 14, 12, 6, FILTER_STYLE),
        _place(
            "ret_detail_number_rate",
            0,
            21,
            12,
            7,
            _overview_kpi_style(GREEN),
        ),
        _place(
            "ret_detail_number_size",
            0,
            29,
            6,
            7,
            _overview_kpi_style(BLUE),
        ),
        _place(
            "ret_detail_number_ltv",
            6,
            29,
            6,
            7,
            _overview_kpi_style(TEAL),
        ),
        _place("ret_detail_chart_trend", 0, 37, 12, 20, CARD_STYLE),
        _place("ret_detail_chart_heatmap", 0, 58, 12, 26, CARD_STYLE),
        _place("ret_detail_chart_ltv", 0, 85, 12, 18, CARD_STYLE),
        _place("ret_detail_table_widget", 0, 104, 12, 32, CARD_STYLE),
    ]
    _write(
        "Retention_Cohort_Dashboard",
        _base_dashboard(
            steps,
            widgets,
            [_page("Retention Cohorts", "retention-cohort-explorer", desktop)],
            [_page("Retention Cohorts", "retention-cohort-explorer", mobile)],
        ),
    )


def _build_xmd() -> None:
    build_xmd(WAVE_DIR, namespace=XMD_NS, blue=BLUE, teal=TEAL)


def build(
    *,
    landing_only: bool = False,
    overview_only: bool = False,
    retention_only: bool = False,
) -> None:
    if sum((landing_only, overview_only, retention_only)) > 1:
        raise ValueError("dashboard generation scopes are mutually exclusive")

    if retention_only:
        _build_retention_detail()
        return
    _build_landing(overview_only=overview_only)
    _style_landing(overview_only=True)
    if landing_only or overview_only:
        return
    _build_risk_detail()
    _build_expansion_detail()
    _build_retention_detail()
    _build_xmd()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    scope = parser.add_mutually_exclusive_group()
    scope.add_argument(
        "--landing-only",
        action="store_true",
        help="Regenerate only Landing_Page.wdash without touching drilldowns or XMD.",
    )
    scope.add_argument(
        "--overview-only",
        action="store_true",
        help=(
            "Merge only the Executive Overview page, overview widgets, and "
            "overview steps into Landing_Page.wdash."
        ),
    )
    scope.add_argument(
        "--retention-only",
        action="store_true",
        help=(
            "Regenerate only Retention_Cohort_Dashboard.wdash without touching "
            "Landing_Page, other drilldowns, or XMD."
        ),
    )
    args = parser.parse_args()
    build(
        landing_only=args.landing_only,
        overview_only=args.overview_only,
        retention_only=args.retention_only,
    )
    if args.retention_only:
        target = "Retention_Cohort_Dashboard.wdash"
    elif args.overview_only:
        target = "Landing_Page Executive Overview"
    elif args.landing_only:
        target = "Landing_Page.wdash"
    else:
        target = "CRM Analytics metadata"
    print(f"Built {target} in {WAVE_DIR}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
