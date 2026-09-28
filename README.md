# Sketch to app demo

Draw a rough screen (or a flow of several screens) in a Copilot side canvas, then press **Build/update**. The canvas sends a PNG of the **entire current board** and your written notes to the current Copilot session. Copilot works on the app already under discussion; subsequent submissions are complete snapshots, not lists of changes.

## What's here

- `.github/extensions/sketch-to-app/` is a project-scoped Copilot canvas extension. Its UI is a .NET 10 standalone Blazor WebAssembly app using `SkiaSharp.Views.Blazor`; the extension serves it from loopback and sends snapshots to the session.
- `demos/MauiXamlDemo/MauiXamlDemo.csproj` is the stock .NET 10 native MAUI XAML template.
- `demos/MauiBlazorDemo/MauiBlazorDemo.csproj` is the stock .NET 10 MAUI Blazor Hybrid template. Neither app contains a pre-generated screen, so both are ready for the on-stage demo.

The sketches, sent PNGs, and published browser assets are saved under this **Copilot session's** `files/sketch-to-app/` artifacts, not in the Git repository. Reopening the canvas in this session restores the board; another session starts with an empty board. Changes Copilot makes to either MAUI app are ordinary repository changes.

## Try it

1. Install the .NET 10 SDK and the .NET MAUI workloads needed for your platform. Open this repository in a Copilot project session and reload extensions after checking out the project extension.
2. Tell Copilot which app you're working on, for example, “Work on `demos/MauiXamlDemo`” or “Work on `demos/MauiBlazorDemo`.” Open the **Sketch to app** canvas (`sketch-to-app`).
3. The first open automatically publishes the Blazor WebAssembly UI into session artifacts. The panel shows build progress and any build errors; use **Retry build** if a missing SDK/workload or restore problem has been corrected.
4. Draw with a mouse, pen, or touch. Label multiple screens and connect them with arrows on the same board; use notes for details that handwriting may not convey. The board saves automatically in this session. **Save sketch** downloads a flattened PNG of everything visible on the board; **Load sketch** imports a PNG or JPEG (up to 8 MiB and 16 million pixels) as a board background, scaled to fit without distortion. `examples/sketches/login-flow.png` and `examples/sketches/task-list.jpg` are ready-to-load mockups. You can draw new strokes over an imported image and save the combined result as PNG.
5. Use **Build/update** when ready. To add a forgotten control, draw it and press **Build/update** again; Copilot receives the complete new image, not just the addition.

Written notes are session-only context sent to Copilot; they aren't embedded in downloaded PNGs. Loading a new image replaces the board and clears its previous notes. Use a PNG when you want a portable sketch you can reopen in a later session; automatic session saving retains your editable recent strokes and notes.

If both sample apps are present and the conversation doesn't establish a target, Copilot should ask which app to change instead of silently modifying both. The extension never chooses a target app for you.

## Build locally

```powershell
dotnet publish .github\extensions\sketch-to-app\ui\SketchToApp.Web.csproj -c Release
dotnet build demos\MauiXamlDemo\MauiXamlDemo.csproj -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
dotnet build demos\MauiBlazorDemo\MauiBlazorDemo.csproj -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
node --test .github\extensions\sketch-to-app\test\canvas.test.mjs
```

For macOS, Android, or iOS, use the corresponding MAUI target framework and platform workload instead of the Windows target.