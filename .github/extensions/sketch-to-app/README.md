# Sketch to app canvas

This project-scoped Copilot canvas is a .NET 10 Blazor WebAssembly whiteboard using SkiaSharp. Draw and type in the panel; ask Copilot in chat to inspect, import, or save an image, edit notes, or build an app from the sketch. No panel button starts a build or sends a chat message.

## Build an app live

1. In a Copilot project session, choose the app to build: [`MauiXamlDemo`](../../../demos/MauiXamlDemo) (native XAML) or [`MauiBlazorDemo`](../../../demos/MauiBlazorDemo) (Blazor Hybrid). They are blank .NET 10 template apps already in the repo; you do not need `dotnet new` on stage.
2. Reload extensions and open **Sketch to app** (`sketch-to-app`) before presenting. The first open publishes the Blazor UI; wait for the canvas to appear. A failed publish shows an error and **Retry build**.
3. Draw with **Pen**, **Color**, and **Size**, or ask chat to load [`login-flow.png`](../../../examples/sketches/login-flow.png) or [`task-list.jpg`](../../../examples/sketches/task-list.jpg) into the board. **Eraser**, **Undo**, and **Clear board** help revise it.
4. Add notes in the panel or ask Copilot to add or replace them. After the board says **Auto-saved**, ask chat to show or describe the sketch; Copilot reads the PNG and notes without editing an app. When ready, say “build this screen in MauiXamlDemo” (or the app you chose), and Copilot uses the latest snapshot to do the work.

The 1200 × 800 flattened PNG auto-saves after drawing; notes auto-save while typing. Chat's `get_snapshot` returns an image path, notes, and version. Ask chat to copy that PNG to a named file when you want to keep or share it. `import_image` accepts a PNG or JPEG (up to 8 MiB and 16 million pixels); Blazor fits and orients it before you draw over it. Import replaces the pixels and strokes, preserving existing notes unless new notes are supplied. Images can be queued while the panel is closed and applied on its next open. Chat imports read files in this repository or the session's attachment/artifact area; copy a file there first if it lives elsewhere. Notes are not embedded in downloaded PNGs. If the target app is unclear, Copilot should ask which one you mean.

## The canvas in seven parts

- **Registration:** [`extension.mjs`](extension.mjs) registers the canvas and chat actions to read the image and notes, import an image, or edit notes; it does not start chat turns by itself.
- **Touch input:** [`ui/Components/TouchCanvas.razor`](ui/Components/TouchCanvas.razor) and [`ui/wwwroot/touch-canvas.js`](ui/wwwroot/touch-canvas.js) capture one active pointer, map coordinates onto a logical canvas size, and forward points without knowing about pens or app screens.
- **Drawing:** [`ui/Components/SketchCanvas.razor`](ui/Components/SketchCanvas.razor) collects strokes in a plain [`BoardDocument`](ui/Models/BoardDocument.cs), manages Undo/Clear, and paints with SkiaSharp. The page owns the document; the component owns the in-progress stroke.
- **Page and updates:** [`ui/Pages/Home.razor`](ui/Pages/Home.razor) handles notes, auto-save, and chat-triggered imports. [`ui/wwwroot/board.js`](ui/wwwroot/board.js) listens for version notifications with browser `EventSource` and calls a Blazor method through JS interop.
- **SkiaSharp:** [`ui/Services/BoardRenderer.cs`](ui/Services/BoardRenderer.cs) renders the same background and strokes for both the on-screen canvas and the saved PNG. [`ui/Services/SketchFile.cs`](ui/Services/SketchFile.cs) loads PNG/JPEG files, including rotated photos.
- **Loopback API:** [`ui/Services/BoardApi.cs`](ui/Services/BoardApi.cs) calls [`canvas-server.mjs`](canvas-server.mjs) over HTTP. That server publishes the Blazor app and broadcasts small “board changed” SSE events; the image itself travels by HTTP, not SSE.
- **Storage:** [`document-store.mjs`](document-store.mjs) persists the board, its PNG, and pending chat imports. Agent actions return an immutable image path plus notes for Copilot to inspect. Version checks prevent stale edits from silently overwriting new ones.

The flow is **chat import or draw → auto-save → chat inspect or edit → ask chat to build the chosen app**. The board, snapshots, and published UI live under this session's `files/sketch-to-app/` artifacts, not in Git. A new session starts with an empty board. Internal `board.json` retains strokes and notes across reloads; user-facing sketch files are images, not JSON.

## Check the demo

From the repository root, with the .NET 10 SDK installed:

```powershell
dotnet publish .github\extensions\sketch-to-app\ui\SketchToApp.Web.csproj -c Release
node --test .github\extensions\sketch-to-app\test\canvas.test.mjs
```
