# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers attending a full-day community event, ranging from people new to
GitHub Copilot through experienced users who want practical ways to direct,
observe, and extend agentic work.

## Product Purpose

Two complementary developer-conference talks: a 30-minute community keynote
that welcomes the event and introduces the complete GitHub Copilot ecosystem,
and a 45-minute technical GitHub Copilot App session that teaches when a
Canvas extension is more effective than chat alone, demonstrates real Canvas
workflows, and gives attendees a safe first path to building a project-scoped
Canvas.

## Positioning

The keynote makes the Copilot ecosystem legible without reducing it to one
chat box. The technical session makes the human-agent feedback loop concrete:
people act through a visual interface while agents act through explicit
capabilities through one extension-managed interaction contract and deliberate
source of truth.

## Operating Context

The talks are delivered live at a full-day developer user-group event. The
30-minute keynote includes the community welcome, sponsor and volunteer
recognition, event agenda, Code of Conduct pointer, ecosystem overview, and
calls to action. Its current wireframe retains the official 2026 Dev Days
Copilot App source deck's motion and media, but its visual design was rejected
and still needs rebuilding.

The 45-minute session uses a GitHub Copilot App session and Canvas side panel;
short examples are Credit Timeline, Mobile Canvas, a guided first Canvas, and
the project-scoped Sketch to app extension on `main`. MAUI DevFlow is
appendix-only. The planned conclusion lands by minute 43, leaving two minutes
for recovery or questions.

## Capabilities and Constraints

- Both decks must be readable from a conference room; only the 45-minute
  session depends on live demos and a project-scoped build.
- The keynote covers IDE integrations, Copilot CLI, GitHub Copilot cloud agent,
  GitHub.com, GitHub Mobile, the GitHub Copilot App, customization,
  automations, and extensibility at overview depth.
- The keynote must recognize the local community, organizers, volunteers,
  venue, and approved sponsors without inventing names or sponsorship claims.
- The audience is new to the GitHub Copilot App, so terms such as Canvas, extension, action, project scope, `canvasId`, and `instanceId` require concise explanation.
- Canvas state is extension-owned and optionally persisted; the Copilot App does not provide a universal shared-state store.
- Mobile Canvas does not depend on MAUI DevFlow.
- Project-scoped extensions execute local code and must be reviewed/trusted like other repository automation.
- The opening orientation distinguishes agent sessions from workspace isolation, mentions My Work/PR delivery, customizations, and automations before narrowing to Canvases.

## Brand Commitments

Use GitHub Copilot terminology accurately. The tone is clear, practical, and technically honest, with no invented product claims.

## Evidence on Hand

- Keynote content: `docs/keynote/content.md`
- Keynote run of show: `docs/keynote/run-of-show.md`
- Keynote build brief: `docs/keynote/build-brief.md`
- Canvas-session content: `docs/canvas-session/content.md`
- Canvas-session run of show: `docs/canvas-session/run-of-show.md`
- Canvas-session build brief: `docs/canvas-session/build-brief.md`
- Rehearsal and demo runbook: `docs/canvas-session/demos.md`
- Supplied-deck extraction: `docs/source-material/copilot-app-english.md`
- Official Dev Days guidance: `docs/source-material/dev-days.md`
- First Canvas walkthrough: `demos/first-canvas.md`
- Sketch to app project extension: `.github/extensions/sketch-to-app/`
- MAUI demo app starting points: `demos/MauiXamlDemo/` and `demos/MauiBlazorDemo/`
- Original reference decks and supplied Canvas PDF: `docs/source-material/`
- Credit Timeline and Mobile Canvas were installed and exercised in the presentation session.

## Product Principles

1. Welcome the community before presenting the product.
2. Show a visible outcome before explaining implementation details.
3. Use diagrams and short prompts to support live demos, not replace them.
4. Make execution boundaries and extension architecture honest.
5. Preserve recovery time and a clear conclusion.

## Accessibility & Inclusion

Use high contrast, large type, uncluttered slides, and diagrams that retain meaning when explained aloud.
