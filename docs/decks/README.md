# PowerPoint artifacts

Generate the keynote wireframe locally, never in the GitHub Copilot App slide
Canvas:

```bash
cd scripts/presentation
npm install
npm run build:keynote-wireframe
```

Output:

- `drafts/copilot-keynote-wireframe.pptx` - an 18-slide structural wireframe
  with speaker notes, local QR codes, the official animated
  Plan/Build/Review/Ship slide, and all five official feature-video slides.
  Its visual treatment was rejected; it is **not presentation-ready**. Keep
  it only as a content, media, and timing reference until it is redesigned.

The build creates the new community and ecosystem slides with PptxGenJS, then
uses local Microsoft PowerPoint automation to copy the official lifecycle and
feature slides from the preserved source deck. This retains their native
animation and playback timing trees. The final text-only retargeting step edits
the copied slide XML with `defusedxml.minidom`.
Package-level checks found the notes, video files, and timing trees, but
offline playback and projection readability still need a real rehearsal.

Build requirements:

- Node.js and the dependencies in `scripts/presentation/package.json`
- Python 3 with `defusedxml`
- Microsoft PowerPoint for macOS
- `unzip`

`drafts/` contains earlier experiments and is not authoritative:

- `copilot-app-keynote-30min.pptx` - early flat keynote rebuild
- `copilot-canvases-talk.pptx` - early technical-session rebuild
- `github-copilot-keynote-dev-days.pptx` - source-based keynote experiment
- `../copilot-canvases-talk.pptx` - early technical-session prototype

`design-explorations/` preserves the useful visual-direction boards that may
inform the next rebuild. They are not approved designs or build plans.

Create final deliverables here from the relevant content, run-of-show, and
build-brief files. Do not edit the preserved official source in
`../source-material/copilot-app-english.pptx`.
