# Protocol 7 v0.188 — Instructions for the Next AI / Developer

## Role

Act as senior engineer and continuity custodian for Protocol 7. The user is the game designer and should not be required to make software-architecture decisions. Ask the user questions when they affect game design, player experience, or a genuinely consequential rule decision—not when the issue is ordinary engineering.

## Before writing code

Read the complete handoff reading order in `00_PROTOCOL_7_AI_HANDOFF_READ_FIRST.md`.

Then report only:
1. authorities read;
2. current trusted/untrusted implementation status;
3. blockers found;
4. the implementation plan.

Do not claim a feature works because code for it exists.

## Engineering rules

### Single source
Maintain exactly one current app implementation. Never create rNNN as an iframe or script wrapper around rNNN-1. Historical builds may remain untouched for comparison.

### Branch/preview discipline
For substantial changes:
- create a development branch or preview target;
- implement there;
- run acceptance tests;
- provide the preview for verification;
- promote `index.html` only after the intended gate passes.

Do not use the public landing page as the test harness.

### Data authority
Do not manually retype canonical Skills/VAM/Gear/condition data into UI code if it can be loaded/generated from the repository authority. Avoid duplicate mechanical constants.

### State
Use one versioned character object. Derived values such as Skill die, BAR used, max HP, roll pools, and eligibility should be calculated from canonical state and rules.

### Rolls
Every roll entry point must call one roll-builder/evaluator path. Preview and actual roll must use the same pool object. Every extra/removed die needs a named legal source.

### Mobile
Assume phone portrait is the primary device. Only the Vector name should normally invoke a keyboard. Controls must be practical touch targets. No required horizontal scrolling.

## Mandatory Skills behavior

This is a regression-sensitive user requirement.

When a preconfigured or custom Vector has trained Skills, opening Skills must make those chosen Skills immediately discoverable. Default completed-character view should be `MY TRAINED SKILLS` (or equivalent). Each trained Skill must visibly include:
- name;
- invested ranks;
- current Skill die;
- all three associated Ability dice, including intentional repeats;
- Mastered state;
- whether legal Mastery access is active/dormant when relevant.

Creation/advancement editing may expose +/- controls, budgets and untrained Skills, but ordinary play must not bury the character's actual trained Skills beneath the full catalog.

Add a regression test for this behavior before further feature work.

## Advancement behavior

Level 1–6 campaign advancement is required. Follow current authority exactly. Advancement must be a guided workflow, not merely `level++`.

Verify:
- +4 max HP each level after 1;
- +4 Skill Ranks each level after 1 and all ranks legally allocated;
- BAR ceilings 16/18/21/24/27/30;
- Level 2 Edge;
- Levels 3 and 5 Ability steps, d12 ceiling;
- Levels 4 and 6 Mastered Skills;
- Durable HP interaction;
- dependency propagation;
- reversal/correction warning behavior.

## Acceptance workflow

Use `P7_v0.188_APPLICATION_ACCEPTANCE_TEST_MATRIX_r001.md` as a gate, not a checklist to glance at.

Maintain a machine/human-readable report:

```text
A01 PASS — evidence...
A02 FAIL — observed...
A03 PASS — evidence...
...
```

A PASS requires observing the resulting state/behavior. Merely locating a function or button is insufficient.

Before public promotion, all applicable Release Gate tests must pass or a deliberately accepted playtest exception must be recorded.

## Required first implementation milestone

Do not add speculative features. Build a trustworthy baseline containing:
- legal preconfigured and custom creation;
- Vitality Ritual;
- Skills including trained-Skills view;
- VAM/BAR selection;
- Gear selection;
- Play status and action economy;
- physical and digital canonical roll builder;
- A/D;
- active defense/damage;
- Reaction;
- Level Up;
- Mastery;
- persistence/export/import;
- mobile navigation and Rules link.

Then run the acceptance matrix.

## Communication with the user

The user prefers concise milestone reporting and large efficient passes. Avoid forcing the user to choose among implementation strategies they cannot reasonably evaluate.

At the end of each substantive response, give simple user-level options. `KK` means continue with the recommendation/current workstream.

Never say “implemented,” “fixed,” “published,” or “passes” unless that exact statement is supported by what actually happened.

## Suggested prompt to start a new AI session

Copy/paste this:

> Work as the senior engineer for my Protocol 7 project in GitHub repository `jnarquitt/protocol-7`. Do not use conversation memory as rules authority. Start by reading `PROJECT_DOCUMENTATION/HANDOFF/00_PROTOCOL_7_AI_HANDOFF_READ_FIRST.md`, then follow its mandatory repository reading order. Read the repository audit and next-developer instructions. Do not modify anything yet. First report the current authority hierarchy, current app risk/status, acceptance-test situation, and your recovery plan. After that, work repository-first, maintain one real app source rather than version wrappers, and do not promote a build to the landing page until observable acceptance tests support it. I am the game designer; make ordinary engineering decisions yourself and ask me only about consequential game/player-experience decisions. `kk` means approve and continue.
