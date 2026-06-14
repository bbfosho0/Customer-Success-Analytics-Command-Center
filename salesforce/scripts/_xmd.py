from __future__ import annotations

from pathlib import Path
from xml.etree import ElementTree as ET


def _xmd_tag(name: str, *, namespace: str) -> str:
    return f"{{{namespace}}}{name}"


def add_dimension(
    path: Path,
    field: str,
    label: str,
    color: str,
    sort_index: int,
    *,
    namespace: str,
) -> None:
    tree = ET.parse(path)
    root = tree.getroot()
    tag = lambda name: _xmd_tag(name, namespace=namespace)
    if any(
        dimension.findtext(tag("field")) == field
        for dimension in root.findall(tag("dimensions"))
    ):
        return
    node = ET.Element(tag("dimensions"))
    ET.SubElement(node, tag("field")).text = field
    ET.SubElement(node, tag("isDerived")).text = "false"
    ET.SubElement(node, tag("label")).text = label
    member = ET.SubElement(node, tag("members"))
    ET.SubElement(member, tag("color")).text = color
    ET.SubElement(member, tag("label")).text = label
    ET.SubElement(member, tag("member")).text = label
    ET.SubElement(member, tag("sortIndex")).text = "0"
    ET.SubElement(node, tag("sortIndex")).text = str(sort_index)
    first_measure = root.find(tag("measures"))
    insert_at = list(root).index(first_measure) if first_measure is not None else len(root)
    root.insert(insert_at, node)
    ET.indent(tree, space="    ")
    tree.write(path, encoding="UTF-8", xml_declaration=True)


def fix_resolution_format(path: Path, *, namespace: str) -> None:
    tree = ET.parse(path)
    root = tree.getroot()
    tag = lambda name: _xmd_tag(name, namespace=namespace)
    for measure in root.findall(tag("measures")):
        if measure.findtext(tag("field")) != "Avg_Resolution_Rate__c":
            continue
        custom = measure.find(tag("formatCustomFormat"))
        if custom is None:
            custom = ET.SubElement(measure, tag("formatCustomFormat"))
        custom.text = '["0.0%",1]'
        digits = measure.find(tag("formatDecimalDigits"))
        if digits is not None:
            digits.text = "1"
    ET.indent(tree, space="    ")
    tree.write(path, encoding="UTF-8", xml_declaration=True)


def build_xmd(
    wave_dir: Path,
    *,
    namespace: str,
    blue: str,
    teal: str,
) -> None:
    ET.register_namespace("", namespace)
    add_dimension(
        wave_dir / "Churn_Risk_Accounts.xmd-meta.xml",
        "Customer_Success_Manager__c",
        "Customer Success Manager",
        blue,
        8,
        namespace=namespace,
    )
    add_dimension(
        wave_dir / "Expansion_Opportunities.xmd-meta.xml",
        "Customer_Success_Manager__c",
        "Customer Success Manager",
        blue,
        7,
        namespace=namespace,
    )
    add_dimension(
        wave_dir / "Retention_Cohorts.xmd-meta.xml",
        "Month_Since_Acquisition__c",
        "Month Since Acquisition",
        teal,
        1,
        namespace=namespace,
    )
    add_dimension(
        wave_dir / "Retention_Cohorts.xmd-meta.xml",
        "Cohort_Quarter__c",
        "Acquisition Quarter",
        blue,
        2,
        namespace=namespace,
    )
    add_dimension(
        wave_dir / "Expansion_Opportunities.xmd-meta.xml",
        "Close_Month__c",
        "Expected Close Month",
        teal,
        8,
        namespace=namespace,
    )
    fix_resolution_format(
        wave_dir / "Support_Impact_On_Churn.xmd-meta.xml",
        namespace=namespace,
    )
