# Official GitHub Dev Days guidance

This document records the parts of
[`github/dev-days`](https://github.com/github/dev-days) that affect these
presentations. It separates official program guidance from local talk choices.

## Authoritative sources

| Source | What it provides |
|---|---|
| [Program README](https://github.com/github/dev-days/blob/main/README.md) | Dev Days program overview and event formats |
| [Content index](https://github.com/github/dev-days/blob/main/content/README.md) | Recommended Copilot App session and lab structure |
| [2026-07-30 presentation release](https://github.com/github/dev-days/releases/tag/2026-07-30) | Official translated Copilot App decks, including the English source |
| [Organizer guide](https://github.com/github/dev-days/blob/main/organization/README.md) | Event roles, logistics, sponsor recognition, accessibility, and event-day guidance |
| [Marketing toolkit](https://github.com/github/dev-days/tree/main/marketing) | Event naming, promotion, and official asset-generator guidance |
| [Registration template](https://github.com/github/dev-days/blob/main/marketing/draft-registration-page.md) | Suggested agenda, attendee requirements, and Code of Conduct language |
| [Event Code of Conduct](https://github.com/github/dev-days/blob/main/EVENT_CODE_OF_CONDUCT.md) | Expected behavior for attendees, speakers, sponsors, volunteers, and organizers |
| [Workshop landing page](https://github.github.com/dev-days/) | Current hands-on GitHub Copilot App workshop |
| [Feedback link](https://gh.io/dev-days/feedback) | Official event feedback destination |

The program is current for the September 1 through October 31, 2026 event
window. Product UI and live demonstrations should still be checked immediately
before delivery.

## Event guidance for the keynote

- Treat the opening as a community welcome, not the first product slide.
- Use the standard **Dev Days [City Name]** event naming and official
  promotional assets. The event is hosted locally by the user group.
- Thank organizers, volunteers, venue, food, swag, and sponsor partners with
  the approved local logo lockups.
- Include a brief Code of Conduct pointer.
- Give attendees a practical agenda and one clear workshop/lab invitation.
- The content guide recommends one lab per event rather than several competing
  hands-on experiences.
- Keep host-only logistics such as the setup buffer, AV checklist, and
  facilitator coverage in the organizer runbook rather than crowding the
  keynote.

Official promotional assets can be generated at
[`gh.io/dev-day/assets`](https://gh.io/dev-day/assets), and event promotion
uses `#DevDays`.

## Content guidance for the two decks

### 30-minute keynote

The official Copilot App deck is intended as an approximately 30-minute
presentation. For this event, it should supply the visual system, ecosystem
framing, and selected product footage, but the local deck also needs:

- welcome and user-group framing;
- sponsor, venue, volunteer, and community recognition;
- agenda and attendee logistics;
- a broader Copilot ecosystem story;
- a short App preview rather than a technical App walkthrough;
- workshop, feedback, and later-session calls to action.

### 45-minute technical session

The official material covers the App well but includes only a conceptual
Canvas slide. The technical session therefore adds original material based on
current GitHub documentation:

- session workspace and autonomy choices;
- My Work, review, customization, and automation details;
- when a Canvas is better than a transcript;
- project- and user-scoped extension structure;
- extension-managed coordination state and agent-callable actions;
- renderer, lifecycle, loopback-server, CSP, and cleanup concerns;
- project-scoped creation and live reload;
- mobile and .NET MAUI scenarios clearly labeled as local demonstrations.

## Important corrections

### Broken workshop link in the supplied deck

The source deck uses `gh.io/dev-days/workshop`. That link currently returns a
404. Replace it with:

<https://github.github.com/dev-days/>

### No MAUI curriculum in the official repository

The official event repository and workshop are general GitHub Copilot App
material. The Mobile Canvas and MAUI DevFlow examples in this repository are
local technical demonstrations, not official Dev Days curriculum.

### Configuration is security-sensitive

Project-scoped extensions and `.github/github-app.yml` are committed
repository configuration. Review them before trust. Configured scripts and
tools must not expose, print, or persist GitHub credentials.
