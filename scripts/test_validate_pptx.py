import tempfile
import unittest
from pathlib import Path
import zipfile

from validate_pptx import inspect_package, resolve_target


class PackageChecks(unittest.TestCase):
    def setUp(self):
        self.parts = {
            "[Content_Types].xml": """
                <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                  <Default Extension="xml" ContentType="application/xml"/>
                  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                  <Default Extension="png" ContentType="image/png"/>
                </Types>""",
            "_rels/.rels": """
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="doc" Type="urn:test/officeDocument" Target="ppt/presentation.xml"/>
                </Relationships>""",
            "ppt/presentation.xml": """
                <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
                  <p:sldIdLst><p:sldId id="256" r:id="slide"/></p:sldIdLst>
                </p:presentation>""",
            "ppt/_rels/presentation.xml.rels": """
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="slide" Type="urn:test/slide" Target="slides/slide1.xml"/>
                </Relationships>""",
            "ppt/slides/slide1.xml": """
                <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
                  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
                  <a:blip r:embed="image"/>
                  <a:hlinkClick r:id="" action="ppaction://media"/>
                </p:sld>""",
            "ppt/slides/_rels/slide1.xml.rels": """
                <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                  <Relationship Id="image" Type="urn:test/image" Target="../media/image.png"/>
                </Relationships>""",
            "ppt/media/image.png": b"test asset",
        }

    def check(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "test.pptx"
            with zipfile.ZipFile(path, "w") as package:
                for name, data in self.parts.items():
                    package.writestr(name, data)
            return inspect_package(path)

    def test_valid_package_and_local_media_action(self):
        self.assertEqual(self.check(), ([], 1, 1))

    def test_missing_asset(self):
        del self.parts["ppt/media/image.png"]
        self.assertTrue(any("missing target" in error for error in self.check()[0]))

    def test_unresolved_slide_reference(self):
        name = "ppt/presentation.xml"
        self.parts[name] = self.parts[name].replace('r:id="slide"', 'r:id="missing"')
        self.assertTrue(any("unresolved relationship" in error for error in self.check()[0]))

    def test_malformed_xml(self):
        self.parts["ppt/slides/slide1.xml"] = "<broken"
        self.assertTrue(self.check()[0])

    def test_reject_dtd(self):
        self.parts["ppt/slides/slide1.xml"] = '<!DOCTYPE sld><sld/>'
        self.assertTrue(any("DTD" in error for error in self.check()[0]))

    def test_target_resolution(self):
        self.assertEqual(resolve_target("ppt/slides/slide1.xml", "../media/a%20b.png"),
                         "ppt/media/a b.png")
        with self.assertRaises(ValueError):
            resolve_target("ppt/presentation.xml", "../../outside.xml")


if __name__ == "__main__":
    unittest.main()
