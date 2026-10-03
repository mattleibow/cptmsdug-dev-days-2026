# GitHub Copilot App and Canvas session run of show

## Timing target

The session runs from **09:30 to 10:15** on 3 October 2026. Finish the planned
narrative by minute 43 and keep minutes 43-45 unscheduled so the 10:15 movement
break begins on time.

| Time | Slides | Segment | Main proof |
|---:|---:|---|---|
| 0:00-0:02 | 1-2 | Welcome and keynote recap | One intent moves through local, cloud, App, and extension surfaces. |
| 0:02-0:05 | 3-4 | App detail needed for Canvas | Workspace, autonomy, extension discovery, and local trust are deliberate choices. |
| 0:05-0:09 | 5-6 | Why Canvas and the model | Human controls and agent actions meet through an extension-managed interaction contract. |
| 0:09-0:12 | 7 | Credit Timeline | Hidden session work becomes a visible, queryable timeline. |
| 0:12-0:19 | 8 | Mobile Canvas | Agent interaction is visible and the person can take over immediately. |
| 0:19-0:23 | 9-11 | Patterns, anatomy, and trust | Different sources of truth; project code must be reviewed and bounded. |
| 0:23-0:30 | 12-14 | First Canvas walkthrough | Cue card -> visible counter -> agent reads the count through an action. |
| 0:30-0:39 | 15-16 | Sketch to app and hardening | Human sketch -> agent snapshot -> agent note -> visible verification. |
| 0:39-0:43 | 17-18 | Selection guide and close | Start with one artifact and a small safe contract. |
| 0:43-0:45 | - | Buffer or question | Do not schedule required content here. |

Do not cut the shared-state proof. If time is lost, shorten the App recap,
replace Credit Timeline with its sanitized screenshot, and skip optional
MAUI app-building material.

## Opening

> The keynote showed the Copilot ecosystem. This session goes inside one part
> of it: the desktop workbench, and specifically the surface that makes active
> work visible.

> Chat is good at working out what you want. It is a poor place to watch work
> happen.

## App recap

Keep the recap concrete:

- Sessions can start from an issue, prompt, or pull request and act in a chosen
  workspace;
- My Work, review, and automations expose attention, verification, and
  repeatable work outside an individual transcript;
- Customize manages installed extensions; project-scoped extensions are
  discovered from the repository;
- project scope means reviewed local code executes for this repository;
- a Canvas replaces transcript archaeology with a shared visible artifact.

Source videos, live App views, and direct demonstrations may all be used where
they make the session easier to follow. Keep each non-Canvas App capability
concise so the session reaches the Canvas problem and model by minute five.

## Canvas explanation

> A Canvas is not a prettier answer. It is a bidirectional extension surface.
> A person has direct controls. The agent has named actions with schemas. Both
> paths meet through an interaction contract the extension owns.

Make these boundaries explicit:

- the App does not supply a universal shared-state database;
- browser-local UI state is not automatically agent-visible;
- the authoritative truth may be extension-owned, repository/history-backed,
  or an external live system;
- persistence is optional and workflow-specific;
- each open instance needs a deliberate state/lifecycle strategy.

## Demo pacing

### Credit Timeline - three minutes

Spend the time on the visual result, not installation:

1. Change scope.
2. Point out concurrent sessions and sub-agents.
3. Ask which sessions overlap, ran longest, or need attention.

Use a sanitized deterministic dataset. If local data is weak or personal,
show the prepared screenshot instead.

### Mobile Canvas - seven minutes

1. Start with the device booted and the checked-in MauiBlazorDemo running.
2. Ask the agent to open Counter and tap Click me once.
3. Point out the visible agent input and changed count.
4. Take over manually and navigate to Home.
5. Ask the agent to capture and identify the current screen.

Say explicitly:

> Mobile Canvas does not require MAUI DevFlow. It controls local simulators
> and emulators. MAUI DevFlow is a separate optional inspector for an app that
> includes the DevFlow agent.

### First Canvas and Sketch to app - sixteen minutes

Follow [`../../demos/first-canvas.md`](../../demos/first-canvas.md) in a
fresh worktree: scaffold a project cue card, add a visible increment action,
send two "I took a breath" messages, then add a read action and verify the
reported count is **2**. Use a rehearsed clip if live scaffolding runs long.
This small counter is intentionally ephemeral.

Then open the completed
[`Sketch to app`](../../.github/extensions/sketch-to-app/README.md) extension:

- draw a simple MAUI sign-in screen and add a note in the human UI;
- ask the agent to get and inspect the saved PNG and notes;
- ask the agent to append an accessibility note and verify the live update;
- explain versioned session artifacts versus per-panel loopback servers;
- if time allows, export the PNG and Markdown as repo artifacts for the
  chosen MAUI project. Building the screen in the app is follow-up material.

## Recovery order

1. Skip optional explanatory animation.
2. Replace Credit Timeline with its sanitized screenshot.
3. Shorten the App recap.
4. Use the Mobile Canvas backup clip.
5. Skip the cue-card build clip and open the completed Sketch to app extension.
6. Never troubleshoot an emulator, package manager, or extension process for
   more than 60 seconds on stage.

## Closing

> Start with one artifact your team already struggles to understand in chat.
> Make its state visible. Give people direct controls. Give the agent a small,
> safe contract. Then verify the result together.
