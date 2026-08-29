# Protocol 7 v0.188 — Acceptance Status

Per `PROJECT_DOCUMENTATION/HANDOFF/02_PROTOCOL_7_NEXT_DEVELOPER_INSTRUCTIONS.md`:
"Maintain a machine/human-readable report... PASS requires observing the
resulting state/behavior. Merely locating a function or button is
insufficient." This file is that report as of the Functional Skeleton
pass. Regenerate it whenever the automated suites' PASS/FAIL counts
change or a manual pass is completed.

**Automated evidence:** `node app/tests/acceptance-data-model.js` and
`node app/tests/acceptance-functional-logic.js`, both re-run at the time
this file was written. **Interactive evidence:** two scripted Playwright
walkthroughs (390×844 viewport, real Chrome) driving the actual served
app — not unit calls into internal functions. Pass 1 covered both
creation paths and all six screens. Pass 2 specifically targeted the
gaps Pass 1 left untested: it walked Level 1→6 end-to-end (Edge pick at
the level Edge slots first appear, Ability growth at both
`rulesCore.abilities.growth_levels`, a Mastered Skill pick once Mastery
slots existed, including at the final Level), and a full Export → New
Vector → Import round-trip. Both passes: zero console errors beyond a
harmless favicon 404 (now fixed). Pass 2 found and fixed two real bugs
(below). **Manual evidence:** not yet performed — see
`MANUAL_MOBILE_TESTS.md`.

**Bugs found by Pass 2 and fixed in the same commit:**
1. The Advancement screen's per-Level choices (Edge/Ability-growth/
   Mastery-slot notice) were gated behind `lvl < maxLevel` — the same
   condition guarding the "Advance to next Level" button. This silently
   hid Level 6's own Mastery-slot notice, since Level 6 has no next
   Level to advance to. Fixed by gating the choices on `state ===
   'current'` alone and moving the `lvl < maxLevel` check to just the
   Advance button (which now shows "Maximum Level reached." instead at
   the top Level).
2. Import had no entry point once there was no current character (a
   fresh browser, or after "New Vector") — the Import button only
   existed on the post-creation Character summary, which is
   unreachable with no character. Added "Import a Save…" to the
   creation wizard's path-choice step.

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
| A28 Navigation | PASS (interactive) | walkthrough reached all six screens via bottom nav; Home link and Rules Guide link present. Full "no scroll to top" check on a long screen is in MANUAL_MOBILE_TESTS.md |
| A29 Studio route | NOT RE-VERIFIED | pre-existing landing-page behavior, unmodified by this pass — not re-audited here |
| A30 Narrow phone | PASS (390px) | walkthrough screenshots at 390×844 show no horizontal overflow; MANUAL_MOBILE_TESTS.md covers narrower real devices |
| A31 Touch usability | PASS (visual review) | CSS enforces ~44px minimum on buttons/chips/AP pips; not confirmed under a real thumb — see MANUAL_MOBILE_TESTS.md |
| A32 Readability | PASS (visual review) | screenshots reviewed for contrast/labeling; not confirmed in real outdoor brightness |
| A33 VAM catalog navigation | PASS (interactive) | family filter + Loaded Only reached the catalog with no typing in the walkthrough |
| A34 Local persistence | PASS | acceptance-data-model.js |
| A35 Export/import | PASS | acceptance-data-model.js (logic) + interactive walkthrough (Export → New Vector → Import round-trip via file chooser, restored character byte-for-byte equivalent) |
| A36 v0.187 incompatibility | PASS | acceptance-data-model.js |
| A37 One-state audit | PASS (module-level, per its own noted caveat) | acceptance-data-model.js; UI now exists, so this should be re-verified against the built screens specifically, not just the module surface |
| A38 One-roll audit | PASS (module-level) + PASS (interactive) | acceptance-data-model.js; walkthrough's Roll Launcher and Skills-tab "Roll" shortcut both route through the same buildRollPool/rollPool, no second implementation found |
| A39 No flat roll modifiers | PASS | acceptance-data-model.js |
| A40 Rules link | PASS | `rules.html` at repo root is the existing "Current Interactive Rules Guide" for v0.188 — the app header now links to it (`target="_blank"`, confirmed 200 response and correct href in Pass 2) |
| A41 Keyboard-free mechanics | PASS (interactive) | Pass 1 (Custom + Preconfigured creation, Skills, VAMs, Gear, Play roll) and Pass 2 (full Level 1→6 Level Up, Skills→Edit Mastery pick, Export/New/Import) both used only the Vector Name field for typing |
| A42 Canon-source regression | NOT IMPLEMENTED (by design) | acceptance-data-model.js explicitly cannot prove this; a human read-through of state.js/roll-builder.js (session 1) and now app.js/screens.js/components.js/presets.js (session 2) was performed. Session 2's read-through found and fixed a real regression: Advancement's Edge/Ability-growth/Mastery-slot gating was keyed off literal Level numbers (2/3/5/4/6) instead of `rulesCore.levels`/`rulesCore.abilities.growth_levels`; also fixed two UI-only magic numbers ("16 BAR" label, a stepper's non-rule ceiling) to read from/document against canonical data instead |

## Known gaps against the full Functional Skeleton Gate (A01–A29, A34–A42)

- **A29**: pre-existing/unmodified landing-page behavior — not re-audited this pass.
- **Combat/damage workflow** is minimally viable (a manual "Opponent Total" stepper feeding `State.resolveAttack`), not a full opposed-roll-vs-roll flow between two Vectors — adequate for solo/GM-adjudicated play, not a two-Vector PvP loop.
- **A37 UI-specific re-check**: still only verified at the module/data level; no second screen was found caching a derived value during interactive testing, but that was observed incidentally, not exhaustively checked.

None of the above are BLOCKER-class per the audit's risk classification (no resurrected mechanic, no competing state/roll builder, no movement violation, no roll-preview mismatch). They are the remaining MEDIUM items before treating the Functional Skeleton Gate as fully closed, and well before any Release Gate or landing-page promotion.

## Accepted playtest exception at landing-page promotion (2026-08-28)

Per the Fast-Track Release Plan's decision rule ("make the smallest coherent
playtest decision... record it"), the designer accepted promoting `app/` to
the public landing page (`index.html`) without first running
`MANUAL_MOBILE_TESTS.md` on a physical device. Rationale: A28–A33/A40/A41
already have emulated-viewport automated + scripted-interactive evidence
(390×844 real Chrome, zero console errors) covering the same behavior;
real-thumb/real-brightness/real-latency confirmation is deferred to actual
playtest use rather than blocking release. Run `MANUAL_MOBILE_TESTS.md` by
hand at the first opportunity and correct this file if any item fails on a
real device.
