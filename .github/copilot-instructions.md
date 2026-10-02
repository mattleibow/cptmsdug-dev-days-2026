# Copilot instructions

## Workspace

- This is a .NET 11 MAUI demo workspace. `demos\MauiXamlDemo` and
  `demos\MauiBlazorDemo` are alternative starting points, not one application.
  Work only on the project the user chooses.
- Implement only the behavior requested by the user. Do not infer extra
  requirements from unrelated documentation.
- Keep the README for humans: project choices, demo links, and simple run
  instructions. Keep agent tooling and troubleshooting guidance here.
- Use Windows-style filesystem paths when running on Windows.

## Run and validate

- Use `dotnet run` to build, launch, and validate the chosen app. A build alone
  does not validate an interaction. Do not use `--no-build` after source changes.
- On Windows, restrict `TargetFrameworks` to the Windows target so other
  platform workloads are not required for this run:

  ```powershell
  dotnet run --project demos\MauiXamlDemo\MauiXamlDemo.csproj --framework net11.0-windows10.0.19041.0 --property:TargetFrameworks=net11.0-windows10.0.19041.0 --no-launch-profile
  ```

- Substitute the Blazor project path when that is the chosen app.
- Discover devices before Android deployment. Target the selected device and
  its architecture; avoid building unrelated architectures for an emulator.
- Verify the app is responsive and check the actual behavior requested by the
  user. For UI changes, inspect the live tree, properties, and screenshots.
- If asked to leave the app running, use a persistent terminal or detached
  process. When restarting, stop only the specific app process.

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
- The installed .NET 11 Android SDK may require a minimum API of 24. If the
  template's `SupportedOSPlatformVersion` is rejected, use the SDK diagnostic
  to update the selected project's Android minimum during implementation.
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
