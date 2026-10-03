# Deck design explorations

These files record early visual directions considered before slide production
was paused:

- `keynote-direction-options.json` - the evaluated keynote visual worlds
- `keynote-live-build.png` - the preferred live-build/broadcast direction
- `keynote-canon.png` - the conservative source-deck direction

They are references, not build instructions. The authoritative design system
is `../../../DESIGN.md`, and deck-specific decisions are in:

- `../../keynote/build-brief.md`
- `../../canvas-session/build-brief.md`

## New keynote concepts

`keynote-concepts.pptx` is a four-slide visual sample awaiting direction
approval, not a final keynote. It explores an event-hero opener, oversized
statement with a click reveal, a high-key ecosystem slide, and the official
Canvas video slide with a stronger headline. The original source deck is
unchanged; the imported video slide retains native media and timing.

Build on Windows with desktop Microsoft PowerPoint installed:

```powershell
.\scripts\presentation\build-keynote-concepts.ps1
```

Pass `-PreviewDirectory <absolute-path>` to export PNG previews. The preview
images do not show animation; use PowerPoint Slide Show for the statement
reveal and the native video sequence. Fonts use Arial deliberately for
predictable rendering while the typography direction is being evaluated.
