# Build your first canvas: a breath counter

A Copilot canvas is a panel beside chat. In this 5–10-minute walkthrough,
you'll start with a one-line cue card, make it count breaths when you
tell Copilot you took one, and ask Copilot to read the count back. The
prompts describe what you want, not how to build it.

The `/create-canvas` skill guides Copilot through the SDK documentation,
scaffolding an extension, reloading it, and checking that it works. You
don't have to write the extension boilerplate yourself.

Open this repository in a Copilot project session where the skill is
available. A fresh worktree avoids a cue card left over from a previous
run. Keep the card open while following the steps.

## 1. Create the card

Ask Copilot:

```text
/create-canvas

Could you make a little cue card canvas for this project? I'd like to
keep "Remember to breathe!" visible beside chat.
```

**What Copilot creates**

- `.github/extensions/<name>/extension.mjs`: the project extension.
- `joinSession(...)`: connects it to Copilot and registers the canvas.
- `createCanvas(...)`: `id` identifies the canvas type, `displayName`
  labels it, and `description` tells Copilot when to use it.
- A loopback HTML server and `open()`: provide the page URL for the
  panel. `instanceId` identifies one panel; optional `onClose()`
  releases its resources.

**What changes**

- "Remember to breathe!" appears beside chat. Nothing updates yet.

## 2. Update the card from chat

Ask Copilot to turn the cue card into a counter:

```text
Let's make this a breath counter. Start at zero, and every time I
tell you I've taken a breath, add one and show the total on the card.
```

**What Copilot adds**

- A shared count outside the browser page, starting at **0**.
- An `actions` entry whose `handler` increments the count. An optional
  `inputSchema` validates its arguments. Copilot calls the action
  from chat; it does not create a button on the card.

When it's ready, send this twice, as **two separate chat messages**:

```text
I took a breath.
```

**What changes**

- Two separate messages move the card's count from **0** to **2**.
- If the page does not refresh, reopen the same panel: it should
  still show **2**. In-memory state resets on extension restart.

## 3. Read the count from chat

Ask Copilot to make the count available in the other direction:

```text
Can you make it so when I ask how many breaths I've taken, you read
the card's total and tell me?
```

**What Copilot adds**

- A read action whose `handler` returns the same count. The card
  needs no new controls.

Then ask:

```text
How many breaths have I taken?
```

**What changes**

- The card still shows **2**; chat now answers **2** using the read
  action. Check its tool activity rather than trusting a count of
  earlier chat messages.

## Read more

- [Canvas extensions](https://docs.github.com/en/copilot/how-tos/github-copilot-app/working-with-canvas-extensions)
  covers `/create-canvas`, scope, and shared state.
- [About CLI extensions](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-cli-extensions)
  explains how extensions are discovered and run.
- [Create a CLI extension](https://docs.github.com/en/copilot/tutorials/create-an-extension)
  shows `joinSession` with tools rather than canvases.
- For the exact canvas and action API in your installed version, ask
  Copilot to run `extensions_manage({ operation: "guide" })`, then
  open the bundled `canvas.d.ts` and `docs/extensions.md` it reports.
