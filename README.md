# .NET MAUI app workspace

This repository is a .NET 11 MAUI app workspace. Pick a UI stack and build the app's screens and interactions here. Both projects start from the standard blank templates so you can focus on the app you want to make, not project setup.

## Projects

- [`demos/MauiXamlDemo`](demos/MauiXamlDemo) — native MAUI controls and XAML.
- [`demos/MauiBlazorDemo`](demos/MauiBlazorDemo) — Blazor UI hosted in a MAUI app.

Choose **one** as the app you're building; they are alternative starting points, not two halves of one solution.
Both demos reference [`demos/CounterCore`](demos/CounterCore) for their increment-only counter.
Its packaged [`countersettings.json`](demos/CounterCore/countersettings.json) sets the increment step to 1.

## Walkthroughs

- [**Build your first canvas**](walkthroughs/first-canvas/README.md) is a 5–10-minute
  walkthrough: create a cue card, count breaths from chat, then ask chat
  to read the total back.
- [**Sketch to device**](walkthroughs/sketch-to-device/README.md) is a copy-and-paste demo:
  start from the clean XAML template, build an animation from a shared sketch,
  inspect the running app, and test and record it on Android.

Walkthroughs and their assets live in [`walkthroughs`](walkthroughs/README.md);
the app projects remain in `demos`.

## Canvases

- [**Sketch to app**](.github/extensions/sketch-to-app/README.md) is included in this repository. Draw on the whiteboard and use chat to load or save images, edit notes, and build the app you chose above from the saved sketch. Its Blazor source, controls, and implementation walkthrough live with the extension. Only the large prebuilt UI lives separately in [`prebuilt/sketch-to-app`](prebuilt/sketch-to-app), outside the extension's 8 MiB size budget.
- [**Mobile Device**](https://github.com/Redth/mobile-canvas-ghcp) is a separate `mobile-canvas` plugin for previewing and interacting with an Android emulator or iOS Simulator after building the app. To use it in the GitHub Copilot app, open **Customize → Plugins**, add the `Redth/mobile-canvas-ghcp` marketplace, install **mobile-canvas**, and reload Copilot. Android requires an Android SDK; iOS requires macOS and Xcode.

The project canvas is available from the checkout, but the third-party Mobile Device plugin is a **per-user install**, not something Git checkout runs automatically. Review the plugin before installing it.

## Get started

Install the .NET 11 RC1 SDK or newer, the MAUI workload for your platform, and the
[.NET MAUI extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.dotnet-maui).

1. Open this repository in VS Code.
2. Choose the XAML or Blazor project and select your debug target or device.
3. Press **F5** to build and run. If prompted, choose **C#** and the project's
   launch configuration.

Android needs the Android SDK and an emulator or connected device.
iOS and Mac Catalyst need a Mac with Xcode installed.
