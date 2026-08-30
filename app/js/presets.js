/**
 * Protocol 7 v0.188 — Level 1 VAM Preset Loadouts
 * ------------------------------------------------------------
 * Source: PROJECT_DOCUMENTATION/P7_v0.188_LEVEL_1_VAM_PRESETS_FINAL_CANDIDATE_r001.md
 * ("GREEN CANDIDATE" — fourteen named Level 1 Standard loadouts; "not
 * classes"; players may substitute freely).
 *
 * This module holds only the *composition* of each preset (which VAM IDs,
 * suggested Ability priority, and suggested starting Skill ranks belong to
 * which named identity) — a product/UX curation decision, not a mechanical
 * constant. It does not restate BAR cost, Skill die, or any other
 * mechanical value: those are looked up live from the canonical databases
 * by validatePresets()/presetLoadedBar() every time, so a future catalog
 * change is reflected automatically instead of silently going stale here
 * (the same canon-source-regression concern A42 exists for).
 *
 * A preset is a non-binding starting point only. ability_priority and
 * skills below are suggestions the creation wizard pre-fills onto the
 * otherwise-neutral Ability array and otherwise-empty Skill ranks — every
 * value they set remains exactly as editable, before and after character
 * creation, as if the player had entered it by hand. Nothing a preset sets
 * is ever locked.
 *
 * validatePresets() must be called once at boot with the loaded VAM and
 * Skill catalogs. It throws on any VAM/Skill id this file references that
 * the current catalog does not contain, any preset's Skill ranks that
 * exceed the Level 1 Skill Rank budget, or any ability_priority that isn't
 * exactly the six canonical Ability ids — a hard failure instead of a
 * silent mismatch.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.P7 = root.P7 || {};
    root.P7.Presets = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Suggested skills are keyed by canonical Skill id -> starting ranks.
  // Each preset's ranks sum to exactly the Level 1 Skill Rank budget (20,
  // per rulesCore.skills.starting_ranks) so "Preconfigured Vector" hands
  // back a fully-spent, ready-to-play build — validatePresets() checks
  // this sum against the live budget rather than a restated constant.
  var PRESETS = [
    { id: 'field-operator', name: 'Field Operator', identity: 'Mobile armed responder who can fight, reposition, and pull people out of danger.',
      vam_ids: ['VAM-CMB-001', 'VAM-CMB-003', 'VAM-DEF-003', 'VAM-CMB-002', 'VAM-DEF-004', 'VAM-CMD-002', 'VAM-SOC-003', 'VAM-CMD-003'],
      ability_priority: ['DEX', 'STR', 'CON', 'WIS', 'CHA', 'INT'],
      skills: { 'SKL-SIDEARMS': 5, 'SKL-ATHLETICS': 4, 'SKL-DODGE': 4, 'SKL-LONGARMS': 3, 'SKL-TACTICS': 2, 'SKL-REFLEX': 2 } },
    { id: 'infiltrator', name: 'Infiltrator', identity: 'Period adaptation, social mimicry, observation, memory, and precise covert work.',
      vam_ids: ['VAM-SOC-001', 'VAM-SOC-002', 'VAM-REC-001', 'VAM-TEC-002', 'VAM-SOC-004', 'VAM-REC-004', 'VAM-REC-003', 'VAM-SOC-003'],
      ability_priority: ['WIS', 'CHA', 'DEX', 'INT', 'CON', 'STR'],
      skills: { 'SKL-STEALTH': 5, 'SKL-TRADECRAFT': 4, 'SKL-CULTURE': 3, 'SKL-DECEPTION': 3, 'SKL-PERCEPTION': 3, 'SKL-LINGUISTICS': 2 } },
    { id: 'investigator', name: 'Investigator', identity: 'Evidence organization, recall, sensory discipline, timing, and context.',
      vam_ids: ['VAM-REC-004', 'VAM-REC-003', 'VAM-REC-001', 'VAM-REC-002', 'VAM-SOC-004', 'VAM-TEC-004', 'VAM-TEC-002', 'VAM-SOC-001'],
      ability_priority: ['INT', 'WIS', 'DEX', 'CHA', 'CON', 'STR'],
      skills: { 'SKL-INVESTIGATION': 5, 'SKL-PERCEPTION': 4, 'SKL-HISTORY': 3, 'SKL-CULTURE': 3, 'SKL-TRADECRAFT': 3, 'SKL-INITIATIVE': 2 } },
    { id: 'diplomat', name: 'Diplomat', identity: 'Cultural fluency, composure, conversational awareness, and social presence.',
      vam_ids: ['VAM-SOC-001', 'VAM-SOC-002', 'VAM-SOC-003', 'VAM-SOC-004', 'VAM-REC-003', 'VAM-REC-004', 'VAM-REC-001', 'VAM-CMD-003', 'VAM-CMD-002'],
      ability_priority: ['CHA', 'WIS', 'INT', 'DEX', 'CON', 'STR'],
      skills: { 'SKL-INFLUENCE': 5, 'SKL-CULTURE': 4, 'SKL-TRADECRAFT': 3, 'SKL-DECEPTION': 3, 'SKL-LINGUISTICS': 3, 'SKL-WILL': 2 } },
    { id: 'engineer', name: 'Engineer', identity: 'Improvisation, precision work, sequencing, diagnosis, and field access.',
      vam_ids: ['VAM-TEC-001', 'VAM-TEC-002', 'VAM-TEC-004', 'VAM-REC-004', 'VAM-REC-001', 'VAM-DEF-002', 'VAM-CMD-002', 'VAM-REC-003', 'VAM-SOC-001', 'VAM-CMD-003'],
      ability_priority: ['INT', 'DEX', 'WIS', 'CON', 'CHA', 'STR'],
      skills: { 'SKL-ENGINEERING': 5, 'SKL-COMPUTING': 4, 'SKL-SECURITY': 3, 'SKL-INVESTIGATION': 3, 'SKL-TRADECRAFT': 3, 'SKL-INITIATIVE': 2 } },
    { id: 'scientist', name: 'Scientist', identity: 'Disciplined observation, recall, controlled measurement, and analysis.',
      vam_ids: ['VAM-REC-004', 'VAM-TEC-004', 'VAM-REC-003', 'VAM-REC-001', 'VAM-TEC-002', 'VAM-SOC-001', 'VAM-REC-002', 'VAM-SOC-003', 'VAM-CMD-003'],
      ability_priority: ['INT', 'WIS', 'DEX', 'CHA', 'CON', 'STR'],
      skills: { 'SKL-SCIENCE': 5, 'SKL-INVESTIGATION': 4, 'SKL-PERCEPTION': 4, 'SKL-HISTORY': 3, 'SKL-COMPUTING': 2, 'SKL-CULTURE': 2 } },
    { id: 'medic', name: 'Medic', identity: 'Rapid stabilization, precision, casualty movement, and composure under pressure.',
      vam_ids: ['VAM-TEC-003', 'VAM-TEC-002', 'VAM-SOC-003', 'VAM-CMD-003', 'VAM-DEF-004', 'VAM-REC-003', 'VAM-REC-001', 'VAM-DEF-002', 'VAM-CMD-002'],
      ability_priority: ['INT', 'DEX', 'WIS', 'CON', 'CHA', 'STR'],
      skills: { 'SKL-MEDICINE': 6, 'SKL-SCIENCE': 3, 'SKL-ATHLETICS': 3, 'SKL-REFLEX': 3, 'SKL-WILL': 3, 'SKL-TACTICS': 2 } },
    { id: 'recon', name: 'Recon', identity: 'Observation, traversal, terrain awareness, and low-profile period adaptation.',
      vam_ids: ['VAM-REC-001', 'VAM-REC-002', 'VAM-DEF-001', 'VAM-DEF-002', 'VAM-CMB-002', 'VAM-REC-004', 'VAM-REC-003', 'VAM-SOC-001', 'VAM-CMD-003', 'VAM-CMD-002'],
      ability_priority: ['DEX', 'WIS', 'CON', 'INT', 'CHA', 'STR'],
      skills: { 'SKL-PERCEPTION': 5, 'SKL-STEALTH': 4, 'SKL-SURVIVAL': 4, 'SKL-ACROBATICS': 3, 'SKL-INITIATIVE': 2, 'SKL-TACTICS': 2 } },
    { id: 'close-protection', name: 'Close Protection', identity: 'Protection, casualty handling, cover discipline, and immediate medical support.',
      vam_ids: ['VAM-DEF-004', 'VAM-DEF-003', 'VAM-CMB-002', 'VAM-SOC-003', 'VAM-DEF-002', 'VAM-DEF-001', 'VAM-TEC-003', 'VAM-CMD-002', 'VAM-CMD-003'],
      ability_priority: ['STR', 'CON', 'WIS', 'DEX', 'CHA', 'INT'],
      skills: { 'SKL-FORTITUDE': 4, 'SKL-UNARMED': 4, 'SKL-SIDEARMS': 3, 'SKL-MEDICINE': 3, 'SKL-REFLEX': 3, 'SKL-TACTICS': 3 } },
    { id: 'breacher', name: 'Breacher', identity: 'Aggressive entry, weapon handling, close control, and precise physical manipulation.',
      vam_ids: ['VAM-CMB-001', 'VAM-CMB-003', 'VAM-CMB-004', 'VAM-DEF-002', 'VAM-DEF-001', 'VAM-TEC-002', 'VAM-CMB-002', 'VAM-CMD-002', 'VAM-DEF-003', 'VAM-CMD-003'],
      ability_priority: ['STR', 'DEX', 'CON', 'WIS', 'CHA', 'INT'],
      skills: { 'SKL-SHOTGUNS': 5, 'SKL-HEAVY-MELEE': 4, 'SKL-GRAPPLING': 3, 'SKL-DISARMING': 3, 'SKL-ATHLETICS': 3, 'SKL-TACTICS': 2 } },
    { id: 'control-specialist', name: 'Control Specialist', identity: 'Leverage, holds, protection, positioning, and close-contact control.',
      vam_ids: ['VAM-CMB-004', 'VAM-DEF-002', 'VAM-DEF-001', 'VAM-CMB-002', 'VAM-DEF-003', 'VAM-TEC-002', 'VAM-DEF-004', 'VAM-SOC-003', 'VAM-CMD-002'],
      ability_priority: ['STR', 'CON', 'DEX', 'WIS', 'CHA', 'INT'],
      skills: { 'SKL-GRAPPLING': 5, 'SKL-UNARMED': 4, 'SKL-FORTITUDE': 3, 'SKL-DISARMING': 3, 'SKL-REFLEX': 3, 'SKL-TACTICS': 2 } },
    { id: 'command', name: 'Command', identity: 'Composure, pattern recognition, cultural awareness, and team-facing authority.',
      vam_ids: ['VAM-SOC-003', 'VAM-SOC-004', 'VAM-REC-004', 'VAM-REC-003', 'VAM-SOC-001', 'VAM-CMD-002', 'VAM-SOC-002', 'VAM-CMD-003', 'VAM-REC-001'],
      ability_priority: ['CHA', 'WIS', 'INT', 'CON', 'DEX', 'STR'],
      skills: { 'SKL-LEADERSHIP': 5, 'SKL-TACTICS': 4, 'SKL-CULTURE': 3, 'SKL-INVESTIGATION': 3, 'SKL-HISTORY': 3, 'SKL-WILL': 2 } },
    { id: 'precision-shooter', name: 'Precision Shooter', identity: 'Deliberate fire, target focus, visual control, stability, and preparation.',
      vam_ids: ['VAM-CMB-001', 'VAM-CMB-003', 'VAM-CMB-002', 'VAM-DEF-003', 'VAM-TEC-002', 'VAM-CMD-003', 'VAM-REC-001', 'VAM-REC-002', 'VAM-REC-004'],
      ability_priority: ['DEX', 'WIS', 'CON', 'INT', 'CHA', 'STR'],
      skills: { 'SKL-PRECISION-WEAPONS': 6, 'SKL-PERCEPTION': 4, 'SKL-INITIATIVE': 3, 'SKL-REFLEX': 3, 'SKL-TACTICS': 2, 'SKL-FORTITUDE': 2 } },
    { id: 'temporal-analyst', name: 'Temporal Analyst', identity: 'Chronology, memory, pattern recognition, cultural context, and composure.',
      vam_ids: ['VAM-REC-004', 'VAM-REC-003', 'VAM-TEC-004', 'VAM-SOC-001', 'VAM-REC-001', 'VAM-SOC-003', 'VAM-TEC-002', 'VAM-CMD-003', 'VAM-CMD-002', 'VAM-SOC-002'],
      ability_priority: ['INT', 'WIS', 'CHA', 'CON', 'DEX', 'STR'],
      skills: { 'SKL-HISTORY': 5, 'SKL-INVESTIGATION': 4, 'SKL-CULTURE': 3, 'SKL-LINGUISTICS': 3, 'SKL-TACTICS': 3, 'SKL-WILL': 2 } }
  ];

  /** Sum of bar for a preset's vam_ids, looked up live from the current VAM catalog. Throws on an unknown id. */
  function presetLoadedBar(preset, vamCatalog) {
    var byId = {};
    vamCatalog.forEach(function (v) { byId[v.id] = v; });
    return preset.vam_ids.reduce(function (sum, id) {
      if (!byId[id]) throw new Error('Preset "' + preset.name + '" references unknown VAM id: ' + id);
      return sum + byId[id].bar;
    }, 0);
  }

  /**
   * Maps a preset's suggested ability_priority onto the neutral starting
   * Ability multiset (highest die to the first-priority Ability, and so
   * on) — a starting arrangement of the same dice every path gets, not a
   * different or larger allotment. Returns { [abilityId]: die }. The
   * caller (the creation wizard) writes this into ordinary, freely-editable
   * wizard state — identical in kind to a manual per-Ability assignment.
   */
  function presetAbilityAssignment(preset, rulesCore) {
    var dice = rulesCore.abilities.starting_multiset.slice()
      .sort(function (a, b) { return sidesOf(b) - sidesOf(a); });
    var assignment = {};
    preset.ability_priority.forEach(function (id, i) { assignment[id] = dice[i]; });
    return assignment;
  }

  function sidesOf(die) { return parseInt(die.slice(1), 10); }

  /**
   * Validates every preset against the live VAM/Skill catalogs and rules
   * core: every VAM id exists, is Level 1, and the loaded BAR fits the
   * Level 1 ceiling; ability_priority is exactly the six canonical Ability
   * ids in some order; every skills id exists and the ranks sum to no more
   * than the Level 1 Skill Rank budget. Call once at boot; throws (rather
   * than silently loading a broken preset) if the catalogs and this file
   * have drifted apart.
   */
  function validatePresets(vamCatalog, rulesCore, skillsCatalog) {
    var ceiling = rulesCore.levels['1'].bar;
    var byId = {};
    vamCatalog.forEach(function (v) { byId[v.id] = v; });
    var skillById = {};
    if (skillsCatalog) skillsCatalog.forEach(function (s) { skillById[s.id] = s; });
    var abilityIds = rulesCore.abilities.ids.slice().sort();
    PRESETS.forEach(function (preset) {
      var bar = presetLoadedBar(preset, vamCatalog);
      if (bar > ceiling) {
        throw new Error('Preset "' + preset.name + '" totals ' + bar + ' BAR, exceeding the Level 1 ceiling of ' + ceiling);
      }
      preset.vam_ids.forEach(function (id) {
        if (byId[id].level !== 1) {
          throw new Error('Preset "' + preset.name + '" includes ' + id + ' (Level ' + byId[id].level + '), but presets are Level 1 Standard only');
        }
      });
      if (preset.ability_priority) {
        var sortedPriority = preset.ability_priority.slice().sort();
        if (sortedPriority.length !== abilityIds.length || sortedPriority.some(function (id, i) { return id !== abilityIds[i]; })) {
          throw new Error('Preset "' + preset.name + '" ability_priority must be exactly the Abilities ' + abilityIds.join(',') + ' in some order; got ' + preset.ability_priority.join(','));
        }
      }
      if (preset.skills && skillsCatalog) {
        var spent = 0;
        Object.keys(preset.skills).forEach(function (id) {
          if (!skillById[id]) throw new Error('Preset "' + preset.name + '" references unknown Skill id: ' + id);
          spent += preset.skills[id];
        });
        if (spent > rulesCore.skills.starting_ranks) {
          throw new Error('Preset "' + preset.name + '" spends ' + spent + ' Skill ranks, exceeding the Level 1 budget of ' + rulesCore.skills.starting_ranks);
        }
      }
    });
    return true;
  }

  return {
    PRESETS: PRESETS,
    presetLoadedBar: presetLoadedBar,
    presetAbilityAssignment: presetAbilityAssignment,
    validatePresets: validatePresets
  };
}));
