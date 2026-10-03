# GitHub Copilot App and Canvas session content

## Public schedule title

> GitHub Copilot App - the agent driven development environment

## Deck title

> From chat to shared work  
> GitHub Copilot App and Canvas extensions

## Session abstract

Chat is good at working out what you want. It is a poor place to watch work
happen. Once an agent is triaging issues, driving a mobile app, or coordinating
several tasks, the transcript becomes a wall of text you must reread before you
can trust it.

This session starts inside the GitHub Copilot App workbench, then moves active
work into Canvas extensions: live side-panel surfaces where people use direct
controls and agents use callable actions through one deliberate interaction
contract. We will inspect existing canvases, share control of a mobile device,
break down a project-scoped extension, and complete the smallest useful
human-agent shared-state loop.

## Purpose

Start with a concise recap of the keynote, explain the Copilot App operating
model in more detail than a 30-minute event welcome allows, then focus on
Canvas extensions as a practical answer to non-text feedback, visible agent
work, and shared human-agent control.

This is a technical, demo-led session. It should use several small,
understandable demonstrations rather than one long "magic" scenario.

## Audience promise

By the end of 45 minutes, attendees should be able to:

1. Explain how App sessions, workspace choices, My Work, customization, and
   automations fit together.
2. Recognize when chat is good for intent but poor for monitoring or steering
   active work.
3. Describe a Canvas as a bidirectional surface, not a prettier text response.
4. Identify the human UI path, agent action path, authoritative source of
   truth, extension coordination state, and persistence choice.
5. Navigate and safely build a minimal project-scoped Canvas extension.
6. Distinguish Mobile Canvas from the optional MAUI DevFlow Inspector.

## Main slide content

### 1. From chat to shared work

**On slide**

> From chat to shared work  
> GitHub Copilot App and Canvas extensions

**Audience takeaway**

The session is about turning agent work into something people can inspect,
steer, and verify directly.

---

### 2. Keynote recap: one intent, several surfaces

**On slide**

> Work with it  
> Delegate to it  
> Build on it

**Audience takeaway**

The keynote covered the ecosystem. This session goes inside the App workbench
and the shared-surface model.

---

### 3. The App is a workbench, not another chat tab

**On slide**

> Sessions - start from an issue, prompt, or pull request  
> My Work - triage issues and pull requests across repositories  
> Review and merge - inspect diffs, checks, fixes, and handoff  
> Automations - turn skills and prompts into repeatable work  
> Canvases - open a shared live artifact

**Speaker detail**

- existing local repository, isolated worktree, or cloud environment;
- Interactive, Plan, and Autopilot modes;
- several sessions running against explicit repositories and tasks.

**Audience takeaway**

The App brings parallel sessions, cross-repository attention, review, recurring
work, and live artifacts into one workbench. For every session, the workspace
and autonomy decision changes what the agent may do and where the result
appears.

---

### 4. The App detail that matters for Canvas

**On slide**

> Sessions choose the environment  
> Customize manages installed extensions  
> Project scope discovers reviewed repository code

**Audience takeaway**

Canvas development depends on three App details: which workspace the session
can change, how installed extensions are managed, and whether project-scoped
extension code discovered from the repository has been reviewed and trusted.

---

### 5. The transcript stops being the workspace

**On slide**

> Chat is great for intent.  
> It is poor at showing what is true now.

Then reveal:

> What changed?  
> What needs attention?  
> What can I control?

**Audience takeaway**

Long-running or highly visual work forces people to reread a transcript before
they can trust the current state. A better surface should answer those three
questions immediately.

---

### 6. The Canvas model

**On slide**

```text
Person -> canvas controls ----\
                               > interaction contract -> source of truth
Agent  -> named actions -------/                         -> visible renderer
```

> One artifact  
> Two interaction paths  
> One deliberate source of truth

**Audience takeaway**

A Canvas is a live side-panel surface. People act through UI controls; agents
act through callable actions with schemas. The extension owns the interaction
contract and any coordination state. The authoritative truth may be owned by
the extension, read from history or repository data, or live in an external
system such as a device. Persistence is an explicit design decision.

**Key line**

> The interface is a collaboration contract, not decoration.

---

### 7. Demo 1: make hidden work visible

**On slide**

> Credit Timeline  
> Session history becomes an inspectable timeline

**Audience takeaway**

The best response is not another paragraph. A visual timeline exposes patterns
and lets the agent answer questions about overlap, duration, and attention from
the same sanitized data.

---

### 8. Demo 2: share a live environment

**On slide**

> Mobile Canvas  
> Agent hands and agent eyes on the device you are watching

**Audience takeaway**

The agent and the presenter are operating the same visible device. The Canvas
provides non-text feedback and direct takeover without translating every step
back into prose.

### 9. Same pattern, different source of truth

**On slide**

| Canvas | Source of truth | Human path | Agent path |
|---|---|---|---|
| Credit Timeline | Local session store | Filter and focus | Query and refresh |
| Mobile Canvas | Selected live device | Direct input | Device actions |
| First Canvas | Extension's small in-memory count | View the cue card | Increment and read |
| Sketch to app | Session-backed board, PNG, and notes | Draw and edit | Snapshot, notes, export |

**Audience takeaway**

The renderer/action pattern is consistent, but the authoritative state can be
history, a live external system, ephemeral extension memory, or a persisted
session artifact.

---

### 10. Project-scoped extension anatomy

**On slide**

```text
your-repository/
└── .github/
    └── extensions/
        └── sketch-to-app/
            ├── extension.mjs
            ├── document-store.mjs
            ├── canvas-server.mjs
            └── ui/
```

Then reveal:

> Declaration  
> State  
> Actions  
> Renderer  
> Lifecycle

**Audience takeaway**

Project scope makes an extension reproducible for the repository. The runtime
discovers the extension, registers its Canvas declaration, opens an instance,
and calls its small agent-facing action contract.

The finished example keeps its renderer and storage in separate files; a
small scaffold can use only `extension.mjs`. Do not teach one folder shape as
a universal manifest requirement.

`canvasId` identifies the Canvas type. `instanceId` identifies one open panel
and its transient server/cleanup, **not** the identity of a durable artifact.
Sketch to app persists its board under the session's artifact directory so
reopening or replacing the panel does not lose the sketch.

---

### 11. Trust it like repository automation

**On slide**

> Local code  
> Loopback only  
> Bounded inputs  
> Explicit tools  
> Cleanup

**Audience takeaway**

Project extensions execute local code and must be reviewed before trust. A
production-shaped Canvas:

- binds local renderers to `127.0.0.1`;
- uses an ephemeral port;
- validates every action payload;
- sets an appropriate Content Security Policy;
- avoids logging prompts, credentials, and sensitive results;
- cleans up servers and per-instance state;
- separates reversible UI changes from destructive actions.

---

### 12. Demo 3: create the smallest project Canvas

**On slide**

> Cue card -> count breaths -> read the count  
> One visible state, two agent actions

**Audience takeaway**

Follow [`demos/first-canvas.md`](../../demos/first-canvas.md): start from
`/create-canvas`, show "Remember to breathe!" beside chat, then ask Copilot
to increment a visible count and read it back through an action. Inspect the
generated project-scoped extension instead of presenting it as magic.

---

### 13. The agent sees the same counter

**On slide**

> "I took a breath." -> 1  
> "I took a breath." -> 2  
> "How many breaths?" -> read action returns 2

**Audience takeaway**

Two separate chat messages must visibly update the card twice. The final
answer must come from the generated read action, not a guess based on chat
history. Show the actual action handlers in the generated source.

---

### 14. What did the scaffold create?

**On slide**

> `joinSession` -> `createCanvas` -> `open` -> local renderer  
> `actions` -> the count the card displays

**Audience takeaway**

The cue card is a small teaching example. Its count may be in memory and
reset after an extension restart. The renderer must read the same count that
the agent changes; an iframe-local counter the agent cannot read would not
prove the shared-state model.

---

### 15. Demo 4: Sketch to app

**On slide**

> Human sketches a MAUI screen and writes a note  
> Agent reads the saved image and notes  
> Agent adds a note  
> Human verifies the update

**Audience takeaway**

The committed [`Sketch to app`](../../.github/extensions/sketch-to-app/README.md)
extension makes the interaction useful for an actual MAUI project. It
auto-saves a board and notes in the session's artifacts; `get_snapshot`
returns an immutable image path, notes, and version. `add_note` updates the
same notes the presenter sees. An explicit export can produce a PNG and
Markdown pair in the repository for `MauiXamlDemo` or `MauiBlazorDemo`.

---

### 16. Teaching state versus lasting work

**On slide**

> The cue card can reset.  
> The sketch survives panel reloads.  
> Export when the project should keep it.

The guided counter explains registration, agent actions, and visible state
without pretending to be a production persistence system.

The finished Sketch to app extension adds:

- session-backed board and PNG snapshots independent of the open panel;
- version checks so stale edits cannot silently overwrite the latest sketch;
- input limits and validation for sketches and imported images;
- loopback serving, UI updates, and per-panel server cleanup;
- explicit repository export when a sketch should become a project artifact.

**Audience takeaway**

The production-shaped implementation is longer because sharing a real
artifact introduces validation, persistence, lifecycle, and recovery work.

---

### 17. When should you build a Canvas?

**On slide**

> The work has an artifact worth seeing  
> A person must steer or verify it directly  
> The agent can use a small, safe action contract

**Audience takeaway**

Good candidates include triage boards, release checklists, architecture maps,
test/device labs, migration plans, document editors, and live observability
views. A Canvas is not required when a short answer or ordinary form is enough.

---

### 18. Start with one shared truth

**On slide**

> Make the state visible  
> Give people controls  
> Give the agent a small contract  
> Verify the result together

**Closing line**

> Chat is where we express intent. A Canvas is where the person and the agent
> share the work.

## Appendix content

### MAUI DevFlow Inspector

MAUI DevFlow Inspector is an optional deeper app-inspection Canvas for a
DevFlow-enabled running MAUI app. It is separate from Mobile Canvas.

### Canvas ideas

- Issue-triage board with severity and owner filters
- Release-readiness checklist backed by repository state
- Multi-device MAUI validation matrix
- Architecture map that both developers and agents evolve
- Test-run explorer with failures grouped by likely cause
- Dependency upgrade planner with risk and rollout controls
- Documentation editor with agent suggestions and human acceptance

### Detailed App topics

- Local repository versus worktree versus cloud environment
- Interactive, Plan, and Autopilot behavior
- My Work sections and attention management
- Automation trigger and tool-grant choices
- Customization support differences across Copilot surfaces
- GitHub Mobile and Copilot CLI remote control

### Appendix slide: My Work

**On slide**

> Issues and pull requests  
> Checks and reviews  
> Diffs and the next action

**Audience takeaway**

My Work is an attention surface. It centralizes work that needs judgment but
does not replace review, CI, or repository policy.

### Appendix slide: Automations

**On slide**

> Explicit prompt  
> Explicit trigger  
> Explicit tools  
> Explicit environment

**Audience takeaway**

Automations can run on demand, on a schedule, or from supported issue and
pull-request events. Treat the tool grant and execution environment as part of
the automation's design.

### Appendix slide: Mobile continuity

**On slide**

> GitHub Mobile tracks cloud work  
> Remote control steers a running CLI session

**Audience takeaway**

Remote control does not move local execution to the phone. The original
machine stays online and continues to run commands and file operations.

### Appendix slide: Customization map

**On slide**

> Context: instructions and custom agents  
> Expertise: skills  
> Tools: MCP servers and hooks  
> Packaging: plugins  
> Experience: Canvas extensions

**Audience takeaway**

These mechanisms are related but not interchangeable, and support differs by
Copilot surface.
