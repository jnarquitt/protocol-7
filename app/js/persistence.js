/**
 * Protocol 7 v0.188 — Persistence
 * ------------------------------------------------------------
 * Authority: PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_APPLICATION_REQUIREMENTS_BIBLE_r001.md
 *   "Saves record schema and rules version; v0.187 saves are never
 *    silently treated as valid v0.188 characters."
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./state.js'));
  } else {
    root.P7 = root.P7 || {};
    root.P7.Persistence = factory(root.P7.State);
  }
}(typeof self !== 'undefined' ? self : this, function (State) {
  'use strict';

  function exportCharacter(state, rulesCore) {
    var shape = State.validateCharacterShape(state, rulesCore);
    if (!shape.legal) {
      throw new Error('Refusing to export an invalid character: ' + shape.problems.join('; '));
    }
    return JSON.stringify(state, null, 2);
  }

  /**
   * Import never silently accepts an incompatible save. A parse failure,
   * a version mismatch, or a missing-field save all come back as
   * legal:false with a reason instead of being coerced into a live
   * character (A35/A36).
   */
  function importCharacter(raw, rulesCore) {
    var parsed;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      return { legal: false, requiresMigration: false, reason: 'Not valid JSON: ' + e.message };
    }

    if (parsed.schema_version !== State.SCHEMA_VERSION || parsed.rules_version !== State.RULES_VERSION) {
      return {
        legal: false,
        requiresMigration: true,
        reason: 'Save is schema_version=' + parsed.schema_version + ' / rules_version=' + parsed.rules_version +
          ' — this build only accepts ' + State.SCHEMA_VERSION + ' / ' + State.RULES_VERSION + '. Explicit migration required, not silent acceptance.'
      };
    }

    var shape = State.validateCharacterShape(parsed, rulesCore);
    if (!shape.legal) {
      return { legal: false, requiresMigration: false, reason: shape.problems.join('; ') };
    }

    return { legal: true, character: parsed };
  }

  return { exportCharacter: exportCharacter, importCharacter: importCharacter };
}));
