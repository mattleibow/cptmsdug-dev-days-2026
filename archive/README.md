# .NET MAUI app workspace

This repository is a .NET 10 MAUI app workspace. Pick a UI stack and build the app's screens and interactions here. Both projects start from the standard blank templates so you can focus on the app you want to make, not project setup.

## Projects

- [`demos/MauiXamlDemo`](demos/MauiXamlDemo) — native MAUI controls and XAML.
- [`demos/MauiBlazorDemo`](demos/MauiBlazorDemo) — Blazor UI hosted in a MAUI app.

Choose **one** as the app you're building; they are alternative starting points, not two halves of one solution. There is no prebuilt product UI or backend.

## Canvases

- **[Build your first canvas](demos/first-canvas.md)** is a 5–10-minute
  walkthrough: create a cue card, count breaths from chat, then ask chat
  to read the total back.
- **[Sketch to app](.github/extensions/sketch-to-app/README.md)** is included in this repository. Draw on the whiteboard and use chat to load or save images, edit notes, and build the app you chose above from the saved sketch. Its controls and implementation walkthrough live with the extension.
- **[Mobile Device](https://github.com/Redth/mobile-canvas-ghcp)** is a separate `mobile-canvas` plugin for previewing and interacting with an Android emulator or iOS Simulator after building the app. To use it in the GitHub Copilot app, open **Customize → Plugins**, add the `Redth/mobile-canvas-ghcp` marketplace, install **mobile-canvas**, and reload Copilot. Android requires an Android SDK; iOS requires macOS and Xcode.

The project canvas is available from the checkout, but the third-party Mobile Device plugin is a **per-user install**, not something Git checkout runs automatically. Review the plugin before installing it.

## Get started

Install the .NET 10 SDK and the .NET MAUI workload for your platform. On Windows, from the repository root:

```powershell
dotnet build demos\MauiXamlDemo\MauiXamlDemo.csproj -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
dotnet build demos\MauiBlazorDemo\MauiBlazorDemo.csproj -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
```

Build only the project you choose. For Android, iOS, or Mac Catalyst, use the corresponding target framework and workload.

## Dev Days talks

This repository also contains the content, source material, and draft decks
for two Dev Days Cape Town 2026 talks:

1. A **30-minute user-group keynote** that welcomes the event, thanks the
   community and sponsors, orients attendees, and introduces the broader
   GitHub Copilot ecosystem.
2. A **45-minute technical session** that recaps the ecosystem, explains the
   GitHub Copilot App operating model, and goes deep on Canvas extensions.

Start with the [talk workspace](docs/README.md).

| Talk | Content | Run of show | Build brief |
|---|---|---|---|
| Event keynote | [`docs/keynote/content.md`](docs/keynote/content.md) | [`docs/keynote/run-of-show.md`](docs/keynote/run-of-show.md) | [`docs/keynote/build-brief.md`](docs/keynote/build-brief.md) |
| App and Canvas session | [`docs/canvas-session/content.md`](docs/canvas-session/content.md) | [`docs/canvas-session/run-of-show.md`](docs/canvas-session/run-of-show.md) | [`docs/canvas-session/build-brief.md`](docs/canvas-session/build-brief.md) |

The [Canvas demo plan](docs/canvas-session/demos.md) uses Credit Timeline,
Mobile Device, the first-canvas walkthrough, and this repository's Sketch to
app extension. The [source-material index](docs/source-material/README.md)
preserves the original reference decks, including
[`Canvassing your Agents.pdf`](docs/source-material/canvassing-your-agents.pdf).
The [organizer checklist](docs/keynote/organizer-inputs.md) records outstanding
keynote approvals.

The [keynote wireframe](docs/decks/drafts/copilot-keynote-wireframe.pptx)
preserves content, speaker notes, and source media, but its visual treatment
was rejected; it is **not a finished deck**. Its
[local build script](scripts/presentation/build-keynote-wireframe.mjs) and the
Markdown plans remain available for a redesign. Do not edit or preview slides
in the GitHub Copilot App slide Canvas.
