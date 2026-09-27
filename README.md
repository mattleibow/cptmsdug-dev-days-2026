# Sketch to app demo

Draw a rough screen (or a flow of several screens) in a Copilot side canvas, then press **Build/update**. The canvas sends a PNG of the **entire current board** and your written notes to the current Copilot session. Copilot works on the app already under discussion; subsequent submissions are complete snapshots, not lists of changes.

## What's here

- `.github/extensions/sketch-to-app/` is a project-scoped Copilot canvas extension. Its UI is a .NET 10 standalone Blazor WebAssembly app using `SkiaSharp.Views.Blazor`; the extension serves it from loopback and sends snapshots to the session.
- `demos/MauiXamlDemo/MauiXamlDemo.csproj` is a .NET 10 native MAUI XAML starter app.
- `demos/MauiBlazorDemo/MauiBlazorDemo.csproj` is a separate .NET 10 MAUI Blazor Hybrid starter app.

The sketches, sent PNGs, and published browser assets are saved under this **Copilot session's** `files/sketch-to-app/` artifacts, not in the Git repository. Reopening the canvas in this session restores the board; another session starts with an empty board. Changes Copilot makes to either MAUI app are ordinary repository changes.

## Try it

1. Install the .NET 10 SDK and the .NET MAUI workloads needed for your platform. Open this repository in a Copilot project session and reload extensions after checking out the project extension.
2. Tell Copilot which app you're working on, for example, “Work on `demos/MauiXamlDemo`” or “Work on `demos/MauiBlazorDemo`.” Open the **Sketch to app** canvas (`sketch-to-app`).
3. The first open automatically publishes the Blazor WebAssembly UI into session artifacts. The panel shows build progress and any build errors; use **Retry build** if a missing SDK/workload or restore problem has been corrected.
4. Draw with a mouse, pen, or touch. Label multiple screens and connect them with arrows on the same board; use notes for details that handwriting may not convey. The board saves automatically in this session. Use **Save sketch** to download a portable JSON document, or **Load sketch** to import one; `examples/sketches/login-flow.json` and `examples/sketches/task-list.json` are ready-to-load mockups.
5. Use **Build/update** when ready. To add a forgotten control, draw it and press **Build/update** again; Copilot receives the complete new image, not just the addition.

If both sample apps are present and the conversation doesn't establish a target, Copilot should ask which app to change instead of silently modifying both. The extension never chooses a target app for you.

## Build locally

```powershell
dotnet publish .github\extensions\sketch-to-app\ui\SketchToApp.Web.csproj -c Release
dotnet build demos\MauiXamlDemo\MauiXamlDemo.csproj -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
dotnet build demos\MauiBlazorDemo\MauiBlazorDemo.csproj -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
node --test .github\extensions\sketch-to-app\test\canvas.test.mjs
```

For macOS, Android, or iOS, use the corresponding MAUI target framework and platform workload instead of the Windows target.