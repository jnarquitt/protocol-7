/**
 * Protocol 7 v0.188 — Canonical Roll Builder / Evaluator
 * ------------------------------------------------------------
 * Authority: PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_ROLL_EVALUATOR_CONTRACT_r001.json
 *            PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_ADVANTAGE_DISADVANTAGE_AUTHORITY_r001.json
 *
 * There is exactly one entry point for building a roll pool
 * (buildRollPool) and exactly one entry point for rolling it
 * (rollPool). Every roll launcher in the eventual UI must call these
 * two functions and nothing else — that is what "one canonical roll
 * builder" (A38 / ARCH-002) means in practice.
 *
 * A42 human read-through (2026-08-27) found and fixed three canon-source
 * regressions the automated A42 text scan could not catch because nothing
 * in the Data Model Gate suite exercised these paths:
 *   1. dieValue() referenced a nonexistent State.DIE_SIDES lookup table —
 *      every call (including every rollPool() roll) threw. Fixed to call
 *      State.sidesOf(), which parses the die notation instead of
 *      hardcoding a size table.
 *   2. The ordinary Gear limit had a "|| 1" fallback that duplicated
 *      rulesCore.gear.ordinary_primary_relevant_limit as a JS literal.
 *      Fixed to require the canonical field and throw rather than fall
 *      back to a hardcoded value if it's ever missing.
 *   3. The Advantage die was hardcoded as 'd6' instead of read from
 *      rulesCore.dice_sources.advantage_disadvantage.advantage.die.
 * See app/tests/acceptance-data-model.js REG-01/REG-02 for regression
 * coverage of (1).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./state.js'));
  } else {
    root.P7 = root.P7 || {};
    root.P7.RollBuilder = factory(root.P7.State);
  }
}(typeof self !== 'undefined' ? self : this, function (State) {
  'use strict';

  // Side count comes from parsing the die notation (State.sidesOf), not a
  // hardcoded lookup table — same rule A42 already enforces in state.js.
  function dieValue(die) { return State.sidesOf(die); }

  function smallestDie(pool, sourceType) {
    var candidates = pool.filter(function (d) { return d.source_type === sourceType; });
    if (candidates.length === 0) return null;
    return candidates.reduce(function (min, d) {
      return dieValue(d.die) < dieValue(min.die) ? d : min;
    });
  }

  /**
   * Build an explainable roll pool. Never returns a numeric +N modifier —
   * every entry is a die with a named source (hard_failures in the
   * contract exist specifically to prevent that).
   *
   * @param {object} opts
   *   skillId, skillsRegistry (array), characterState, rulesCore,
   *   gearCandidates (array of {id,name,die}), vamCandidates (array of VAM
   *   records with explicit ADD_DIE effects), advantageReasons (array of
   *   strings), disadvantageReasons (array of strings),
   *   masteryAccessGranted (boolean)
   */
  function buildRollPool(opts) {
    var pool = [];
    var removedDice = [];
    var warnings = [];
    var restrictions = [];
    var requiresGmResolution = false;

    // Step 1 — RESOLVE_SKILL
    var skill = opts.skillsRegistry.filter(function (s) { return s.id === opts.skillId; })[0];
    if (!skill) throw new Error('hard_failure: unknown skill ID ' + opts.skillId);
    var ranks = (opts.characterState.skills[opts.skillId] || { ranks: 0 }).ranks;
    var skillDie = State.currentSkillDie(ranks, opts.rulesCore.skills.breakpoints);
    pool.push({ source_type: 'skill', source_id: opts.skillId, label: skill.name, die: skillDie, reason: ranks + ' ranks' });

    // Step 2 — RESOLVE_ABILITIES (duplicates intentional and preserved)
    skill.abilities.forEach(function (abilityId) {
      var die = State.currentAbilityDie(opts.characterState, abilityId, opts.rulesCore);
      pool.push({ source_type: 'ability', source_id: abilityId, label: abilityId, die: die, reason: 'Skill-linked Ability' });
    });

    // Step 3 — RESOLVE_GEAR (at most one primary relevant Gear die by default)
    var gearCandidates = opts.gearCandidates || [];
    if (!opts.rulesCore.gear || typeof opts.rulesCore.gear.ordinary_primary_relevant_limit !== 'number') {
      throw new Error('hard_failure: rulesCore.gear.ordinary_primary_relevant_limit is missing — refusing to fall back to a hardcoded gear limit');
    }
    var gearLimit = opts.rulesCore.gear.ordinary_primary_relevant_limit;
    if (gearCandidates.length > gearLimit) {
      warnings.push(gearCandidates.length + ' Gear candidates offered but ordinary limit is ' + gearLimit + ' — only the first was used');
    }
    gearCandidates.slice(0, gearLimit).forEach(function (g) {
      if (!g.die) { warnings.push('Gear "' + g.name + '" has no dice contribution and was not added'); return; }
      pool.push({ source_type: 'gear', source_id: g.id, label: g.name, die: g.die, reason: 'primary relevant gear' });
    });

    // Step 4 — RESOLVE_VAM (dice only from an explicit ADD_DIE effect — never implied)
    (opts.vamCandidates || []).forEach(function (v) {
      (v.effects || []).forEach(function (eff) {
        if (eff.op === 'ADD_DIE' && eff.die) {
          pool.push({ source_type: 'vam', source_id: v.id, label: v.name, die: eff.die, reason: 'explicit VAM effect' });
        }
      });
    });

    // Step 5 — RESOLVE_CONDITIONS (conditions may propose Disadvantage; GM adjudicates)
    var disadvantageReasons = (opts.disadvantageReasons || []).slice();
    (opts.activeConditions || []).forEach(function (cond) {
      var proposesDisadvantage = (cond.effects || []).some(function (e) { return e.type === 'CONDITIONAL_DISADVANTAGE'; });
      if (proposesDisadvantage) {
        disadvantageReasons.push(cond.name + ' (condition — GM adjudicated)');
        requiresGmResolution = true;
        restrictions.push(cond.name + ': Disadvantage applies only if the GM rules it actually hinders this action');
      }
    });

    // Step 6 — RESOLVE_ADV_DISADV (cancel 1-for-1, cap at one effective side)
    var advantageReasons = (opts.advantageReasons || []).slice();
    var cancelCount = Math.min(advantageReasons.length, disadvantageReasons.length);
    var netAdvantage = advantageReasons.length - cancelCount;
    var netDisadvantage = disadvantageReasons.length - cancelCount;

    if (netAdvantage > 0) {
      var advantageDie = opts.rulesCore.dice_sources.advantage_disadvantage.advantage.die;
      pool.push({ source_type: 'advantage', source_id: 'ADV', label: 'Advantage', die: advantageDie, reason: advantageReasons.slice(cancelCount).join('; ') });
    }
    if (netDisadvantage > 0) {
      var target = smallestDie(pool, 'ability');
      if (target) {
        pool = pool.filter(function (d) { return d !== target; });
        removedDice.push({ source_type: 'ability', source_id: target.source_id, die: target.die, reason: 'Disadvantage: ' + disadvantageReasons.slice(cancelCount).join('; ') });
      } else {
        warnings.push('Disadvantage applied but no Ability die was present to remove');
      }
    }

    // Step 7 — RESOLVE_MASTERY (only if Mastered AND explicit access is granted)
    var isMastered = (opts.characterState.progression.mastered_skill_ids || []).indexOf(opts.skillId) !== -1;
    if (isMastered && opts.masteryAccessGranted) {
      pool.push({ source_type: 'mastery', source_id: opts.skillId, label: skill.name + ' Mastery', die: skillDie, reason: 'Mastered Skill + legal access' });
    } else if (isMastered && !opts.masteryAccessGranted) {
      restrictions.push(skill.name + ' is Mastered but dormant — no legal access mechanism is active (MAST-003)');
    }

    // Step 8 — VALIDATE_POOL (every die must be fully named; reject silent modifiers)
    pool.forEach(function (d) {
      if (!d.source_type || !d.source_id || !d.die || !d.reason) {
        throw new Error('hard_failure: unidentified die source in pool: ' + JSON.stringify(d));
      }
    });

    // Step 9 — PRESENT_POOL
    var explanation = pool.map(function (d) {
      return d.label + ' (' + d.die + ', ' + d.source_type + ': ' + d.reason + ')';
    }).join('; ');
    if (removedDice.length) {
      explanation += ' | removed: ' + removedDice.map(function (d) { return d.label + ' (' + d.die + ', ' + d.reason + ')'; }).join('; ');
    }

    return {
      pool: pool,
      removedDice: removedDice,
      restrictions: restrictions,
      warnings: warnings,
      requiresGmResolution: requiresGmResolution,
      explanation: explanation
    };
  }

  /**
   * Rolls exactly the pool that was previewed (A24) — takes the same pool
   * array built by buildRollPool, never a re-derived copy. Blank faces
   * come from rulesCore.protocol_dice, not a local copy.
   */
  function rollPool(pool, rulesCore, rng) {
    rng = rng || Math.random;
    var blanks = rulesCore.protocol_dice.blank_faces;
    var results = pool.map(function (d) {
      var sides = dieValue(d.die);
      var face = Math.floor(rng() * sides) + 1;
      var scored = blanks.indexOf(face) === -1 ? face : 0;
      return { source_type: d.source_type, label: d.label, die: d.die, face: face, scored: scored };
    });
    var total = results.reduce(function (sum, r) { return sum + r.scored; }, 0);
    return { results: results, total: total };
  }

  return { buildRollPool: buildRollPool, rollPool: rollPool };
}));
