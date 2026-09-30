---
name: Dev Days GitHub Copilot talk system
description: A shared visual system for the event keynote and the GitHub Copilot App Canvas session.
colors:
  white: "#FFFFFF"
  gray-1: "#F2F5F3"
  gray-2: "#E4EBE6"
  gray-3: "#B6BFB8"
  gray-4: "#909692"
  gray-5: "#232925"
  gray-6: "#101411"
  black: "#000000"
  green-1: "#BFFFD1"
  green-2: "#8CF2A9"
  green-3: "#5FED83"
  green-4-emphasis: "#0FBF3E"
  green-5: "#0E6836"
  green-6: "#0A241B"
typography:
  display:
    fontFamily: "Aptos Display"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-1.33px"
  body:
    fontFamily: "Aptos"
    fontWeight: 400
    lineHeight: 1.3
  code:
    fontFamily: "Aptos Mono"
    fontWeight: 400
spacing:
  edge: "0.75in"
  section: "0.5in"
components:
  signal-panel:
    backgroundColor: "{colors.gray-6}"
    textColor: "{colors.gray-2}"
  bright-panel:
    backgroundColor: "{colors.green-5}"
    textColor: "{colors.gray-2}"
---

# Design System: Dev Days GitHub Copilot talks

## Overview

**Creative North Star: "Dev Days signal stage."**

The two decks carry the supplied Dev Days green-black field, mineral whites,
3D product art, and conference-graphic language rather than introducing a
competing brand. The keynote uses the system as a welcoming main-stage event
experience. The technical session uses it to make the human-agent feedback
loop, shared artifact, and extension architecture visible.

Deck-specific construction decisions live in:

- `docs/keynote/build-brief.md`
- `docs/canvas-session/build-brief.md`

**Key Characteristics:**

- oversized directional statements;
- inky green-black fields interrupted by tonal greens, with Green 4 used only
  for emphasis;
- rectangular panels, arrows, rails, and device silhouettes as functional
  diagram geometry;
- sparse copy that supports, rather than duplicates, a live demo.

## Colors

The palette follows the supplied Dev Days green scale: the inky field carries
focus while tonal greens mark movement and activity. Green 4 is the vivid
emphasis color—the equivalent of a "Today" highlight—not a general-purpose
lime.

### Primary

- **Green 5** (`#0E6836`): grounds the stage and carries structural rails.
- **Green 2** (`#8CF2A9`): names active system paths and Canvas moments.
- **Green 4** (`#0FBF3E`): reserves emphasis for a verified result or a
  high-confidence action.

### Neutral

- **Gray 5** (`#232925`): the main dark stage background.
- **Gray 6** (`#101411`): the secondary dark panel.
- **Gray 2** (`#E4EBE6`): the high-contrast light field and dark-surface
  display text.
- **Green 1** (`#BFFFD1`): restrained supporting text on dark fields.
- **Green 3** (`#5FED83`): secondary activity and progression marks.

**The Today Rule.** Green 4 (`#0FBF3E`) is the one vivid emphasis mark on a
slide. Other greens carry structural or status meaning, not decorative noise.

## Typography

**Display Font:** Aptos Display  
**Body Font:** Aptos  
**Label/Mono Font:** Aptos Mono, only for code, paths, and measured identifiers.

**Character:** Display typography is big, compressed, and declarative. Body
copy is short and calm, leaving the audience to watch the live work.

### Hierarchy

- **Display** (700, 38–56pt, tight tracking): slide theses and pivotal moments.
- **Title** (700, 24–33pt): labels inside diagrams and panels.
- **Body** (400–700, 16–23pt): supporting explanation and demo cues.
- **Code** (400, 17–18pt): short snippets only.
- **Label** (700, 13–15pt, expanded tracking): live-demo identifiers.

**The One Idea Rule.** A slide’s largest type expresses one memorable claim;
the live demonstration supplies the detail.

## Layout

Slides use a 16:9 field with a consistent 0.75-inch edge margin. Dense
dark-field slides alternate with high-key white slides to create clear act
breaks. Asymmetry is intentional: large statements occupy the left or upper
field while a device, timeline, action path, or extension anatomy anchors the
opposite side.

### Keynote opening lock

The keynote welcome slide uses
`docs/assets/event/branding/devdays2026hero.png` as a full-bleed background.
Preserve the mascot, the `@CPTMSDUG` shirt mark, and the GitHub cube. Use only
the image's existing dark negative space for the event title and details; do
not introduce a competing hero illustration or stretch the image to 16:9.

## Elevation & Depth

The deck is flat by default. Depth comes from hard tonal layers, color rails,
and arrows rather than shadows or translucent glass effects.

## Shapes

Use mostly square rectangles, long rails, and directional arrows. Device
silhouettes may use large rounded corners when the geometry represents a real
device. Small aluminum-like circles act as occasional structural bolt details.

## Components

### Signal Panels

- **Shape:** square-cornered rectangles.
- **Background:** Midnight or Surface, with Stock White content.
- **Accent:** a thin, full-width signal bar when the panel needs an active
  state.

### Action Arrows

- **Shape:** broad right arrows.
- **Color:** Green 2 for a system path, Green 4 for the verified transfer.
- **Use:** connect a real actor to a shared artifact; do not use as decoration.

### Code Blocks

- **Background:** Surface on a Midnight field.
- **Typography:** Aptos Mono; first meaningful line may use Acid Lime.
- **Content:** keep to one executable idea, not a full implementation.

## Do's and Don'ts

### Do:

- **Do** alternate dark and light stage fields to delineate narrative acts.
- **Do** use arrows and rails to explain flow at a distance.
- **Do** make demo transition slides sparse and unmistakable.
- **Do** reserve Green 4 for proof, the "Today" highlight, or one primary
  action—not general decoration.

### Don't:

- **Don't** recreate the live Canvas UI on slides; show the real canvas during
  the demo.
- **Don't** use card grids, gradient text, generic dashboard metrics, or
  non-Dev-Days accent colors.
- **Don't** reduce the architecture to a platform-provided universal state
  store; state is extension-owned and persistence is deliberate.
