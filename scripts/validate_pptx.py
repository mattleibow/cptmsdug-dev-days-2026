"""Read-only PPTX package checks using Python's standard library, not XSD validation."""

import argparse
from collections import Counter
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit
import sys
import xml.etree.ElementTree as ET
import zipfile


PACKAGE_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
OFFICE_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PRESENTATION_NS = "http://schemas.openxmlformats.org/presentationml/2006/main"
CONTENT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"


def resolve_target(owner, target):
    uri = urlsplit(target)
    if uri.scheme or uri.netloc:
        raise ValueError("internal target contains an external URI")
    path = unquote(uri.path)
    if not path or "\\" in path:
        raise ValueError("internal target has an empty or invalid path")
    segments = [] if path.startswith("/") else list(PurePosixPath(owner).parent.parts)
    for segment in path.split("/"):
        if segment in ("", "."):
            continue
        if segment == "..":
            if not segments:
                raise ValueError("internal target escapes the package")
            segments.pop()
        else:
            segments.append(segment)
    return "/".join(segments)


def inspect_package(path):
    errors = []
    with zipfile.ZipFile(path) as package:
        entries = [item.filename for item in package.infolist() if not item.is_dir()]
        names = set(entries)
        for name, count in Counter(entries).items():
            if count > 1:
                errors.append(f"Duplicate package entry: {name}")
        damaged = package.testzip()
        if damaged:
            errors.append(f"CRC check failed: {damaged}")

        documents = {}
        for name in sorted(names):
            if not name.endswith((".xml", ".rels")):
                continue
            data = package.read(name)
            try:
                # PPTX does not require DTDs; reject them before parsing entities.
                if b"<!DOCTYPE" in data.replace(b"\x00", b"").upper():
                    raise ValueError("DTD is not allowed")
                documents[name] = ET.fromstring(data)
            except (ET.ParseError, ValueError) as exc:
                errors.append(f"{name}: {exc}")

        for required in ("[Content_Types].xml", "_rels/.rels", "ppt/presentation.xml"):
            if required not in documents:
                errors.append(f"Missing or unreadable required part: {required}")

        types = documents.get("[Content_Types].xml")
        if types is not None:
            defaults = {
                item.get("Extension"): item.get("ContentType")
                for item in types.findall(f"{{{CONTENT_NS}}}Default")
            }
            overrides = {
                unquote(item.get("PartName", "")).lstrip("/"): item.get("ContentType")
                for item in types.findall(f"{{{CONTENT_NS}}}Override")
            }
            for name in sorted(names - {"[Content_Types].xml"}):
                if not (overrides.get(name) or defaults.get(name.rsplit(".", 1)[-1])):
                    errors.append(f"No content type declared: {name}")
            for name in sorted(overrides):
                if name not in names:
                    errors.append(f"Content type references missing part: {name}")

        relationships = {}
        for name, root in documents.items():
            if not name.endswith(".rels"):
                continue
            part = PurePosixPath(name)
            if name == "_rels/.rels":
                owner = ""
            elif part.parent.name == "_rels":
                owner = str(part.parent.parent / part.name[:-5])
                if owner not in names:
                    errors.append(f"Relationships have no owning part: {name}")
            else:
                errors.append(f"Invalid relationships location: {name}")
                continue
            mapping = {}
            for item in root.findall(f"{{{PACKAGE_NS}}}Relationship"):
                key, target = item.get("Id"), item.get("Target")
                if not key or key in mapping:
                    errors.append(f"{name}: missing or duplicate relationship ID {key!r}")
                mapping[key] = (item.get("Type", ""), None)
                if not target:
                    errors.append(f"{name}: {key}: missing target")
                    continue
                mode = item.get("TargetMode", "Internal")
                if mode == "External":
                    continue
                if mode != "Internal":
                    errors.append(f"{name}: {key}: invalid target mode {mode!r}")
                    continue
                try:
                    resolved = resolve_target(owner, target)
                    mapping[key] = (item.get("Type", ""), resolved)
                    if resolved not in names:
                        errors.append(f"{name}: {key}: missing target {resolved}")
                except ValueError as exc:
                    errors.append(f"{name}: {key}: {exc}")
            relationships[owner] = mapping

        for name, root in documents.items():
            if name.endswith(".rels"):
                continue
            mapping = relationships.get(name, {})
            for element in root.iter():
                for attribute, value in element.attrib.items():
                    # PowerPoint uses empty hyperlink IDs for local slide/media actions.
                    if (attribute == f"{{{OFFICE_NS}}}id" and not value
                            and element.tag in {
                                f"{{{DRAWING_NS}}}hlinkClick",
                                f"{{{DRAWING_NS}}}hlinkHover",
                            } and element.get("action", "").startswith("ppaction://")):
                        continue
                    if attribute.startswith(f"{{{OFFICE_NS}}}") and value not in mapping:
                        errors.append(f"{name}: unresolved relationship {value!r}")

        root_links = relationships.get("", {}).values()
        if not any(kind.endswith("/officeDocument") and target == "ppt/presentation.xml"
                   for kind, target in root_links):
            errors.append("Package root does not reference ppt/presentation.xml")

        presentation = documents.get("ppt/presentation.xml")
        slides = [] if presentation is None else presentation.findall(
            f"{{{PRESENTATION_NS}}}sldIdLst/{{{PRESENTATION_NS}}}sldId"
        )
        if not slides:
            errors.append("Presentation has no slides")
        slide_ids = [item.get("id") for item in slides]
        if None in slide_ids or len(set(slide_ids)) != len(slide_ids):
            errors.append("Missing or duplicate presentation slide IDs")
        mapping = relationships.get("ppt/presentation.xml", {})
        for item in slides:
            key = item.get(f"{{{OFFICE_NS}}}id")
            kind, target = mapping.get(key, ("", None))
            if not kind.endswith("/slide") or target not in documents:
                errors.append(f"Slide {item.get('id')}: invalid slide relationship {key!r}")
        media_count = sum(name.startswith("ppt/media/") for name in names)
        return errors, len(slides), media_count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("presentation", type=Path)
    args = parser.parse_args()
    try:
        errors, slides, media = inspect_package(args.presentation)
    except (OSError, zipfile.BadZipFile, RuntimeError, NotImplementedError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1
    print(f"Package checks passed: {slides} slides, {media} embedded media parts.")
    print("This does not check XSD conformance, visual layout, or slideshow playback.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
