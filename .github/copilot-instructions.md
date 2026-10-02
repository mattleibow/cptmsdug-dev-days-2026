# Copilot instructions

## Workspace

- This is a .NET 11 MAUI demo workspace. `demos\MauiXamlDemo` and
  `demos\MauiBlazorDemo` are alternative starting points, not one application.
  Work only on the project the user chooses.
- Implement only the behavior requested by the user. Do not infer extra
  requirements from unrelated documentation.
- Keep the README for humans: project choices, demo links, and simple VS Code
  instructions. Keep agent tooling and troubleshooting guidance here.
- Use Windows-style filesystem paths when running on Windows.

## Run and validate

- Use `dotnet run` to build, launch, and validate the chosen app. A build alone
  does not validate an interaction. Do not use `--no-build` after source changes.
- Select the project and platform from the user's request and the execution
  host. For local runtime testing, do not attempt Apple targets on Windows or
  Windows targets on macOS.
- Restrict `TargetFrameworks` to the selected target so unrelated platform
  workloads are not required. Use Debug for live inspection.
- For Android and iOS, discover available devices first and set `$device` to
  the selected native serial or UDID. Pass it with `--device` instead of leaving
  an unattended command waiting at .NET 11's interactive device picker.
- Target the selected device's architecture when generating a standalone APK.
  Avoid building unrelated architectures for an emulator.
- Verify the app is responsive and check the actual behavior requested by the
  user. For UI changes, inspect the live tree, properties, and screenshots.
- If asked to leave the app running, use a persistent terminal or detached
  process. When restarting, stop only the specific app process.
- After a source change, restart with a fresh `dotnet run` and rediscover the
  agent before inspecting. Do not validate an old process or installed binary.
- Report launch or runtime failures explicitly. Inspect relevant logs before
  changing dependencies, project settings, or device data.

### Platform commands

Run from the repository root in PowerShell (`pwsh`). These examples use the
XAML project; substitute `MauiBlazorDemo` and `MauiBlazorDemo.csproj` when the
user chooses Blazor. `Join-Path` keeps project paths portable between hosts.

#### Windows

```powershell
dotnet run `
    --project (Join-Path demos MauiXamlDemo MauiXamlDemo.csproj) `
    --framework net11.0-windows10.0.19041.0 `
    --property:TargetFrameworks=net11.0-windows10.0.19041.0 `
    --no-launch-profile
```

#### macOS (Mac Catalyst)

Run on a Mac with Xcode installed.

```powershell
dotnet run `
    --project (Join-Path demos MauiXamlDemo MauiXamlDemo.csproj) `
    --framework net11.0-maccatalyst `
    --property:TargetFrameworks=net11.0-maccatalyst `
    --no-launch-profile
```

#### Android

Start the selected emulator or connect the device first. Set `$device` to its
discovered serial, such as `emulator-5554`, before running.

```powershell
dotnet run `
    --project (Join-Path demos MauiXamlDemo MauiXamlDemo.csproj) `
    --framework net11.0-android `
    --property:TargetFrameworks=net11.0-android `
    --device $device `
    --no-launch-profile
```

#### iOS

Run on a Mac with Xcode installed. Set `$device` to the selected simulator's
UDID before running; physical devices additionally require provisioning.

```powershell
dotnet run `
    --project (Join-Path demos MauiXamlDemo MauiXamlDemo.csproj) `
    --framework net11.0-ios `
    --property:TargetFrameworks=net11.0-ios `
    --device $device `
    --no-launch-profile
```

## CI and build troubleshooting

- `.github/workflows/maui.yml` builds both demos through `MauiDemos.slnx`.
  Automatic runs are limited to pushes to `main` and PRs targeting `main`;
  PRs build only on macOS for faster feedback. Pushes to `main` and manual
  dispatch build on Linux, macOS, and Windows. Android and Windows coverage is
  post-merge, not a PR gate.
- Keep the matrix OS-only. Each project selects Android on Linux,
  Android/Windows on Windows, and iOS/Mac Catalyst on macOS. This is an intentional
  demo split, not a statement of host capabilities. Local Windows builds do not
  validate Apple implementations; macOS PR CI catches platform contract drift.
- `global.json` sets .NET 11 RC1 as the minimum and rolls forward to the latest
  installed .NET 11.0 SDK, including previews and feature bands. CI's
  `setup-dotnet` installs the exact prerelease SDK specified there.
- CI installs the solution's workloads. Only Linux/Windows set up Java 21
  and Android SDK components. `setup-android` installs `platform-tools`,
  `platforms;android-37.0`, and `build-tools;36.0.0` directly; there is no separate
  MSBuild dependency installation. Recheck these versions when updating .NET.
  Builds discover Android and Java through the setup actions' `ANDROID_HOME`
  and `JAVA_HOME`; do not duplicate these as command-line SDK directory properties.
  macOS selects Xcode 26.6 for RC1 and uses the default iOS runtime identifier;
  there is no explicit simulator override. Mac Catalyst requires minimum 17.0.
  Builds use Debug (including DevFlow), `ContinuousIntegrationBuild=true`, and
  `EnableCodeSigning=false`; CI does not launch apps or emulators.
- Cache the isolated .NET installation and workload records on Windows only;
  do not cache or modify the runner's shared installation. Always run workload
  restore to verify requirements, even on a cache hit.
- Linux/macOS cache application NuGet packages per OS, architecture, SDK, and
  dependency hash. Set their package path after workload installation to avoid
  duplicating workload downloads. Windows downloads application packages
  directly because its measured NuGet cache overhead exceeded restore savings.
  Linux/macOS workload installations are too short to justify large SDK caches.
- Caching is enabled for automatic and manual runs. Compare actual cache hits
  and restore/save overhead, not just total job duration.
  PR caches are scoped to the PR merge ref; rerun the same PR job for warm-cache
  comparisons instead of assuming branch dispatch can read them.
- Windows uses `-maxcpucount:4`. This increases scheduling concurrency, not CPU
  capacity; it does not guarantee a speedup or fixed batches of target frameworks.

For solution-wide build checks, rather than app runtime validation:

```powershell
dotnet workload restore MauiDemos.slnx
dotnet build MauiDemos.slnx --configuration Debug
```

CI prints MSBuild performance summaries and uploads solution build binlogs as
`binlogs-<os>-attempt-<number>`, including failures, with seven-day retention.
Inspect downloaded logs with the pinned local tool:

```powershell
dotnet tool restore
dotnet tool run binlogtool -- search <path-to-build.binlog> '$task'
```

Task durations can overlap; cumulative timings are not wall-clock totals.
`ProjectImports=None` excludes imported file contents, not imports themselves.
Binlogs still contain properties and environment values; review before sharing.

## MAUI DevFlow and Inspector

- Both apps register `Microsoft.Maui.DevFlow.Agent` in Debug builds only.
  The Blazor app also registers `Microsoft.Maui.DevFlow.Blazor` for WebView
  inspection. Release builds do not include these agents.
- The matching `Microsoft.Maui.Cli` is pinned in the repository's local
  `dotnet-tools.json` manifest. Use the local tool, not a global installation.
  Restore it with `dotnet tool restore` if it is unavailable.
- Use the broker for agent discovery. Start it when needed:

  ```powershell
  dotnet tool run maui -- devflow broker start
  dotnet tool run maui -- devflow list
  ```

- Open `http://localhost:19223/inspector/` in a browser canvas when the user
  wants to inspect the app. Select the agent for the intended app and platform.
- Discover the current agent port; never assume 9223 or reuse stale element
  IDs after an app restart. Pass the discovered port with `-ap`:

  ```powershell
  dotnet tool run maui -- devflow ui tree -ap <port>
  ```

- Use live tree queries to identify controls before tapping or editing them.
  Read properties back and use `ui assert` for concrete expectations. Do not
  claim a test passed from source code or a tool's launch-success response.
- Live property edits change the running instance, not XAML or C#. Restore
  temporary edits after the requested test.
- If the UI changes during a tree capture, retry after it settles.
  Do not interpret a failed tree capture as a successful check.
- The Blazor project's Windows Debug build has a temporary workaround for
  [dotnet/maui-labs#66](https://github.com/dotnet/maui-labs/issues/66).
  Its project target copies the restored bridge's `chobitsu.js` into the
  package's expected PRI path. Do not duplicate this workaround in the XAML app.

## Mobile Device canvas and Android

- Mobile Device is a per-user plugin, not something this checkout installs.
  Use its device discovery and canvas tools when available.
- Use the live accessibility hierarchy to find and tap controls. Read the
  result back; do not substitute property assignment for a physical tap.
- Keep Windows and Android app instances separate. Their state,
  process lifetimes, and Inspector connections are independent.
- Distinguish a warm return from a cold restart: bringing an app to the
  foreground should not force-stop it unless the user asks for a restart.
- Prefer `dotnet run` for build-and-run testing. If directly installing a
  generated APK instead, build with `EmbedAssembliesIntoApk=true`; a standalone
  APK must not depend on fast-deployed managed assemblies.
- If an APK upgrade fails with insufficient storage, try targeting only the
  emulator's architecture. Do not erase the emulator or remove unrelated apps
  or user data to make space.
- If upgrading from a fast-deployed .NET 10 app causes a CoreCLR startup
  failure, inspect logs and the app's `files/.__override__` directory. Stale
  assemblies there can shadow the embedded .NET 11 assemblies. Remove only
  that confirmed generated deployment cache, not all app data.
