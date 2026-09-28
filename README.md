# Sketch to app (.NET 10 demo)

Sketch a screen in a Copilot side canvas, press **Build / update**, and watch Copilot edit a MAUI app. The canvas is a .NET 10 Blazor WebAssembly app using SkiaSharp for drawing; it does **not** call an AI API itself. It sends the complete PNG and your notes to the current Copilot session, which works in this repository.

## On-stage walkthrough

1. Before the demo, install the .NET 10 SDK and the MAUI workload for your platform. Open this repository in a Copilot project session, reload extensions, and open **Sketch to app** (`sketch-to-app`) once to let it publish and warm up. The first open may take a while; the panel shows progress or a **Retry build** button if publishing fails.
2. Tell Copilot which blank app to work on: `demos/MauiXamlDemo` (native XAML) or `demos/MauiBlazorDemo` (Blazor Hybrid). Both are checked-in, stock .NET 10 templates so there is no need to run `dotnet new` on stage.
3. Draw with the **Pen**, change **Color** and **Size**, or use **Load image** with [`login-flow.png`](examples/sketches/login-flow.png) or [`task-list.jpg`](examples/sketches/task-list.jpg). Use **Eraser**, **Undo**, or **Clear board** as needed. The board auto-saves within this session.
4. Add **Notes for Copilot** (for example, what a button should do) and press **Build / update**. Copilot receives the whole board, not just the latest stroke. Add to the sketch and press it again to update the app.

**Save PNG** downloads a flattened 1200 × 800 image of the board; **Load image** accepts PNG or JPEG (up to 8 MiB and 16 million pixels), fits it without distortion, and clears previous strokes and notes after confirmation. You can draw over a loaded image. Notes are sent with Build / update but are **not** embedded in downloaded PNGs. If no target app has been established, Copilot should ask instead of choosing one.

## How it fits together

- **Canvas entry point:** [`extension.mjs`](.github/extensions/sketch-to-app/extension.mjs) registers the canvas with Copilot, starts a local server for the panel, and forwards the Build / update request into this Copilot session.
- **Panel and drawing:** [`Home.razor`](.github/extensions/sketch-to-app/ui/Pages/Home.razor) owns the toolbar, pointer events, notes, and buttons. [`board.js`](.github/extensions/sketch-to-app/ui/wwwroot/board.js) maps browser pointer positions to the board and downloads the PNG.
- **Images:** [`BoardRenderer.cs`](.github/extensions/sketch-to-app/ui/Services/BoardRenderer.cs) uses SkiaSharp to draw strokes over the image and flatten the result. [`SketchFile.cs`](.github/extensions/sketch-to-app/ui/Services/SketchFile.cs) imports PNG/JPEG backgrounds, including rotated photos.
- **Saving and sending:** [`BoardApi.cs`](.github/extensions/sketch-to-app/ui/Services/BoardApi.cs) calls the loopback HTTP endpoints in [`canvas-server.mjs`](.github/extensions/sketch-to-app/canvas-server.mjs). [`document-store.mjs`](.github/extensions/sketch-to-app/document-store.mjs) saves the session board and, on Build / update, stores a PNG snapshot and sends that image plus notes to Copilot.
- **Apps:** [`MauiXamlDemo`](demos/MauiXamlDemo) and [`MauiBlazorDemo`](demos/MauiBlazorDemo) are the two alternative blank targets, not part of the canvas.

The loop is **draw or load → auto-save → render a PNG → send to Copilot → edit the chosen app**. The board and snapshots live in this session's `files/sketch-to-app/` artifacts, not the Git repository; opening a different session starts a fresh board. Internal `board.json` holds editable strokes, notes, and a background across reloads; portable sketch files are images, never JSON. This is intentionally a small demo, not a visual app designer or an AI service.

## Build locally

```powershell
dotnet publish .github\extensions\sketch-to-app\ui\SketchToApp.Web.csproj -c Release
dotnet build demos\MauiXamlDemo\MauiXamlDemo.csproj -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
dotnet build demos\MauiBlazorDemo\MauiBlazorDemo.csproj -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
node --test .github\extensions\sketch-to-app\test\canvas.test.mjs
```

For macOS, Android, or iOS, use the corresponding MAUI target framework and platform workload instead of the Windows target.