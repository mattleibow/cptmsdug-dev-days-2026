# Source material

This folder separates evidence from presentation decisions.

| Source | Purpose |
|---|---|
| [`copilot-app-english.pptx`](copilot-app-english.pptx) | Unchanged supplied Copilot App source presentation, including its embedded videos |
| [`github-copilot-dev-days-overview.pptx`](github-copilot-dev-days-overview.pptx) | Supplied Dev Days overview used for early visual and event-content research |
| [`graphic-asset-templates.pptx`](graphic-asset-templates.pptx) | Supplied graphic asset templates used for early visual research |
| [`canvassing-your-agents.pdf`](canvassing-your-agents.pdf) | Supplied 32-page "Canvassing your Agents" talk for additional Canvas examples and reading |
| [`copilot-app-english.md`](copilot-app-english.md) | Generated inventory of PowerPoint text objects, notes, media, transitions, and animation metadata |
| [`copilot-app-english-visual-text.md`](copilot-app-english-visual-text.md) | OCR inventory of the complete rendered slides, including text flattened into images and screenshots |
| [`dev-days.md`](dev-days.md) | Official GitHub Dev Days repository findings and recommendations |
| [`product-docs.md`](product-docs.md) | Current official product references for CLI, cloud agent, App, automations, mobile continuity, and extensibility |
| [`adoption-matrix.md`](adoption-matrix.md) | Decision for how each supplied source slide is reused, retargeted, or omitted |
| [`event-site.md`](event-site.md) | Confirmed local event identity, schedule, speakers, organizers, sponsors, venue, registration, and community links |

The source deck is intentionally broader than either final presentation. The
keynote should reuse its event energy, ecosystem framing, transitions, and
selected footage. The technical session should reuse only the App and Canvas
material needed to establish context before the live demos.

The three PPTX files and the PDF above are the unmodified local originals used
for reference, not final talks or current product documentation. Their SHA-256
hashes, in table order, are
`44bf1eb11911015c78720aba146565423c0274a5d35052336dfe44fd2201be58`,
`4381a10ca355b96d9b6a758994f6c9992ab31c5f0d42827ec2f036c69a637b86`,
`1a04040513f71abe64871a87f7f98e72e30e2fd9851b71e1c8f536ddaa493a19`,
and `c87a2f6d33d0251849a21bd61a9e07c542261836baf6ab720f1bbb722311ea95`.
Generated slide previews, PDF exports of PPTX files, and session backup copies
are not source material; regenerate them from these originals as needed.

Regenerate the PowerPoint extraction with:

```bash
python3 scripts/extract_pptx_content.py \
  docs/source-material/copilot-app-english.pptx \
  --output docs/source-material/copilot-app-english.md
```

Visual text requires a separate render-and-OCR pass because it is not present
in the PPTX text XML. Export the slides to images using local PowerPoint (not
the GitHub Copilot App slide Canvas), keeping intermediate files in a
repository-local ignored work directory, then run:

```bash
swift scripts/extract_rendered_slide_text.swift \
  scripts/presentation/.keynote-qa/source-slide-images \
  docs/source-material/copilot-app-english-visual-text.md
```
