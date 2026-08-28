/**
 * Protocol 7 v0.188 — Data Model Gate acceptance tests
 * ------------------------------------------------------------
 * Authority: PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_APPLICATION_ACCEPTANCE_TEST_MATRIX_r001.md
 *   Data Model Gate = A01-A14, A34-A39, A42.
 *
 * "PASS requires observable behavior, not developer intent." This file
 * actually calls the real state/roll-builder/persistence modules and
 * checks their output — it does not assert that code exists.
 *
 * Run: node app/tests/acceptance-data-model.js
 */
'use strict';

const path = require('path');
const Data = require('../js/data.js');
const State = require('../js/state.js');
const RollBuilder = require('../js/roll-builder.js');
const Persistence = require('../js/persistence.js');

const results = [];
function record(id, pass, evidence) {
  results.push({ id, pass, evidence });
  console.log(id + ' ' + (pass === true ? 'PASS' : pass === false ? 'FAIL' : 'NOT IMPLEMENTED') + ' — ' + evidence);
}

Data.loadCanonicalData().then(function (canon) {
  const rulesCore = canon.rulesCore;
  const skills = canon.skills.skills;
  const vams = canon.vams.vams;
  const conditions = canon.conditions.conditions;

  // ---- A01 Starting Abilities ----
  const legalStart = State.validateStartingAbilities(['d8', 'd8', 'd6', 'd6', 'd4', 'd4'], rulesCore);
  const illegalStart = State.validateStartingAbilities(['d8', 'd8', 'd8', 'd6', 'd4', 'd4'], rulesCore);
  record('A01', legalStart.legal === true && illegalStart.legal === false,
    'legal multiset accepted (' + legalStart.legal + '), illegal multiset rejected: "' + illegalStart.reason + '"');

  // ---- A02 Starting Skills ----
  const ranks20 = {}; skills.slice(0, 10).forEach((s) => { ranks20[s.id] = { ranks: 2 }; }); // 10*2=20
  const alloc20 = State.allocateSkillRanks(ranks20, rulesCore);
  const ranks21 = JSON.parse(JSON.stringify(ranks20)); ranks21[skills[0].id].ranks += 1;
  const alloc21 = State.allocateSkillRanks(ranks21, rulesCore);
  record('A02', alloc20.legal === true && alloc20.spent === 20 && alloc21.legal === false,
    '20/20 ranks legal (spent=' + alloc20.spent + '), 21 ranks blocked: "' + alloc21.reason + '"');

  // ---- A03 Level 1 BAR / authorization ----
  const bar1 = State.barCeiling(1, rulesCore);
  const auth1 = State.authorizationForLevel(1, canon.vams);
  record('A03', bar1 === 16 && auth1 === 'STANDARD', 'Level 1 BAR ceiling=' + bar1 + ', authorization="' + auth1 + '"');

  // ---- A04 Unused BAR ----
  const cheapVams = vams.filter(v => v.level === 1).sort((a, b) => a.bar - b.bar);
  let runningIds = [], runningBar = 0;
  for (const v of cheapVams) { if (runningBar + v.bar <= 15) { runningIds.push(v.id); runningBar += v.bar; } }
  const loaded15 = State.loadedBar(runningIds, vams);
  record('A04', loaded15 <= 16 && loaded15 >= 0, 'loadout totals ' + loaded15 + ' BAR (<= 16 ceiling) and computed without error, ' + (16 - loaded15) + ' left unused');

  // ---- A05 Vitality die validation ----
  const startDice = { STR: 'd8', DEX: 'd8', CON: 'd6', INT: 'd6', WIS: 'd4', CHA: 'd4' };
  const legalFaces = State.validateVitalityFaces({ STR: 7, DEX: 2, CON: 1, INT: 3, WIS: 2, CHA: 1 }, startDice, rulesCore);
  const illegalFaces = State.validateVitalityFaces({ STR: 9, DEX: 2, CON: 1, INT: 3, WIS: 2, CHA: 1 }, startDice, rulesCore);
  record('A05', legalFaces.legal === true && illegalFaces.legal === false,
    'face=7 on d8 accepted; face=9 on d8 rejected: "' + illegalFaces.problems[0] + '"');

  // ---- A06 Vitality ordinary (highest face 7 -> 25 HP) ----
  const vit25 = State.vitalityResult({ STR: 7, DEX: 2, CON: 1, INT: 3, WIS: 2, CHA: 1 }, null, rulesCore);
  record('A06', vit25.startingHp === 25, 'highest qualifying face 7 produced startingHp=' + vit25.startingHp);

  // ---- A07 Vitality tie ----
  const vitTie = State.vitalityResult({ STR: 6, DEX: 6, CON: 1, INT: 2, WIS: 3, CHA: 1 }, null, rulesCore);
  const vitTieResolved = State.vitalityResult({ STR: 6, DEX: 6, CON: 1, INT: 2, WIS: 3, CHA: 1 }, 'DEX', rulesCore);
  record('A07', vitTie.tie === true && vitTie.originAbilityId === null && vitTieResolved.originAbilityId === 'DEX',
    'unresolved tie between ' + vitTie.tiedAbilities.join('/') + ' returns no origin until the player chooses one (chose DEX -> origin=' + vitTieResolved.originAbilityId + ')');

  // ---- A08 Vitality all blanks ----
  const vitBlanks = State.vitalityResult({ STR: 1, DEX: 2, CON: 3, INT: 1, WIS: 2, CHA: 3 }, null, rulesCore);
  record('A08', vitBlanks.startingHp === 28 && vitBlanks.allBlanksException === true, 'six blank faces produced startingHp=' + vitBlanks.startingHp);

  // ---- A09 HP advancement 25 -> 29/33/37/41/45 ----
  const hpSeq = [1, 2, 3, 4, 5, 6].map(l => State.maxHp(25, l, false, rulesCore));
  const expectedSeq = [25, 29, 33, 37, 41, 45];
  record('A09', JSON.stringify(hpSeq) === JSON.stringify(expectedSeq), 'L1-L6 maxHp from 25 starting = ' + hpSeq.join('/') + ' (expected ' + expectedSeq.join('/') + ')');

  // ---- A10 Durable at L6 -> 50 ----
  const hpDurable6 = State.maxHp(25, 6, true, rulesCore);
  record('A10', hpDurable6 === 50, 'L6 maxHp with Durable = ' + hpDurable6);

  // ---- A11 Level 3 Core Growth changes dependent rolls ----
  const preGrowth = { abilities: { STR: { base_die: 'd6' } }, progression: { level: 3, ability_growth: [] } };
  const postGrowth = { abilities: { STR: { base_die: 'd6' } }, progression: { level: 3, ability_growth: [{ level: 3, ability_id: 'STR' }] } };
  const dieBefore = State.currentAbilityDie(preGrowth, 'STR', rulesCore);
  const dieAfter = State.currentAbilityDie(postGrowth, 'STR', rulesCore);
  record('A11', dieBefore === 'd6' && dieAfter === 'd8', 'STR die before growth=' + dieBefore + ', after one Level-3 Core Growth=' + dieAfter);

  // ---- A12 d12 ceiling ----
  const overgrown = { abilities: { STR: { base_die: 'd10' } }, progression: { level: 6, ability_growth: [{ level: 3, ability_id: 'STR' }, { level: 5, ability_id: 'STR' }, { level: 5, ability_id: 'STR' }] } };
  const clamped = State.currentAbilityDie(overgrown, 'STR', rulesCore);
  record('A12', clamped === 'd12', 'three growth steps on a d10 base clamps at ' + clamped + ' (never exceeds the canonical ceiling)');

  // ---- A13 Level 5 Core Growth (second slot) ----
  const twoSteps = { abilities: { STR: { base_die: 'd6' } }, progression: { level: 5, ability_growth: [{ level: 3, ability_id: 'STR' }, { level: 5, ability_id: 'STR' }] } };
  const dieAtL5 = State.currentAbilityDie(twoSteps, 'STR', rulesCore);
  record('A13', dieAtL5 === 'd10' && rulesCore.levels['5'].ability_growth_slots === 2,
    'two Core Growth selections (L3+L5) on d6 base = ' + dieAtL5 + '; Level 5 grants ' + rulesCore.levels['5'].ability_growth_slots + ' cumulative slots');

  // ---- A14 Level reduction warning ----
  const beforeReduction = { progression: { level: 4, ability_growth: [{ level: 3, ability_id: 'STR' }], mastered_skill_ids: ['SKL-ATHLETICS'], edge_id: 'inspired' } };
  const reduceTo2 = State.levelReductionWarnings(beforeReduction, 2, rulesCore);
  record('A14', reduceTo2.hasWarnings === true, 'reducing L4->L2 flags: ' + reduceTo2.warnings.join(' | '));

  // ---- Build one real character + one real roll for the persistence tests ----
  const character = State.createCharacter({
    name: 'Test Vector', abilityDice: startDice, level: 1,
    vitalityFaces: { STR: 7, DEX: 2, CON: 1, INT: 3, WIS: 2, CHA: 1 },
    originAbilityId: 'STR', allBlanksException: false, startingHp: 25,
    skillRanks: ranks20
  }, rulesCore);

  // ---- A34 Local persistence (export -> reparse == equivalent character) ----
  const exported34 = Persistence.exportCharacter(character, rulesCore);
  const reloaded = JSON.parse(exported34);
  record('A34', JSON.stringify(reloaded) === JSON.stringify(character), 'export -> JSON.parse reload reproduces an identical character object');

  // ---- A35 Export/import round-trip ----
  const imp = Persistence.importCharacter(exported34, rulesCore);
  record('A35', imp.legal === true && JSON.stringify(imp.character) === JSON.stringify(character), 'import of a fresh export is legal and matches the original');

  // ---- A36 v0.187 (incompatible) save is never silently accepted ----
  const fakeOldSave = Object.assign({}, character, { schema_version: 'p7-character-r001', rules_version: '0.187' });
  const impOld = Persistence.importCharacter(JSON.stringify(fakeOldSave), rulesCore);
  record('A36', impOld.legal === false && impOld.requiresMigration === true, 'v0.187-shaped save rejected, not coerced: "' + impOld.reason + '"');

  // ---- A37 One-state audit (module-level proxy; full check needs the UI layer, noted below) ----
  const persistedKeys = JSON.stringify(character);
  const noDerivedFieldsPersisted = !/current_ability_die|max_hp|bar_ceiling|current_skill_die/.test(persistedKeys);
  record('A37', noDerivedFieldsPersisted,
    'no derived value (max HP, BAR ceiling, current dice) appears as a persisted field on the character object — only state.js computes them. ' +
    'NOTE: this confirms the data layer has one source; full A37 needs re-verification once a UI exists that could add a second one.');

  // ---- A38 One-roll audit (module-level proxy; same caveat as A37) ----
  const rollExportKeys = Object.keys(RollBuilder).sort();
  record('A38', JSON.stringify(rollExportKeys) === JSON.stringify(['buildRollPool', 'rollPool']),
    'roll-builder.js exports exactly buildRollPool+rollPool, no second pool-building function. ' +
    'NOTE: this confirms one module exists; full A38 needs re-verification once real UI roll launchers call it.');

  // ---- A39 No flat roll modifiers ----
  const athletics = skills.filter(s => s.id === 'SKL-ATHLETICS')[0];
  const rollState = Object.assign({}, character, { skills: ranks20 });
  const built = RollBuilder.buildRollPool({
    skillId: 'SKL-ATHLETICS', skillsRegistry: skills, characterState: rollState, rulesCore: rulesCore,
    gearCandidates: [], vamCandidates: [], advantageReasons: ['ambush'], disadvantageReasons: []
  });
  const everyEntryIsADie = built.pool.every(d => typeof d.die === 'string' && !('modifier' in d) && !('value' in d));
  record('A39', everyEntryIsADie, built.pool.length + '-die pool built (' + built.explanation + '); every entry is a named die, none is a bare numeric modifier');

  // ---- REG-01 rollPool() actually rolls the previewed pool without throwing ----
  // Not a matrix ID itself, but a required precondition of A24 (pool truth):
  // this caught a live bug (roll-builder.js referenced a nonexistent
  // State.DIE_SIDES, so every dieValue() call threw) that A39 could not
  // detect because A39 never calls rollPool.
  let reg01Ok = true, reg01Evidence = '';
  try {
    const rolled = RollBuilder.rollPool(built.pool, rulesCore, () => 0.999); // force max face on every die
    reg01Ok = rolled.results.length === built.pool.length && typeof rolled.total === 'number';
    reg01Evidence = 'rolled ' + rolled.results.length + ' dice from the previewed pool, total=' + rolled.total;
  } catch (e) {
    reg01Ok = false; reg01Evidence = 'threw: ' + e.message;
  }
  record('REG-01', reg01Ok, reg01Evidence);

  // ---- REG-02 Disadvantage removes the smallest Ability die without throwing ----
  const builtWithDisadvantage = RollBuilder.buildRollPool({
    skillId: 'SKL-ATHLETICS', skillsRegistry: skills, characterState: rollState, rulesCore: rulesCore,
    gearCandidates: [], vamCandidates: [], advantageReasons: [], disadvantageReasons: ['heavy smoke']
  });
  const removedOneAbility = builtWithDisadvantage.removedDice.length === 1 && builtWithDisadvantage.removedDice[0].source_type === 'ability';
  record('REG-02', removedOneAbility,
    removedOneAbility
      ? 'Disadvantage removed ' + builtWithDisadvantage.removedDice[0].source_id + ' (' + builtWithDisadvantage.removedDice[0].die + ') without throwing'
      : 'expected exactly one removed ability die, got: ' + JSON.stringify(builtWithDisadvantage.removedDice));

  // ---- A42 Canon-source regression (heuristic static check — NOT a substitute for human review) ----
  const fs = require('fs');
  const src = fs.readFileSync(path.join(__dirname, '../js/state.js'), 'utf8') + fs.readFileSync(path.join(__dirname, '../js/roll-builder.js'), 'utf8');
  // Look for the specific constants that were hardcoded in an earlier draft and confirm they no longer appear
  // as bare literals doing game-rule work (still allowed as array/loop indices, e.g. "0" and "1").
  const suspiciousLiteralNearHp = /startingHp\s*\+\s*\d/.test(src) || /hp\s*\+=?\s*4/i.test(src);
  record('A42', suspiciousLiteralNearHp ? false : null,
    suspiciousLiteralNearHp
      ? 'found a literal added directly to HP outside rulesCore — regression'
      : 'static scan of state.js + roll-builder.js found no re-typed HP/die-ladder/blank-face constants after the r002 fix; ' +
        'marking NOT IMPLEMENTED rather than PASS because a text-pattern scan cannot prove full traceability — a human read-through ' +
        'of both files against the canonical JSON is still the real gate for this test.');

  // ---- Summary ----
  const passCount = results.filter(r => r.pass === true).length;
  const failCount = results.filter(r => r.pass === false).length;
  const niCount = results.filter(r => r.pass === null).length;
  console.log('\n' + passCount + ' PASS, ' + failCount + ' FAIL, ' + niCount + ' NOT IMPLEMENTED out of ' + results.length + ' Data Model Gate tests run.');
  process.exit(failCount > 0 ? 1 : 0);
}).catch(function (err) {
  console.error('Test run crashed:', err);
  process.exit(2);
});
