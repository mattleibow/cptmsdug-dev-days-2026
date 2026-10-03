# Supplied deck adoption matrix

This matrix turns the source evidence into explicit decisions for the two new
presentations. Decisions use both the structural extraction in
[`copilot-app-english.md`](copilot-app-english.md) and the rendered-slide OCR
in
[`copilot-app-english-visual-text.md`](copilot-app-english-visual-text.md), so
text embedded inside screenshots and flattened graphics is not overlooked.

| Source slide | Source topic | Event keynote | App and Canvas session |
|---:|---|---|---|
| 1 | Dev Days opening | Retarget as the event welcome and preserve the official opening motion/artwork | Reuse the visual system for the technical title, not the exact event-opening copy |
| 2 | Code completion -> agentic SDLC -> hybrid teams | Retarget as Assist -> Collaborate -> Delegate; remove dated roadmap implications | Use only as a very short keynote recap if needed |
| 3 | Plan -> Build -> Review -> Ship | Keep the animated lifecycle sequence | Use a static or abbreviated recap; do not replay the full sequence |
| 4 | Copilot ecosystem montage | Keep as the broad ecosystem transition | Use one still in the 90-second recap |
| 5 | One Copilot, everywhere you code | Retarget as one Copilot with different execution boundaries | Omit after the recap |
| 6 | IDEs, web, terminal, mobile, collaboration, boards | Retarget and verify current client terminology | Omit from the Canvas core; detailed support belongs in appendix |
| 7 | "How do we bring it together?" | Use as the transition from local/delegated work into the Copilot App | Use as the transition from ecosystem recap into the App operating model |
| 8 | Copilot App introduction | Keep as a short workbench introduction | Keep as the App context slide |
| 9 | Sessions video | Keep the complete 18-second video as the App-workbench introduction | Available for the App recap or as a transition into live work |
| 10 | My Work video | Keep the complete 13-second video as the cross-repository attention example | Move detailed My Work content to appendix or Q&A |
| 11 | Canvases video | Keep the complete 12-second video as the technical-session invitation | Available as an introduction, transition, or complement to the live Canvas |
| 12 | Review and Merge video | Keep the complete 19-second video as the review/CI/handoff example | Available wherever review/CI context improves the App story |
| 13 | Automations video | Keep the complete 13-second video with brief customization framing | Put trigger, tool-grant, and policy details in appendix |
| 14 | Copilot App download CTA | Retarget as event/workshop/session handoff artwork | Retarget as closing/resources artwork |
| 15 | Workshop CTA | Replace the broken source URL with `https://github.github.com/dev-days/` | Link the official workshop as a prerequisite/on-ramp |
| 16 | Feedback CTA | Keep `https://gh.io/dev-days/feedback` in the event close | Omit unless the session closes the entire event |

## Footage rule

The keynote uses all five source videos as a fast feature showcase. Their
combined runtime is approximately 74 seconds. The technical session may reuse
any of the clips alongside live App, Canvas, and mobile demonstrations when
that creates the clearest flow.

## Flattened image content retained

The visual-text pass exposed important product copy and UI state that was not
available from PowerPoint text objects alone:

- Slides 1, 8, and 14 show an end-to-end App session with Changes, Plan,
  Terminal, Run, and a live browser preview around a caption-converter task.
  Reuse the **workbench around the work** idea, not the incidental sample app.
- Slide 4 reinforces three platform messages: model choice, custom and
  third-party agents, and staying in flow across GitHub, IDEs, CLI, project
  tools, chat apps, and MCP servers.
- Slide 6 demonstrates the breadth of surfaces with concrete IDE review,
  GitHub/mobile, terminal, collaboration, and project-management examples.
- Slide 9 says sessions can start from an issue, a prompt, or a pull request
  already in flight.
- Slide 10 frames My Work as a centralized cross-repository inbox for issue and
  pull-request triage.
- Slide 11 defines Canvases as a live surface where a person and agent edit,
  reorder, and verify the same artifact.
- Slide 12 keeps diffs, CI, failing-check repair, and merge in the same window.
- Slide 13 describes automations as turning skills and prompts into repeatable
  scheduled work.

These ideas are now represented in the keynote's ecosystem/App section and the
technical session's concise App-workbench slide.

## Content rule

The official source deck is evidence and reusable media, not the authoritative
script for either new talk. Product claims are checked against
[`product-docs.md`](product-docs.md), and local event content is locked through
[`../keynote/organizer-inputs.md`](../keynote/organizer-inputs.md).
