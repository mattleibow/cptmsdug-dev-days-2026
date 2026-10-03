# Vendored agent skills

Skills copied here verbatim from upstream for use by coding agents in this repo.

## `pptx/`

- Source: https://github.com/anthropics/skills/tree/main/skills/pptx (branch `main`)
- All 56 files verified byte-identical to upstream git blob SHAs at download time.
- Upstream terms are in `pptx/LICENSE.txt` — retained unmodified.

### Runtime requirements

| Dependency | Status |
| --- | --- |
| `python-pptx` | installed |
| `lxml` | installed |
| `Pillow` | installed |
| `defusedxml` | installed (`pip install defusedxml`) |
| `markitdown` | **not installed** — only needed for reading/extracting `.pptx` text |
| LibreOffice (`soffice`) | installed at `/opt/homebrew/bin/soffice` |

### Smoke test

```bash
python3 .agents/skills/pptx/scripts/office/validate.py docs/decks/drafts/copilot-keynote-wireframe.pptx
# -> All validations PASSED!
```
