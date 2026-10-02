# .NET MAUI app workspace

This repository is a .NET 11 MAUI app workspace. Pick a UI stack and build the app's screens and interactions here. Both projects start from the standard blank templates so you can focus on the app you want to make, not project setup.

## Projects

- [`demos/MauiXamlDemo`](demos/MauiXamlDemo) — native MAUI controls and XAML.
- [`demos/MauiBlazorDemo`](demos/MauiBlazorDemo) — Blazor UI hosted in a MAUI app.

Choose **one** as the app you're building; they are alternative starting points, not two halves of one solution. There is no prebuilt product UI or backend.

## Canvases

- **[Build your first canvas](demos/first-canvas.md)** is a 5–10-minute
  walkthrough: create a cue card, count breaths from chat, then ask chat
  to read the total back.
- **[Sketch to device](demos/sketch-to-device.md)** is a copy-and-paste demo:
  use a shared sketch, inspect the running app, and interact with an Android
  device.
- **[Sketch to app](.github/extensions/sketch-to-app/README.md)** is included in this repository. Draw on the whiteboard and use chat to load or save images, edit notes, and build the app you chose above from the saved sketch. Its Blazor source, controls, and implementation walkthrough live with the extension. Only the large prebuilt UI lives separately in [`prebuilt/sketch-to-app`](prebuilt/sketch-to-app), outside the extension's 8 MiB size budget.
- **[Mobile Device](https://github.com/Redth/mobile-canvas-ghcp)** is a separate `mobile-canvas` plugin for previewing and interacting with an Android emulator or iOS Simulator after building the app. To use it in the GitHub Copilot app, open **Customize → Plugins**, add the `Redth/mobile-canvas-ghcp` marketplace, install **mobile-canvas**, and reload Copilot. Android requires an Android SDK; iOS requires macOS and Xcode.

The project canvas is available from the checkout, but the third-party Mobile Device plugin is a **per-user install**, not something Git checkout runs automatically. Review the plugin before installing it.

## Get started

The repository's `global.json` sets .NET 11 RC1 as the minimum SDK and selects
the latest installed .NET 11.0 SDK, including later previews and feature bands.

Install the .NET 11 SDK, the MAUI workload for your platform, and the
[.NET MAUI extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.dotnet-maui).

1. Open this repository in VS Code.
2. Choose the XAML or Blazor project and select your debug target or device.
3. Press **F5** to build and run. If prompted, choose **C#** and the project's
   launch configuration.

Android needs the Android SDK and an emulator or connected device.
iOS and Mac Catalyst need a Mac with Xcode installed.

## Continuous integration

The [MAUI workflow](.github/workflows/maui.yml) builds both demo projects through
`MauiDemos.slnx` for pushes to `main` and pull requests targeting `main`, and can
also be run manually.
Its matrix contains only operating systems. Shared target framework conditions
in `demos/Directory.Build.props` select Android on Linux, Android/iOS/Mac Catalyst
on macOS, and all four targets (including Windows) on Windows.

The workflow installs the SDK specified in `global.json`, the solution's MAUI
workloads, Java 21, and the required Android SDK components. macOS uses Xcode 26.6
for the RC1 Apple workloads and builds iOS for the host's simulator architecture.
Both demos target Mac Catalyst 17.0 or newer, as required by the .NET 11 workload.
Apple targets on Windows provide compilation coverage, not runnable app bundles;
native Apple builds run on macOS. Debug builds include the demos' DevFlow
integrations; no running emulator or signing secrets are needed.
For prerelease versions, `setup-dotnet` installs the exact SDK from `global.json`;
roll-forward applies when a newer compatible SDK is already installed.
NuGet packages are cached separately per operating system, architecture, and SDK,
with cache keys tracking the demo dependencies. Workload installations are not
cached. Windows builds use four MSBuild nodes to allow more targets to overlap;
this increases scheduling concurrency, not the runner's CPU count.

To build both demos for the current operating system:

```powershell
dotnet workload restore MauiDemos.slnx
dotnet build MauiDemos.slnx --configuration Debug
```

Each CI job uploads its Android dependency and solution build binlogs as a
`binlogs-<os>-attempt-<number>` artifact, including failed builds, with seven-day
retention. Reruns retain separate logs for comparison.
The build also prints MSBuild target and task timing summaries.
Download an artifact and inspect it with the repository's pinned local tool:

```powershell
dotnet tool restore
dotnet tool run binlogtool -- search <path-to-build.binlog> '$task'
```

Binlogs can contain build properties and environment values. Imported project
files are excluded from these CI logs, but review logs before sharing them.
