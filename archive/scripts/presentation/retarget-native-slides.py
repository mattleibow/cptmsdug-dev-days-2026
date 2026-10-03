#!/usr/bin/env python3

import os
import sys
import tempfile
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from defusedxml import minidom


REPLACEMENTS = {
    12: {
        "Delegate to agents": "Parallel agent sessions",
        "Start a session from an issue, a prompt, or a PR already in flight.": (
            "A desktop workbench for deliberate workspace choices."
        ),
    },
    13: {
        "Centralized inbox": "One centralized inbox",
        "Triage issues and PRs across repos, without leaving the app.": (
            "Issues, pull requests, repositories — attention in one place."
        ),
    },
    14: {
        "Canvases": "A shared work surface",
        (
            "Open a live work surface where you and the agent edit, reorder, "
            "and verify the same artifact together."
        ): "Chat is good for intent. Shared work needs a surface.",
    },
    15: {
        "Review and merge": "Review where work happened",
        (
            "Review diffs, check CI, and fix failing checks. Merge from the "
            "same window the agent works in."
        ): "Diffs, checks, repair, and a normal merge decision.",
    },
    16: {
        "Automated workflows": "Teach it. Connect it. Repeat it.",
        (
            "Turn skills and prompts into repeatable work that can be run on "
            "a regular basis."
        ): "Turn expertise and guarded prompts into repeatable work.",
    },
}

FEATURE_TITLES = {
    "Parallel agent sessions",
    "One centralized inbox",
    "A shared work surface",
    "Review where work happened",
    "Teach it. Connect it. Repeat it.",
}


def direct_child(node, tag_name: str):
    for child in node.childNodes:
        if child.nodeType == child.ELEMENT_NODE and child.tagName == tag_name:
            return child
    return None


def make_feature_title_explicit(document, text_node) -> None:
    run = text_node.parentNode
    run_properties = direct_child(run, "a:rPr")
    if run_properties is None:
        run_properties = document.createElement("a:rPr")
        run.insertBefore(run_properties, text_node)

    for fill_name in ("a:noFill", "a:solidFill", "a:gradFill", "a:blipFill", "a:pattFill"):
        fill = direct_child(run_properties, fill_name)
        if fill is not None:
            run_properties.removeChild(fill)

    solid_fill = document.createElement("a:solidFill")
    color = document.createElement("a:srgbClr")
    color.setAttribute("val", "E4EBE6")
    solid_fill.appendChild(color)

    first_element = next(
        (
            child
            for child in run_properties.childNodes
            if child.nodeType == child.ELEMENT_NODE
        ),
        None,
    )
    if first_element is None:
        run_properties.appendChild(solid_fill)
    else:
        run_properties.insertBefore(solid_fill, first_element)

    paragraph = run.parentNode
    paragraph_properties = direct_child(paragraph, "a:pPr")
    if paragraph_properties is None:
        paragraph_properties = document.createElement("a:pPr")
        paragraph.insertBefore(paragraph_properties, run)

    for child in list(paragraph_properties.childNodes):
        if (
            child.nodeType == child.ELEMENT_NODE
            and child.tagName.startswith("a:bu")
        ):
            paragraph_properties.removeChild(child)

    paragraph_properties.appendChild(document.createElement("a:buNone"))


def ordered_slide_parts(archive: ZipFile) -> list[str]:
    presentation = minidom.parseString(archive.read("ppt/presentation.xml"))
    relationships = minidom.parseString(
        archive.read("ppt/_rels/presentation.xml.rels")
    )
    rel_targets = {
        rel.getAttribute("Id"): rel.getAttribute("Target")
        for rel in relationships.getElementsByTagName("Relationship")
    }

    parts = []
    for slide_id in presentation.getElementsByTagName("p:sldId"):
        rel_id = slide_id.getAttribute("r:id")
        target = rel_targets[rel_id]
        parts.append(f"ppt/{target.lstrip('/')}")
    return parts


def replace_slide_text(xml: bytes, replacements: dict[str, str]) -> bytes:
    document = minidom.parseString(xml)
    remaining = set(replacements)

    for node in document.getElementsByTagName("a:t"):
        if node.firstChild is None:
            continue

        current = node.firstChild.data.strip()
        if current not in replacements:
            continue

        replacement = replacements[current]
        node.firstChild.data = replacement
        if replacement in FEATURE_TITLES:
            make_feature_title_explicit(document, node)
        remaining.remove(current)

    if remaining:
        missing = ", ".join(sorted(remaining))
        raise RuntimeError(f"Could not find expected source text: {missing}")

    return document.toxml(encoding="UTF-8")


def retarget_deck(deck: Path) -> None:
    with ZipFile(deck) as archive:
        slide_parts = ordered_slide_parts(archive)
        rewritten = {
            slide_parts[position - 1]: replace_slide_text(
                archive.read(slide_parts[position - 1]), replacements
            )
            for position, replacements in REPLACEMENTS.items()
        }

        fd, temp_name = tempfile.mkstemp(
            prefix=f"{deck.stem}-", suffix=".pptx", dir=deck.parent
        )
        os.close(fd)
        temp_path = Path(temp_name)

        try:
            with ZipFile(temp_path, "w", ZIP_DEFLATED) as output:
                for item in archive.infolist():
                    output.writestr(
                        item,
                        rewritten.get(item.filename, archive.read(item.filename)),
                    )
            os.replace(temp_path, deck)
        finally:
            temp_path.unlink(missing_ok=True)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: retarget-native-slides.py deck.pptx")

    deck = Path(sys.argv[1]).resolve()
    if not deck.exists():
        raise SystemExit(f"Deck not found: {deck}")

    retarget_deck(deck)


if __name__ == "__main__":
    main()
