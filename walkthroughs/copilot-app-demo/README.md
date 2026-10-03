# Copilot App: two paths to a merged PR

Follow two tracks in the same repository. [Issue #8][issue] becomes a
bi-directional stepper through coordinated sessions. The existing [PR #13][pr]
goes through review, conflict resolution, CI repair, and merge. Start the
issue track, switch to the PR while its agents work, then return to the issue.

Open this repository in the GitHub Copilot app. Use the app's **My work**
view to find the issue and PR. Outcomes depend on the live state: read
the current checks and merge status rather than assuming that a previous
result still applies.

## 1. Schedule a short repo pulse

Open **Automations** and create a repository workflow. Choose a weekday
morning schedule, or enter `0 9 * * 1-5` if the editor accepts custom cron.
Use this prompt:

```text
Review open issues and PRs in this repo. Summarize new activity, review
requests, failing or pending checks, merge conflicts, and items that
need attention. Include links and short next actions. Don't change
anything.
```

Select **Create and run**, or create it and choose **Run now**. Open the
resulting session.

**Expected:** The report links to relevant open work, including issue #8
and PR #13 if they are still open, and describes their *current* state.
Each workflow run has its own session; setting a schedule does not mean
a future run has already happened. The workflow reports on the repo,
but does not watch an issue or repair a PR for you.

## Track A: issue to merged feature PRs

### 2. Start work from the issue

In **My work**, open [issue #8: Make the counter a bi-directional
stepper][issue] and select **New session**. Use a worktree for the issue's
coordinator session. Send:

```text
Do this in both apps. One child session each.
```

**Expected:** The coordinator reads the issue and starts two child project
sessions, one for the XAML app and one for the Blazor app. Each child has its
own worktree. The issue initially allows negative values; neither child
should receive the later no-negative requirement yet.

### 3. Change the requirement while they work

When both children are implementing the stepper, return to the coordinator
session and send:

```text
Don't let it go negative.
```

**Expected:** The coordinator relays the new requirement to both children.
Check their responses. The issue is unchanged; the mid-flight requirement
comes directly from this message, not an issue comment.

While they work, switch to Track B. Return to step 5 after the PR is ready.

## Track B: existing PR to merged PR

### 4. Review and enable Agent Merge

Open [PR #13: Configure shared counter increment from packaged JSON][pr]
from **My work**. Inspect its **Changes** diff and current merge/check
status, then enable **Agent Merge** in the app.

**Expected:** At the time this guide was written, PR #13 was conflicting,
so GitHub reported no checks for its current head. Agent Merge can resolve
the conflict, then respond to actionable review feedback and failing
required checks. Watch the *new* check run after the conflict is resolved.
If Linux Android reports a missing `CounterSettings.json` resource, the
repair should correct the filename/path rather than skip CI. Do not assume
that a conflict hides a failing check, or claim a check failed before it ran.

The agent's finish line is merge-ready; the app lands the PR only when its
configured permissions and repository rules allow it. Confirm the actual
merged state before treating its changes as part of `main`.

## Return to Track A

### 5. Bring the children up to date

Once PR #13 has landed, return to the issue coordinator. If the children
started before it merged, send:

```text
Catch both children up with main. Keep their stepper changes.
```

**Expected:** Both child branches incorporate the current shared counter
code. Any overlap in that shared project is reconciled without losing
either app's stepper or the new no-negative behavior. If PR #13 has not
landed yet, keep the child work in progress and revisit this step later.

### 6. Run and inspect both apps

Ask the coordinator:

```text
Run both apps on Windows and check the stepper in each.
```

**Expected:** Each child runs its own app with a fresh `dotnet run`. Use
MAUI DevFlow's native UI tree for XAML and its Blazor WebView inspection for
the Counter page. In **each** app, plus twice shows **2**, minus twice
returns to **0**, and another minus leaves the value at **0**. Read the
displayed value after real taps; a successful build alone is not this
check. The count only needs to live while the screen is open. There is no
reset or saved-count requirement.

### 7. Open, review, and land the feature PRs

In the coordinator session, send:

```text
Open a PR for each.
```

**Expected:** The two children open separate PRs for their app changes.
Inspect each diff in the app and confirm both account for the mid-flight
request. Review the current checks and enable Agent Merge on each PR if
you want it to handle review comments, CI failures, or integration
conflicts. One PR landing can make the other's shared-code changes need
reconciliation; that is a possibility, not a guaranteed conflict.

When the required checks, reviews, and mergeability are satisfied, confirm
both PRs have actually landed. The issue is complete only when the final
integrated code still gives both apps a working, non-negative stepper.

[issue]: https://github.com/mattleibow/cptmsdug-dev-days-2026/issues/8
[pr]: https://github.com/mattleibow/cptmsdug-dev-days-2026/pull/13
