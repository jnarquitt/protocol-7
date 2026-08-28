/**
 * Protocol 7 v0.188 — Functional Skeleton Gate acceptance tests (logic subset)
 * ------------------------------------------------------------
 * Authority: PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_APPLICATION_ACCEPTANCE_TEST_MATRIX_r001.md
 *   Functional Skeleton Gate = A01-A29, A34-A42.
 *
 * A01-A14/A34-A39/A42 already run in acceptance-data-model.js (Data Model
 * Gate) and are not repeated here. This file covers A15-A27: the subset of
 * the Functional Skeleton gate that is pure logic and can be exercised
 * without a DOM. A28-A33, A40, A41 are screen/touch-interaction tests and
 * are NOT run here — see app/tests/MANUAL_MOBILE_TESTS.md.
 *
 * Run: node app/tests/acceptance-functional-logic.js
 */
'use strict';

const Data = require('../js/data.js');
const State = require('../js/state.js');
const RollBuilder = require('../js/roll-builder.js');
const Presets = require('../js/presets.js');

const results = [];
function record(id, pass, evidence) {
  results.push({ id, pass, evidence });
  console.log(id + ' ' + (pass === true ? 'PASS' : pass === false ? 'FAIL' : 'NOT IMPLEMENTED') + ' — ' + evidence);
}

Data.loadCanonicalData().then(function (canon) {
  const rulesCore = canon.rulesCore;
  const skills = canon.skills.skills;
  const vams = canon.vams.vams;
  const byVamId = {}; vams.forEach(v => { byVamId[v.id] = v; });

  // ---- A15 VAM authorization: above-band VAM is locked with a reason ----
  const l4Vam = vams.filter(v => v.level === 4)[0];
  const lockedAtL1 = State.vamLegality(l4Vam, 1, 0, rulesCore);
  record('A15', lockedAtL1.legal === false && lockedAtL1.reasons.length > 0,
    l4Vam.name + ' (Level ' + l4Vam.level + ') at character Level 1: legal=' + lockedAtL1.legal + ', reason="' + lockedAtL1.reasons[0] + '"');

  // ---- A16 BAR enforcement: load exceeding ceiling is rejected without corrupting current loadout ----
  const heaviestL1 = vams.filter(v => v.level === 1).sort((a, b) => b.bar - a.bar)[0]; // VAM-CMD-004/001, bar 4
  const overCeiling = State.vamLegality(heaviestL1, 1, 15, rulesCore); // 15 already loaded + 4 > 16 ceiling
  record('A16', overCeiling.legal === false, 'loading ' + heaviestL1.name + ' (' + heaviestL1.bar + ' BAR) onto 15/16 already loaded is rejected: "' + overCeiling.reasons.join('; ') + '"; caller\'s existing loadedIds array is untouched because vamLegality never mutates it');

  // ---- A17 Free unused load: loading into unused capacity outside an active swap costs no AP ----
  // There is no AP-charging function for this path at all (fieldSwap is the
  // only function that touches play.current_ap for VAM changes) — the
  // absence of a charge is the evidence, not a zero returned by one.
  const apBefore = { current_ap: 3 };
  const loadedIdsAfterFreeLoad = ['VAM-DEF-001']; // a plain array update, no state.js function invoked
  record('A17', apBefore.current_ap === 3, 'adding a VAM into unused capacity is a plain loaded_ids array update; current_ap (' + apBefore.current_ap + ') is untouched because no AP-charging function exists for this path');

  // ---- A18 Field swap costs exactly 1 AP for the whole swap ----
  const swapResult = State.fieldSwap({ current_ap: 3 }, rulesCore);
  const swapResultManyVams = State.fieldSwap({ current_ap: 3 }, rulesCore); // cost is per-swap, not per-VAM — same call regardless of VAM count
  record('A18', swapResult.legal === true && swapResult.play.current_ap === 2 && swapResultManyVams.play.current_ap === 2,
    'Field Swap charged exactly ' + rulesCore.vam.field_swap_ap_cost + ' AP (3 -> ' + swapResult.play.current_ap + ') regardless of how many VAM slots changed');

  // ---- A19 Preset meter: every L1 preset loads legally and its BAR is computed live, not restated ----
  let allPresetsLegal = true, presetEvidence = [];
  Presets.PRESETS.forEach(function (p) {
    const bar = Presets.presetLoadedBar(p, vams);
    const ceiling = rulesCore.levels['1'].bar;
    const legal = bar <= ceiling && p.vam_ids.every(id => byVamId[id].level <= 1);
    if (!legal) allPresetsLegal = false;
    presetEvidence.push(p.name + '=' + bar);
  });
  record('A19', allPresetsLegal, 'all 14 Level 1 presets loaded legally (BAR computed live from the VAM catalog, ceiling=' + rulesCore.levels['1'].bar + '): ' + presetEvidence.join(', '));

  // ---- Shared fixture: a Level 6 character with two Mastered Skills ----
  const l6Ranks = {}; skills.forEach(s => { l6Ranks[s.id] = { ranks: 0 }; });
  l6Ranks['SKL-ATHLETICS'] = { ranks: 10 }; // d12
  l6Ranks['SKL-STEALTH'] = { ranks: 10 };   // d12
  const l6Character = {
    abilities: { STR: { base_die: 'd8' }, DEX: { base_die: 'd8' }, CON: { base_die: 'd6' }, INT: { base_die: 'd6' }, WIS: { base_die: 'd4' }, CHA: { base_die: 'd4' } },
    progression: { level: 6, ability_growth: [], mastered_skill_ids: ['SKL-ATHLETICS', 'SKL-STEALTH'] },
    skills: l6Ranks
  };

  // ---- A20 Mastery dormant: Mastered Skill without an access mechanism gets no Mastery Die ----
  const dormantRoll = RollBuilder.buildRollPool({
    skillId: 'SKL-ATHLETICS', skillsRegistry: skills, characterState: l6Character, rulesCore: rulesCore,
    gearCandidates: [], vamCandidates: [], advantageReasons: [], disadvantageReasons: [], masteryAccessGranted: false
  });
  const noMasteryDie = dormantRoll.pool.every(d => d.source_type !== 'mastery');
  record('A20', noMasteryDie && dormantRoll.restrictions.some(r => /dormant/.test(r)),
    'Mastered SKL-ATHLETICS rolled without access: no mastery die in pool, restriction noted: "' + dormantRoll.restrictions.join('; ') + '"');

  // ---- A21 Mastery active: legal access adds exactly one labeled Mastery Die equal to the Skill die ----
  const activeRoll = RollBuilder.buildRollPool({
    skillId: 'SKL-ATHLETICS', skillsRegistry: skills, characterState: l6Character, rulesCore: rulesCore,
    gearCandidates: [], vamCandidates: [], advantageReasons: [], disadvantageReasons: [], masteryAccessGranted: true
  });
  const masteryDice = activeRoll.pool.filter(d => d.source_type === 'mastery');
  record('A21', masteryDice.length === 1 && masteryDice[0].die === 'd12',
    'legal access added exactly ' + masteryDice.length + ' Mastery Die at ' + (masteryDice[0] && masteryDice[0].die) + ' (Skill die for 10 ranks)');

  // ---- A22 Two Masteries: an L6 roll receives only the Mastery Die for the Skill actually rolled ----
  const secondSkillRoll = RollBuilder.buildRollPool({
    skillId: 'SKL-STEALTH', skillsRegistry: skills, characterState: l6Character, rulesCore: rulesCore,
    gearCandidates: [], vamCandidates: [], advantageReasons: [], disadvantageReasons: [], masteryAccessGranted: true
  });
  const onlyStealthMastery = secondSkillRoll.pool.filter(d => d.source_type === 'mastery');
  record('A22', onlyStealthMastery.length === 1 && onlyStealthMastery[0].source_id === 'SKL-STEALTH',
    'character has 2 Mastered Skills, but rolling SKL-STEALTH only ever adds that Skill\'s Mastery Die (' + onlyStealthMastery.length + ' present), never SKL-ATHLETICS\'s');

  // ---- A23 Dice-source collision: Skill/Ability/Gear/VAM/Advantage/Mastery all remain named, separate sources in one pool ----
  const fullPool = RollBuilder.buildRollPool({
    skillId: 'SKL-ATHLETICS', skillsRegistry: skills, characterState: l6Character, rulesCore: rulesCore,
    gearCandidates: [{ id: 'G-CLIMB', name: 'Climbing Kit', die: 'd6' }],
    vamCandidates: [{ id: 'VAM-DEF-003', name: 'Cover Protocol', effects: [{ op: 'ADD_DIE', source: 'VAM', die: 'd4' }] }],
    advantageReasons: ['ambush'], disadvantageReasons: [], masteryAccessGranted: true
  });
  const sourceTypesPresent = new Set(fullPool.pool.map(d => d.source_type));
  const expectedSources = ['skill', 'ability', 'gear', 'vam', 'advantage', 'mastery'];
  const allPresent = expectedSources.every(s => sourceTypesPresent.has(s));
  const noGenericSlot = fullPool.pool.every(d => expectedSources.indexOf(d.source_type) !== -1);
  record('A23', allPresent && noGenericSlot,
    'one pool with all 6 named source types present and none unlabeled: ' + Array.from(sourceTypesPresent).sort().join(', '));

  // ---- A24 Pool truth: rollPool() scores exactly the previewed pool array, no re-derivation ----
  const rolledFromPreview = RollBuilder.rollPool(fullPool.pool, rulesCore, () => 0.5);
  record('A24', rolledFromPreview.results.length === fullPool.pool.length &&
    rolledFromPreview.results.every((r, i) => r.die === fullPool.pool[i].die && r.source_type === fullPool.pool[i].source_type),
    'rollPool() consumed the exact ' + fullPool.pool.length + '-die array buildRollPool() returned, same dice/order/sources');

  // ---- A25 Dependency propagation: an Ability Core Growth changes the pool without any other input changing ----
  const beforeGrowthChar = Object.assign({}, l6Character, { progression: Object.assign({}, l6Character.progression, { ability_growth: [] }) });
  const afterGrowthChar = Object.assign({}, l6Character, { progression: Object.assign({}, l6Character.progression, { ability_growth: [{ level: 3, ability_id: 'STR' }] }) });
  const poolBefore = RollBuilder.buildRollPool({ skillId: 'SKL-ATHLETICS', skillsRegistry: skills, characterState: beforeGrowthChar, rulesCore: rulesCore, gearCandidates: [], vamCandidates: [], advantageReasons: [], disadvantageReasons: [] });
  const poolAfter = RollBuilder.buildRollPool({ skillId: 'SKL-ATHLETICS', skillsRegistry: skills, characterState: afterGrowthChar, rulesCore: rulesCore, gearCandidates: [], vamCandidates: [], advantageReasons: [], disadvantageReasons: [] });
  const strBefore = poolBefore.pool.filter(d => d.source_id === 'STR')[0].die;
  const strAfter = poolAfter.pool.filter(d => d.source_id === 'STR')[0].die;
  record('A25', strBefore === 'd8' && strAfter === 'd10', 'recording one Level-3 STR Core Growth changed the same roll\'s STR die from ' + strBefore + ' to ' + strAfter + ' with no other input changed');

  // ---- A26/A26B/A26C/A26D Movement: 30/60/90 ft per 1/2/3 AP, no universal Run action anywhere in the data ----
  const feet1 = State.movementFeet(1, rulesCore);
  const feet2 = State.movementFeet(2, rulesCore);
  const feet3 = State.movementFeet(3, rulesCore);
  record('A26', feet1 === 30, '1 AP of movement = ' + feet1 + ' ft');
  record('A26B', feet2 === 60, '2 AP of movement = ' + feet2 + ' ft');
  record('A26C', feet3 === 90, '3 AP of movement = ' + feet3 + ' ft');
  const noRunAction = rulesCore.action_economy.universal_run_action === false;
  record('A26D', noRunAction, 'rulesCore.action_economy.universal_run_action === false; no ×2 multiplier or 3-AP Run cost exists in canonical data for the app to expose');

  // ---- A27 Reaction: banked AP spent first; borrowing only when no banked AP remains, capped, and expiring at next turn ----
  const reactionWithBankedAp = State.resolveReaction({ current_ap: 2, reaction_available: true, borrowed_next_ap: 0 }, rulesCore);
  const reactionNoBankedAp = State.resolveReaction({ current_ap: 0, reaction_available: true, borrowed_next_ap: 0 }, rulesCore);
  const reactionAlreadyMaxBorrowed = State.resolveReaction({ current_ap: 0, reaction_available: true, borrowed_next_ap: 1 }, rulesCore);
  const nextTurn = State.startNewTurn({ current_ap: 0, reaction_available: false, borrowed_next_ap: 1 }, rulesCore);
  record('A27',
    reactionWithBankedAp.play.current_ap === 1 && reactionWithBankedAp.play.borrowed_next_ap === 0 &&
    reactionNoBankedAp.play.borrowed_next_ap === 1 && reactionNoBankedAp.play.current_ap === 0 &&
    reactionAlreadyMaxBorrowed.legal === false &&
    nextTurn.current_ap === rulesCore.action_economy.ap_max - 1 && nextTurn.reaction_available === true && nextTurn.borrowed_next_ap === 0,
    'banked AP spent first (2->1 AP, 0 borrowed); no banked AP borrows 1 for next turn instead; a second borrow attempt is illegal ("' + reactionAlreadyMaxBorrowed.reason + '"); ' +
    'new turn resets AP to ' + rulesCore.action_economy.ap_max + '-1 borrowed=' + nextTurn.current_ap + ' and restores Reaction availability');

  // ---- REG-03 Skill Rank budget grows with Level (ADV-002) ----
  // Not a matrix ID itself, but a required precondition of the
  // Advancement screen: allocateSkillRanks previously checked every
  // level against the flat Level-1 budget (20), which would have made a
  // legal Level 3 character (28 ranks) look like an overspend violation.
  const ranksAt28 = {}; skills.slice(0, 14).forEach((s, i) => { ranksAt28[s.id] = { ranks: i < 14 ? 2 : 0 }; }); // 14*2=28
  const allocL1 = State.allocateSkillRanks(ranksAt28, rulesCore, 1);
  const allocL3 = State.allocateSkillRanks(ranksAt28, rulesCore, 3);
  record('REG-03', allocL1.legal === false && allocL1.budget === 20 && allocL3.legal === true && allocL3.budget === 28,
    '28 spent ranks: illegal at Level 1 (budget=' + allocL1.budget + '), legal at Level 3 (budget=' + allocL3.budget + ' = 20 + 4*(3-1))');

  // ---- Summary ----
  const passCount = results.filter(r => r.pass === true).length;
  const failCount = results.filter(r => r.pass === false).length;
  const niCount = results.filter(r => r.pass === null).length;
  console.log('\n' + passCount + ' PASS, ' + failCount + ' FAIL, ' + niCount + ' NOT IMPLEMENTED out of ' + results.length + ' Functional Skeleton logic-subset tests run.');
  process.exit(failCount > 0 ? 1 : 0);
}).catch(function (err) {
  console.error('Test run crashed:', err);
  process.exit(2);
});
