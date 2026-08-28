# Protocol 7 v0.188 — Manual Mobile Test Script

Per the repository audit's recovery plan: "run every applicable A01–A42
test... executable tests where possible and manual mobile test scripts
where browser automation is impractical." A28–A33, A40, and A41 are
screen/touch-interaction tests. A headless run (390×844 viewport,
Playwright + a real Chrome binary, full custom-creation and
preconfigured-creation walkthroughs, all six screens) was performed
during development and found no console errors and no visibly broken
screen — see the engineering log/commit history for that session's
screenshots. That is evidence, not a substitute for a human on a real
phone under a real thumb, real network latency, and a real software
keyboard. Run this script by hand before any Mobile Gate or Release
Gate claim.

## Setup
Serve the repository root statically (`app/js/data.js` fetches JSON
from `../PROJECT_DOCUMENTATION/APP_REBUILD/` relative to
`app/index.html`, so `app/` cannot be served in isolation), e.g.:
```
python3 -m http.server 8000
```
Open `http://<host>:8000/app/index.html` on an actual phone in portrait.

## A28 — Navigation
- [ ] From every one of the six primary screens, reach every other screen without using browser Back.
- [ ] Bottom navigation stays reachable without scrolling to the top of a long screen (e.g. scroll to the bottom of Skills → All, confirm nav bar is still visible/tappable).
- [ ] The header's Protocol 7 Home link returns to the site landing page from every screen.

## A29 — Studio route
- [ ] From the landing page (`index.html`) at repository root, confirm a route to Jade Lion Studios exists (this predates the app rebuild — confirm it hasn't regressed, don't re-litigate its design).

## A30 — Narrow phone
- [ ] On the narrowest common phone width (≈360–375px logical), confirm no screen requires horizontal scrolling — Skills/VAMs/Gear cards, the ability grid, the die pools, and the AP pips must all reflow instead of overflow.

## A31 — Touch usability
- [ ] Every primary control (buttons, chips, stepper +/-, die chips, AP pips, nav bar items) is comfortably tappable with a thumb — no accidental adjacent-target taps.
- [ ] No required action depends on a small icon-only control with no visible label.

## A32 — Readability
- [ ] HP, AP, BAR, and Skill/Ability dice are readable at a glance in direct outdoor-equivalent brightness (check actual device brightness, not just screenshots).
- [ ] Legality/lock state (e.g. a locked VAM, an over-budget Skill banner) is conveyed by more than color alone — confirm text/label accompanies every warning color (the app currently pairs every warning color with explanatory text; re-verify after any visual redesign).

## A33 — VAM catalog navigation
- [ ] Every one of the 84 VAMs is reachable via family filter + scroll without ever needing to type in a search box (no search box exists yet — confirm this isn't experienced as a missing/expected control on a real device with 14 VAMs per family).

## A40 — Rules link
- [ ] NOT IMPLEMENTED: there is no Interactive Rules Guide yet to deep-link to. This is an honest gap, not a broken link — track it before claiming the Release Gate.

## A41 — Keyboard-free mechanics
- [ ] After entering the Vector Name once, complete an entire Custom creation → Skills allocation → VAM loading → Play a roll → Level Up flow without the software keyboard ever reopening.
- [ ] Repeat for Preconfigured creation.
- [ ] Confirm no screen has a stray text `<input>` other than Vector Name (Export/Import use a file picker and a download link, not typed text).
