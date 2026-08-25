# READ FIRST — Protocol 7 Authority Map

**Status:** ACTIVE ENTRY POINT
**Current development target:** v0.188 PLAYTEST

A fresh work session starts here. Do not reconstruct Protocol 7 from conversational memory when repository authorities are available.

## Required reading order for substantial v0.188 work

1. `PROJECT_DOCUMENTATION/00_READ_FIRST_PROTOCOL_7_AUTHORITY_MAP.md` — this map.
2. `PROJECT_DOCUMENTATION/P7_v0.188_PLAYTEST_GOVERNANCE_AND_GUARDRAILS.md` — operating law, playtest philosophy, no-resurrection rule, current hard locks, Auditor role.
3. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_RULES_DATA_CORE_r001.json` — current candidate mechanical core. Treat entries as candidate/current data subject to the governance file; JSON presence alone does not override an explicit lock.
4. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_SKILL_CANONICAL_REGISTRY_r001.json` — current 40-Skill registry.
5. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_VAM_CANONICAL_DATABASE_r001.json` — current VAM candidate database. This is a playtest catalog/data source, not permission to contradict the rules authority.
6. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_ADVANTAGE_DISADVANTAGE_AUTHORITY_r001.json` and `P7_v0.188_ROLL_EVALUATOR_CONTRACT_r001.json` for dice-pool implementation work.
7. `PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_MOBILE_INTERACTION_LOCK_r001.md` and `P7_v0.188_APPLICATION_REQUIREMENTS_BIBLE_r001.md` for app/UI work.
8. `PROJECT_DOCUMENTATION/CONTINUITY_REVIEW_PERSONA_AND_MILESTONE_PROTOCOL.md` for major milestone audit procedure, interpreted through the newer playtest governance file.
9. `PROJECT_DOCUMENTATION/03_CURRENT_STATE_SNAPSHOT_v0.187.md` only as predecessor/reference evidence. It is not allowed to resurrect a mechanic superseded in v0.188.

## Authority precedence

For v0.188 work, use this precedence:

1. Explicit current user lock recorded in repository governance/lock authority.
2. Current v0.188 playtest rulebook and synchronized canonical rules source once published.
3. Current v0.188 specialized authorities/registries that do not conflict with #1–2.
4. Current v0.188 application requirements and QA derived from the rules.
5. v0.187 promoted materials as predecessor/reference for mechanics not superseded.
6. Historical development documents, old app code, old summaries, simulations, and conversational memory.

A lower source may help fill a gap, but may not silently override a higher source.

## Historical / reference-only warning

The repository contains many useful older files. Their continued presence is intentional for history, regression comparison, Adventure continuity, and recovery. They are not automatically current rules.

In particular:
- v0.187 player-facing materials are the last promoted release, not the v0.188 design authority.
- old app builds are regression/feature references only;
- development simulations describe the rules used at the time they were run;
- candidate JSON can contain experimental decisions;
- continuity audit reports describe a past audit state and do not outrank later locks;
- conversational memory is navigation assistance, not project canon.

## Supersession principle

When a v0.188 decision deliberately replaces an older mechanic, mark the new rule in the current rules authority and do not restore the predecessor merely because it is more complete or easier to copy.

The no-resurrection rule is more important than preserving old wording.

## Publication target

The desired v0.188 publication structure is:

- one player-facing v0.188 Playtest Rulebook;
- one synchronized canonical rules source used for implementation;
- registries/databases for Skills, VAMs, conditions, gear, and other structured catalogs;
- Interactive Rules Guide derived from the rulebook;
- mobile Vector App derived from the same rules/data;
- QA and Auditor reports validating consistency rather than defining mechanics.

Once the v0.188 rulebook/canonical rules source are promoted, update this map so they become the primary mechanical authorities and clearly demote candidate development sources.

## Work-session minimum

Before changing mechanics: read items 1–3 plus the specialized authority for the mechanic.

Before changing the app: read items 1–3, 6–7, and the relevant catalog authority.

Before publishing a milestone: read items 1–3 and run the Auditor procedure.

Do not claim a guardrail was applied unless the relevant repository authority was actually read during the work session.
