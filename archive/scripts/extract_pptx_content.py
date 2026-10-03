#!/usr/bin/env python3

"""Extract slide text, notes, media, and motion metadata from a PPTX file."""

from __future__ import annotations

import argparse
import hashlib
import posixpath
import re
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET


P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"

NS = {"p": P_NS, "a": A_NS, "r": R_NS, "rel": PKG_REL_NS}

VIDEO_EXTENSIONS = {".avi", ".m4v", ".mov", ".mp4", ".wmv"}
IMAGE_EXTENSIONS = {
    ".bmp",
    ".emf",
    ".gif",
    ".jpeg",
    ".jpg",
    ".png",
    ".svg",
    ".tif",
    ".tiff",
    ".wdp",
    ".wmf",
}


def slide_number(path: str) -> int:
    match = re.search(r"slide(\d+)\.xml$", path)
    if not match:
        raise ValueError(f"Not a slide path: {path}")
    return int(match.group(1))


def paragraph_text(paragraph: ET.Element) -> str:
    return "".join(node.text or "" for node in paragraph.findall(".//a:t", NS)).strip()


def slide_text(root: ET.Element) -> list[str]:
    paragraphs: list[str] = []
    for paragraph in root.findall(".//a:p", NS):
        text = paragraph_text(paragraph)
        if text:
            paragraphs.append(text)
    return paragraphs


def relationships(archive: ZipFile, rels_path: str) -> list[dict[str, str]]:
    if rels_path not in archive.namelist():
        return []

    root = ET.fromstring(archive.read(rels_path))
    return [
        {
            "id": relationship.attrib.get("Id", ""),
            "type": relationship.attrib.get("Type", ""),
            "target": relationship.attrib.get("Target", ""),
        }
        for relationship in root.findall("rel:Relationship", NS)
    ]


def resolve_target(base_path: str, target: str) -> str:
    return posixpath.normpath(posixpath.join(posixpath.dirname(base_path), target))


def notes_text(archive: ZipFile, slide_path: str) -> list[str]:
    rels_path = (
        f"{posixpath.dirname(slide_path)}/_rels/"
        f"{posixpath.basename(slide_path)}.rels"
    )
    notes_relationship = next(
        (
            relationship
            for relationship in relationships(archive, rels_path)
            if relationship["type"].endswith("/notesSlide")
        ),
        None,
    )
    if not notes_relationship:
        return []

    notes_path = resolve_target(slide_path, notes_relationship["target"])
    if notes_path not in archive.namelist():
        return []

    root = ET.fromstring(archive.read(notes_path))
    paragraphs: list[str] = []

    for shape in root.findall(".//p:sp", NS):
        placeholder = shape.find("./p:nvSpPr/p:nvPr/p:ph", NS)
        if placeholder is None or placeholder.attrib.get("type") != "body":
            continue

        for paragraph in shape.findall(".//a:p", NS):
            text = paragraph_text(paragraph)
            if text:
                paragraphs.append(text)

    return paragraphs


def media_for_slide(archive: ZipFile, slide_path: str) -> list[dict[str, object]]:
    rels_path = (
        f"{posixpath.dirname(slide_path)}/_rels/"
        f"{posixpath.basename(slide_path)}.rels"
    )
    media: list[dict[str, object]] = []
    seen: set[str] = set()

    for relationship in relationships(archive, rels_path):
        target_path = resolve_target(slide_path, relationship["target"])
        if not target_path.startswith("ppt/media/") or target_path in seen:
            continue
        seen.add(target_path)

        extension = Path(target_path).suffix.lower()
        if extension in VIDEO_EXTENSIONS:
            kind = "video"
        elif extension in IMAGE_EXTENSIONS:
            kind = "image"
        else:
            kind = "media"

        info = archive.getinfo(target_path) if target_path in archive.namelist() else None
        media.append(
            {
                "kind": kind,
                "path": target_path,
                "bytes": info.file_size if info else None,
            }
        )

    return media


def motion_metadata(root: ET.Element) -> tuple[str, int]:
    transition = root.find("./p:transition", NS)
    transition_name = "none"
    if transition is not None:
        children = list(transition)
        transition_name = (
            children[0].tag.rsplit("}", 1)[-1] if children else "configured"
        )

    timing = root.find("./p:timing", NS)
    animation_nodes = len(root.findall(".//p:cTn", NS)) if timing is not None else 0
    return transition_name, animation_nodes


def presentation_size(archive: ZipFile) -> tuple[int | None, int | None]:
    path = "ppt/presentation.xml"
    if path not in archive.namelist():
        return None, None

    root = ET.fromstring(archive.read(path))
    size = root.find("./p:sldSz", NS)
    if size is None:
        return None, None

    return int(size.attrib["cx"]), int(size.attrib["cy"])


def human_size(byte_count: int | None) -> str:
    if byte_count is None:
        return "unknown size"
    if byte_count < 1024:
        return f"{byte_count} B"
    if byte_count < 1024 * 1024:
        return f"{byte_count / 1024:.1f} KiB"
    return f"{byte_count / (1024 * 1024):.1f} MiB"


def markdown_quote(lines: list[str]) -> list[str]:
    output: list[str] = []
    for line in lines:
        for wrapped_line in line.splitlines() or [""]:
            output.append(f"> {wrapped_line}")
    return output


def extract(input_path: Path) -> str:
    sha256 = hashlib.sha256(input_path.read_bytes()).hexdigest()

    with ZipFile(input_path) as archive:
        slide_paths = sorted(
            (
                path
                for path in archive.namelist()
                if re.fullmatch(r"ppt/slides/slide\d+\.xml", path)
            ),
            key=slide_number,
        )

        width_emu, height_emu = presentation_size(archive)
        all_media = [
            path for path in archive.namelist() if path.startswith("ppt/media/")
        ]
        videos = [
            path
            for path in all_media
            if Path(path).suffix.lower() in VIDEO_EXTENSIONS
        ]
        images = [
            path
            for path in all_media
            if Path(path).suffix.lower() in IMAGE_EXTENSIONS
        ]

        slides: list[dict[str, object]] = []
        for slide_path in slide_paths:
            root = ET.fromstring(archive.read(slide_path))
            transition, animation_nodes = motion_metadata(root)
            slides.append(
                {
                    "number": slide_number(slide_path),
                    "text": slide_text(root),
                    "notes": notes_text(archive, slide_path),
                    "media": media_for_slide(archive, slide_path),
                    "transition": transition,
                    "animation_nodes": animation_nodes,
                }
            )

    output = [
        "# Source deck extraction: Copilot App English",
        "",
        "<!-- Generated by scripts/extract_pptx_content.py. Do not hand-edit. -->",
        "",
        f"- **Source:** `{input_path.as_posix()}`",
        f"- **SHA-256:** `{sha256}`",
        f"- **Slides:** {len(slides)}",
        f"- **Slide size:** {width_emu or 'unknown'} × {height_emu or 'unknown'} EMU",
        f"- **Media:** {len(images)} images, {len(videos)} videos, "
        f"{len(all_media)} total files",
        "",
        "This document records the source presentation's PowerPoint text "
        "objects, speaker notes, media relationships, transitions, and "
        "animation-tree presence. Text flattened inside screenshots, diagrams, "
        "and other images is captured separately in "
        "[`copilot-app-english-visual-text.md`]"
        "(copilot-app-english-visual-text.md). Together they are evidence for "
        "planning the two new decks, not an instruction to reuse every claim "
        "unchanged.",
        "",
    ]

    for slide in slides:
        output.extend([f"## Slide {slide['number']}", ""])

        text = slide["text"]
        output.append("### On-slide text")
        output.append("")
        if text:
            output.extend(f"- {paragraph}" for paragraph in text)
        else:
            output.append("- _No extractable text; the slide is primarily visual._")
        output.append("")

        notes = slide["notes"]
        output.append("### Speaker notes")
        output.append("")
        if notes:
            output.extend(markdown_quote(notes))
        else:
            output.append("> _No speaker notes._")
        output.append("")

        media = slide["media"]
        output.append("### Media and motion")
        output.append("")
        if media:
            for item in media:
                output.append(
                    f"- {item['kind']}: `{item['path']}` "
                    f"({human_size(item['bytes'])})"
                )
        else:
            output.append("- Media: none")
        output.append(f"- Transition: `{slide['transition']}`")
        output.append(
            f"- Animation timing nodes: {slide['animation_nodes']}"
        )
        output.append("")

    return "\n".join(output).rstrip() + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="PPTX file to inspect")
    parser.add_argument(
        "--output",
        type=Path,
        help="Markdown output path; defaults to standard output",
    )
    args = parser.parse_args()

    content = extract(args.input)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(content, encoding="utf-8")
    else:
        print(content, end="")


if __name__ == "__main__":
    main()
