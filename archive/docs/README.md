# Talk workspace

This repository contains two related presentations. The Markdown files are the
authoritative content and build plans. The PowerPoint files are generated
deliverables and may lag while the decks are being rebuilt.

## Presentations

| Presentation | Audience-facing content | Speaker plan | Deck build brief |
|---|---|---|---|
| **30-minute event keynote** - welcome, community, and the GitHub Copilot ecosystem | [`keynote/content.md`](keynote/content.md) | [`keynote/run-of-show.md`](keynote/run-of-show.md) | [`keynote/build-brief.md`](keynote/build-brief.md) |
| **45-minute technical session** - GitHub Copilot app with a Canvas deep dive | [`canvas-session/content.md`](canvas-session/content.md) | [`canvas-session/run-of-show.md`](canvas-session/run-of-show.md) | [`canvas-session/build-brief.md`](canvas-session/build-brief.md) |

The technical session's live-demo preparation is in
[`canvas-session/demos.md`](canvas-session/demos.md).
The confirmed local facts and the remaining organizer approvals needed to
finalize the keynote are listed in
[`keynote/organizer-inputs.md`](keynote/organizer-inputs.md).

## Source material

- [`source-material/copilot-app-english.md`](source-material/copilot-app-english.md)
  is a generated extraction of the supplied `copilot-app-english (1).pptx`:
  PowerPoint text objects, speaker notes, media relationships, transitions,
  and animation timing metadata.
- [`source-material/copilot-app-english-visual-text.md`](source-material/copilot-app-english-visual-text.md)
  captures text flattened into screenshots, diagrams, and other artwork by
  running OCR over the complete rendered slides.
- [`source-material/copilot-app-english.pptx`](source-material/copilot-app-english.pptx)
  is the unchanged supplied source deck, including its five embedded videos.
- [`source-material/github-copilot-dev-days-overview.pptx`](source-material/github-copilot-dev-days-overview.pptx)
  and [`source-material/graphic-asset-templates.pptx`](source-material/graphic-asset-templates.pptx)
  preserve the other original decks consulted for early visual research.
- [`source-material/canvassing-your-agents.pdf`](source-material/canvassing-your-agents.pdf)
  is the supplied Canvas talk used as an additional reference.
- [`source-material/dev-days.md`](source-material/dev-days.md) records useful
  guidance and reusable material from the official `github/dev-days`
  repository.
- [`source-material/product-docs.md`](source-material/product-docs.md) records
  the current official product references behind CLI, cloud agent, App,
  automations, mobile continuity, and extensibility claims.
- [`source-material/adoption-matrix.md`](source-material/adoption-matrix.md)
  maps every supplied source slide to the keynote, the technical session, or
  neither.
- [`source-material/event-site.md`](source-material/event-site.md) captures the
  confirmed local event details and downloaded public assets.
- [`assets/copilot-app-videos/`](assets/copilot-app-videos/) contains extracted
  video fallbacks. The keynote should normally retain the videos embedded in
  the source PowerPoint.

## PowerPoint status

| File | Status |
|---|---|
| `source-material/copilot-app-english.pptx` | Preserved source; do not edit |
| `decks/drafts/copilot-keynote-wireframe.pptx` | Structural wireframe; visual design rejected and needs rebuilding |
| `decks/drafts/github-copilot-keynote-dev-days.pptx` | In-progress source-based experiment; deck work is paused |
| `decks/drafts/copilot-app-keynote-30min.pptx` | Earlier rebuilt draft; not authoritative |
| `decks/drafts/copilot-canvases-talk.pptx` | Earlier rebuilt draft; not authoritative |
| `copilot-canvases-talk.pptx` | Earlier technical-session prototype; not authoritative |

See [`decks/README.md`](decks/README.md) for the PowerPoint artifact policy.

Do not infer talk content from an old PPTX. Update the relevant `content.md`
first, update the run of show, and only then rebuild the presentation from its
build brief.
