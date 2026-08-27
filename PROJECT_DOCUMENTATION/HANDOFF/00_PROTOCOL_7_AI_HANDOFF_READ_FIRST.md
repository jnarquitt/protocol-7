# Protocol 7 — AI / Developer Handoff — READ FIRST

**Prepared:** 2026-08-27
**Project target:** v0.188 PLAYTEST
**Purpose:** Make Protocol 7 transferable to a new AI model or human developer without depending on prior chat memory.

## First instruction to the next model

Do not reconstruct Protocol 7 from conversation history. The repository is the source of continuity. Read the repository authorities in the order below before changing code or rules.

## Mandatory reading order

1. `PROJECT_DOCUMENTATION/00_READ_FIRST_PROTOCOL_7_AUTHORITY_MAP.md`
2. `PROJECT_DOCUMENTATION/P7_v0.188_PLAYTEST_GOVERNANCE_AND_GUARDRAILS.md`
3. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_RULES_DATA_CORE_r001.json`
4. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_SKILL_CANONICAL_REGISTRY_r001.json`
5. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_VAM_CANONICAL_DATABASE_r001.json`
6. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_GEAR_CANONICAL_DATABASE_r001.json`
7. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_CONDITION_CANONICAL_REGISTRY_r001.json`
8. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_ADVANTAGE_DISADVANTAGE_AUTHORITY_r001.json`
9. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_ROLL_EVALUATOR_CONTRACT_r001.json`
10. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_DERIVED_STATE_AND_ROLL_BUILDER_CONTRACT_r001.md`
11. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_MOBILE_INTERACTION_LOCK_r001.md`
12. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_APPLICATION_REQUIREMENTS_BIBLE_r001.md`
13. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_APPLICATION_SCREEN_AND_INTERACTION_MAP_r001.md`
14. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_CHARACTER_STATE_SCHEMA_r001.json`
15. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_APPLICATION_ACCEPTANCE_TEST_MATRIX_r001.md`
16. `PROJECT_DOCUMENTATION/HANDOFF/01_PROTOCOL_7_REPOSITORY_AUDIT_2026-08-27.md`
17. `PROJECT_DOCUMENTATION/HANDOFF/02_PROTOCOL_7_NEXT_DEVELOPER_INSTRUCTIONS.md`

## Authority rule

Current locks and v0.188 authorities outrank old apps, v0.187 materials, simulations, summaries, and chat memory. An older app may be inspected for a successful feature or interaction pattern, but its mechanics must never be copied without checking current v0.188 authority.

## Current application warning

The current landing page points to `Protocol_7_v0.188_Session_App_r018_STANDALONE.html`. This is a recovery/flattening build created after a long sequence of increasingly nested HTML wrappers. It must **not** be treated as a complete or release-ready implementation merely because it is the newest filename.

The next developer should treat r018 as an implementation candidate that must be audited against the requirements and acceptance matrix before further feature work.

## Required architecture going forward

- One real application source, not iframe/version wrappers.
- One persisted v0.188 character-state object.
- One canonical roll builder used by every roll launcher.
- Rules/catalog data separate from UI logic and sourced from current repository authorities.
- Derived state must be derived rather than separately editable.
- No feature is called complete until observable behavior passes its acceptance test.
- Do not publish directly to the landing page until the release gate passes for the intended milestone.

## User/product priorities

- Phone-first.
- Except for Vector name, normal creation/play should require no typing.
- Preserve useful automation from successful prior builds where compatible with v0.188.
- Skills screen must visibly show the selected/trained Skills for the current character, including ranks, current Skill die, the Skill's three Ability dice, and Mastery state/access.
- Preconfigured characters and custom creation are both required.
- Physical dice and in-app dice rolling are both first-class workflows.
- Long-term campaign play and Level 1–6 advancement are required.
- Gear must support historical eras through modern play as appropriate to missions.
- The user prefers large implementation passes and minimal interruptions. `kk` means approve recommendations and continue the current workstream.

## Handoff objective

The next developer's first deliverable should be a verified baseline, not new features: audit current code, establish the single source tree, run/implement acceptance tests, identify PASS/FAIL/NOT IMPLEMENTED for every applicable requirement, repair blockers, then publish a candidate only after evidence-based QA.
