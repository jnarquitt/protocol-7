# P7-AP01 — The Continuance Files
## NPC Dossier Standard r001

**Status:** Adventure Path design authority for NPC presentation, additive to the Campaign Architecture's existing GM Presentation Standard.
**Produced by:** `P7-AP01_ADVENTURE_PATH_LEVEL_10_DIAGNOSTIC_r001.md`, finding D-02/D-03/D-04.
**Does not change:** the existing compact Cast blocks in the M01/M02 GM Field Guides ("playable motivations, not biographies"). Those stay as-is — see Scope below.

## Why this exists

A GM never knows in advance which NPC a table will love. Sometimes it's Silas Venn, built to recur. Sometimes it's the relief sergeant who got one line in Scene 2 and now the players ask about him every session. Protocol 7's Adventure Path needs one consistent place to answer three questions for *any* character, no matter how small:

1. **How do I play them** — voice, tactics, what they'd never do — so two different sessions of the same NPC feel like the same person?
2. **What can I plant now** that costs nothing if it's never picked up, but pays off if this character comes back?
3. **What happened last time** — a place to look back to before the next session, instead of relying on memory?

## Scope — two tiers, not one mandatory form

**Tier 1 — Stub (default for every named NPC).** The Cast block already used in M01/M02: a handful of fields (Wants / Fear or Obstacle / Voice / Line, or the nearest equivalent) inline in the mission's own GM Field Guide. This is sufficient for the large majority of named characters and should not be expanded by default. Writing a full dossier for every walk-on NPC would bury the ones that matter.

**Tier 2 — Full Dossier (this standard).** Reserved for:
- any character Campaign Architecture already designates as campaign-recurring (currently: Aletheia, Silas Venn, Mara Ellery);
- any local/mission NPC a table has visibly latched onto — the promotion trigger below.

### Promotion trigger

Promote a Tier 1 stub to a Tier 2 dossier the first time **any** of these happens:
- the GM decides to bring the NPC back in a later mission or session, for any reason;
- players ask about the NPC after the session in which they appeared, unprompted;
- the GM catches themselves improvising a detail about the NPC that isn't written down anywhere (a name, a habit, a relationship) — write it into a dossier before it's needed again, not after.

Promotion costs one dossier, most of which can be filled from what already happened at the table. It is cheaper to promote a character the session after players like them than to reconstruct their voice from memory two months later.

## The Full Dossier Template

Copy this block per character. Every section is short by design — this is a table reference, not a biography.

```markdown
## <Name> — <one-line role/faction tag>

**Snapshot**
- First appears: <mission/scene>
- Status: <alive / dead / unknown / last seen ...>
- Last session touched: <mission/scene, or "not yet recurred">
- One-line hook: <the single sentence a GM re-reads 30 seconds before this NPC is on stage>

**Playable Motivations**
- Wants:
- Fear:
- Leverage (what someone could use on them, or they could use on the Vectors):
- Voice:
- Useful line:

**How to Play This Character**
- Physicality/mannerism: <one or two concrete, repeatable tells — not a paragraph>
- Default tactic under pressure: <what they actually do, not what they'd say they'd do>
- If players push <specific likely approach> → they <specific reaction>
- What they would never do: <the boundary that keeps them consistent across GMs/sessions>

**Foreshadowing Bank** *(plant now, redeem later — each one costs nothing if never picked up)*
- <a droppable detail — object, phrase, rumor, name> → pays off if <specific future mission/theme, or "open — any later recurrence">
- <same pattern, second hook>
- <same pattern, third hook — optional; two or three is enough>

**Continuity Thread Across Missions** *(recurring cast only — delete this section for a promoted one-mission NPC)*
| Mission | What changed | What they now know/believe |
|---|---|---|
| M01 | | |
| M02 | | |

**Callback Log** *(GM fills this in after actual play — this is the "place to look back to")*
| Session/Date | Table | What happened | Promises/threads left open |
|---|---|---|---|
| | | | |

**Session Recall Box** *(update this one line after every appearance — read this, not the whole log, before the NPC's next scene)*
> Last seen: <mission/scene>. Currently: <one sentence — where they are, what they want right now, what's unresolved>.
```

## Field notes

- **Foreshadowing Bank is written before you know if it'll be used.** That's the point — it's cheap insurance, not a commitment. A hook that's never redeemed is invisible to the players and cost nothing to write. Tag each with where it *could* pay off if the GM already has a guess (a later mission's theme), or leave it "open" if not.
- **Continuity Thread is where Campaign Architecture's own per-mission notes (e.g. Venn's evolving argument, already sketched mission-by-mission in the Campaign Architecture's "Recurring Characters" section) actually live going forward** — that sketch was campaign-design intent; the dossier is where it becomes something a GM opens mid-prep.
- **The Callback Log is a living document, not a template to admire.** It should look sparse right after a dossier is created and fill in as the campaign is actually played. An empty log is not a defect; an empty log after three sessions featuring that NPC is.
- **Keep the Session Recall Box to one sentence.** Its entire value is that a GM can read it in the time it takes to sit down at the table. If it needs more than a sentence, that detail belongs in the Callback Log instead.

## Where dossiers live

One file per logical group, not per character, so a GM has one place to open:
- `P7-AP01_NPC_DOSSIERS_RECURRING_CAST_r001.md` — campaign-spanning cast (Aletheia, Venn, Ellery, and any future addition to that set).
- A per-mission dossier file (e.g. `P7-AP01-M0x_NPC_DOSSIERS_r001.md`) should be created the first time a mission promotes a local NPC — do not pre-create empty files for missions that haven't promoted anyone yet.
