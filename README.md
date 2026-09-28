# .NET MAUI app workspace

This repository is a .NET 10 MAUI app workspace. Pick a UI stack and build the app's screens and interactions here. Both projects start from the standard blank templates so you can focus on the app you want to make, not project setup.

## Projects

- [`demos/MauiXamlDemo`](demos/MauiXamlDemo) — native MAUI controls and XAML.
- [`demos/MauiBlazorDemo`](demos/MauiBlazorDemo) — Blazor UI hosted in a MAUI app.

Choose **one** as the app you're building; they are alternative starting points, not two halves of one solution. There is no prebuilt product UI or backend.

## Get started

Install the .NET 10 SDK and the .NET MAUI workload for your platform. On Windows, from the repository root:

```powershell
dotnet build demos\MauiXamlDemo\MauiXamlDemo.csproj -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
dotnet build demos\MauiBlazorDemo\MauiBlazorDemo.csproj -f net10.0-windows10.0.19041.0 -p:TargetFrameworks=net10.0-windows10.0.19041.0
```

Build only the project you choose. For Android, iOS, or Mac Catalyst, use the corresponding target framework and workload.

An optional [Sketch to app canvas](.github/extensions/sketch-to-app/README.md) lets you draw a screen and ask Copilot to implement it in your chosen project. Its setup, controls, and implementation walkthrough live with the extension.
