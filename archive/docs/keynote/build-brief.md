# Event keynote deck build brief

This document tells the deck builder how to construct the keynote. Audience
copy belongs in [`content.md`](content.md); timing and narration belong in
[`run-of-show.md`](run-of-show.md).

## Source of visual truth

Build from
[`../source-material/copilot-app-english.pptx`](../source-material/copilot-app-english.pptx),
the unchanged official 2026 English Dev Days deck.

Preserve its:

- 16:9 dimensions: 12,188,825 by 6,858,000 EMU;
- Dev Days theme and official palette;
- 3D Copilot artwork and ecosystem imagery;
- existing transitions and animation timing trees;
- embedded Sessions, My Work, Canvases, Review and Merge, and Automations
  videos.

Do not rebuild the official source as flat screenshots. Duplicate and
retarget source slides when their animation/effect structure is useful.

The opening slide is the deliberate exception: its fixed background is
[`../assets/event/branding/devdays2026hero.png`](../assets/event/branding/devdays2026hero.png),
not the generic source-deck opening artwork.

## Visual direction

The keynote should feel like the opening of a large community event:

- event-scale editorial type;
- fast alternation between white and green-black stages;
- supplied 3D product artwork rather than generic AI imagery;
- a few strong animated reveals rather than movement on every object;
- full-bleed product footage with short, deliberate narration;
- local community warmth in the welcome, sponsor, agenda, and closing slides.

Use the supplied palette:

| Role | Color |
|---|---|
| Main dark field | `#101411` |
| Secondary dark | `#232925` |
| Mineral white | `#E4EBE6` |
| Supporting green | `#8CF2A9` |
| Structural green | `#0E6836` |
| Single emphasis green | `#0FBF3E` |

Use `#0FBF3E` once per slide at most, as the equivalent of the source deck's
"Today" highlight.

## Final slide construction plan

| Final slide | Build approach | Source material |
|---:|---|---|
| 1 | Use the confirmed event hero as a full-bleed background and overlay the final event identity in its dark negative space | `docs/assets/event/branding/devdays2026hero.png` |
| 2 | New sponsor/community thank-you slide using the downloaded organizer, Microsoft, and BBD assets | `docs/assets/event/` |
| 3 | New confirmed morning-agenda slide with full session titles and speaker names | Event-site schedule and speaker assets |
| 4 | New confirmed afternoon-agenda slide with full session titles and speaker names, plus event-page QR | Event-site schedule and speaker assets |
| 5 | Retarget the animated evolution slide; remove dated roadmap implications | Source slide 2 |
| 6 | Keep the animated Plan/Build/Review/Ship sequence | Source slide 3 |
| 7 | Keep the ecosystem montage | Source slide 4 |
| 8 | Retarget the large statement and surface overview | Source slides 5-6 |
| 9 | New or source-matched IDE scene | Official current IDE capture |
| 10 | New terminal scene; do not reuse the outdated 2025 CLI screenshot | Current CLI capture or authored terminal composition |
| 11 | New cloud-agent scene or current GitHub capture | Current prepared demo capture |
| 12 | Retarget App introduction and play the Sessions video | Source slides 8-9 |
| 13 | Retarget My Work and play its video | Source slide 10 |
| 14 | Retarget Canvases as a teaser and play its video | Source slide 11 |
| 15 | Retarget Review and Merge and play its video | Source slide 12 |
| 16 | Retarget Automations, adding brief customization framing, and play its video | Source slide 13 plus current documentation |
| 17 | New high-contrast engineering safety statement | Original content |
| 18 | Retarget closing artwork with workshop, feedback, and technical-session handoff | Source slides 14-16 |

The agenda is two slides because the confirmed session titles and speaker names
must remain readable from the back of the room. Do not abbreviate session
titles, omit speakers, or include the keynote attendees are already watching.

The five App videos are the keynote's feature showcase. Keep them embedded in
their source-derived slides and preserve their existing playback behavior.
Their combined runtime is approximately 74 seconds.

### Opening-image treatment

- Fill the 16:9 slide with the 1792 by 1024 image without stretching it.
- Use the minimal centered crop required for 16:9; preserve the mascot, its
  `@CPTMSDUG` shirt mark, and the GitHub cube.
- Put the title and event details in the existing dark negative space.
- Do not recolor, blur, mask, or cover the hero artwork with another product
  image.
- Add a contrast treatment only if rendered projection testing proves it is
  needed; keep it local to the text rather than dimming the full image.

## Motion strategy

- Keep the source deck's existing animation and video sequences where they
  strengthen the story.
- New slides should use one authored reveal, not many unrelated entrance
  effects.
- Prefer duplicating a source slide with suitable motion and replacing its
  content.
- If a genuinely new transition, gradient, shadow, or animation is required,
  add it through PowerPoint/Open XML only after the static composition is
  approved and render-tested.
- Do not put timing labels such as "30-minute keynote" on audience-facing
  slides.

## Required organizer assets

The event website now supplies the name, date, venue, schedule, organizing
team, speaker photos, Microsoft and BBD sponsor logos, registration URL, event
hashtag, Code of Conduct, and community links.

Do not finalize slides 1-4 or 18 until the remaining items in
[`organizer-inputs.md`](organizer-inputs.md) are approved, especially:

- volunteer recognition;
- final sponsor list and lockup rules;
- workshop prerequisites;
- accessibility and help contacts;
- room assignments and next-community-event CTA.

## Content and link corrections

- Replace the broken `gh.io/dev-days/workshop` link with
  <https://github.github.com/dev-days/>.
- Keep <https://gh.io/dev-days/feedback> for feedback.
- Label mobile and MAUI demonstrations as local examples, not official Dev
  Days curriculum.
- Verify all product screenshots and clips against the shipping App build
  immediately before the event.

## Quality checks

Render the complete deck and verify:

1. No text clipping, overflow, or placeholder copy.
2. No title, subtitle, timing, or presenter-note text is accidentally visible.
3. Sponsor logos use approved proportions and readable sizes.
4. Videos play offline from the final PPTX.
5. Transitions and animation order survive save/reopen.
6. All QR codes and links resolve.
7. Text is readable from the back of the room.
8. The keynote finishes under 30 minutes with all five videos playing offline
   in approximately 74 seconds total.
