# Protocol 7 — Ecosystem Audit A

**Audit date:** 2026-08-23  
**Scope:** Core v0.187, public player surfaces, The Continuance Files M01–M03, project authority/current-state documents, public navigation  
**Audit stage:** First periodic ecosystem audit  
**Change policy:** This audit does not unlock or rebalance frozen mechanics.

## Executive result

**Overall status: AMBER — playable ecosystem, documentation drift requires correction before M04 promotion.**

The live v0.187 core surfaces and current Adventure Path work are broadly compatible. The principal problem is not a gameplay contradiction inside M01–M03; it is **authority/current-state drift** created by Adventure Path development moving faster than the v0.187 project-control documents.

No frozen mechanic is changed by this audit.

## Audit findings

### A-01 — BLOCKER: current authority incorrectly identifies the current Adventure revision

`PROJECT_DOCUMENTATION_CURRENT_AUTHORITY.md` still states:

- Current mission: `P7-AP01-M01 — The Ash Ledger r001`
- M01 retains Rules Target v0.180 until specifically audited/revised.

That is obsolete. M01 has since been specifically revised/audited and the public current-review page identifies **M01 r003**, **M02 r001**, and **M03 r002** as current promoted Adventure materials.

**Required correction:** Update project authority to distinguish the current core baseline from the independently advancing Adventure Path and point to `continuance-files/current.html` as the canonical public Adventure review surface.

### A-02 — MAJOR: current-state snapshot is stale for the Adventure Path

`03_CURRENT_STATE_SNAPSHOT_v0.187.md` still identifies M01 r001 as the current mission and describes the pre-revision v0.180 Adventure boundary.

**Required correction:** Preserve the v0.187 core snapshot facts but update the Adventure section to the current path state:

- M01 — The Ash Ledger r003 — current promoted revision
- M02 — The Winter Relay r001 — current promoted revision
- M03 — The Paper Harbor r002 — current promoted revision
- M04–M06 — first drafts, not promoted/current

### A-03 — MAJOR: canonical lock document contains an obsolete Adventure-boundary note

`Protocol_7_v0.187_CANONICAL_PLAYTEST_LOCKS.md` correctly defines the frozen v0.187 mechanics, but its final Adventure Boundary paragraph still says M01 remains r001 / Rules Target v0.180 until audited.

**Required correction:** Do not alter any frozen mechanic. Replace only the obsolete Adventure-boundary paragraph with a statement that Adventure revisions advance independently and must declare compatibility with the v0.187 mechanical baseline.

### A-04 — PASS: stable public core navigation points to v0.187

The public redirect surfaces `app.html` and `rules.html` route to the v0.187 Vector App and v0.187 Interactive Rules Guide. The root Protocol 7 hub labels the project `v0.187 PRE-BETA` and routes Adventure review through `continuance-files/current.html`.

**Action:** None beyond ongoing release checks.

### A-05 — PASS WITH CLEANUP NOTE: historical player builds coexist with current builds

The repository intentionally preserves older v0.181/v0.185 player-facing files alongside current v0.187 artifacts. This is acceptable under the historical-file policy, but direct repository browsing can still confuse a human reviewer.

**Action:** Do not delete historical builds during active playtest. Continue using stable redirect/landing files as the public authority. A later repository-organization pass may move historical releases into an archive directory if desired.

### A-06 — PASS: Adventure Path mechanical vocabulary aligns with the frozen core

M01–M03 use the canonical mission framework:

- Carrier states: Fragile → Established → Durable
- Carrier strength versus Exposure
- Clean Success / Exposed Success / Contained Failure / Exposed Failure

No Adventure revision reviewed by this audit requires unlocking a frozen v0.187 mechanic.

### A-07 — PASS: Adventure Path has a coherent conceptual escalation

Current promoted Adventure work advances the continuity concept rather than repeating the same mission:

- M01: the object/person is not necessarily the Carrier.
- M02: independent reproduction creates resilience.
- M03: resilience can require compartmentation and deliberate incompleteness.

This is consistent with the Campaign Architecture r001 and provides a usable foundation for M04.

### A-08 — WATCH: campaign architecture and public promoted revisions use different revision maturity

The campaign architecture remains r001 while individual missions have advanced. This is acceptable because architecture is a design authority, not a release manifest, but it must not be mistaken for the current mission index.

**Action:** `continuance-files/current.html` is the current public mission manifest. Architecture changes only when the campaign spine itself changes.

### A-09 — WATCH: M04–M06 public first drafts are visible

The current campaign page correctly labels M04–M06 as FIRST DRAFT. Their presence is useful for review but creates a risk that a reader treats them as playtest-ready.

**Action:** Maintain explicit FIRST DRAFT labels until each mission completes coherence revision and simulation.

### A-10 — PROCESS: periodic audit schedule is now canonical project workflow

Use this audit rhythm for P7-AP01:

- Mission-level synchronization check after every promoted Adventure revision.
- Ecosystem Audit A: after M02 / performed late after M03 on 2026-08-23.
- Ecosystem Audit B: after M04 is promoted.
- Ecosystem Audit C: after M06 is promoted.
- Final Release Audit: after M06 and before Adventure Path release packaging.

Each ecosystem audit checks at minimum:

1. canonical rules source and lock compatibility;
2. app / rules guide / rulebook representation;
3. Adventure mechanical terminology;
4. campaign continuity and consequences;
5. player/GM information separation;
6. current-state and authority documents;
7. landing pages and stable redirects;
8. version/revision labels;
9. public links and current manifest;
10. obsolete or contradictory documentation.

## Core mechanical audit baseline

The v0.187 lock set remains frozen. Audit A makes **no balance changes** and does not promote v0.188.

Any future Adventure finding that appears to require changing a frozen rule must be recorded first and explicitly authorized before the mechanical baseline changes.

## Required corrections authorized by Audit A

The following are documentation synchronization corrections, not mechanical changes:

- Update `PROJECT_DOCUMENTATION_CURRENT_AUTHORITY.md` Adventure status.
- Update `03_CURRENT_STATE_SNAPSHOT_v0.187.md` Adventure status.
- Correct the obsolete Adventure-boundary paragraph in `Protocol_7_v0.187_CANONICAL_PLAYTEST_LOCKS.md` without altering frozen mechanics.
- Keep `continuance-files/current.html` as the canonical public Adventure review manifest.

## Audit conclusion

After those documentation corrections, Protocol 7 is cleared to continue M04 development on the v0.187 mechanical baseline.

**Next full checkpoint:** Ecosystem Audit B after M04 promotion.
