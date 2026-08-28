# Protocol 7 v0.188 — Acceptance Status

Per `PROJECT_DOCUMENTATION/HANDOFF/02_PROTOCOL_7_NEXT_DEVELOPER_INSTRUCTIONS.md`:
"Maintain a machine/human-readable report... PASS requires observing the
resulting state/behavior. Merely locating a function or button is
insufficient." This file is that report as of the Functional Skeleton
pass. Regenerate it whenever the automated suites' PASS/FAIL counts
change or a manual pass is completed.

**Automated evidence:** `node app/tests/acceptance-data-model.js` and
`node app/tests/acceptance-functional-logic.js`, both re-run at the time
this file was written. **Interactive evidence:** a scripted Playwright
walkthrough (390×844 viewport, real Chrome) driving the actual served
app through both creation paths and all six screens — not unit calls
into internal functions — with zero console errors beyond a harmless
favicon 404. **Manual evidence:** not yet performed — see
`MANUAL_MOBILE_TESTS.md`.

| Test | Status | Evidence |
|---|---|---|
| A01 Starting Abilities | PASS | acceptance-data-model.js |
| A02 Starting Skills | PASS | acceptance-data-model.js |
| A03 Level 1 BAR | PASS | acceptance-data-model.js |
| A04 Unused BAR | PASS | acceptance-data-model.js |
| A05 Vitality die validation | PASS | acceptance-data-model.js |
| A06 Vitality ordinary | PASS | acceptance-data-model.js |
| A07 Vitality tie | PASS | acceptance-data-model.js |
| A08 Vitality all blanks | PASS | acceptance-data-model.js |
| A09 HP advancement | PASS | acceptance-data-model.js |
| A10 Durable | PASS | acceptance-data-model.js |
| A11 Level 3 Core Growth | PASS | acceptance-data-model.js |
| A12 d12 ceiling | PASS | acceptance-data-model.js |
| A13 Level 5 Core Growth | PASS | acceptance-data-model.js |
| A14 Level reduction | PASS | acceptance-data-model.js |
| A15 VAM authorization | PASS | acceptance-functional-logic.js |
| A16 BAR enforcement | PASS | acceptance-functional-logic.js |
| A17 Free unused load | PASS (logic-level) | acceptance-functional-logic.js — UI behavior (VAMs screen "Load" outside Field Swap) exercised interactively, not yet in the manual script |
| A18 Field swap | PASS | acceptance-functional-logic.js + interactive walkthrough (VAMs screen "Field Swap" button) |
| A19 Preset meter | PASS | acceptance-functional-logic.js + interactive walkthrough (preset creation, VAMs screen shows loaded BAR immediately) |
| A20 Mastery dormant | PASS | acceptance-functional-logic.js |
| A21 Mastery active | PASS | acceptance-functional-logic.js |
| A22 Two Masteries | PASS | acceptance-functional-logic.js |
| A23 Dice-source collision | PASS | acceptance-functional-logic.js |
| A24 Pool truth | PASS | acceptance-functional-logic.js |
| A25 Dependency propagation | PASS | acceptance-functional-logic.js |
| A26 Movement 1 AP | PASS | acceptance-functional-logic.js |
| A26B Movement 2 AP | PASS | acceptance-functional-logic.js |
| A26C Movement 3 AP | PASS | acceptance-functional-logic.js |
| A26D No universal Run | PASS | acceptance-functional-logic.js |
| A27 Reaction | PASS | acceptance-functional-logic.js + interactive walkthrough (Play screen "Use Reaction"/"Start New Turn") |
| A28 Navigation | PASS (interactive) | walkthrough reached all six screens via bottom nav; Home link present. Full "no scroll to top" check on a long screen is in MANUAL_MOBILE_TESTS.md |
| A29 Studio route | NOT RE-VERIFIED | pre-existing landing-page behavior, unmodified by this pass — not re-audited here |
| A30 Narrow phone | PASS (390px) | walkthrough screenshots at 390×844 show no horizontal overflow; MANUAL_MOBILE_TESTS.md covers narrower real devices |
| A31 Touch usability | PASS (visual review) | CSS enforces ~44px minimum on buttons/chips/AP pips; not confirmed under a real thumb — see MANUAL_MOBILE_TESTS.md |
| A32 Readability | PASS (visual review) | screenshots reviewed for contrast/labeling; not confirmed in real outdoor brightness |
| A33 VAM catalog navigation | PASS (interactive) | family filter + Loaded Only reached the catalog with no typing in the walkthrough |
| A34 Local persistence | PASS | acceptance-data-model.js |
| A35 Export/import | PASS | acceptance-data-model.js (logic) + Export/Import buttons wired in UI (not yet walked interactively) |
| A36 v0.187 incompatibility | PASS | acceptance-data-model.js |
| A37 One-state audit | PASS (module-level, per its own noted caveat) | acceptance-data-model.js; UI now exists, so this should be re-verified against the built screens specifically, not just the module surface |
| A38 One-roll audit | PASS (module-level) + PASS (interactive) | acceptance-data-model.js; walkthrough's Roll Launcher and Skills-tab "Roll" shortcut both route through the same buildRollPool/rollPool, no second implementation found |
| A39 No flat roll modifiers | PASS | acceptance-data-model.js |
| A40 Rules link | NOT IMPLEMENTED | no Interactive Rules Guide exists yet to link to — honest gap, see MANUAL_MOBILE_TESTS.md |
| A41 Keyboard-free mechanics | PASS (interactive, not exhaustive) | full walkthrough (Custom + Preconfigured creation, Skills, VAMs, Gear, Play roll, screen navigation) used only the Vector Name field for typing; Advancement's Level Up button was not exercised in this run — see MANUAL_MOBILE_TESTS.md |
| A42 Canon-source regression | NOT IMPLEMENTED (by design) | acceptance-data-model.js explicitly cannot prove this; a human read-through of state.js/roll-builder.js was performed and fixed 3 real regressions (see commit history) — that read-through has not yet been extended to app.js/screens.js/components.js/presets.js |

## Known gaps against the full Functional Skeleton Gate (A01–A29, A34–A42)

- **A29, A40**: not addressed by this pass (A29 pre-existing/unmodified; A40 has no target to link to yet).
- **A42 for the UI layer**: the human read-through covered the logic layer (state.js, roll-builder.js) but not yet app.js/screens.js/components.js/presets.js. Those files are new this pass and haven't had the same scrutiny.
- **Combat/damage workflow** is minimally viable (a manual "Opponent Total" stepper feeding `State.resolveAttack`), not a full opposed-roll-vs-roll flow between two Vectors — adequate for solo/GM-adjudicated play, not a two-Vector PvP loop.
- **Level Up guided flow** exists (Edge/Ability-growth/Mastery choices gated per Level) but was not exercised end-to-end in the interactive walkthrough.
- **Advancement's HP clamp on level change** was implemented but not independently tested.

None of the above are BLOCKER-class per the audit's risk classification (no resurrected mechanic, no competing state/roll builder, no movement violation, no roll-preview mismatch). They are HIGH/MEDIUM items to close before treating the Functional Skeleton Gate as fully passed, and well before any Release Gate or landing-page promotion.
