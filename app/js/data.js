/**
 * Protocol 7 v0.188 — Canonical Data Loader
 * ------------------------------------------------------------
 * Authority: PROJECT_DOCUMENTATION/00_READ_FIRST_PROTOCOL_7_AUTHORITY_MAP.md
 *
 * This module does not define, duplicate, or re-type any mechanical
 * constant. It loads the repository's canonical JSON authorities as-is.
 * If a rule changes, it changes in PROJECT_DOCUMENTATION/APP_REBUILD/,
 * not here.
 *
 * Two runtime adapters share one filename list:
 *  - Browser: fetch(), resolved relative to the page (app/index.html).
 *  - Node:    fs.readFileSync(), resolved relative to the repo root.
 * Both return the same plain-object shape so state.js / roll-builder.js
 * never need to know which environment loaded the data.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.P7 = root.P7 || {};
    root.P7.Data = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Bare filenames only — each adapter below decides how to resolve them.
  var CANONICAL_FILES = {
    rulesCore: 'P7_v0.188_RULES_DATA_CORE_r001.json',
    skills: 'P7_v0.188_SKILL_CANONICAL_REGISTRY_r001.json',
    vams: 'P7_v0.188_VAM_CANONICAL_DATABASE_r001.json',
    gear: 'P7_v0.188_GEAR_CANONICAL_DATABASE_r001.json',
    conditions: 'P7_v0.188_CONDITION_CANONICAL_REGISTRY_r001.json',
    advantageDisadvantage: 'P7_v0.188_ADVANTAGE_DISADVANTAGE_AUTHORITY_r001.json',
    rollEvaluatorContract: 'P7_v0.188_ROLL_EVALUATOR_CONTRACT_r001.json'
  };

  // Path from the PAGE (app/index.html) to the authorities directory.
  var BROWSER_BASE = '../PROJECT_DOCUMENTATION/APP_REBUILD/';

  var isBrowser = typeof window !== 'undefined' && typeof fetch === 'function';

  function loadJsonBrowser(filename) {
    return fetch(BROWSER_BASE + filename).then(function (res) {
      if (!res.ok) {
        throw new Error('Canonical data fetch failed: ' + filename + ' (' + res.status + ')');
      }
      return res.json();
    });
  }

  function loadJsonNode(filename) {
    var fs = require('fs');
    var path = require('path');
    // __dirname here is <repoRoot>/app/js — authorities live at <repoRoot>/PROJECT_DOCUMENTATION/APP_REBUILD
    var abs = path.join(__dirname, '..', '..', 'PROJECT_DOCUMENTATION', 'APP_REBUILD', filename);
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  }

  function loadOne(filename) {
    return isBrowser ? loadJsonBrowser(filename) : Promise.resolve(loadJsonNode(filename));
  }

  function loadCanonicalData() {
    var keys = Object.keys(CANONICAL_FILES);
    return Promise.all(keys.map(function (k) { return loadOne(CANONICAL_FILES[k]); }))
      .then(function (values) {
        var out = {};
        keys.forEach(function (k, i) { out[k] = values[i]; });
        return out;
      });
  }

  return {
    CANONICAL_FILES: CANONICAL_FILES,
    loadCanonicalData: loadCanonicalData
  };
}));
