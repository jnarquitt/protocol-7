# Protocol 7 v0.188 — Product & Learning Design Principles

**Status:** Active design authority for the living v0.188 playtest. These are product/interface principles, not locked game mechanics.

## Product purpose
Protocol 7's app is a tabletop learning and play interface, not a replacement for tabletop play. A player should be able to arrive at an in-person session with only a phone and dice and feel confident that the app contains what they need to create, understand, manage and play their Vector.

Digital rolling remains a first-class option. Many modern TTRPG players expect to play from a browser or phone, including at physical tables. The app must therefore support both digital and physical rolling without treating either as secondary or incomplete.

The app carries cognitive complexity; the table carries the social and tactile experience.

## Three governing principles

### 1. Playable before understood; understood because played
A new player should be able to begin successfully before mastering Protocol 7's terminology or rules. The interface teaches through use, repetition and contextual explanation (scaffolding / learning by doing).

### 2. Phone + dice is enough
For in-person play, the player should not need a separate rulebook, printed character sheet, reference packet, calculator, or browser research. The phone should provide character state, rules access, pool assembly, explanations and optional digital rolling. Physical dice remain fully supported and intentionally satisfying.

### 3. Build elsewhere. Play on PLAY.
Creation and management surfaces choose or change the Vector. PLAY is the sole normal action-resolution surface. Skills, loaded VAMs, Gear, resources and current conditions converge there. Actionable selections elsewhere may take the player automatically to PLAY with context already selected, but they do not create competing rollers.

## Learning design requirements

- Use progressive disclosure: show information when it becomes relevant instead of front-loading the full rules system.
- Prefer recognition over recall: present available actions/resources instead of requiring players to remember names or rules.
- Teach the mental model while completing real tasks. Pool assembly should visibly identify Skill, Ability, Gear, VAM, Advantage and Mastery sources.
- Use consistent placement, wording and interaction patterns to reduce cognitive load.
- Avoid unnecessary typing on mobile. Character name is the expected free-text exception; normal choices should be selectable controls.
- Give immediate, meaningful feedback after choices and rolls.
- Provide short contextual explanations before forcing players to leave PLAY and search reference material.
- Advanced detail should remain accessible in a few taps without overwhelming a first-time player.
- Professional visual hierarchy and restraint are requirements, not decoration. Avoid clutter, novelty UI and unnecessary complexity.

## Dual rolling requirement
Every ordinary roll must support two equivalent paths from the same assembled pool:

**Physical dice:** clearly show exactly which dice to pick up and why each die is present. The player rolls them at the table and can enter/resolve results with minimal friction where needed.

**Digital dice:** one-tap rolling from the same assembled pool, with readable results and the same rules interpretation.

Neither path may contain rules or modifiers unavailable to the other. Digital rolling is convenience/accessibility; physical rolling preserves the tactile ritual and anticipation many tabletop players value.

## Evaluation standard
Feature completion is not merely 'the button works.' Testing asks:

- Can a first-time player discover what to do without prior rules study?
- Does the interface teach why the action works while helping the player perform it?
- Can an experienced player reach the same action quickly without tutorial friction?
- Can a physical-dice player see the complete pool without doing hidden arithmetic?
- Can a digital-dice player resolve it in the app without a second workflow?
- Can a mobile player operate it comfortably with minimal typing?
- Does the feature keep attention at the table rather than unnecessarily trapping the player in the phone?
- After repeated use, is the player learning Protocol 7's rules and vocabulary naturally?

These questions are acceptance criteria: conditions a feature should satisfy before it is considered correctly implemented.

## Simulation/test persona implications
Maya (first-time player) now tests discoverability and learning transfer, not merely task completion. Alex (physical dice) and a digital-roller path must receive equivalent information. Jordan tests one-handed/mobile cognitive and interaction load. Experienced personas test speed and depth after the teaching layer is no longer needed.

The persistent action checklist should test not only whether an action can be resolved, but whether a player can discover the correct resolution naturally from PLAY.

## Design filter
Before adding a feature, ask:

1. Does this help the player do something at the table?
2. Is the information appearing at the moment it is useful?
3. Are we making the player remember something the app already knows?
4. Are we adding another place to perform an action that belongs on PLAY?
5. Does this preserve equal physical- and digital-dice support?
6. Does it make the game easier to learn without making experienced play slower?
7. Is the interface professionally restrained and immediately understandable?

If the answer exposes unnecessary complexity, redesign before adding more interface.