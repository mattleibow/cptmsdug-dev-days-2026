---
name: maui-devflow-debug
description: >-
  Run DevFlow inspect-and-fix loops for MAUI apps. USE FOR: launch, device selection, agent recovery, broker/port/adb, tree/screenshot, Blazor CDP, iterative UI debugging. DO NOT USE FOR: first-time setup or non-MAUI automation. INVOKES: `maui devflow`, `dotnet`, `adb`, `simctl`.
---

# DevFlow Debug

Use this skill for the active debugging loop after a MAUI app has DevFlow
packages and `builder.AddMauiDevFlowAgent()` registered.

## Repository demo workflow: read first

These instructions override generic examples below for this repository's
pinned CLI. They are tested workarounds, not fixes to DevFlow itself.

- Use the repository-local `dotnet tool run maui --`, not a global `maui`.
  Follow `.github/copilot-instructions.md` for `dotnet run`, target selection,
  and the CounterCore restore workaround. Keep the launch process alive.
- Discover the fresh agent with `devflow wait` and `devflow list`, then confirm
  its app, platform, and process with `devflow agent status -ap <port>`.
  Never assume a previous port still belongs to the same app. If a
  project-filtered wait times out but list shows the app, check its status
  directly instead of rebuilding or restarting the broker.
- Plan the interaction sequence before starting it. Use **one**
  `devflow batch -ap <port>` process for all actions and readbacks. Separate
  sequential CLI processes can conflict over a retained mutation lease
  ([dotnet/maui-labs#621](https://github.com/dotnet/maui-labs/issues/621)).
  Read `references/batch.md` before issuing actions, including native taps.
- For Blazor, verify `webview status`, then use `webview Runtime evaluate`
  for DOM inspection and the identified element's `.click()`. Do not use
  `webview snapshot`, `webview DOM querySelector`/`querySelectorAll`, or
  `webview Input dispatchClickEvent` with the affected pinned CLI. Their
  generated scripts reference an undefined `webview` variable
  ([dotnet/maui-labs#620](https://github.com/dotnet/maui-labs/issues/620)).
  Do not repeatedly reproduce a known tooling failure during the demo.
- Read the actual displayed value after **every** action. Never assign
  component state or DOM text to simulate a click. Inspect each batch
  response's output as well as its exit code; `Error: Uncaught` can be
  reported with exit code 0. A failed readback is a failure, not a pass.
- Give each app one runtime driver at a time. Do not open an Inspector or
  start another CLI action session against an app already being driven.
  For delegated app work, report the commit, evidence, and any blocker in
  one completion handoff; an idle notification alone is not completion.
- Do not overwrite these repository adaptations with `devflow init`,
  `skills update`, or `--force` during a demo. After a CLI upgrade, compare
  bundled guidance and retest before removing the workarounds.

## When to Use

- Build and run a MAUI app on Android, iOS, Mac Catalyst, macOS, Windows, or GTK.
- Choose or create a simulator/emulator for a project.
- Wait for a DevFlow agent, inspect the visual tree, tap/fill UI, or capture screenshots.
- Recover from DevFlow connection failures after the app is integrated, including broker, port, and Android adb forwarding issues.
- Debug Blazor Hybrid content through DevFlow WebView/CDP commands.
- Read app logs, network captures, preferences, device info, or recordings through DevFlow.
- Iterate on an app bug with a build -> deploy -> inspect -> fix loop.

## Route Elsewhere

- If DevFlow packages or `MauiProgram.cs` registration are missing, use `maui-devflow-onboard`.
- If the failure is a generic build or SDK issue with no DevFlow angle, use normal .NET/MAUI diagnostics.

## Optional Session Feedback Nudge

If you have retried the same MAUI DevFlow workflow several times, tried multiple
workarounds, or are ending a long DevFlow-assisted debugging session, ask
whether the user wants to run `maui-devflow-session-review` to summarize friction
for MAUI DevFlow product feedback. Do not run it automatically.

## Core Loop

1. Confirm the app is already integrated:

   ```bash
   grep -rl "Microsoft.Maui.DevFlow" --include="*.csproj" .
   ```

   If no project has DevFlow package references, stop and switch to `maui-devflow-onboard`.

2. Pick the target framework and launch target. Do not assume `net10.0`; inspect the project first.

   ```bash
   grep -i "TargetFramework" *.csproj Directory.Build.props 2>/dev/null
   ```

3. Start or select the device/emulator. For Android and iOS, avoid reusing a simulator/emulator that is already running another app under investigation.

4. Launch the app and keep the launch process alive when required.

   - iOS, Android, and Mac Catalyst `dotnet build -t:Run` usually block for the app lifetime.
   - GTK `dotnet run` blocks for the app lifetime.
   - macOS AppKit builds can exit after compiling; launch the `.app` separately.

5. Wait for the DevFlow agent before inspecting UI:

   ```bash
   maui devflow wait
   maui devflow agent status
   maui devflow ui tree --depth 3 --fields "id,type,text,automationId"
   ```

   Treat `agent status` as the runtime truth for reachability and app identity.
   `diagnose` is broader environment state; it can report broker/project details
   without proving the current app is reachable.
   Pass the current discovered port explicitly to inspection commands.

   If `wait`, `list`, or `ui tree` cannot connect after the app is running, load `references/connectivity.md` and recover the broker/agent connection before continuing.

6. Prefer AutomationId-first validation for native UI flows. Query controls
   before acting, then execute taps and assertions in the same batch:

   ```bash
   dotnet tool run maui -- devflow ui query --automationId save-button -ap <port>
   ```

   If important controls do not have stable `AutomationId`s, add them before
   relying on text, coordinates, screenshots, or brittle tree positions.
   For Blazor, use the DOM workflow in `references/batch.md`, not native taps
   on the BlazorWebView container.

7. Inspect, interact, capture evidence, then edit the app and repeat from launch.

## Critical Anti-patterns

- Do not treat an empty `maui devflow list` as proof the project is not integrated. `list` is runtime state; project files are source of truth.
- Do not use arbitrary sleeps after launch. Use `maui devflow wait` to gate on the actual agent connection.
- Do not kill an async `dotnet build -t:Run` or `dotnet run` shell while you still need the app; that often kills the app.
- Do not reuse a busy simulator/emulator when multiple MAUI apps or agents may be running.
- Do not debug Blazor WebView DOM issues through the native visual tree alone; use the WebView/CDP commands.
- Do not drive key app flows by coordinates when AutomationIds are available or can be added.
- Do not retry lease conflicts by starting more one-shot action processes.
  Stop the previous driver, preserve one batch process for the workflow, and
  never take over another live client's lease.

## Stop Signals

- Stop and switch to `maui-devflow-onboard` when package references or `AddMauiDevFlowAgent()` are absent.
- Stop and ask which project, device, or agent to target when multiple candidates match.
- Stop rebuilding after two identical failures until you inspect the first meaningful build/runtime error.
- Stop using screenshots for exact property values; query the visual tree or properties instead.

## Reference Map

Load these only when needed:

- `references/setup.md` - detailed integration, package, entitlement, and update notes.
- `references/connectivity.md` - broker, agent, port, Android forwarding, and "no agents connected" recovery.
- `references/android.md` - Android SDK, emulator, adb, build, deploy, and port forwarding details.
- `references/ios-and-mac.md` - iOS simulator, Mac Catalyst, permissions, entitlements, and Apple tooling.
- `references/macos.md` - macOS AppKit project shape, launch model, and troubleshooting.
- `references/linux.md` - GTK/Linux launch, packages, and WebKitGTK notes.
- `references/batch.md` - batching multiple DevFlow UI/WebView operations.
- `references/troubleshooting.md` - build, connection, CDP, and platform-specific failure recovery.
