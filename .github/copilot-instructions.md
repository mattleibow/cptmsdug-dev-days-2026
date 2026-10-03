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

- Read `.github/workflows/maui.yml`, `global.json`, and the project files for
  current configuration. Do not duplicate their versions, flags, or matrix here.
- The host- and CI-specific target split is intentional for the platform-drift demo,
  not a limitation of the toolchain. A local build does not validate other hosts.
  Fix platform implementations rather than removing failing targets.
- When changing SDK versions, check the required Android packages and Xcode
  compatibility together.
- Measure cache download, extraction, and upload overhead before calling it an
  optimization. Compare runs with compatible cache scopes and account for runner
  variability. Cache task-owned installations, not shared runner directories.
- Use CI binlogs and the local `binlogtool` for slow-build investigations.
  Task durations can overlap; cumulative timings are not wall-clock totals.
  Binlogs may contain properties and environment values even without embedded
  imports; review them before sharing.

## MAUI DevFlow and Inspector

- Read `.github/skills/maui-devflow-debug/SKILL.md` before runtime inspection.
  Its repository demo workflow and `references/batch.md` contain tested
  workarounds for the pinned CLI. Use them before starting a demo.
  `devflow skills doctor` can report these intentional adaptations as drift;
  do not overwrite them with `init`, `skills update`, or `--force`.
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
- If scoped Windows auto-restore causes CounterCore NETSDK1005 for `net11.0`,
  restore the CounterCore project separately, then use a fresh `dotnet run`
  with `--no-restore`. Do not use `--no-build` or change project targets to
  hide the restore issue.
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
