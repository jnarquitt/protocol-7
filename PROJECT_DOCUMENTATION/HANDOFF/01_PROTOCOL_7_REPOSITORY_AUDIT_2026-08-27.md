# Protocol 7 Repository / Development Audit — 2026-08-27

**Scope:** v0.188 app development process and transfer readiness.

## Executive finding

The repository contains unusually strong authority, requirements, structured data, mobile interaction, and QA documentation. The principal failure was not lack of documentation; it was failure to consistently obey the repository-first workflow and to verify observable behavior before publication.

The current application lineage should be considered **development/recovery state, not trusted release state** until revalidated.

## What the repository already gets right

### Authority and governance
`00_READ_FIRST_PROTOCOL_7_AUTHORITY_MAP.md` explicitly says not to reconstruct the project from conversational memory and provides a reading order and precedence hierarchy.

`P7_v0.188_PLAYTEST_GOVERNANCE_AND_GUARDRAILS.md` establishes GitHub-first continuity, no-resurrection, dice-math requirements, user locks, publication workflow, Auditor duties, and the `kk` continuation shorthand.

### App engineering requirements
`P7_v0.188_APPLICATION_REQUIREMENTS_BIBLE_r001.md` already requires:
- exactly one persisted character state;
- exactly one roll builder;
- derived state rather than competing manual state;
- rules/catalog data separate from UI;
- phone-first, keyboard-free mechanics;
- full creation, Vitality, Skills, advancement, VAM/BAR, Gear, Mastery, Play, Reaction, active defense, damage, conditions, persistence/export/import.

### QA
`P7_v0.188_APPLICATION_ACCEPTANCE_TEST_MATRIX_r001.md` already defines 40+ observable acceptance tests and explicitly says PASS requires observable behavior, not developer intent.

This means the process already contained the safeguards needed to prevent many recent failures.

## Development failures observed

### 1. Repository-first law was not consistently followed
Rules and app behavior were sometimes implemented or described from conversation recollection before the relevant authority was re-read. This allowed obsolete concepts and uncertain mechanics to reappear.

### 2. Nested wrapper architecture
A sequence of later app revisions was implemented as HTML wrappers/iframes around earlier revisions. This violated the spirit and eventually the explicit architectural law requiring one authoritative state and maintainable implementation. It also made it difficult to know which layer owned a feature and caused regressions to be mistaken for missing requirements.

### 3. Feature claims without observable acceptance evidence
Features were reported as implemented when code had been written, but the actual deployed player path had not necessarily been exercised. This directly conflicts with the QA authority's rule that PASS means observable behavior.

### 4. Regression handling failure
The trained/chosen Skills display had been discussed and implemented in prior lineage, yet its later absence was initially treated as a new feature request rather than a regression. A proper regression suite would have blocked publication.

### 5. Direct-to-main / direct-to-landing publication was too permissive
Experimental implementation passes were repeatedly promoted to the public landing page without a release-gate report. This increased user-facing instability.

### 6. Requirements and implementation diverged
The requirements call for full touch-first custom creation, VAM authorization/BAR enforcement, Gear selection, conditions, one canonical roll builder, export/import, level reduction warning, full Edge behavior, Mastery access, and more. The newest standalone recovery build should not be assumed to implement all of these.

## Current r018 standalone assessment

`Protocol_7_v0.188_Session_App_r018_STANDALONE.html` is valuable because it stops the nested-wrapper pattern and restores direct ownership of UI/state. However, it is a **recovery baseline**, not a verified complete app.

Known strengths visible from its implementation intent:
- standalone HTML rather than iframe nesting;
- local v0.188 state;
- preset loading;
- Skills view with My Trained Skills / All / Edit modes;
- Skill rows intended to show rank, Skill die, three Ability dice, Mastered flag;
- Vitality face controls and HP calculation;
- loadout summary;
- physical/in-app rolling;
- A/D selector;
- AP, movement, Reaction, HP controls;
- basic Level display/advancement foundation.

Known or likely gaps against the authoritative requirements/acceptance matrix that must be verified and repaired rather than assumed:
- complete custom Vector creation workflow and legal starting Ability assignment;
- strict 20-rank creation enforcement and overspend blocking;
- complete canonical 40-Skill registry sourced from data rather than duplicated hard-coded data;
- full 84-VAM canonical selector, authorization and BAR enforcement;
- 1-AP whole field-swap rule during active play;
- canonical Gear catalog and selection, not a small hard-coded subset;
- conditions registry and condition effects;
- canonical Edge implementations and once/session state;
- guided Level 2–6 advancement with all choices, reversibility and dependency warnings;
- legal Mastery access and Mastery die integration;
- one canonical roll builder for every launcher;
- full A/D reason cancellation behavior;
- active defense/opposed attack and automatic damage workflow;
- correct armor interaction;
- export/import with schema/rules validation;
- explicit v0.187 save incompatibility/migration behavior;
- reset/delete confirmation;
- Rules Guide route;
- full narrow-phone and touch-size verification;
- traceability of all hard-coded mechanics to current authority.

## Risk classification

### BLOCKER
- Any resurrection of superseded rules.
- Multiple competing state objects or roll builders.
- Movement other than 30 ft per AP.
- Skills display not reflecting actual character state.
- Roll preview differing from dice actually rolled.
- Ability/Skill/Vitality/BAR rules contradicting current authority.
- Publication without evidence-based QA.

### HIGH
- Incomplete VAM/Gear catalogs presented as complete.
- Advancement that changes Level without completing legal choices/ranks.
- Mastery granted merely because a Skill is Mastered.
- Reaction bookkeeping inconsistent with current rules.
- Old saves silently accepted as v0.188.

### MEDIUM / playtest polish
- Preset descriptions, recommended filters, quick-roll ordering, visual refinements, richer help text.

## Required recovery plan

1. Freeze public feature expansion temporarily.
2. Establish a normal single-source app directory/source file. Do not use another wrapper.
3. Load canonical data from repository JSON or generate a single bundled data module from those authorities.
4. Implement one versioned character-state schema.
5. Implement one roll-builder/evaluator module.
6. Convert the acceptance matrix into executable tests where possible and manual mobile test scripts where browser automation is impractical.
7. Run every applicable A01–A42 test and record PASS/FAIL/NOT IMPLEMENTED with evidence.
8. Repair BLOCKER/HIGH failures before adding polish.
9. Run the Auditor procedure.
10. Publish a candidate to a non-default preview path/branch first.
11. Promote the landing page only after the user or developer verifies the preview candidate.

## Recommended repository structure

```text
/
  index.html                         # public landing page only
  app/                               # NEW: one current application source tree
    index.html
    css/
      app.css
    js/
      app.js
      state.js
      roll-builder.js
      evaluator.js
      advancement.js
      ui.js
    data/
      rules-core.json
      skills.json
      vams.json
      gear.json
      conditions.json
    tests/
      acceptance-data-model.js
      acceptance-rolls.js
      acceptance-advancement.js
      acceptance-play.js
      MANUAL_MOBILE_TESTS.md
  PROJECT_DOCUMENTATION/
    00_READ_FIRST_PROTOCOL_7_AUTHORITY_MAP.md
    HANDOFF/
      00_PROTOCOL_7_AI_HANDOFF_READ_FIRST.md
      01_PROTOCOL_7_REPOSITORY_AUDIT_2026-08-27.md
      02_PROTOCOL_7_NEXT_DEVELOPER_INSTRUCTIONS.md
    APP_REBUILD/                     # authorities / registries / contracts
    CONTINUITY_AUDITS/
  archive/                           # OPTIONAL future move for old app builds; do not delete history casually
```

Do not move historical files merely for tidiness until references and Pages routes have been checked. The important immediate change is that **new development occurs only in one `/app/` source tree**.

## Audit conclusion

The project is recoverable and the repository is sufficiently documented for transfer to another capable AI/developer. The handoff should emphasize that the next developer does not need to rediscover the game from chat. Their job is to obey the authorities already present, convert the QA matrix into a real gate, and rebuild/repair the app from a single maintainable source.
