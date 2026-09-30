# Canvas session demo plan

## Core demos

Use four short demonstrations. The cue-card build proves the smallest
human-agent loop; the finished Sketch to app extension makes that loop useful
on a real MAUI project.

| Demo | What it proves | Live target | Fallback |
|---|---|---|---|
| Credit Timeline | Hidden agent/session work is easier to understand visually than as prose | 3 minutes | Sanitized screenshot |
| Mobile Canvas | The agent and person can share one visible live device | 7 minutes | Prepared recording |
| First Canvas | A small project extension can expose an agent-write and agent-read action | 7 minutes | Rehearsed clip, then move on |
| Sketch to app | A human sketch and agent actions can share a session-backed artifact for a MAUI project | 9 minutes | Completed project extension and a prepared still |

MAUI DevFlow Inspector is appendix-only. It is not a Mobile Canvas dependency.

## Shared preflight

- Open the GitHub Copilot App and this repository before attendees enter.
- Reload project extensions once.
- Close unrelated sessions, canvases, terminals, and notifications.
- Increase UI zoom until device text and code are readable from the rear.
- Use only demo repositories, disposable devices, and non-sensitive content.
- Store one sanitized still image and one short recording for every external
  dependency.
- Rehearse [`../../demos/first-canvas.md`](../../demos/first-canvas.md)
  in a fresh disposable worktree; it creates an extension as part of the demo.
- Keep the completed
  [`Sketch to app`](../../.github/extensions/sketch-to-app/README.md)
  project extension openable without rebuilding its UI.

## Demo 1: Credit Timeline

Source: <https://github.com/shyamagu-ms/copilot-credit-timeline>

### Prompt

```text
Open the Credit Timeline canvas for this repository's sessions.
```

Then ask one of:

```text
Which sessions overlapped, and where did the most work happen in parallel?
```

```text
Which sessions ran longest or appear to need attention?
```

### Proof

The audience sees concurrent sessions and sub-agent activity in the same
sanitized timeline the agent queries.

### Recovery

If the local history is not visually useful, show a prepared, sanitized
screenshot and move on. Do not expose private session history.

## Demo 2: Mobile Canvas

Source: <https://github.com/Redth/mobile-canvas-ghcp>

### Install before the event

```text
/plugin marketplace add Redth/mobile-canvas-ghcp
/plugin install mobile-canvas@mobile-canvas-ghcp
```

Reload the App, open **Mobile Device**, and verify a device before rehearsal.

### Device preparation

- On macOS/iOS, install Xcode and an iOS Simulator runtime.
- For Android, install the SDK, emulator, and `adb`.
- Boot one disposable device before the session.
- Run the checked-in
  [`MauiBlazorDemo`](../../demos/MauiBlazorDemo/) with its Home and Counter
  pages, or a previously rehearsed safe app with an equally clear path.
- Do not use production accounts, personal messages, or real credentials.

### Prompt

```text
In the MauiBlazorDemo app currently visible, open Counter and tap Click me
once. Do not change files or settings.
```

Confirm the count changed, then take over manually and navigate to Home.
Ask:

```text
Capture the device now and tell me which screen is visible.
```

### Proof

The audience sees agent input on the device, then the presenter takes over the
same device manually.

### Recovery

Record a 30-60 second clip before the event and use it if the device cannot
boot or stream. Do not debug an emulator on stage for more than 60 seconds.

## Demo 3: first Canvas

Walkthrough:
[`../../demos/first-canvas.md`](../../demos/first-canvas.md)

Prepare a fresh project session and rehearse the three prompts in the
walkthrough. The extension is generated in that session; it is not a second
prebuilt project extension on `main`.

1. Use `/create-canvas` to make a cue card displaying "Remember to breathe!"
   beside chat.
2. Ask Copilot to add an action that increments a visible breath count when
   told "I took a breath." Send that message twice in separate turns and
   verify the card shows **2**.
3. Ask Copilot to add a read action and ask "How many breaths have I taken?"
   Verify that the response comes from the action, not a guess from the
   transcript.
4. Show the generated `createCanvas` registration and where the human page
   and agent actions meet.

The teaching counter can live in memory and reset after an extension restart.
Do not present it as a durable project artifact. If scaffolding takes too
long, use the rehearsed clip and continue to the finished extension.

## Demo 4: Sketch to app

Prepared extension:
[`../../.github/extensions/sketch-to-app/`](../../.github/extensions/sketch-to-app/)

Demo app starting points:
[`MauiXamlDemo`](../../demos/MauiXamlDemo/) and
[`MauiBlazorDemo`](../../demos/MauiBlazorDemo/).
Choose one before presenting; the build itself is optional, not part of the
nine-minute shared-state proof.

1. Open **Sketch to app** and draw a simple MAUI sign-in screen with placeholder
   fields. Add a short note in the panel and wait for **Auto-saved**.
2. Ask:

   ```text
   Get the latest sketch snapshot and inspect its image and notes. Describe
   the screen I drew; do not change the app.
   ```

3. Ask:

   ```text
   Add a note to the sketch: Error messages must be accessible. Do not
   change the pixels or build the app.
   ```

4. Point to the update in the same open panel. If time allows, ask Copilot to
   export that board to an unused repo-relative path such as
   `designs/demo-sign-in` and show the resulting PNG and Markdown pair.

The board, PNG snapshots, and notes persist in the current session's
`files/sketch-to-app/` artifacts; a new session starts blank. An explicit
export creates repository files for later app-building. `get_snapshot`
returns an immutable image path, notes, and version; `add_note` changes
the shared notes. See the extension README for version checks, import limits,
loopback serving, and cleanup.

If the app is not available, use a prepared still of the board and show the
committed extension source. Do not try to build the Blazor UI or a MAUI app
from scratch on stage.

## Optional appendix: MAUI DevFlow Inspector

Source:
<https://github.com/dotnet/maui-labs/tree/main/.github/extensions/maui-devflow-canvas>

Run only when:

- the core session is ahead;
- a DevFlow-enabled MAUI app is already running;
- the broker and client package are built;
- every action has been rehearsed.

Limit the demonstration to safe inspection and reversible changes: select an
element, inspect a property, make one reversible edit, attach selected-element
context, or record a workflow.

## Failure ladder

| Failure | Immediate response |
|---|---|
| Credit Timeline has weak data | Use its sanitized screenshot |
| Mobile device is unavailable | Play the backup clip |
| Mobile stream fails | Use screenshot polling, then the clip |
| Cue-card scaffold takes too long | Use its rehearsed clip; continue to Sketch to app |
| Sketch to app is not listed | Reload once, then show its prepared still and committed source |
| MAUI DevFlow fails | Skip it |
