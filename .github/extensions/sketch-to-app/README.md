# Sketch to app canvas

This project-scoped Copilot canvas is a .NET 10 Blazor WebAssembly UI using SkiaSharp. Draw a screen, press **Build / update**, and Copilot receives the whole board as a PNG plus your notes. The canvas does not run its own AI model or choose an app to change; it sends the sketch to the current Copilot session.

## Build an app live

1. In a Copilot project session, choose the app to build: [`MauiXamlDemo`](../../../demos/MauiXamlDemo) (native XAML) or [`MauiBlazorDemo`](../../../demos/MauiBlazorDemo) (Blazor Hybrid). They are blank .NET 10 template apps already in the repo; you do not need `dotnet new` on stage.
2. Reload extensions and open **Sketch to app** (`sketch-to-app`) before presenting. The first open publishes the Blazor UI; wait for the canvas to appear. A failed publish shows an error and **Retry build**.
3. Draw with **Pen**, **Color**, and **Size**, or **Load image** using [`login-flow.png`](../../../examples/sketches/login-flow.png) or [`task-list.jpg`](../../../examples/sketches/task-list.jpg). **Eraser**, **Undo**, and **Clear board** help revise it.
4. Add **Notes for Copilot** to describe behavior the drawing cannot show. Press **Build / update** and follow the Copilot chat as it edits the chosen app. Revise the drawing and press it again to send a new *complete* sketch.

The board auto-saves within this session. **Save PNG** downloads a flattened 1200 × 800 image; **Load image** accepts PNG or JPEG (up to 8 MiB and 16 million pixels), fits it without distortion, then replaces the board and notes after confirmation. You can draw over an imported image. Notes accompany Build / update but are not embedded in a saved PNG. If you have not named a target app, Copilot should ask which one you mean.

## The canvas in five parts

- **Registration:** [`extension.mjs`](extension.mjs) registers the canvas and its latest-snapshot action with Copilot, starts the local panel server, and provides the session message sender.
- **Drawing UI:** [`ui/Pages/Home.razor`](ui/Pages/Home.razor) handles pointer strokes, controls, notes, auto-save, and Build / update. [`ui/wwwroot/board.js`](ui/wwwroot/board.js) maps browser coordinates onto the fixed board and downloads PNGs.
- **SkiaSharp:** [`ui/Services/BoardRenderer.cs`](ui/Services/BoardRenderer.cs) draws the imported background plus strokes and exports the complete image. [`ui/Services/SketchFile.cs`](ui/Services/SketchFile.cs) loads PNG/JPEG files, including rotated photos.
- **Loopback API:** [`ui/Services/BoardApi.cs`](ui/Services/BoardApi.cs) calls the endpoints in [`canvas-server.mjs`](canvas-server.mjs), which also publishes and serves the Blazor app.
- **Handoff:** [`document-store.mjs`](document-store.mjs) persists the board; on Build / update it writes an immutable PNG snapshot and sends that image and the notes to the Copilot session.

The flow is **draw or load → auto-save → render a PNG → send to Copilot → update the chosen app**. The board, snapshots, and published UI live under this session's `files/sketch-to-app/` artifacts, not in Git. A new session starts with an empty board. Internal `board.json` retains strokes and notes across reloads; user-facing sketch files are images, not JSON.

## Check the demo

From the repository root, with the .NET 10 SDK installed:

```powershell
dotnet publish .github\extensions\sketch-to-app\ui\SketchToApp.Web.csproj -c Release
node --test .github\extensions\sketch-to-app\test\canvas.test.mjs
```
