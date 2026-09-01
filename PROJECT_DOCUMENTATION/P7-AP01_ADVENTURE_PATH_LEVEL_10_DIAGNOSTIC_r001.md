# P7-AP01 — The Continuance Files
## Adventure Path Level-10 Diagnostic r001

**Date:** 2026-08-31
**Scope:** All current M01–M06 manuscript tiers (GM Field Guides, Development Bibles, Playtest Simulation Reports, Player Briefings) plus the Campaign Architecture authority.
**Rules baseline:** Protocol 7 v0.187 (Adventure Path is not touched by v0.188 mechanical work).
**Relationship to other audits:** This is a content/continuity diagnostic of the Adventure Path specifically. It sits alongside, and does not replace, `P7_ECOSYSTEM_AUDIT_A/B/C` (repository-authority hygiene) or `P7-AP01_WHOLE_CAMPAIGN_STYLE_AND_BALANCE_AUDIT_r001` (adventure-mode/pacing balance). Finding tags follow the Ecosystem Audit convention: **BLOCKER / MAJOR / WATCH / PASS / PROCESS**.

## Executive Result

**AMBER.** The path's story architecture is sound and the two drafted GM Field Guides (M01, M02) are genuinely strong, table-ready documents. The diagnostic's headline finding is that **the campaign's own recurring cast has fallen out of the manuscript record.** Campaign Architecture requires Silas Venn's argument to evolve across all six missions and explicitly plans a Venn-centered M06 finale act — but Venn and Mara Ellery are named in only two of the six mission documents (M01, M02). M03–M05 drafts do not name a Covenant representative at all. Nothing currently in the repository would stop two different GMs, or the same GM three months apart, from portraying Aletheia's honesty, or Venn's argument, inconsistently from one mission to the next.

There is no mechanical or story-architecture fix needed here — the fix is a **standard place to record how a recurring character behaves, what's been foreshadowed for them, and what happened last time**, filled in for the cast that actually recurs. That standard and its first three dossiers (Aletheia, Silas Venn, Mara Ellery) are the deliverable of this diagnostic; see the companion files listed under Disposition.

## Method

Read in full: the Campaign Architecture (`P7-AP01_The_Continuance_Files_CAMPAIGN_ARCHITECTURE_r001.md`); both M01 GM Field Guide revisions and both M01 Player Briefing revisions; the M02 GM Field Guide and Player Briefing; the M02, M05, M06 Development/Capstone Bibles; the M03–M06 Playtest Simulation Reports; the Whole-Campaign Style & Balance Audit. Cross-referenced every named-NPC mention across all of the above.

## Findings

### D-01 — MAJOR: Recurring Covenant cast disappears after M02
Campaign Architecture states Venn's argument must evolve mission-by-mission through M06, and the M06 Capstone Bible builds an entire act ("Venn's Offer") around him still being the campaign's ideological antagonist. But a name search across every M03, M04, and M05 document returns zero hits for "Venn" or "Ellery." M05's Development Bible has only an unnamed "Covenant representative" placeholder. A GM drafting or running M03–M05 today has no record telling them whether Venn is even the person in the room.
**Why it matters:** the campaign's second-strongest asset (per the Whole-Campaign audit, its "social/ethical play") depends entirely on Venn/Ellery being recognizable across sessions — the exact thing currently undocumented.
**Disposition:** addressed by `P7-AP01_NPC_DOSSIERS_RECURRING_CAST_r001.md`'s Continuity Thread section, which now carries Venn's and Ellery's mission-by-mission evolution (already sketched in Campaign Architecture but never attached to a usable NPC record) forward through M06, with an explicit placeholder protocol for whichever GM drafts M03–M05 next.

### D-02 — MAJOR: No standard NPC presentation format
The two existing Cast sections use three different field sets for structurally similar roles. M01's protagonist (Quill) uses *First impression / Wants now / Will trust / Will resist / Useful line*; M01's Covenant pair uses *Role / Belief / Method / Weakness* (Venn adds Use); M02's protagonist (Mercer) uses *Wants / Fear / Voice / Line* — a different set again, for the same narrative slot Quill filled in M01. None of the three define voice/mannerism direction, and none point forward or backward to another mission.
**Why it matters:** a GM who has run M01 and picks up M02 mid-prep has to re-learn how to read the Cast section instead of pattern-matching.
**Disposition:** addressed by `P7-AP01_NPC_DOSSIER_STANDARD_r001.md`. The existing compact Cast blocks are not being replaced (see D-05) — the new standard is the format for anything beyond them.

### D-03 — WATCH: No GM-facing NPC continuity/callback tracker exists anywhere in the repo
The Campaign Architecture's "Consequence Engine" records mission-level state (Carrier state, Exposure, Covenant relationship) but nothing records NPC-level detail a GM would want mid-scene: a promise Venn made, a line Ellery used, which table's Aletheia already disclosed her uncertainty. That detail currently lives only in a GM's memory of a session run months earlier.
**Disposition:** addressed by the dossier standard's **Callback Log** section — a living table the GM fills in after each session, plus a **Session Recall Box** that surfaces the most recent entry for pre-session skimming.

### D-04 — WATCH: No path exists for promoting a minor NPC to recurring status
Nothing in the GM Presentation Standard (Campaign Architecture, "GM Presentation Standard for M02–M06") addresses what happens when players get attached to a background NPC never designed to recur — a common table event this diagnostic was specifically asked to plan for. Right now that NPC has nowhere to grow into.
**Disposition:** addressed by the dossier standard's two-tier design (Stub vs. Full Dossier) and its explicit promotion trigger.

### D-05 — PASS: Existing per-mission Cast blocks are strong and should not be rewritten
Quill's and Mercer's Cast entries are tight, table-usable, and already follow the Campaign Architecture's own instruction to write "playable motivations, not biographies." They should stay exactly as written. The new dossier format is additive — reserved for the recurring cast and for any local NPC a table has promoted — not a mandatory expansion of every named background character.

### D-06 — PROCESS: M03–M05 local cast is still provisional
Marchand (M03), Samira bat Malik / Diodoros / Nadiya / Marcellus (M05), and M04's cast (not yet named in the current draft tier) exist only inside Development Bible / Playtest Simulation Report tiers, not a drafted GM Field Guide. Per Campaign Architecture's own GM Presentation Standard, a Cast section only becomes final when its mission reaches Field Guide tier. Any dossier work for these NPCs is therefore deferred, not skipped — flag this diagnostic's disposition for revisit at that point.

### D-07 — WATCH: Aletheia has no dossier despite being the most-recurring character in the path
Aletheia is named in five of six mission-tier documents and is the one character guaranteed to appear in every session, yet — unlike Venn — she has never had a single Cast entry anywhere, because she reads as infrastructure rather than "cast." Her characterization already has one real seam: Campaign Architecture instructs "do not make it evasive merely to manufacture suspicion... answer what it knows honestly," while the M05/M06 Capstone material reveals she withheld the seven-stroke correlation specifically to avoid contaminating an experiment. Both are correct and intentional (the M06 bible is explicit that this must land as a real, unexcused decision, not retroactive omniscience) — but a GM improvising her voice at the table needs that seam documented, or risks playing her as either a liar from session one or a wall who never actually gets confronted.
**Disposition:** addressed by giving Aletheia the first dossier in `P7-AP01_NPC_DOSSIERS_RECURRING_CAST_r001.md`.

## Disposition

**AMBER — no story-architecture defect, one real continuity-infrastructure gap, now closed by these companion deliverables:**

1. `P7-AP01_NPC_DOSSIER_STANDARD_r001.md` — the standard format (this diagnostic's requested output).
2. `P7-AP01_NPC_DOSSIERS_RECURRING_CAST_r001.md` — filled dossiers for Aletheia, Silas Venn, and Mara Ellery, the three characters Campaign Architecture already designates as needing to recur across the whole path.

**Next checkpoint:** revisit D-01/D-06 when M03's GM Field Guide is drafted — that draft is the first point where Venn or Ellery must either be placed on stage by name or the Continuity Thread must be updated to say why they are not.
