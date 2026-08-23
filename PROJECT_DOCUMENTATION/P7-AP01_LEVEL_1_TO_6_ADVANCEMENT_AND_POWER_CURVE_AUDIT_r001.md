# P7-AP01 — Level 1–6 Advancement & Power-Curve Audit r001

**Campaign:** The Continuance Files  
**Core baseline:** Protocol 7 v0.187 PRE-BETA  
**Campaign leveling target:** Level 1 at M01 through Level 6 at M06  
**Status:** Advancement audit / second-pass mechanical design gate  
**Result:** AMBER-RED — campaign progression target is sound, but canonical advancement awards are not yet sufficiently specified to run a true persistent-sheet Level 1→6 simulation.

## Executive finding

The campaign-level progression target is coherent: M01 at Level 1, M02 at Level 2, M03 at Level 3, M04 at Level 4, M05 at Level 5, and M06 at Level 6. That pacing should remain the Adventure Path target.

However, Protocol 7 v0.187's canonical structured rules source defines starting resources and progression breakpoints, but it does **not** define a complete level-advancement award schedule. The current campaign plan correctly states that exact award packages must be derived from canonical advancement rules before final release, but the canonical data presently available in the repository does not state how many Skill Ranks, Ability increases, VAM acquisitions, gear improvements, or other benefits a Vector receives at Level 2, Level 3, and so on.

Therefore this audit must distinguish between:

1. **what can be evaluated now** — the shape and sensitivity of the existing mechanics; and
2. **what cannot be honestly simulated yet** — the actual persistent character sheet at each level.

Do not invent an Adventure-only advancement currency to fill this gap.

## Confirmed frozen progression-related mechanics

The v0.187 canonical source establishes:

- starting Ability dice: d8, d8, d6, d6, d4, d4;
- starting Skill Ranks: 20;
- Skill breakpoints: rank 0 d4, 1 d6, 3 d8, 6 d10, 10 d12, then multi-die progression at 15, 21, 28, 36, and 45;
- ranks between breakpoints are Progress Ranks and do not increase the Skill die until the next breakpoint;
- HP = CON die maximum × 3;
- 3 AP per turn;
- one normal Reaction;
- standard BAR capacity 16;
- VAM field reconfiguration costs 1 AP when replacement/unloading is required.

These are frozen. This audit does not alter them.

## Skill-die power curve

Because 1–3 are blank and every 4+ scores at face value, each die step changes both the chance to contribute and the expected score contributed by that die.

| Die | Chance die scores | Expected score contribution |
|---|---:|---:|
| d4 | 25% | 1.00 |
| d6 | 50% | 2.50 |
| d8 | 62.5% | 3.75 |
| d10 | 70% | 4.90 |
| d12 | 75% | 6.00 |

### Finding: early Skill advancement is very noticeable

The jump from untrained d4 to trained d6 is enormous: expected contribution rises from 1.00 to 2.50 and scoring frequency doubles. d6→d8 is also substantial. Later steps remain useful but are less explosive.

This is good for the desired campaign feel **if** advancement regularly crosses meaningful breakpoints.

### Finding: Progress Ranks can create dead-feeling levels

Ranks 1→3, 3→6, 6→10, and later thresholds contain stretches where Progress Ranks accumulate without changing the current Skill die. If a level award happens to consist primarily of ranks that do not cross any breakpoint, the player may technically advance while feeling almost no immediate mechanical change.

The campaign standard already requires every post-mission advancement to produce at least one immediately noticeable payoff. That requirement should become a hard advancement-package test.

The solution should not be to alter Skill breakpoints casually. The solution is first to determine the actual canonical award package and see whether the existing progression naturally produces at least one breakpoint, Ability change, VAM/gear option, HP change, or other tangible benefit at each mission boundary.

## Ability dice and HP sensitivity

HP is entirely tied to CON die size under the frozen formula:

- d4 CON = 12 HP
- d6 CON = 18 HP
- d8 CON = 24 HP
- d10 CON = 30 HP
- d12 CON = 36 HP

That means a one-step CON increase creates a **6 HP jump** at every step.

This is a large and clean survivability increase. It also means that if Ability advancement is rare or absent from Levels 1–6, HP may remain completely static for much of the campaign.

### Audit question requiring canonical clarification

How often may a Vector improve an Ability die as part of advancement, and what is the cost/tradeoff relative to Skill progression or other rewards?

Without that answer, no honest Level 1→6 survivability simulation can be completed.

## AP economy

The fixed 3-AP economy should **not** scale upward with level merely to create a sense of advancement.

This is a positive finding.

A higher-level Vector can feel dramatically more capable while still having 3 AP because better Skills, VAM choices, gear, positioning, preparation, and reliable actions make each AP more valuable. Keeping AP fixed also protects combat duration and tactical clarity.

Second-pass adventure design should therefore challenge Level 5–6 characters with simultaneous objectives and opportunity cost rather than giving enemies inflated defenses or giving PCs more turns inside each turn.

## VAM/BAR progression

BAR is frozen at 16 capacity.

That is compatible with meaningful growth if higher-level Vectors acquire a broader library of VAMs, better combinations, or stronger mission-specific choices. The character becomes more versatile without simply being able to load everything at once.

This is desirable for the campaign's Level 1→6 target because it creates veteran **choice complexity** rather than raw capacity inflation.

### Canonical gap

The structured v0.187 source does not specify a level-by-level VAM acquisition schedule. Before persistent campaign simulation, determine what advancement actually grants in terms of VAM access or acquisition.

## Gear progression

The one-primary-gear-die rule prevents high-level gear from turning into bonus stacking. That is healthy.

For campaign growth, gear rewards should primarily create:

- new problem-solving options;
- better die sizes on specific tasks;
- period-specific mission preparation choices;
- new tactical capabilities;
- choices about Exposure.

Gear should not become an Adventure-only replacement for an underdefined level system.

## Expected campaign feel by level

This remains the correct target pending canonical award clarification:

| Protocol 7 level | Campaign role | Desired feel |
|---|---|---|
| 1 — M01 | New Vector | Capable but uncertain; individual failed actions can swing a scene. |
| 2 — M02 | Defined operative | Signature competence clearly improves; player begins making stronger loadout choices. |
| 3 — M03 | Established Vector | Reliable specialties plus enough breadth to solve problems in more than one way. |
| 4 — M04 | Strong specialist | Earlier-style obstacles should visibly feel easier; player decisions matter more than basic competence. |
| 5 — M05 | Veteran | City-scale triage and simultaneous objectives challenge priorities rather than routine checks. |
| 6 — M06 | Capstone operative | Individual technical/social/action problems are often solvable; the hard part is deciding what to solve and what consequences to accept. |

This still broadly maps to the intended emotional span of a d20 Level 1→12 campaign without copying d20 mathematics.

## Four representative build tests required once awards are canonicalized

The eventual persistent-sheet simulation must advance the same characters from M01 through M06 using actual awards, not hand-built snapshots.

### Balanced four-Vector team
Track general campaign reliability, HP pressure, AP use, VAM changes, Exposure, and spotlight distribution.

### Combat-specialized team
Determine whether combat investment matters enough in M02–M06 without allowing combat builds to brute-force investigative or Carrier problems.

### Investigation/social-heavy team
Determine whether these characters dominate M01–M04 and remain meaningfully challenged/valuable during M05–M06 physical crises.

### Broad/generalist team
Determine whether spreading advancement creates a viable resilient operative or produces a character who never crosses enough Skill breakpoints to feel powerful.

## Major risk: breakpoint optimization

Because Skill ranks only change the die at specific cumulative thresholds, rational players may strongly prefer concentrating ranks until a breakpoint is crossed rather than spreading ranks broadly.

That can be healthy specialization, but the audit must test whether the optimal strategy becomes so obvious that generalist advancement is punished.

Particular attention should be paid to:

- pushing multiple important Skills to rank 1 early for the d4→d6 jump;
- concentrating signature Skills to rank 3 or 6;
- whether Progress Ranks feel wasted when a campaign ends before the next threshold;
- whether a Level 6 Vector can reasonably possess both a strong specialty and credible secondary competence.

Do not change the thresholds from this paper analysis alone. Record this as a mandatory simulation question.

## Adventure difficulty implications for the second pass

Until canonical awards are resolved:

- do not globally raise target numbers by mission number;
- keep M01 baseline difficulties useful as a reference point later;
- let veteran characters automatically or routinely handle some earlier-tier problems where appropriate;
- scale pressure through clocks, simultaneity, hostile positioning, rescue obligations, incomplete information, Exposure, and multiple Carrier routes;
- ensure combat threats test tactical choices and consequences, not simply larger HP pools;
- give M02–M04 the additional kinetic set pieces identified by the Style & Balance Audit without assuming unverified level math.

## Classification

### BLOCKER — canonical advancement award schedule

Before the campaign can become release-candidate material, the repository needs an authoritative description of what advancement from Level 1→2, 2→3, 3→4, 4→5, and 5→6 actually awards under Protocol 7.

This does **not** necessarily mean the rules themselves are missing from the live player products. It means the current canonical structured source used for ecosystem auditing does not contain enough information to reconstruct and simulate the progression reliably.

Resolve by either:

1. locating and canonizing the already-approved advancement rules from the current live artifacts; or
2. if no complete rule exists, explicitly designing and approving advancement as a core-rule change rather than hiding it inside the Adventure Path.

### MAJOR — noticeable reward every mission

Whatever the canonical package is, each mission boundary must produce at least one immediate visible mechanical or option-based improvement.

### MAJOR — generalist viability

Test whether Progress Rank breakpoints over-reward narrow concentration across a six-level campaign.

### MAJOR — survivability curve

Test HP/damage pressure only after Ability advancement frequency is known.

### MAJOR — VAM growth curve

Clarify VAM acquisition/access so Level 6 has clearly greater tactical breadth while BAR remains 16.

## Audit verdict

**AMBER-RED.**

The campaign's intended Level 1→6 progression remains a strong design target, and the frozen mechanics appear capable of supporting a satisfying power curve. The main risk is not obvious mathematical failure; it is that the canonical ecosystem does not presently expose enough advancement information to run the required persistent-party simulation.

Do not rebalance M01–M06 around invented level benefits.

The next mechanical step is to resolve/canonize the existing Protocol 7 advancement award rules, then run the persistent-party simulations and produce r002 of this audit with measured results.

No frozen v0.187 mechanic was changed by this audit.
