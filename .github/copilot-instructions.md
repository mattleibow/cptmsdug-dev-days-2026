# Copilot instructions

## Workspace

- This is a .NET 11 MAUI demo workspace. `demos\MauiXamlDemo` and
  `demos\MauiBlazorDemo` are alternative starting points, not one application.
  Work only on the app or apps the user requests. Both reference
  `demos\CounterCore`; change that library when implementing shared behavior,
  but do not change the other app unless it was requested.
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
  workloads are not required. Both apps and CounterCore use matching
  host-supported platform targets, so restore/build/run the selected app or
  solution normally; no separate shared-library restore is needed.
  Use Debug for live inspection.
- For Android and iOS, discover available devices first and set `$device` to
  the selected native serial or UDID. Pass it with `--device` instead of leaving
  an unattended command waiting at .NET 11's interactive device picker.
- Target the selected device's architecture when generating a standalone APK.
  Avoid building unrelated architectures for an emulator.
- Verify the app is responsive and check the actual behavior requested by the
  user. For UI changes, inspect the live tree, properties, and screenshots.
- If asked to leave the app running, use a persistent terminal or detached
  process and confirm it remains responsive. Do not stop its launch shell
  while the app is still needed. When restarting, stop only the specific
  app process, never all processes with the same name.
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
    --configuration Debug `
    --framework net11.0-windows10.0.19041.0 `
    --property:TargetFrameworks=net11.0-windows10.0.19041.0 `
    --no-launch-profile
```

#### macOS (Mac Catalyst)

Run on a Mac with Xcode installed.

```powershell
dotnet run `
    --project (Join-Path demos MauiXamlDemo MauiXamlDemo.csproj) `
    --configuration Debug `
    --framework net11.0-maccatalyst `
    --property:TargetFrameworks=net11.0-maccatalyst `
    --no-launch-profile
```

#### Android

Start the selected emulator or connect the device first. Discover devices with
the Mobile Device tools or `dotnet run --list-devices` for the chosen project
and framework. Set `$device` to the selected native serial before running.

```powershell
dotnet run `
    --project (Join-Path demos MauiXamlDemo MauiXamlDemo.csproj) `
    --configuration Debug `
    --framework net11.0-android `
    --property:TargetFrameworks=net11.0-android `
    --device $device `
    --no-launch-profile
```

#### iOS

Run on a Mac with Xcode installed. Discover devices with the Mobile Device
tools or `dotnet run --list-devices` for the chosen project and framework.
Set `$device` to the selected native device/simulator UDID before running;
physical devices additionally require provisioning.

```powershell
dotnet run `
    --project (Join-Path demos MauiXamlDemo MauiXamlDemo.csproj) `
    --configuration Debug `
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

## MAUI DevFlow CLI

- Use `maui-devflow-debug` for launch, discovery, inspection, and interaction;
  `maui-devflow-onboard` for missing package references or registration; and
  `maui-devflow-session-review` when the user requests a review of tooling
  friction. These skills live in `.github/skills`. If the current session
  cannot invoke one, read its `SKILL.md` directly.
- Keep the bundled skills unchanged. Repository-specific issues and
  workarounds belong in these instructions, not in the skill files.
  Confirm syntax with CLI help: the bundled batch reference has legacy
  `MAUI`/`cdp` examples, while the current commands use `ui`/`webview`.
- Both apps register `Microsoft.Maui.DevFlow.Agent` in Debug builds only.
  The Blazor app also registers `Microsoft.Maui.DevFlow.Blazor` for WebView
  inspection. Release builds do not include these agents.
- The matching `Microsoft.Maui.Cli` is pinned in the repository's local
  root `dotnet-tools.json` manifest. Use `dotnet tool run maui --` from the
  repository root, not a global installation.
  Restore it with `dotnet tool restore` if it is unavailable.
- Use the broker for agent discovery. Start it when needed:

  ```powershell
  dotnet tool run maui -- devflow broker start
  dotnet tool run maui -- devflow list
  ```

- After launching, wait for the agent with `devflow wait --timeout 60` before
  inspecting it. If a project-filtered wait times out but `list` shows the app,
  verify that agent directly with `agent status`; do not repeatedly rebuild
  or restart the broker. Inspect timeout/error output, not only exit codes.
- Discover the current agent port; never assume 9223 or reuse stale element
  IDs after an app restart. Confirm the app and platform with `devflow agent
  status -ap <port>`. Pass the discovered port with `-ap`:

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

### Known CLI issues and workarounds

- [dotnet/maui-labs#620](https://github.com/dotnet/maui-labs/issues/620):
  separate CLI processes can report "Another DevFlow session is driving this
  app" even when commands run sequentially and the previous process exited.
  Run multi-step actions and readbacks through one `devflow batch -ap <port>`
  process to keep the same mutation-lease identity. Plan the sequence first
  or keep batch stdin open; do not start a new process for every step.
  Do not repeatedly retry with more one-shot commands or tiny sleeps.
- [dotnet/maui-labs#621](https://github.com/dotnet/maui-labs/issues/621):
  the pinned CLI's Blazor snapshot, DOM selector, and click helpers can return
  `Error: Uncaught` because generated JavaScript references an undefined
  `webview` variable. Use `webview source` for HTML inspection and
  `webview Runtime evaluate` for DOM queries and the identified element's
  `.click()` instead of `webview Input dispatchClickEvent`. Keep evaluations
  in the same batch and read the displayed value after each click.
  Never assign component state or DOM text to simulate an interaction.
- Inspect output as well as process and batch exit codes: the WebView helper
  failures above can return exit code 0. An error or failed readback is not
  a pass. Use the known workarounds rather than repeatedly reproducing the
  failures during a demo; revalidate them after upgrading the CLI.
- The Blazor project's Windows Debug build has a temporary workaround for
  [dotnet/maui-labs#66](https://github.com/dotnet/maui-labs/issues/66).
  Its project target copies the restored bridge's `chobitsu.js` into the
  package's expected PRI path. Although the upstream issue is closed, do not
  remove the target until the pinned package is verified to include the fix.
  Do not duplicate this workaround in the XAML app.

## DevFlow Inspector

- The Inspector is the browser UI, not the CLI. It connects to the running
  app's DevFlow agent through the broker; CLI helper bugs do not by themselves
  establish an Inspector bug.
- When the user wants the Inspector, start the broker if needed and open
  `http://localhost:19223/inspector/` in a browser canvas (19223 is the default;
  use the port from `devflow broker status` if different). Select the intended
  app and platform, and reselect the fresh agent after an app restart.
- Use the Inspector's live tree, properties, and screenshots to inspect the
  app. Property edits affect only the running instance, not source files;
  restore temporary edits after the requested inspection.
- Avoid driving the same app simultaneously through the Inspector and CLI.
  Finish or disconnect the active driver before switching tools; do not
  treat a competing driver's mutation lease as an app failure.

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
