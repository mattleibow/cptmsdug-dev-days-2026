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

Install the .NET 11 SDK and the .NET MAUI workload for your platform.
On Windows, run the XAML app from the repository root:

```powershell
dotnet run --project demos\MauiXamlDemo\MauiXamlDemo.csproj --framework net11.0-windows10.0.19041.0 --property:TargetFrameworks=net11.0-windows10.0.19041.0 --no-launch-profile
```

Use `demos\MauiBlazorDemo\MauiBlazorDemo.csproj` instead for the Blazor app.
`dotnet run` builds and launches the app; no separate build step is needed.
For Android, iOS, or Mac Catalyst, use the corresponding target framework,
workload, and device or simulator.
