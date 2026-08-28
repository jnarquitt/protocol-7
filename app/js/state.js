/**
 * Protocol 7 v0.188 — Derived State
 * ------------------------------------------------------------
 * Authority: PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_DERIVED_STATE_AND_ROLL_BUILDER_CONTRACT_r001.md
 *
 * Derived-state law: the character save stores only player choices and
 * mutable play state. Every value in this file is *calculated* from
 * canonical rules data (rulesCore, passed in — never hardcoded here) plus
 * those choices. r002 note: an earlier draft of this file hardcoded the
 * die ladder, the starting Ability multiset, the blank-face set, and the
 * HP-per-level/Durable constants locally. That is exactly the
 * canon-source regression A42 exists to catch, so every one of those was
 * moved to read from rulesCore instead of being retyped here.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.P7 = root.P7 || {};
    root.P7.State = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SCHEMA_VERSION = 'p7-character-r002';
  var RULES_VERSION = '0.188-playtest';

  /** A die's side count comes from parsing its notation ("d12" -> 12), not a lookup table. */
  function sidesOf(die) { return parseInt(die.slice(1), 10); }

  /** Step a die along the canonical ladder, clamped at the canonical ceiling (ADV-008). */
  function stepDie(baseDie, steps, rulesCore) {
    var ladder = rulesCore.abilities.die_ladder;
    var idx = ladder.indexOf(baseDie);
    if (idx === -1) throw new Error('Unknown ability die: ' + baseDie);
    var ceilingIdx = ladder.indexOf(rulesCore.abilities.ceiling);
    var target = Math.min(idx + Math.max(0, steps), ceilingIdx);
    return ladder[target];
  }

  /** Current Ability die = base die + one step per legal Core Growth selection at/under current Level. */
  function currentAbilityDie(state, abilityId, rulesCore) {
    var base = state.abilities[abilityId].base_die;
    var steps = (state.progression.ability_growth || []).filter(function (g) {
      return g.ability_id === abilityId && g.level <= state.progression.level;
    }).length;
    return stepDie(base, steps, rulesCore);
  }

  /** Current Skill die from persisted ranks + the central breakpoint table. */
  function currentSkillDie(ranks, breakpoints) {
    var best = null;
    breakpoints.forEach(function (bp) {
      var inRange = ranks >= bp.min_ranks && (bp.max_ranks === null || bp.max_ranks === undefined || ranks <= bp.max_ranks);
      if (inRange) best = bp.die;
    });
    if (!best) throw new Error('No breakpoint matched ranks=' + ranks);
    return best;
  }

  /** A01 — legal starting Ability multiset must match rulesCore.abilities.starting_multiset (order-independent). */
  function validateStartingAbilities(dice, rulesCore) {
    var expected = rulesCore.abilities.starting_multiset.slice().sort();
    var got = dice.slice().sort();
    var legal = got.length === expected.length && got.every(function (d, i) { return d === expected[i]; });
    return {
      legal: legal,
      reason: legal ? null : 'Starting Abilities must be exactly one ' + expected.join(',') + ' multiset; got ' + got.join(',')
    };
  }

  /**
   * A02 — Skill Rank budget legality. Level 1 budget is
   * rulesCore.skills.starting_ranks; every Level after 1 adds
   * rulesCore.skills.ranks_per_level_after_1 more (ADV-002/next-developer
   * instructions: "+4 Skill Ranks each level after 1 and all ranks
   * legally allocated"). level defaults to 1 so existing Level-1-only
   * callers/tests are unaffected.
   */
  function allocateSkillRanks(skillsMap, rulesCore, level) {
    // skillsMap uses the same shape as the persisted character schema:
    // { [skillId]: { ranks: N } } — not a bare number — so this function
    // can validate the actual character.skills object with no reshaping.
    var lvl = level || 1;
    var totalBudget = rulesCore.skills.starting_ranks + rulesCore.skills.ranks_per_level_after_1 * (lvl - 1);
    var spent = Object.keys(skillsMap || {}).reduce(function (sum, id) { return sum + ((skillsMap[id] && skillsMap[id].ranks) || 0); }, 0);
    var legal = spent <= totalBudget;
    return {
      legal: legal,
      spent: spent,
      budget: totalBudget,
      remaining: totalBudget - spent,
      reason: legal ? null : 'Spent ' + spent + ' ranks against a budget of ' + totalBudget + ' — overspend of ' + (spent - totalBudget)
    };
  }

  /** A05 — a Vitality face must be legal (1..sides) for the Ability die used during the ritual. */
  function validateVitalityFaces(faces, startingAbilityDice, rulesCore) {
    var problems = [];
    rulesCore.abilities.ids.forEach(function (id) {
      var face = faces[id];
      var die = startingAbilityDice[id];
      var max = sidesOf(die);
      if (typeof face !== 'number' || face < 1 || face > max) {
        problems.push(id + ': face ' + face + ' is not legal for ' + die + ' (1-' + max + ')');
      }
    });
    return { legal: problems.length === 0, problems: problems };
  }

  /**
   * A06/A07/A08 — starting HP from the Vitality Ritual, per rulesCore.vitality.
   * All-blanks exception, otherwise 18(base_hp)+highest qualifying face; ties
   * require the caller to supply chosenOriginId since only the player breaks a tie.
   */
  function vitalityResult(faces, chosenOriginId, rulesCore) {
    var blanks = rulesCore.vitality.blank_faces;
    var ids = rulesCore.abilities.ids;
    var qualifying = ids.filter(function (id) { return blanks.indexOf(faces[id]) === -1; });

    if (qualifying.length === 0) {
      return { startingHp: rulesCore.vitality.all_six_blank_exception_starting_hp, originAbilityId: null, allBlanksException: true, tie: false };
    }

    var highest = Math.max.apply(null, qualifying.map(function (id) { return faces[id]; }));
    var tiedAbilities = qualifying.filter(function (id) { return faces[id] === highest; });
    var hp = rulesCore.vitality.base_hp + highest;

    if (tiedAbilities.length > 1) {
      if (!chosenOriginId || tiedAbilities.indexOf(chosenOriginId) === -1) {
        return {
          startingHp: hp, originAbilityId: null, allBlanksException: false, tie: true, tiedAbilities: tiedAbilities,
          reason: 'Tied highest face (' + highest + ') among ' + tiedAbilities.join(', ') + ' — player must choose Vitality Origin'
        };
      }
      return { startingHp: hp, originAbilityId: chosenOriginId, allBlanksException: false, tie: true, tiedAbilities: tiedAbilities };
    }

    return { startingHp: hp, originAbilityId: tiedAbilities[0], allBlanksException: false, tie: false };
  }

  /** A09/A10 — max HP = starting HP + (hp_per_level_after_1) per Level after 1, + Durable Edge's max_hp_add if selected and Level >= 2. */
  function maxHp(startingHp, level, hasDurable, rulesCore) {
    var perLevel = rulesCore.vitality.hp_per_level_after_1;
    var durableEdge = rulesCore.edges.filter(function (e) { return e.id === 'durable'; })[0];
    var durableBonus = (hasDurable && level >= 2 && durableEdge) ? durableEdge.max_hp_add : 0;
    return startingHp + perLevel * (level - 1) + durableBonus;
  }

  /** A03 — BAR ceiling for a Level, from the central Level table. */
  function barCeiling(level, rulesCore) {
    return rulesCore.levels[String(level)].bar;
  }

  /** A03 — the VAM authorization label active at a Level (e.g. Level 1 -> "STANDARD"). */
  function authorizationForLevel(level, vamData) {
    return vamData.authorization[String(level)];
  }

  /** Mastery slots available at a Level, from the central Level table (not a separate hardcoded map). */
  function masterySlots(level, rulesCore) {
    return rulesCore.levels[String(level)].mastery_slots;
  }

  /** A15/A16 — is a VAM loadable given current Level and current loaded BAR? */
  function vamLegality(vam, currentLevel, currentLoadedBar, rulesCore) {
    var ceiling = barCeiling(currentLevel, rulesCore);
    var authOk = vam.level <= currentLevel;
    var barOk = currentLoadedBar + vam.bar <= ceiling;
    var prereqsOk = !vam.prerequisites || vam.prerequisites.length === 0; // no prerequisite field observed in the current catalog
    var legal = authOk && barOk && prereqsOk;
    var reasons = [];
    if (!authOk) reasons.push('requires authorization level ' + vam.level + ', current Level is ' + currentLevel);
    if (!barOk) reasons.push('would load BAR to ' + (currentLoadedBar + vam.bar) + ', ceiling is ' + ceiling);
    return { legal: legal, reasons: reasons };
  }

  /**
   * A18 — replacing already-loaded VAMs during active play costs exactly
   * rulesCore.vam.field_swap_ap_cost AP for the whole swap, regardless of
   * how many VAM slots changed. Loading into unused capacity outside an
   * active swap (A17) is a plain array update with no AP cost, so it has
   * no dedicated function here — the caller simply doesn't call this one.
   */
  function fieldSwap(play, rulesCore) {
    var cost = rulesCore.vam.field_swap_ap_cost;
    if (play.current_ap < cost) {
      return { legal: false, play: play, reason: 'Field Swap costs ' + cost + ' AP; only ' + play.current_ap + ' AP available' };
    }
    return { legal: true, play: Object.assign({}, play, { current_ap: play.current_ap - cost }), reason: 'Field Swap charged ' + cost + ' AP for the whole swap' };
  }

  /** A18 — loaded BAR is the sum of bar_cost for every currently loaded VAM. */
  function loadedBar(loadedVamIds, vamCatalog) {
    var byId = {};
    vamCatalog.forEach(function (v) { byId[v.id] = v; });
    return loadedVamIds.reduce(function (sum, id) {
      if (!byId[id]) throw new Error('Unknown VAM id in loadout: ' + id);
      return sum + byId[id].bar;
    }, 0);
  }

  /** A14 — does reducing to targetLevel invalidate any currently-recorded choice? */
  function levelReductionWarnings(state, targetLevel, rulesCore) {
    var warnings = [];
    (state.progression.ability_growth || []).forEach(function (g) {
      if (g.level > targetLevel) warnings.push('Ability growth at Level ' + g.level + ' (' + g.ability_id + ') would become illegal');
    });
    var masterySlotsAtTarget = masterySlots(targetLevel, rulesCore);
    if ((state.progression.mastered_skill_ids || []).length > masterySlotsAtTarget) {
      warnings.push('Level ' + targetLevel + ' only allows ' + masterySlotsAtTarget + ' Mastered Skill(s); character currently has ' + state.progression.mastered_skill_ids.length);
    }
    if (state.progression.edge_id) {
      var edgeSlotsAtTarget = rulesCore.levels[String(targetLevel)].edge_slots;
      if (edgeSlotsAtTarget < 1) warnings.push('Edge "' + state.progression.edge_id + '" requires a Level with at least one edge slot');
    }
    return { hasWarnings: warnings.length > 0, warnings: warnings };
  }

  /** Builds a schema-conformant character object (see CHARACTER_STATE_SCHEMA_r001.json). */
  function createCharacter(opts, rulesCore) {
    var now = new Date().toISOString();
    var abilities = {};
    rulesCore.abilities.ids.forEach(function (id) { abilities[id] = { base_die: opts.abilityDice[id] }; });
    var faces = {};
    rulesCore.abilities.ids.forEach(function (id) { faces[id] = (opts.vitalityFaces && opts.vitalityFaces[id]) || null; });

    return {
      schema_version: SCHEMA_VERSION,
      rules_version: RULES_VERSION,
      identity: { character_name: opts.name || '' },
      progression: {
        level: opts.level || 1,
        edge_id: null,
        ability_growth: [],
        mastered_skill_ids: []
      },
      abilities: abilities,
      vitality: {
        faces: faces,
        origin_ability_id: opts.originAbilityId || null,
        all_blanks_exception: !!opts.allBlanksException
      },
      skills: opts.skillRanks || {},
      vams: { loaded_ids: [], active_preset_id: opts.presetId || null },
      gear: { selected_ids: [] },
      play: {
        current_hp: opts.startingHp || 0,
        current_ap: rulesCore.action_economy.ap_max,
        reaction_available: true,
        borrowed_next_ap: 0,
        conditions: [],
        edge_used: false
      },
      mission: { exposure: 0, carrier_state: null },
      meta: { created_at: now, updated_at: now, source_preset_id: opts.presetId || null }
    };
  }

  /**
   * Minimal structural validation against CHARACTER_STATE_SCHEMA_r001.json.
   * Hand-rolled (no external schema-validator dependency, since this is a
   * zero-build-step static site) but checks the same required fields the
   * canonical schema requires, plus the version pair that gates A35/A36.
   */
  function validateCharacterShape(obj, rulesCore) {
    var problems = [];
    var topRequired = ['schema_version', 'rules_version', 'identity', 'progression', 'abilities', 'vitality', 'skills', 'vams', 'gear', 'play', 'mission', 'meta'];
    topRequired.forEach(function (k) {
      if (!(k in obj)) problems.push('missing required field: ' + k);
    });
    if (obj.schema_version !== SCHEMA_VERSION) problems.push('unsupported schema_version: ' + obj.schema_version + ' (expected ' + SCHEMA_VERSION + ')');
    if (obj.rules_version !== RULES_VERSION) problems.push('unsupported rules_version: ' + obj.rules_version + ' (expected ' + RULES_VERSION + ')');
    if (obj.abilities && rulesCore) {
      rulesCore.abilities.ids.forEach(function (id) {
        if (!obj.abilities[id] || !obj.abilities[id].base_die) problems.push('missing abilities.' + id + '.base_die');
      });
    }
    return { legal: problems.length === 0, problems: problems };
  }

  /**
   * A26/A26B/A26C/A26D — movement feet for a given AP spend, read from
   * rulesCore.action_economy.movement (no universal Run action exists in
   * the data, so there is nothing here to key one off of).
   */
  function movementFeet(apSpent, rulesCore) {
    return apSpent * rulesCore.action_economy.movement.feet_per_ap;
  }

  /**
   * A27 — Reaction resolution. Uses banked (unspent) current_ap first;
   * only borrows from next turn if no AP is currently banked, capped at
   * rulesCore.reaction.max_borrowed_ap. Returns a new play object rather
   * than mutating the caller's.
   */
  function resolveReaction(play, rulesCore) {
    if (!play.reaction_available) {
      return { legal: false, play: play, reason: 'No Reaction available' };
    }
    var next = Object.assign({}, play);
    if (play.current_ap > 0) {
      next.current_ap = play.current_ap - 1;
      next.reaction_available = false;
      return { legal: true, play: next, reason: 'Spent 1 banked AP on Reaction' };
    }
    var maxBorrow = rulesCore.reaction.max_borrowed_ap;
    if ((play.borrowed_next_ap || 0) >= maxBorrow) {
      return { legal: false, play: play, reason: 'No banked AP and next-turn AP is already fully borrowed' };
    }
    next.borrowed_next_ap = (play.borrowed_next_ap || 0) + 1;
    next.reaction_available = false;
    return { legal: true, play: next, reason: 'No banked AP — borrowed 1 AP from next turn for Reaction' };
  }

  /**
   * Start-of-turn AP/Reaction reset. Unused banked AP expires (does not
   * carry forward); any AP borrowed by a Reaction is deducted from the
   * fresh allotment; Reaction availability resets for the new between-turn
   * window.
   */
  function startNewTurn(play, rulesCore) {
    var apMax = rulesCore.action_economy.ap_max;
    return Object.assign({}, play, {
      current_ap: apMax - (play.borrowed_next_ap || 0),
      borrowed_next_ap: 0,
      reaction_available: true
    });
  }

  /**
   * Active-defense combat resolution (COMBAT authority in rulesCore):
   * a hit requires attacker total > defender total; damage is the margin.
   * No universal critical subsystem, no separate weapon damage die.
   */
  function resolveAttack(attackTotal, defenseTotal) {
    var hit = attackTotal > defenseTotal;
    return { hit: hit, damage: hit ? attackTotal - defenseTotal : 0, margin: attackTotal - defenseTotal };
  }

  /** Apply damage/healing to current HP, clamped to [0, maxHpValue]. */
  function applyHpChange(currentHp, delta, maxHpValue) {
    return Math.max(0, Math.min(maxHpValue, currentHp + delta));
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    RULES_VERSION: RULES_VERSION,
    sidesOf: sidesOf,
    stepDie: stepDie,
    currentAbilityDie: currentAbilityDie,
    currentSkillDie: currentSkillDie,
    validateStartingAbilities: validateStartingAbilities,
    allocateSkillRanks: allocateSkillRanks,
    validateVitalityFaces: validateVitalityFaces,
    vitalityResult: vitalityResult,
    maxHp: maxHp,
    barCeiling: barCeiling,
    authorizationForLevel: authorizationForLevel,
    masterySlots: masterySlots,
    vamLegality: vamLegality,
    fieldSwap: fieldSwap,
    loadedBar: loadedBar,
    levelReductionWarnings: levelReductionWarnings,
    createCharacter: createCharacter,
    validateCharacterShape: validateCharacterShape,
    movementFeet: movementFeet,
    resolveReaction: resolveReaction,
    startNewTurn: startNewTurn,
    resolveAttack: resolveAttack,
    applyHpChange: applyHpChange
  };
}));
