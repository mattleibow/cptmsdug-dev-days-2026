# GitHub Copilot App and Canvas deck build brief

This document tells the deck builder how to construct the 45-minute technical
session. Audience copy belongs in [`content.md`](content.md); narration and
timing belong in [`run-of-show.md`](run-of-show.md).

## Relationship to the keynote

Use the same official Dev Days visual system so the two presentations feel
related, but make the technical deck visibly more operational:

- reuse the keynote's ecosystem recap language for only the first few minutes;
- use real App and Canvas screenshots rather than repeating every source video;
- make code, state flow, and live-demo cues readable from the back of the room;
- keep the architecture honest and small enough to explain during a live build.

## Visual rhythm

Alternate four presentation modes:

1. **Statement** - one large problem or design rule.
2. **Live product** - the real App or Canvas fills most of the screen.
3. **Model** - a simple flow showing person, agent, state, and renderer.
4. **Code** - no more than one executable idea per slide.

Do not create fake dashboard screenshots or miniature replicas of a Canvas.
When the audience needs to see the product, show the real Canvas or a prepared
recording.

## Source reuse

| Session need | Preferred source |
|---|---|
| Title and keynote recap | Official source opening/ecosystem artwork |
| App introduction | Official App overview slide |
| Sessions/My Work context | Current App screenshots or a short still from supplied footage |
| Canvas teaser | Supplied Canvas poster or current live Canvas |
| Review and automation context | Current App capture; footage only if it saves time |
| Architecture and code | Original session diagrams and code from the committed examples |
| Mobile workflow | Live Mobile Canvas with a prepared backup clip |
| Live-build walkthrough | `demos/first-canvas.md` from `main`; show prompts and the generated extension, not a fake code sample |
| Project extension proof | `.github/extensions/sketch-to-app/` on `main`, using `MauiXamlDemo` or `MauiBlazorDemo` as an app target |

## Motion strategy

- Reuse source transitions for the opening and recap.
- The transcript-to-Canvas contrast should have one clear reveal.
- Architecture slides should reveal one path at a time: person, agent, shared
  state, renderer.
- Code slides should not animate line by line unless it directly follows the
  live typing sequence.
- Live Canvas activity is the primary motion in the session.
- New gradients, shadows, and effects are optional; clarity and the real
  shared-state interaction are more important than decorative motion.

## Technical accuracy requirements

The deck must state:

- The extension owns the Canvas interaction contract and any coordination
  state; the authoritative truth may be extension-owned, repository-backed,
  history-backed, or an external live system.
- Project-scoped extensions live beneath `.github/extensions`.
- Project extensions execute local code and must be reviewed before trust.
- A renderer should bind to loopback, use an ephemeral port, set CSP, validate
  input, and clean up.
- `canvasId` selects a Canvas type; `instanceId` identifies one open panel.
- Mobile Canvas is independent of MAUI DevFlow.
- App and Canvas APIs may evolve; use the SDK and documentation installed for
  the event build.

Do not imply:

- one universal Canvas state store supplied by the App;
- identical feature support in every Copilot client;
- that browser-only selection is visible to the agent;
- that all project extensions require an identical package-file layout;
- that the App bypasses repository permissions, review, CI, or branch policy.

## Code-slide rules

- Use code from the committed Sketch to app extension for fixed code slides.
  The cue-card extension is generated during the walkthrough; show its
  actual source only after it exists.
- Use at least 22-point code in the final 16:9 deck.
- Show only the lines needed for the current idea.
- Use callouts for `createCanvas`, action schemas, `ctx.instanceId`, loopback
  URL creation, session-backed state, and cleanup.
- Keep the full implementation in the repository and link it by QR code rather
  than shrinking it onto slides.

## Demo-slide rules

- Each demo begins with a one-sentence audience question.
- Each demo ends with one visible proof.
- Put the recovery path in presenter notes, never on the audience slide.
- Keep devices, App windows, and terminal text at an audience-readable zoom.
- Do not show credentials, private issue content, unrelated repositories, or
  personal notification data.

## Required captures

Prepare and store:

- Credit Timeline with sanitized, deterministic local history;
- Mobile Canvas with one iOS or Android device already booted;
- the first Canvas cue card at zero and after two messages;
- Sketch to app before and after an agent adds a note to a saved sketch;
- the project extension folder in the repository;
- a short backup recording for each external demo.

## Quality checks

Render and rehearse the complete deck:

1. No clipping or inline speaker/build notes.
2. Code is readable from the rear of the room.
3. Every architecture arrow has a meaningful source and destination.
4. The Canvas model consistently names the source of truth.
5. Live demos have prepared still or video fallbacks.
6. The project extension reload path works from a clean App restart.
7. The planned conclusion lands by minute 43.
