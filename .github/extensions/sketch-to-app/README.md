# Sketch to app canvas

This project-scoped Copilot canvas is a .NET 11 Blazor WebAssembly whiteboard using SkiaSharp. Draw and type in the panel; ask Copilot in chat to inspect, import, or export an image with its notes, edit notes, or build an app from the sketch. No panel button starts a build or sends a chat message.

## Build an app live

1. In a Copilot project session, choose the app to build: [`MauiXamlDemo`](../../../demos/MauiXamlDemo) (native XAML) or [`MauiBlazorDemo`](../../../demos/MauiBlazorDemo) (Blazor Hybrid). They are blank .NET 11 template apps already in the repo; you do not need `dotnet new` on stage.
2. Reload extensions and open **Sketch to app** (`sketch-to-app`) before presenting. The matching prebuilt Blazor UI is checked in under [`prebuilt/sketch-to-app`](../../../prebuilt/sketch-to-app), outside the extension directory, so it opens without a .NET build. If you edited the UI but did not regenerate the bundle, opening it publishes the new version locally instead; a failed publish shows **Retry build**.
3. Draw with **Pen**, **Color**, and **Size**, or ask chat to load a PNG/JPEG from the repository or the session's attachments into the board. **Eraser**, **Undo**, and **Clear board** help revise it.
4. Add notes in the panel or ask Copilot to add or replace them. After the board says **Auto-saved**, ask chat to show or describe the sketch; Copilot reads the PNG and notes without editing an app. Ask it to “export this board to `designs\login-screen`” to create `designs\login-screen.png` and `designs\login-screen.md`. When ready, say “build this screen in MauiXamlDemo” (or the app you chose), and Copilot uses the latest snapshot to do the work.

The 1200 × 800 flattened PNG auto-saves after drawing; notes auto-save while typing. Chat's `get_snapshot` returns an image path, notes, and version. `export_board` writes that same immutable board version to a repository-relative PNG plus a sibling Markdown file that embeds the image and preserves the notes; it refuses to overwrite either file. `import_image` accepts a PNG or JPEG (up to 8 MiB and 16 million pixels); Blazor fits and orients it before you draw over it. Import replaces the pixels and strokes, preserving existing notes unless new notes are supplied. Images can be queued while the panel is closed and applied on its next open. Chat imports read files in this repository or the session's attachment/artifact area; copy a file there first if it lives elsewhere. If the target app is unclear, Copilot should ask which one you mean.

## The canvas in seven parts

- **Registration:** [`extension.mjs`](extension.mjs) registers the canvas and chat actions to read or export the image and notes, import an image, or edit notes; it does not start chat turns by itself.
- **Touch input:** [`TouchCanvas.razor`](ui/Components/TouchCanvas.razor) and [`touch-canvas.js`](ui/wwwroot/touch-canvas.js) capture one active pointer, map coordinates onto a logical canvas size, and forward points without knowing about pens or app screens.
- **Drawing:** [`SketchCanvas.razor`](ui/Components/SketchCanvas.razor) collects strokes in a plain [`BoardDocument`](ui/Models/BoardDocument.cs), manages Undo/Clear, and paints with SkiaSharp. The page owns the document; the component owns the in-progress stroke.
- **Page and updates:** [`Home.razor`](ui/Pages/Home.razor) handles notes, auto-save, and chat-triggered imports. [`board.js`](ui/wwwroot/board.js) listens for version notifications with browser `EventSource` and calls a Blazor method through JS interop.
- **SkiaSharp:** [`BoardRenderer.cs`](ui/Services/BoardRenderer.cs) renders the same background and strokes for both the on-screen canvas and the saved PNG. [`SketchFile.cs`](ui/Services/SketchFile.cs) loads PNG/JPEG files, including rotated photos.
- **Loopback API:** [`BoardApi.cs`](ui/Services/BoardApi.cs) calls [`canvas-server.mjs`](canvas-server.mjs) over HTTP. That server serves the matching [`prebuilt`](../../../prebuilt/sketch-to-app) UI (or publishes changed source) and broadcasts small “board changed” SSE events; the image itself travels by HTTP, not SSE.
- **Storage:** [`document-store.mjs`](document-store.mjs) persists the board, its PNG, and pending chat imports. Agent actions return an immutable image path plus notes for Copilot to inspect, or export that version as a PNG/Markdown pair. Version checks prevent stale edits from silently overwriting new ones.

The flow is **chat import or draw → auto-save → chat inspect, edit, or export → ask chat to build the chosen app**. The live board and snapshots stay under this session's `files/sketch-to-app/` artifacts; the prebuilt browser UI is checked in separately from the extension source. A new session starts with an empty board. Internal `board.json` retains strokes and notes across reloads, while requested exports are repository PNG/Markdown pairs.

The Copilot app limits project extensions to **8,388,608 bytes (8 MiB)**. All extension source, including the Blazor app under [`ui`](ui), stays in `.github/extensions/sketch-to-app`. Only the roughly 11 MiB prebuilt WebAssembly bundle lives outside it, under the repository-root `prebuilt/sketch-to-app` folder. Keep the complete repository checkout available on the execution host to reuse that bundle: copying or sharing the extension folder alone includes the source but not the prebuilt app. Browser assets are still served locally with the board API on the same loopback origin; no external hosting or downloads are needed.

## Update the prebuilt UI

After editing anything under `ui/`, use [`build-prebuilt.mjs`](build-prebuilt.mjs) to regenerate the bundle, then commit both the source and `prebuilt/sketch-to-app`. From the repository root, with the .NET 11 SDK and Node.js installed:

Install the `wasm-tools` workload for native relinking. SkiaSharp is pinned to
`4.151.2` because the newer native WebAssembly assets regress .NET 11 toolchain
compatibility (see [mono/SkiaSharp#4440](https://github.com/mono/SkiaSharp/issues/4440)).

```powershell
node .github\extensions\sketch-to-app\build-prebuilt.mjs
node --test .github\extensions\sketch-to-app\test\canvas.test.mjs
```

The script publishes in Release with IL trimming and runtime relinking, then replaces `prebuilt/sketch-to-app` with the static `wwwroot` files and a `source.hash` marker. The custom loopback server does not serve Brotli/Gzip sidecars or source maps, so they are omitted. This whiteboard has no locale-dependent formatting, so invariant globalization removes ICU data. The bundle is about 11 MiB rather than 24 MiB. The source fingerprint excludes `bin` and `obj` and uses normalized text line endings so a checkout on another OS can reuse it.

Build staging and all intermediate .NET outputs go under the ignored `prebuilt/.build` folder and are cleaned up after publishing, not left inside the extension's size budget. A stale or missing bundle falls back to a local .NET publish under the session's artifacts, also with intermediate outputs outside the extension. Use the script rather than a plain `dotnet build` or `dotnet publish` in `ui/`, which would create large local `bin`/`obj` directories inside the extension. Reload the extension after updating the UI; there is no file watcher.
