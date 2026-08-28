/**
 * Protocol 7 v0.188 — Level 1 VAM Preset Loadouts
 * ------------------------------------------------------------
 * Source: PROJECT_DOCUMENTATION/P7_v0.188_LEVEL_1_VAM_PRESETS_FINAL_CANDIDATE_r001.md
 * ("GREEN CANDIDATE" — fourteen named Level 1 Standard loadouts; "not
 * classes"; players may substitute freely).
 *
 * This module holds only the *composition* of each preset (which VAM IDs
 * belong to which named identity) — a product/UX curation decision, not a
 * mechanical constant. It does not restate BAR cost, authorization, or any
 * other mechanical value: those are looked up live from the canonical VAM
 * database by validatePresets()/presetLoadedBar() every time, so a future
 * catalog change is reflected automatically instead of silently going
 * stale here (the same canon-source-regression concern A42 exists for).
 *
 * validatePresets() must be called once at boot with the loaded VAM
 * catalog. It throws on any VAM id this file references that the current
 * catalog does not contain — a hard failure instead of a silent mismatch.
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

  var PRESETS = [
    { id: 'field-operator', name: 'Field Operator', identity: 'Mobile armed responder who can fight, reposition, and pull people out of danger.',
      vam_ids: ['VAM-CMB-001', 'VAM-CMB-003', 'VAM-DEF-003', 'VAM-CMB-002', 'VAM-DEF-004', 'VAM-CMD-002', 'VAM-SOC-003', 'VAM-CMD-003'] },
    { id: 'infiltrator', name: 'Infiltrator', identity: 'Period adaptation, social mimicry, observation, memory, and precise covert work.',
      vam_ids: ['VAM-SOC-001', 'VAM-SOC-002', 'VAM-REC-001', 'VAM-TEC-002', 'VAM-SOC-004', 'VAM-REC-004', 'VAM-REC-003', 'VAM-SOC-003'] },
    { id: 'investigator', name: 'Investigator', identity: 'Evidence organization, recall, sensory discipline, timing, and context.',
      vam_ids: ['VAM-REC-004', 'VAM-REC-003', 'VAM-REC-001', 'VAM-REC-002', 'VAM-SOC-004', 'VAM-TEC-004', 'VAM-TEC-002', 'VAM-SOC-001'] },
    { id: 'diplomat', name: 'Diplomat', identity: 'Cultural fluency, composure, conversational awareness, and social presence.',
      vam_ids: ['VAM-SOC-001', 'VAM-SOC-002', 'VAM-SOC-003', 'VAM-SOC-004', 'VAM-REC-003', 'VAM-REC-004', 'VAM-REC-001', 'VAM-CMD-003', 'VAM-CMD-002'] },
    { id: 'engineer', name: 'Engineer', identity: 'Improvisation, precision work, sequencing, diagnosis, and field access.',
      vam_ids: ['VAM-TEC-001', 'VAM-TEC-002', 'VAM-TEC-004', 'VAM-REC-004', 'VAM-REC-001', 'VAM-DEF-002', 'VAM-CMD-002', 'VAM-REC-003', 'VAM-SOC-001', 'VAM-CMD-003'] },
    { id: 'scientist', name: 'Scientist', identity: 'Disciplined observation, recall, controlled measurement, and analysis.',
      vam_ids: ['VAM-REC-004', 'VAM-TEC-004', 'VAM-REC-003', 'VAM-REC-001', 'VAM-TEC-002', 'VAM-SOC-001', 'VAM-REC-002', 'VAM-SOC-003', 'VAM-CMD-003'] },
    { id: 'medic', name: 'Medic', identity: 'Rapid stabilization, precision, casualty movement, and composure under pressure.',
      vam_ids: ['VAM-TEC-003', 'VAM-TEC-002', 'VAM-SOC-003', 'VAM-CMD-003', 'VAM-DEF-004', 'VAM-REC-003', 'VAM-REC-001', 'VAM-DEF-002', 'VAM-CMD-002'] },
    { id: 'recon', name: 'Recon', identity: 'Observation, traversal, terrain awareness, and low-profile period adaptation.',
      vam_ids: ['VAM-REC-001', 'VAM-REC-002', 'VAM-DEF-001', 'VAM-DEF-002', 'VAM-CMB-002', 'VAM-REC-004', 'VAM-REC-003', 'VAM-SOC-001', 'VAM-CMD-003', 'VAM-CMD-002'] },
    { id: 'close-protection', name: 'Close Protection', identity: 'Protection, casualty handling, cover discipline, and immediate medical support.',
      vam_ids: ['VAM-DEF-004', 'VAM-DEF-003', 'VAM-CMB-002', 'VAM-SOC-003', 'VAM-DEF-002', 'VAM-DEF-001', 'VAM-TEC-003', 'VAM-CMD-002', 'VAM-CMD-003'] },
    { id: 'breacher', name: 'Breacher', identity: 'Aggressive entry, weapon handling, close control, and precise physical manipulation.',
      vam_ids: ['VAM-CMB-001', 'VAM-CMB-003', 'VAM-CMB-004', 'VAM-DEF-002', 'VAM-DEF-001', 'VAM-TEC-002', 'VAM-CMB-002', 'VAM-CMD-002', 'VAM-DEF-003', 'VAM-CMD-003'] },
    { id: 'control-specialist', name: 'Control Specialist', identity: 'Leverage, holds, protection, positioning, and close-contact control.',
      vam_ids: ['VAM-CMB-004', 'VAM-DEF-002', 'VAM-DEF-001', 'VAM-CMB-002', 'VAM-DEF-003', 'VAM-TEC-002', 'VAM-DEF-004', 'VAM-SOC-003', 'VAM-CMD-002'] },
    { id: 'command', name: 'Command', identity: 'Composure, pattern recognition, cultural awareness, and team-facing authority.',
      vam_ids: ['VAM-SOC-003', 'VAM-SOC-004', 'VAM-REC-004', 'VAM-REC-003', 'VAM-SOC-001', 'VAM-CMD-002', 'VAM-SOC-002', 'VAM-CMD-003', 'VAM-REC-001'] },
    { id: 'precision-shooter', name: 'Precision Shooter', identity: 'Deliberate fire, target focus, visual control, stability, and preparation.',
      vam_ids: ['VAM-CMB-001', 'VAM-CMB-003', 'VAM-CMB-002', 'VAM-DEF-003', 'VAM-TEC-002', 'VAM-CMD-003', 'VAM-REC-001', 'VAM-REC-002', 'VAM-REC-004'] },
    { id: 'temporal-analyst', name: 'Temporal Analyst', identity: 'Chronology, memory, pattern recognition, cultural context, and composure.',
      vam_ids: ['VAM-REC-004', 'VAM-REC-003', 'VAM-TEC-004', 'VAM-SOC-001', 'VAM-REC-001', 'VAM-SOC-003', 'VAM-TEC-002', 'VAM-CMD-003', 'VAM-CMD-002', 'VAM-SOC-002'] }
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
   * Validates every preset against the live VAM catalog: every id exists,
   * every VAM is Level 1, and the loaded BAR fits the Level 1 ceiling.
   * Call once at boot; throws (rather than silently loading a broken
   * preset) if the catalog and this file have drifted apart.
   */
  function validatePresets(vamCatalog, rulesCore) {
    var ceiling = rulesCore.levels['1'].bar;
    var byId = {};
    vamCatalog.forEach(function (v) { byId[v.id] = v; });
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
    });
    return true;
  }

  return { PRESETS: PRESETS, presetLoadedBar: presetLoadedBar, validatePresets: validatePresets };
}));
