/**
 * Protocol 7 v0.188 — Screen Renderers
 * ------------------------------------------------------------
 * Authority: PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_APPLICATION_SCREEN_AND_INTERACTION_MAP_r001.md
 *
 * Every screen reads canonical data + the one character object and calls
 * into state.js/roll-builder.js for anything mechanical. No screen
 * computes its own die, HP, BAR, or roll pool (ARCH-001/002/003).
 */
(function () {
  'use strict';
  var UI = window.P7.UI;
  var State = window.P7.State;
  var RollBuilder = window.P7.RollBuilder;
  var Presets = window.P7.Presets;

  var Screens = {};

  // ---------------------------------------------------------------
  // Shared lookups
  // ---------------------------------------------------------------
  function byId(list) { var m = {}; list.forEach(function (x) { m[x.id] = x; }); return m; }

  function abilityDiceForSkill(skill, character, rulesCore) {
    return skill.abilities.map(function (aid, i) {
      return { abilityId: aid, die: State.currentAbilityDie(character, aid, rulesCore), key: aid + i };
    });
  }

  // ---------------------------------------------------------------
  // CHARACTER screen (creation wizard OR post-creation summary)
  // ---------------------------------------------------------------
  function renderCharacter(app, container) {
    if (!app.character) {
      container.appendChild(renderCreation(app));
      return;
    }
    var c = app.character;
    var rc = app.canon.rulesCore;
    var startDice = {}; rc.abilities.ids.forEach(function (id) { startDice[id] = c.abilities[id].base_die; });

    // Abilities stay editable after creation the same way VAMs/Gear/Skills
    // do: tap one Ability, then tap another, to swap which starting die each
    // holds. This only rearranges the already-legal multiset (never invents
    // a new die), so it can't produce an illegal Ability spread, and Core
    // Growth (persisted per ability_id) keeps applying on top of whichever
    // base die ends up there afterward — currentAbilityDie derives from
    // base_die + growth every time, so nothing here is a competing source.
    var swapPending = app.abilitySwapPending;
    var abilityCards = rc.abilities.ids.map(function (id) {
      return UI.card([
        UI.el('div', { class: 'p7-ability-id', text: id }),
        UI.el('div', { class: 'p7-ability-die', text: State.currentAbilityDie(c, id, rc) }),
        UI.el('div', { class: 'p7-ability-base', text: 'base ' + c.abilities[id].base_die }),
        UI.button(swapPending === id ? 'Cancel' : (swapPending ? 'Swap with ' + swapPending : 'Swap…'), function () {
          if (!swapPending) { app.abilitySwapPending = id; app.render(); return; }
          if (swapPending === id) { app.abilitySwapPending = null; app.render(); return; }
          var next = JSON.parse(JSON.stringify(c));
          var a = next.abilities[swapPending].base_die, b = next.abilities[id].base_die;
          next.abilities[swapPending].base_die = b;
          next.abilities[id].base_die = a;
          app.abilitySwapPending = null;
          app.setCharacter(next);
        }, { small: true, variant: swapPending === id ? 'danger' : 'secondary' })
      ], { class: 'p7-ability-card' });
    });

    var maxHpVal = State.maxHp(startingHpOf(c, rc), c.progression.level, !!c.progression.edge_id && c.progression.edge_id === 'durable', rc);

    var nameInput = UI.el('input', {
      class: 'p7-name-input', type: 'text', value: c.identity.character_name, placeholder: 'Vector Name',
      maxlength: '80'
    });
    nameInput.addEventListener('change', function () {
      var next = JSON.parse(JSON.stringify(c));
      next.identity.character_name = nameInput.value.slice(0, 80);
      app.setCharacter(next);
    });

    container.appendChild(UI.help('This is your Vector’s core profile. Tap Swap on any Ability to trade which die it holds — that stays available for the life of the character, not just at creation. HP, Edge, and Mastered Skills come from Vitality and Advancement; use the button at the bottom of this screen to level up.'));

    container.appendChild(UI.section('Vector', [
      UI.card([
        UI.el('label', { class: 'p7-field-label', text: 'Vector Name (the only typed field)' }),
        nameInput
      ]),
      UI.el('div', { class: 'p7-ability-grid' }, abilityCards),
      UI.card([
        UI.el('div', { text: 'HP: ' + c.play.current_hp + ' / ' + maxHpVal }),
        UI.el('div', { text: 'Level ' + c.progression.level + ' · Edge: ' + (c.progression.edge_id || 'none') + ' · Mastered: ' + (c.progression.mastered_skill_ids.length ? c.progression.mastered_skill_ids.join(', ') : 'none') }),
        UI.el('div', { text: 'Vitality Origin: ' + (c.vitality.origin_ability_id || (c.vitality.all_blanks_exception ? 'all blanks — no origin' : 'unset')) }),
        UI.button('Go to Advancement →', function () { app.goTo('advancement'); }, { variant: 'primary' })
      ])
    ]));

    container.appendChild(UI.section('Save Management', [
      UI.el('div', { class: 'p7-btn-row' }, [
        UI.button('Export', function () { exportCharacter(app); }),
        UI.button('Import', function () { promptImport(app); }),
        UI.button('New Vector…', function () {
          if (confirm('Start a new Vector? This replaces the current one (export first if you want to keep it).')) app.deleteCharacter();
        }, { variant: 'danger' })
      ])
    ]));
  }

  function startingHpOf(c, rc) {
    // Starting HP is not a persisted field (derived-state law) — reconstruct
    // it once from the persisted Vitality faces the same way createCharacter did.
    var result = State.vitalityResult(c.vitality.faces, c.vitality.origin_ability_id, rc);
    return result.startingHp;
  }

  function exportCharacter(app) {
    var json = window.P7.Persistence.exportCharacter(app.character, app.canon.rulesCore);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = UI.el('a', { href: url, download: (app.character.identity.character_name || 'vector') + '-p7-save.json' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function promptImport(app) {
    var input = UI.el('input', { type: 'file', accept: 'application/json', style: 'display:none' });
    input.addEventListener('change', function () {
      var file = input.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var result = window.P7.Persistence.importCharacter(reader.result, app.canon.rulesCore);
        if (result.legal) { app.setCharacter(result.character); }
        else { alert('Import rejected: ' + result.reason); }
      };
      reader.readAsText(file);
    });
    document.body.appendChild(input); input.click(); document.body.removeChild(input);
  }

  // ---------------------------------------------------------------
  // Creation wizard
  // ---------------------------------------------------------------
  function ensureCreation(app) {
    if (!app.creation) {
      var ids = app.canon.rulesCore.abilities.ids;
      app.creation = {
        step: 'path', path: null, presetId: null, name: '',
        remainingDice: app.canon.rulesCore.abilities.starting_multiset.slice(),
        abilityAssignment: {}, vitalityFaces: {}, vitalityOrigin: null,
        skillRanks: {}, loadedVamIds: []
      };
      ids.forEach(function (id) { app.creation.abilityAssignment[id] = null; app.creation.vitalityFaces[id] = null; });
    }
    return app.creation;
  }

  // Ordered per path — Custom Vector skips the 'preset' step, Preconfigured
  // Vector doesn't — so the progress header below always shows an accurate
  // "Step N of <path's total>" instead of a fixed count.
  var CREATION_STEPS = {
    custom: ['path', 'name', 'abilities', 'vitality', 'skills', 'vams', 'review'],
    preconfigured: ['path', 'preset', 'name', 'abilities', 'vitality', 'skills', 'vams', 'review']
  };
  var CREATION_STEP_LABELS = {
    path: 'Starting Path', preset: 'Identity', name: 'Name', abilities: 'Abilities',
    vitality: 'Vitality', skills: 'Skills', vams: 'VAMs', review: 'Review & Create'
  };

  function presetById(id) {
    var match = Presets.PRESETS.filter(function (p) { return p.id === id; });
    return match[0] || null;
  }

  // Full detail behind a preset's card/badge — every die, Skill, and VAM it
  // proposes, spelled out. Shown both on the Identity picker itself (so a
  // player can inspect a preset before committing to it) and, via
  // renderPresetBanner below, from every later preconfigured step (so
  // "what did this preset actually give me" is never more than one tap
  // away instead of only visible at the very end in Review).
  function renderPresetLoadoutSummary(app, p, rc) {
    var vams = app.canon.vams.vams, skills = app.canon.skills.skills;
    var vamsById = byId(vams), skillsById = byId(skills);
    var assignment = Presets.presetAbilityAssignment(p, rc);
    var abilityLine = p.ability_priority.map(function (id) { return id + ' ' + assignment[id]; }).join(' · ');
    var skillLine = Object.keys(p.skills || {}).map(function (id) {
      return (skillsById[id] ? skillsById[id].name : id) + ' ' + p.skills[id];
    }).join(', ') || '(none)';
    var vamLine = p.vam_ids.map(function (id) { return vamsById[id] ? vamsById[id].name : id; }).join(', ') || '(none)';
    var bar = Presets.presetLoadedBar(p, vams);
    return UI.card([
      reviewRow('Ability priority', abilityLine),
      reviewRow('Skills', skillLine),
      reviewRow('VAMs (' + bar + ' BAR)', vamLine)
    ], { class: 'p7-preset-summary' });
  }

  // A small persistent strip on every preconfigured step past 'preset' so
  // "what preset did I pick, and what's still pre-chosen" and "let me pick
  // a different Identity entirely" are both always one tap away, instead of
  // only reachable by clicking Back through every prior step.
  function renderPresetBanner(app, w, rc) {
    if (w.path !== 'preconfigured' || !w.presetId) return null;
    var p = presetById(w.presetId);
    if (!p) return null;
    if (!w.presetPreviewOpen) w.presetPreviewOpen = {};
    var open = !!w.presetPreviewOpen[p.id];
    return UI.card([
      UI.el('div', { class: 'p7-preset-name', text: 'Identity: ' + p.name }),
      UI.el('div', { class: 'p7-btn-row' }, [
        UI.button(open ? 'Hide full loadout' : 'View full loadout', function () {
          w.presetPreviewOpen[p.id] = !open;
          app.render();
        }, { small: true }),
        UI.button('Change Identity…', function () { w.step = 'preset'; app.render(); }, { small: true })
      ]),
      open ? renderPresetLoadoutSummary(app, p, rc) : null
    ]);
  }

  function renderCreation(app) {
    var w = ensureCreation(app);
    var rc = app.canon.rulesCore;
    var wrap = UI.el('div', { class: 'p7-creation' });

    var order = CREATION_STEPS[w.path || 'custom'];
    var stepIndex = order.indexOf(w.step);
    if (stepIndex === -1) stepIndex = 0;
    wrap.appendChild(UI.el('div', { class: 'p7-creation-header' }, [
      UI.el('div', { class: 'p7-creation-title', text: 'Create Your Vector' }),
      UI.el('div', { class: 'p7-creation-progress' }, order.map(function (s, i) {
        return UI.el('div', { class: 'p7-progress-dot' + (i <= stepIndex ? ' p7-progress-dot-done' : '') + (i === stepIndex ? ' p7-progress-dot-active' : '') });
      })),
      UI.el('div', { class: 'p7-creation-step-label', text: 'Step ' + (stepIndex + 1) + ' of ' + order.length + ' — ' + CREATION_STEP_LABELS[w.step] })
    ]));

    if (w.step === 'path') {
      wrap.appendChild(UI.help('Custom Vector lets you assign every die, Skill, and VAM yourself. Preconfigured Vector starts you with a ready-made Identity instead — either way, every choice you make stays fully editable, both later in this wizard and after the Vector is created.'));
      wrap.appendChild(UI.section('Choose a starting path', [
        UI.el('div', { class: 'p7-btn-row' }, [
          UI.button('Custom Vector', function () { w.path = 'custom'; w.step = 'name'; app.render(); }, { variant: 'primary' }),
          UI.button('Preconfigured Vector', function () { w.path = 'preconfigured'; w.step = 'preset'; app.render(); }, { variant: 'primary' })
        ]),
        UI.note('Already have a save? Import it instead of creating a new Vector.', 'default'),
        UI.button('Import a Save…', function () { promptImport(app); })
      ]));
    } else if (w.step === 'preset') {
      if (!w.presetPreviewOpen) w.presetPreviewOpen = {};
      wrap.appendChild(UI.help('Each Identity pre-fills a suggested Ability priority, a starting Skill spread, and a VAM loadout to match its concept — tap "View full loadout" on any card to see exactly what that means before you commit. Tap a card to load it, then adjust anything you like in the steps ahead.'));
      wrap.appendChild(UI.section('Choose an Identity (Level 1 · ' + rc.levels['1'].bar + ' BAR ceiling)', [
        UI.el('div', { class: 'p7-preset-grid' }, Presets.PRESETS.map(function (p) {
          var bar = Presets.presetLoadedBar(p, app.canon.vams.vams);
          var open = !!w.presetPreviewOpen[p.id];
          return UI.card([
            UI.el('div', { class: 'p7-preset-name', text: p.name }),
            UI.el('div', { class: 'p7-preset-bar', text: bar + ' BAR' }),
            UI.el('div', { class: 'p7-preset-identity', text: p.identity }),
            UI.button(open ? 'Hide full loadout' : 'View full loadout', function () {
              w.presetPreviewOpen[p.id] = !open;
              app.render();
            }, { small: true }),
            open ? renderPresetLoadoutSummary(app, p, rc) : null,
            UI.button('Choose ' + p.name, function () {
              w.path = 'preconfigured'; w.presetId = p.id;
              // A preset pre-fills the same neutral Ability dice every path
              // gets, just arranged by the preset's suggested priority, plus
              // a suggested Skill spread — both are only a starting point,
              // exactly as editable afterward (here, and later on the
              // character sheet) as if the player had entered them by hand.
              w.abilityAssignment = Presets.presetAbilityAssignment(p, rc);
              w.remainingDice = [];
              w.skillRanks = {};
              Object.keys(p.skills || {}).forEach(function (id) { w.skillRanks[id] = { ranks: p.skills[id] }; });
              // Preset's VAM loadout is only a starting point — the VAMs step
              // lets the player Unload/Load before Review, same as post-creation.
              w.loadedVamIds = p.vam_ids.slice();
              w.step = 'name'; app.render();
            }, { variant: 'primary' })
          ], { class: 'p7-preset-card' });
        }))
      ]));
      wrap.appendChild(UI.button('← Back', function () { w.step = 'path'; app.render(); }));
    } else if (w.step === 'name') {
      var nameInput = UI.el('input', { class: 'p7-name-input', type: 'text', value: w.name, placeholder: 'Vector Name', maxlength: '80' });
      nameInput.addEventListener('input', function () { w.name = nameInput.value.slice(0, 80); });
      wrap.appendChild(UI.section('Vector Name', [
        UI.el('label', { class: 'p7-field-label', text: 'The only typed field in ordinary play.' }),
        nameInput,
        UI.button('Continue →', function () { w.step = 'abilities'; app.render(); }, { variant: 'primary' })
      ]));
    } else if (w.step === 'abilities') {
      wrap.appendChild(renderAbilityStep(app, w, rc));
    } else if (w.step === 'vitality') {
      wrap.appendChild(renderVitalityStep(app, w, rc));
    } else if (w.step === 'skills') {
      wrap.appendChild(renderSkillStep(app, w, rc));
    } else if (w.step === 'vams') {
      wrap.appendChild(renderCreationVamsStep(app, w, rc));
    } else if (w.step === 'review') {
      wrap.appendChild(renderReviewStep(app, w, rc));
    }

    return wrap;
  }

  function renderAbilityStep(app, w, rc) {
    var ids = rc.abilities.ids;
    var allAssigned = ids.every(function (id) { return w.abilityAssignment[id]; });
    var swapPending = w.abilitySwapPending;
    // Preconfigured Vector arrives with every die already assigned and an
    // empty pool — Clear-then-reassign was the only way to change anything,
    // which meant trading two Abilities' dice took four taps through a pool
    // that (with nothing in it yet) didn't visibly explain why. Swap does a
    // direct two-tap trade without ever touching the pool, matching the
    // post-creation Ability screen's own Swap control (see renderCharacter
    // above) so the same gesture works before and after the Vector exists.
    var box = UI.section('Assign Abilities — tap a die, then tap an Ability', [
      renderPresetBanner(app, w, rc),
      UI.help(w.path === 'preconfigured'
        ? 'Every Ability already holds a die from this Identity. Tap Swap on two Abilities to trade which dice they hold, or Clear one to send its die back to the pool below and assign it individually — nothing here is locked in. You can rearrange these anytime later from the Character screen too.'
        : 'These are your Vector’s six innate dice. Tap a die from the pool below, then tap an Ability to assign it — or let Auto-Assign Remaining finish for you. You can rearrange these anytime later from the Character screen.'),
      w.remainingDice.length
        ? UI.el('div', { class: 'p7-die-pool' }, w.remainingDice.map(function (die, idx) {
          return UI.dieChip(die, function () { w.pendingDie = { die: die, idx: idx }; app.render(); }, { selected: w.pendingDie && w.pendingDie.idx === idx });
        }))
        : (allAssigned ? UI.note('All six dice are assigned. Tap Swap on two Abilities to trade dice directly, or Clear one to return it here and assign it by hand.', 'default') : null),
      UI.el('div', { class: 'p7-ability-grid' }, ids.map(function (id) {
        var assigned = w.abilityAssignment[id];
        var isPending = swapPending === id;
        return UI.card([
          UI.el('div', { class: 'p7-ability-id', text: id }),
          assigned
            ? UI.el('div', { class: 'p7-ability-die', text: assigned })
            : UI.button('assign here', function () {
              if (!w.pendingDie) return;
              w.abilityAssignment[id] = w.pendingDie.die;
              w.remainingDice.splice(w.pendingDie.idx, 1);
              w.pendingDie = null;
              app.render();
            }, { disabled: !w.pendingDie, small: true }),
          assigned ? UI.el('div', { class: 'p7-btn-row' }, [
            UI.button(isPending ? 'Cancel' : (swapPending ? 'Swap with ' + swapPending : 'Swap…'), function () {
              if (!swapPending) { w.abilitySwapPending = id; app.render(); return; }
              if (swapPending === id) { w.abilitySwapPending = null; app.render(); return; }
              var a = w.abilityAssignment[swapPending], b = w.abilityAssignment[id];
              w.abilityAssignment[swapPending] = b;
              w.abilityAssignment[id] = a;
              w.abilitySwapPending = null;
              app.render();
            }, { small: true, variant: isPending ? 'danger' : 'secondary' }),
            UI.button('Clear', function () {
              w.remainingDice.push(w.abilityAssignment[id]);
              w.abilityAssignment[id] = null;
              if (w.abilitySwapPending === id) w.abilitySwapPending = null;
              app.render();
            }, { small: true })
          ]) : null
        ], { class: 'p7-ability-card' });
      })),
      UI.button('Auto-Assign Remaining', function () {
        var order = rc.abilities.ids.filter(function (id) { return !w.abilityAssignment[id]; });
        var dice = w.remainingDice.slice().sort(function (a, b) { return State.sidesOf(b) - State.sidesOf(a); });
        order.forEach(function (id, i) { if (dice[i]) w.abilityAssignment[id] = dice[i]; });
        w.remainingDice = [];
        app.render();
      }),
      UI.button('Continue →', function () { w.step = 'vitality'; app.render(); }, { variant: 'primary', disabled: !allAssigned })
    ]);
    box.appendChild(UI.button('← Back', function () { w.step = w.path === 'preconfigured' ? 'preset' : 'name'; app.render(); }));
    return box;
  }

  function renderVitalityStep(app, w, rc) {
    var ids = rc.abilities.ids;
    var box = UI.el('div');
    var banner = renderPresetBanner(app, w, rc);
    if (banner) box.appendChild(banner);
    box.appendChild(UI.help('This determines your starting HP. Roll or pick a face for each Ability die — the highest non-blank face becomes your Origin Ability, and its value sets your starting HP.'));
    box.appendChild(UI.section('Vitality Ritual — roll or pick the face for each Ability', ids.map(function (id) {
      var die = w.abilityAssignment[id];
      var sides = State.sidesOf(die);
      var face = w.vitalityFaces[id];
      var faceButtons = [];
      for (var f = 1; f <= sides; f++) {
        (function (face_) {
          faceButtons.push(UI.dieChip(String(face_), function () { w.vitalityFaces[id] = face_; app.render(); }, { selected: face === face_ }));
        }(f));
      }
      return UI.card([
        UI.el('div', { class: 'p7-ability-id', text: id + ' (' + die + ')' }),
        UI.button('ROLL', function () { w.vitalityFaces[id] = 1 + Math.floor(Math.random() * sides); app.render(); }, { variant: 'primary', small: true }),
        UI.el('div', { class: 'p7-face-picker', text: '' }),
        UI.el('div', { class: 'p7-die-pool' }, faceButtons),
        face ? UI.el('div', { class: 'p7-note', text: 'Face: ' + face + (rc.protocol_dice.blank_faces.indexOf(face) !== -1 ? ' (blank)' : '') }) : null
      ], { class: 'p7-ability-card' });
    })));

    var allFacesSet = ids.every(function (id) { return w.vitalityFaces[id]; });
    var validation = allFacesSet ? State.validateVitalityFaces(w.vitalityFaces, w.abilityAssignment, rc) : null;
    var result = (allFacesSet && validation.legal) ? State.vitalityResult(w.vitalityFaces, w.vitalityOrigin, rc) : null;

    if (result && result.tie) {
      box.appendChild(UI.section('Tied for highest — choose Vitality Origin', [
        UI.el('div', { class: 'p7-btn-row' }, result.tiedAbilities.map(function (id) {
          return UI.button(id, function () { w.vitalityOrigin = id; app.render(); }, { variant: w.vitalityOrigin === id ? 'primary' : 'secondary' });
        }))
      ]));
    }
    if (result && (result.originAbilityId || result.allBlanksException)) {
      box.appendChild(UI.note('Starting HP: ' + result.startingHp + (result.allBlanksException ? ' (all six blank)' : ' — Origin: ' + result.originAbilityId), 'success'));
    }

    var canContinue = !!(result && (result.originAbilityId || result.allBlanksException));
    box.appendChild(UI.el('div', { class: 'p7-btn-row' }, [
      UI.button('← Back', function () { w.step = 'abilities'; app.render(); }),
      UI.button('Continue →', function () { w.step = 'skills'; app.render(); }, { variant: 'primary', disabled: !canContinue })
    ]));
    return box;
  }

  function renderSkillStep(app, w, rc) {
    var skills = app.canon.skills.skills;
    var alloc = State.allocateSkillRanks(w.skillRanks, rc, 1);
    var box = UI.el('div');
    var banner = renderPresetBanner(app, w, rc);
    if (banner) box.appendChild(banner);
    box.appendChild(UI.help('Spend your Skill Rank budget (below) across the Skills your Vector trains — Ranks set each Skill’s die. Use the category row to jump to Combat, Defense, or General.'));

    // Same Category filter as the post-creation Skills screen (renderSkills)
    // — tapping "Combat" here during creation shows only Combat Skills too,
    // instead of every category stacked in one long scroll.
    if (!w.skillsCategoryFilter) w.skillsCategoryFilter = 'all';
    var allCats = app.canon.skills.categories;
    box.appendChild(UI.el('div', { class: 'p7-tabbar' }, ['all'].concat(allCats).map(function (cat) {
      return UI.chip(filterChipLabel(cat), w.skillsCategoryFilter === cat, function () { w.skillsCategoryFilter = cat; app.render(); });
    })));

    box.appendChild(UI.el('div', { class: 'p7-budget-banner' + (alloc.legal ? '' : ' p7-budget-over'), text: 'Skill Ranks: ' + alloc.spent + ' / ' + alloc.budget + ' spent' }));

    var cats = w.skillsCategoryFilter === 'all' ? allCats : [w.skillsCategoryFilter];
    cats.forEach(function (cat) {
      box.appendChild(UI.section(cat, skills.filter(function (s) { return s.category === cat; }).map(function (s) {
        var ranks = (w.skillRanks[s.id] && w.skillRanks[s.id].ranks) || 0;
        var die = State.currentSkillDie(ranks, rc.skills.breakpoints);
        return UI.card([
          UI.el('div', { class: 'p7-skill-name', text: s.name + ' (' + die + ')' }),
          UI.stepper('Ranks', ranks, function (v) {
            w.skillRanks[s.id] = { ranks: v };
            app.render();
          // 12 is a UI-only stepper stop, not a rule value — no canonical
          // per-Skill rank ceiling exists; total spend is bounded by
          // allocateSkillRanks()'s budget instead, enforced above.
          }, { min: 0, max: 12 })
        ], { class: 'p7-skill-card' });
      })));
    });

    box.appendChild(UI.el('div', { class: 'p7-btn-row' }, [
      UI.button('← Back', function () { w.step = 'vitality'; app.render(); }),
      UI.button('Continue →', function () { w.step = 'vams'; app.render(); }, { variant: 'primary', disabled: !alloc.legal })
    ]));
    return box;
  }

  // A preset only proposes a starting VAM loadout — this step lets the
  // player Unload/Load before creation, same controls as the post-creation
  // VAMS screen (renderVams), just operating on wizard state instead of a
  // saved character. A Custom Vector starts here with nothing loaded.
  function renderCreationVamsStep(app, w, rc) {
    var vams = app.canon.vams.vams;
    var ceiling = State.barCeiling(1, rc);
    var used = State.loadedBar(w.loadedVamIds, vams);
    var auth = State.authorizationForLevel(1, app.canon.vams);
    var box = UI.el('div');
    var banner = renderPresetBanner(app, w, rc);
    if (banner) box.appendChild(banner);

    box.appendChild(UI.meter('BAR', used, ceiling));
    box.appendChild(UI.el('div', { class: 'p7-note', text: 'Authorization: ' + auth }));
    box.appendChild(UI.help('VAMs loaded into your BAR — ' + (w.path === 'preconfigured' ? "this is the preset's default; Load/Unload freely before you create the Vector." : 'optional — load any Level 1 VAMs now, or skip and load them later.') + ' Use the Family row to jump to a group instead of scrolling.'));

    // Same Family filter + grouping as the post-creation VAMs screen — all
    // 84 VAMs in one flat list meant a preset's own loaded VAMs (which can
    // span several Families) were scattered end to end, and finding an
    // unloaded one meant scrolling to the very bottom.
    if (!w.vamFamilyFilter) w.vamFamilyFilter = 'all';
    box.appendChild(UI.el('div', { class: 'p7-tabbar' },
      renderFamilyFilterChips(w.vamFamilyFilter, app.canon.vams.families, function (f) { w.vamFamilyFilter = f; app.render(); })));

    var visible = vams.filter(function (v) { return w.vamFamilyFilter === 'all' || v.family === w.vamFamilyFilter; });
    renderVamFamilyGroups(box, app.canon.vams.families, w.vamFamilyFilter, visible, function (v) {
      var loaded = w.loadedVamIds.indexOf(v.id) !== -1;
      var otherLoadedBar = used - (loaded ? v.bar : 0);
      return renderVamCard(v, loaded, 1, otherLoadedBar, rc, function () {
        if (loaded) w.loadedVamIds = w.loadedVamIds.filter(function (id) { return id !== v.id; });
        else w.loadedVamIds.push(v.id);
        app.render();
      });
    });

    box.appendChild(UI.el('div', { class: 'p7-btn-row' }, [
      UI.button('← Back', function () { w.step = 'skills'; app.render(); }),
      UI.button('Continue →', function () { w.step = 'review'; app.render(); }, { variant: 'primary' })
    ]));
    return box;
  }

  function reviewRow(label, value) {
    return UI.el('div', { class: 'p7-review-row' }, [
      UI.el('div', { class: 'p7-review-label', text: label }),
      UI.el('div', { class: 'p7-review-value', text: value })
    ]);
  }

  function renderReviewStep(app, w, rc) {
    var vams = app.canon.vams.vams;
    var vamsById = byId(vams);
    var spentSkillRanks = Object.keys(w.skillRanks).reduce(function (sum, id) { return sum + ((w.skillRanks[id] && w.skillRanks[id].ranks) || 0); }, 0);
    var chosenPreset = w.path === 'preconfigured' && w.presetId ? presetById(w.presetId) : null;
    var box = UI.section('Review & Create', [
      renderPresetBanner(app, w, rc),
      UI.help('One last look before this becomes your Vector — every value below stays exactly as editable afterward as it is right now.'),
      UI.card([
        reviewRow('Name', w.name || '(unnamed)'),
        reviewRow('Path', w.path === 'preconfigured' ? 'Preconfigured (' + (chosenPreset ? chosenPreset.name : w.presetId) + ')' : 'Custom'),
        reviewRow('Abilities', rc.abilities.ids.map(function (id) { return id + ' ' + w.abilityAssignment[id]; }).join(' · ')),
        reviewRow('Skills', spentSkillRanks + ' ranks assigned'),
        reviewRow('VAMs', State.loadedBar(w.loadedVamIds, vams) + ' BAR — ' + (w.loadedVamIds.length ? w.loadedVamIds.map(function (id) { return vamsById[id] ? vamsById[id].name : id; }).join(', ') : '(none loaded)'))
      ]),
      UI.el('div', { class: 'p7-btn-row' }, [
        UI.button('Create Vector', function () { finalizeCreation(app, w, rc); }, { variant: 'primary' }),
        UI.button('← Back', function () { w.step = 'vams'; app.render(); })
      ])
    ]);
    return box;
  }

  function finalizeCreation(app, w, rc) {
    var vit = State.vitalityResult(w.vitalityFaces, w.vitalityOrigin, rc);
    var character = State.createCharacter({
      name: w.name, abilityDice: w.abilityAssignment, level: 1,
      vitalityFaces: w.vitalityFaces, originAbilityId: vit.originAbilityId,
      allBlanksException: vit.allBlanksException, startingHp: vit.startingHp,
      skillRanks: w.skillRanks, presetId: w.presetId
    }, rc);
    character.vams.loaded_ids = w.loadedVamIds.slice();
    app.creation = null;
    app.setCharacter(character);
  }

  // ---------------------------------------------------------------
  // SKILLS screen
  // ---------------------------------------------------------------
  function renderSkills(app, container) {
    var c = app.character, rc = app.canon.rulesCore, skills = app.canon.skills.skills;
    if (!container.skillsTab) container.skillsTab = 'trained';
    var tab = app.skillsTab || 'trained';

    container.appendChild(UI.help('Skills show what your Vector is trained to do, priced in Ranks against the budget below. Switch to All to browse everything or Edit to spend Ranks; use the category row to jump straight to Combat, Defense, or General instead of scrolling.'));

    container.appendChild(UI.el('div', { class: 'p7-tabbar' }, ['trained', 'all', 'edit'].map(function (t) {
      return UI.chip(t === 'trained' ? 'My Trained Skills' : t.charAt(0).toUpperCase() + t.slice(1), tab === t, function () { app.skillsTab = t; app.render(); });
    })));

    // Category filter — a second, independent sticky sub-tab row (stacked
    // directly under the one above via .p7-tabbar-2's top offset) so
    // tapping "Combat" shows only Combat Skills instead of requiring a
    // scroll past General/Defense to reach it.
    if (!app.skillsCategoryFilter) app.skillsCategoryFilter = 'all';
    var catFilter = app.skillsCategoryFilter;
    var allCats = app.canon.skills.categories;
    container.appendChild(UI.el('div', { class: 'p7-tabbar p7-tabbar-2' }, ['all'].concat(allCats).map(function (cat) {
      return UI.chip(filterChipLabel(cat), catFilter === cat, function () { app.skillsCategoryFilter = cat; app.render(); });
    })));

    var alloc = State.allocateSkillRanks(c.skills, rc, c.progression.level);
    container.appendChild(UI.el('div', { class: 'p7-budget-banner' + (alloc.legal ? '' : ' p7-budget-over'), text: 'Skill Ranks: ' + alloc.spent + ' / ' + alloc.budget + ' spent, ' + alloc.remaining + ' remaining' }));

    var trainedOnly = tab === 'trained';
    var editable = tab === 'edit';
    var cats = catFilter === 'all' ? allCats : [catFilter];
    cats.forEach(function (cat) {
      var list = skills.filter(function (s) { return s.category === cat && (!trainedOnly || ((c.skills[s.id] && c.skills[s.id].ranks) > 0)); });
      if (list.length === 0) return;
      container.appendChild(UI.section(cat, list.map(function (s) { return renderSkillRow(app, s, c, rc, editable); })));
    });
  }

  function renderSkillRow(app, s, c, rc, editable) {
    var ranks = (c.skills[s.id] && c.skills[s.id].ranks) || 0;
    var die = State.currentSkillDie(ranks, rc.skills.breakpoints);
    var abilityDice = abilityDiceForSkill(s, c, rc);
    var isMastered = c.progression.mastered_skill_ids.indexOf(s.id) !== -1;

    var children = [
      UI.el('div', { class: 'p7-skill-name', text: s.name }),
      UI.el('div', { class: 'p7-skill-die', text: 'Skill Die: ' + die + ' (' + ranks + ' ranks)' }),
      UI.el('div', { class: 'p7-skill-abilities' }, abilityDice.map(function (a) { return UI.badge(a.abilityId + ' ' + a.die, 'default'); })),
      isMastered ? UI.badge('Mastered', 'mastery') : null
    ];
    if (editable) {
      children.push(UI.stepper('Ranks', ranks, function (v) {
        var next = JSON.parse(JSON.stringify(c));
        next.skills[s.id] = { ranks: v };
        app.setCharacter(next);
      }, { min: 0, max: 12 })); // UI-only stepper stop, see the matching comment in the creation-flow Skills step
      var slotsAvail = State.masterySlots(c.progression.level, rc) - c.progression.mastered_skill_ids.length;
      var canMaster = isMastered || slotsAvail > 0;
      children.push(UI.button(isMastered ? 'Unmaster' : 'Master' + (canMaster ? '' : ' (no slots)'), function () {
        var next = JSON.parse(JSON.stringify(c));
        if (isMastered) next.progression.mastered_skill_ids = next.progression.mastered_skill_ids.filter(function (id) { return id !== s.id; });
        else next.progression.mastered_skill_ids.push(s.id);
        app.setCharacter(next);
      }, { small: true, disabled: !canMaster }));
    } else {
      children.push(UI.button('Roll in Play →', function () { app.openInPlay({ skillId: s.id }); }, { small: true, variant: 'primary' }));
    }
    return UI.card(children, { class: 'p7-skill-card' });
  }

  // Family ids in the canonical data are shouting-case with underscores
  // (DEFENSE_MOBILITY, RECON_INVESTIGATION, ...) because they're identifiers,
  // not display copy — never show one verbatim as a button label, section
  // title, or card meta line.
  function formatFamily(f) {
    if (f === 'all') return 'All';
    return f.split('_').map(function (w) { return w.charAt(0) + w.slice(1).toLowerCase(); }).join(' / ');
  }

  /** The literal filter value 'all' is never a display label on its own —
   * every other option in these filter rows (Skills categories, Gear eras)
   * is already Title Case, so a bare lowercase "all" chip stood out. */
  function filterChipLabel(v) { return v === 'all' ? 'All' : v; }

  /** One VAM card, shared by the post-creation VAMs screen and the creation
   * wizard's VAMs step — same look, different backing state (a saved
   * character's loaded_ids vs. the wizard's own w.loadedVamIds) and
   * Load/Unload handler, both passed in instead of closed over. */
  function renderVamCard(v, loaded, level, otherLoadedBar, rc, onToggle) {
    var legality = State.vamLegality(v, level, otherLoadedBar, rc);
    var canToggle = loaded || legality.legal;
    return UI.card([
      UI.el('div', { class: 'p7-vam-name', text: v.name }),
      UI.el('div', { class: 'p7-vam-meta', text: formatFamily(v.family) + ' · Lv' + v.level + ' · ' + v.bar + ' BAR' }),
      (v.effects || []).some(function (e) { return e.op === 'ALLOW_MASTERY'; }) ? UI.badge('Mastery-enabling', 'mastery') : null,
      !canToggle ? UI.note(legality.reasons.join('; '), 'warn') : null,
      UI.button(loaded ? 'Unload' : 'Load', function () { onToggle(loaded); }, { disabled: !canToggle, variant: loaded ? 'danger' : 'primary', small: true })
    ], { class: 'p7-vam-card' });
  }

  /** Renders `visible` VAMs either as one flat grid (a single family is
   * already isolated by the filter) or grouped into a Family section per
   * the Skills screen's category pattern — the default "all" view is what
   * makes a long VAM list (84 entries) scrollable-to-the-bottom without
   * this, since 8+ Families stacked with no breaks reads as one big list. */
  function renderVamFamilyGroups(container, allFamilies, familyFilter, visible, cardFn) {
    if (familyFilter !== 'all') {
      container.appendChild(UI.el('div', { class: 'p7-vam-grid' }, visible.map(cardFn)));
      return;
    }
    allFamilies.forEach(function (family) {
      var list = visible.filter(function (v) { return v.family === family; });
      if (!list.length) return;
      container.appendChild(UI.section(formatFamily(family), [UI.el('div', { class: 'p7-vam-grid' }, list.map(cardFn))]));
    });
  }

  function renderFamilyFilterChips(currentFilter, allFamilies, onChange) {
    return ['all'].concat(allFamilies).map(function (f) {
      return UI.chip(formatFamily(f), currentFilter === f, function () { onChange(f); });
    });
  }

  // ---------------------------------------------------------------
  // VAMS screen
  // ---------------------------------------------------------------
  function renderVams(app, container) {
    var c = app.character, rc = app.canon.rulesCore, vams = app.canon.vams.vams;
    var vamsById = byId(vams);
    var ceiling = State.barCeiling(c.progression.level, rc);
    var used = State.loadedBar(c.vams.loaded_ids, vams);
    var auth = State.authorizationForLevel(c.progression.level, app.canon.vams);

    container.appendChild(UI.help('VAMs are the abilities loaded into your BAR — your equipped-powers budget for the session. Load and Unload freely between sessions; Field Swap trades one VAM mid-session for an Action Point cost instead. Use the Family row to jump to a group instead of scrolling.'));

    container.appendChild(UI.meter('BAR', used, ceiling));
    container.appendChild(UI.el('div', { class: 'p7-note', text: 'Authorization: ' + auth }));

    container.appendChild(UI.el('div', { class: 'p7-btn-row' }, [
      UI.button('Field Swap (−' + rc.vam.field_swap_ap_cost + ' AP, in-play)', function () {
        var res = State.fieldSwap(c.play, rc);
        if (!res.legal) { alert(res.reason); return; }
        var next = JSON.parse(JSON.stringify(c));
        next.play = res.play;
        app.setCharacter(next);
        alert(res.reason);
      }),
      UI.button('Load a Preset…', function () { app.vamPresetPicker = !app.vamPresetPicker; app.render(); })
    ]));

    if (app.vamPresetPicker) {
      container.appendChild(UI.section('Presets (replace current loadout)', Presets.PRESETS.map(function (p) {
        var bar = Presets.presetLoadedBar(p, vams);
        return UI.button(p.name + ' (' + bar + ' BAR)', function () {
          var next = JSON.parse(JSON.stringify(c));
          next.vams.loaded_ids = p.vam_ids.slice();
          next.vams.active_preset_id = p.id;
          app.vamPresetPicker = false;
          app.setCharacter(next);
        });
      })));
    }

    if (!app.vamFamilyFilter) app.vamFamilyFilter = 'all';
    // Family filter + Loaded Only live in one sticky sub-tab row (see
    // .p7-tabbar in app.css) so both stay reachable while scrolling the
    // VAM list instead of only being visible at the top of the screen.
    container.appendChild(UI.el('div', { class: 'p7-tabbar' },
      renderFamilyFilterChips(app.vamFamilyFilter, app.canon.vams.families, function (f) { app.vamFamilyFilter = f; app.render(); })
        .concat([UI.chip('Loaded Only', !!app.vamLoadedOnly, function () { app.vamLoadedOnly = !app.vamLoadedOnly; app.render(); })])));

    var visible = vams.filter(function (v) {
      if (app.vamFamilyFilter !== 'all' && v.family !== app.vamFamilyFilter) return false;
      if (app.vamLoadedOnly && c.vams.loaded_ids.indexOf(v.id) === -1) return false;
      return true;
    });

    renderVamFamilyGroups(container, app.canon.vams.families, app.vamFamilyFilter, visible, function (v) {
      var loaded = c.vams.loaded_ids.indexOf(v.id) !== -1;
      var otherLoadedBar = used - (loaded ? v.bar : 0);
      var card = renderVamCard(v, loaded, c.progression.level, otherLoadedBar, rc, function () {
        var next = JSON.parse(JSON.stringify(c));
        if (loaded) next.vams.loaded_ids = next.vams.loaded_ids.filter(function (id) { return id !== v.id; });
        else next.vams.loaded_ids.push(v.id);
        app.setCharacter(next);
      });
      // Loaded VAMs are actionable — the shortcut hands them to Play rather than resolving anything here.
      if (loaded) card.appendChild(UI.button('Use in Play →', function () { app.openInPlay({ vamId: v.id }); }, { small: true }));
      return card;
    });
  }

  // ---------------------------------------------------------------
  // GEAR screen
  // ---------------------------------------------------------------
  function renderGear(app, container) {
    var c = app.character, gear = app.canon.gear.gear;
    container.appendChild(UI.help('Gear is what your Vector is carrying. Filter by era to match your campaign’s setting, then Equip what’s on hand — this is for tracking what you have, not a hard equip limit.'));

    if (!app.gearEraFilter) app.gearEraFilter = 'all';
    var eras = ['all'].concat(app.canon.gear.era_filters);
    container.appendChild(UI.el('div', { class: 'p7-tabbar' }, eras.map(function (e) {
      return UI.chip(filterChipLabel(e), app.gearEraFilter === e, function () { app.gearEraFilter = e; app.render(); });
    })));

    var categories = {};
    gear.forEach(function (g) { (categories[g.category] = categories[g.category] || []).push(g); });
    Object.keys(categories).forEach(function (cat) {
      var list = categories[cat].filter(function (g) { return app.gearEraFilter === 'all' || g.eras.indexOf(app.gearEraFilter) !== -1; });
      if (!list.length) return;
      container.appendChild(UI.section(cat, list.map(function (g) {
        var selected = c.gear.selected_ids.indexOf(g.id) !== -1;
        return UI.card([
          UI.el('div', { class: 'p7-gear-name', text: g.name }),
          UI.el('div', { class: 'p7-gear-meta', text: (g.die || 'no die') + (g.skill ? ' · ' + g.skill : '') }),
          UI.button(selected ? 'Unequip' : 'Equip', function () {
            var next = JSON.parse(JSON.stringify(c));
            if (selected) next.gear.selected_ids = next.gear.selected_ids.filter(function (id) { return id !== g.id; });
            else next.gear.selected_ids.push(g.id);
            app.setCharacter(next);
          }, { small: true, variant: selected ? 'danger' : 'primary' }),
          selected && g.die && g.skill ? UI.button('Use in Play →', function () { app.openInPlay({ gearId: g.id }); }, { small: true }) : null
        ], { class: 'p7-gear-card' });
      })));
    });
  }

  // ---------------------------------------------------------------
  // PLAY screen — the sole action-resolution surface (Play Tab
  // Interaction Standard: "Build the Vector elsewhere. Play the Vector on
  // PLAY."). Other tabs hand a Skill/Gear/VAM over via app.openInPlay();
  // every pool is assembled, previewed and rolled only here, always
  // through RollBuilder.buildRollPool → rollPool/startManualRoll.
  //
  // Everything in app.playUi is transient UI state (what is selected in
  // the launcher, the last result). Anything that must survive a reload —
  // HP, AP, Reaction, Conditions, once-per-session uses — lives on the
  // one character object via app.setCharacter().
  // ---------------------------------------------------------------
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function playUi(app) {
    if (!app.playUi) {
      app.playUi = {
        skillId: null, gearId: null, vamId: null, masterySource: null,
        advantage: false, disadvantage: false, inspired: false, waivedConditions: [],
        difficulty: null, mode: 'digital', showAllSkills: false,
        result: null, rerollPick: false,
        movedFeet: 0, notice: null, confirmNewSession: false,
        opponentTotal: 0, combatResult: null
      };
    }
    return app.playUi;
  }

  function skillById(app, id) { return app.canon.skills.skills.filter(function (s) { return s.id === id; })[0]; }
  function gearById(app, id) { return app.canon.gear.gear.filter(function (g) { return g.id === id; })[0]; }
  function vamById(app, id) { return app.canon.vams.vams.filter(function (v) { return v.id === id; })[0]; }

  /** Any change to what's being rolled discards a result rolled from the old pool (A24: a result always matches its preview). */
  function setRollSetup(p, changes) {
    Object.keys(changes).forEach(function (k) { p[k] = changes[k]; });
    p.result = null;
    p.rerollPick = false;
  }

  /**
   * Selecting a Skill starts a fresh roll: Gear/VAM/Mastery and situational
   * Advantage/Disadvantage are per-action, so none carry over from the last
   * Skill (an attack's Advantage must not leak into the next defense roll).
   * The equipped Gear that fits is pre-selected, but only when exactly one
   * does — never a silent pick between several.
   */
  function selectSkill(app, p, skillId) {
    var relevant = State.relevantGear(skillById(app, skillId), app.character.gear.selected_ids, app.canon.gear.gear);
    setRollSetup(p, {
      skillId: skillId, gearId: relevant.length === 1 ? relevant[0].id : null, vamId: null, masterySource: null,
      advantage: false, disadvantage: false, inspired: false
    });
  }

  function humanize(id) { return String(id).replace(/_/g, ' ').toLowerCase(); }

  /** One-line plain-language summary of a VAM's canonical effects, for reference at the table. */
  function vamEffectSummary(v) {
    var parts = (v.effects || []).map(function (e) {
      var bits = [humanize(e.op)];
      if (e.die) bits.push(e.die);
      if (e.value !== undefined) bits.push('→ ' + e.value);
      if (e.action) bits.push('(' + humanize(e.action) + ')');
      if (e.scope) bits.push('— ' + humanize(e.scope));
      if (e.target) bits.push('[' + humanize(e.target) + ']');
      return bits.join(' ');
    });
    var timing = [];
    if (v.activation && v.activation.ap !== undefined) timing.push(v.activation.ap + ' AP');
    if (v.trigger) timing.push(humanize(v.trigger));
    if (v.duration) timing.push(humanize(v.duration));
    return (timing.length ? timing.join(' · ') + ' — ' : '') + parts.join('; ');
  }

  /** Applies a hand-off from another tab (Skills "Roll", Gear/VAMs "Use in Play"). Returns true if one was applied. */
  function consumeShortcut(app, p) {
    var s = app.pendingPlayShortcut;
    if (!s) return false;
    app.pendingPlayShortcut = null;
    var c = app.character;
    p.notice = null;
    if (s.skillId) selectSkill(app, p, s.skillId);
    if (s.gearId) {
      var g = gearById(app, s.gearId);
      var skill = g && g.skill && app.canon.skills.skills.filter(function (x) { return x.name === g.skill; })[0];
      if (skill && g.die) {
        selectSkill(app, p, skill.id);
        setRollSetup(p, { gearId: g.id });
      } else if (g) {
        p.notice = { kind: 'default', text: g.name + ' adds no die to rolls — it is narrative capability. Tell your GM how you use it.' };
      }
    }
    if (s.vamId) {
      var v = vamById(app, s.vamId);
      if (v && State.selfDieVams(c.vams.loaded_ids, [v]).length) {
        setRollSetup(p, { vamId: v.id });
      } else if (v && State.masteryAccessVams(c.vams.loaded_ids, [v]).length) {
        if (c.progression.mastered_skill_ids.indexOf(p.skillId) === -1 && c.progression.mastered_skill_ids.length) {
          selectSkill(app, p, c.progression.mastered_skill_ids[0]);
        }
        if (c.progression.mastered_skill_ids.indexOf(p.skillId) !== -1) {
          setRollSetup(p, { masterySource: v.id });
        } else {
          p.notice = { kind: 'warn', text: v.name + ' grants Mastery access, but you have no Mastered Skill yet — Mastery slots open on the Advancement tab.' };
        }
      } else if (v) {
        p.notice = { kind: 'default', text: v.name + ': ' + vamEffectSummary(v) + '. It adds no die to your own roll — apply it as described.' };
      }
    }
    return true;
  }

  function renderPlay(app, container) {
    var c = app.character, rc = app.canon.rulesCore;
    var p = playUi(app);
    if (!p.skillId || !skillById(app, p.skillId)) {
      var trained = app.canon.skills.skills.filter(function (s) { return (c.skills[s.id] && c.skills[s.id].ranks) > 0; });
      selectSkill(app, p, c.progression.mastered_skill_ids[0] || (trained[0] || app.canon.skills.skills[0]).id);
    }
    var cameFromShortcut = consumeShortcut(app, p);

    container.appendChild(UI.help('When you don’t know what to do, you’re in the right place. Track HP, AP and Reaction up top, pick an action or a Skill, check the labeled dice in the preview, then ROLL in the app — or roll your own physical dice and tap in what came up.'));

    if (p.notice) container.appendChild(UI.note(p.notice.text, p.notice.kind));

    container.appendChild(renderStatus(app, c, rc, p));
    container.appendChild(renderQuickActions(app, c, rc, p));
    var launcher = renderRollLauncher(app, c, rc, p);
    container.appendChild(launcher);
    container.appendChild(renderCombatResolver(app, c, rc, p));
    container.appendChild(renderLoadedVams(app, c, rc, p));
    container.appendChild(renderConditions(app, c));

    if (cameFromShortcut) {
      // Rendered into a not-yet-attached container — scroll once it's in the page.
      setTimeout(function () { if (launcher.scrollIntoView) launcher.scrollIntoView({ block: 'start' }); }, 0);
    }
  }

  function renderStatus(app, c, rc, p) {
    var maxHpVal = State.maxHp(startingHpOf(c, rc), c.progression.level, c.progression.edge_id === 'durable', rc);
    var setHp = function (v) { var next = clone(c); next.play.current_hp = State.applyHpChange(0, v, maxHpVal); app.setCharacter(next); };
    var apMax = rc.action_economy.ap_max;
    var pips = [];
    for (var i = 0; i < apMax; i++) {
      (function (idx) {
        var filled = idx < c.play.current_ap;
        pips.push(UI.el('button', {
          class: 'p7-ap-pip' + (filled ? ' p7-ap-pip-filled' : ''),
          'aria-label': (filled ? 'Spend' : 'Restore') + ' AP',
          onclick: function () { var next = clone(c); next.play.current_ap = filled ? idx : idx + 1; app.setCharacter(next); }
        }));
      }(i));
    }
    var activeConds = app.canon.conditions.conditions.filter(function (cond) { return c.play.conditions.indexOf(cond.id) !== -1; });

    return UI.section('Status', [
      UI.el('div', { class: 'p7-status-grid' }, [
        UI.el('div', { class: 'p7-status-cell' }, [
          UI.el('div', { class: 'p7-status-label', text: 'HP' }),
          UI.el('div', { class: 'p7-hp-readout' + (c.play.current_hp === 0 ? ' p7-hp-zero' : ''), text: c.play.current_hp + ' / ' + maxHpVal }),
          UI.el('div', { class: 'p7-btn-row p7-btn-row-tight' }, [
            UI.button('−5', function () { setHp(c.play.current_hp - 5); }, { small: true, disabled: c.play.current_hp === 0 }),
            UI.button('−1', function () { setHp(c.play.current_hp - 1); }, { small: true, disabled: c.play.current_hp === 0 }),
            UI.button('+1', function () { setHp(c.play.current_hp + 1); }, { small: true, disabled: c.play.current_hp >= maxHpVal }),
            UI.button('+5', function () { setHp(c.play.current_hp + 5); }, { small: true, disabled: c.play.current_hp >= maxHpVal })
          ])
        ]),
        UI.el('div', { class: 'p7-status-cell' }, [
          UI.el('div', { class: 'p7-status-label', text: 'AP ' + c.play.current_ap + ' / ' + apMax + (c.play.borrowed_next_ap ? ' · ' + c.play.borrowed_next_ap + ' borrowed from next turn' : '') }),
          UI.el('div', { class: 'p7-ap-pips' }, pips),
          UI.el('div', { class: 'p7-status-label', text: 'Reaction: ' + (c.play.reaction_available ? 'available' : 'used') })
        ])
      ]),
      UI.el('div', { class: 'p7-btn-row' }, [
        UI.button('Use Reaction', function () {
          var res = State.resolveReaction(c.play, rc);
          p.notice = { kind: res.legal ? 'success' : 'warn', text: res.reason };
          if (!res.legal) { app.render(); return; }
          var next = clone(c); next.play = res.play; app.setCharacter(next);
        }, { disabled: !c.play.reaction_available, variant: 'primary' }),
        UI.button('Start New Turn', function () {
          var next = clone(c); next.play = State.startNewTurn(c.play, rc);
          p.movedFeet = 0;
          p.notice = { kind: 'default', text: 'New turn: ' + next.play.current_ap + ' AP' + (c.play.borrowed_next_ap ? ' (' + c.play.borrowed_next_ap + ' was borrowed by last Reaction)' : '') + ', Reaction ready. Unspent AP from last turn expired.' };
          app.setCharacter(next);
        })
      ]),
      UI.meter('BAR', State.loadedBar(c.vams.loaded_ids, app.canon.vams.vams), State.barCeiling(c.progression.level, rc)),
      activeConds.length
        ? UI.el('div', { class: 'p7-chip-row p7-active-conds' }, [UI.el('span', { class: 'p7-status-label', text: 'Conditions:' })].concat(activeConds.map(function (cond) { return UI.badge(cond.name, 'warn'); })))
        : null,
      renderSessionResources(app, c, rc, p)
    ]);
  }

  function renderSessionResources(app, c, rc, p) {
    var feature = State.sessionFeature(c);
    var edge = State.sessionEdge(c, rc);
    var rows = [];
    if (feature) {
      rows.push(UI.el('div', { class: 'p7-resource-row' }, [
        UI.el('div', { class: 'p7-resource-body' }, [
          UI.el('div', { class: 'p7-resource-name', text: feature.name + (feature.kind === 'spark' ? ' (' + feature.originAbilityId + ')' : '') }),
          UI.el('div', { class: 'p7-resource-text', text: feature.kind === 'spark'
            ? 'Once/session: after rolling a Skill that lists ' + feature.originAbilityId + ', reroll one die showing a natural 1 and keep the new result.'
            : 'Once/session: after any Skill roll, reroll one die showing a natural 1 and keep the new result.' })
        ]),
        UI.badge(feature.used ? 'Used' : 'Ready', feature.used ? 'default' : 'ready')
      ]));
    }
    if (edge) {
      // Driven and Inspired act on a roll, so they're spent from the roller; the narrative Edges are spent here.
      var manual = edge.edge.id !== 'driven' && edge.edge.id !== 'inspired';
      rows.push(UI.el('div', { class: 'p7-resource-row' }, [
        UI.el('div', { class: 'p7-resource-body' }, [
          UI.el('div', { class: 'p7-resource-name', text: 'Edge: ' + edge.edge.name }),
          UI.el('div', { class: 'p7-resource-text', text: 'Once/session: ' + edge.edge.effect + (manual ? '' : ' Use it from the roller below.') })
        ]),
        manual && !edge.used
          ? UI.button('Use', function () { var next = clone(c); next.play.edge_used = true; app.setCharacter(next); }, { small: true })
          : UI.badge(edge.used ? 'Used' : 'Ready', edge.used ? 'default' : 'ready')
      ]));
    }
    if (!rows.length) return null;
    rows.push(p.confirmNewSession
      ? UI.el('div', { class: 'p7-btn-row' }, [
        UI.button('Confirm: start new session', function () {
          var next = clone(c); next.play = State.startNewSession(c.play, rc);
          p.confirmNewSession = false; p.movedFeet = 0;
          p.notice = { kind: 'success', text: 'New session: once-per-session resources restored, full AP and Reaction.' };
          app.setCharacter(next);
        }, { variant: 'primary', small: true }),
        UI.button('Cancel', function () { p.confirmNewSession = false; app.render(); }, { small: true })
      ])
      : UI.button('Start New Session…', function () { p.confirmNewSession = true; app.render(); }, { small: true }));
    return UI.el('div', { class: 'p7-resources' }, rows);
  }

  function renderQuickActions(app, c, rc, p) {
    var econ = rc.action_economy;
    var spendAp = function (cost, mutate, message) {
      if (c.play.current_ap < cost) { p.notice = { kind: 'warn', text: 'Needs ' + cost + ' AP; you have ' + c.play.current_ap + '.' }; app.render(); return false; }
      var next = clone(c); next.play.current_ap -= cost; if (mutate) mutate(next);
      p.notice = { kind: 'default', text: message + ' (−' + cost + ' AP — tap an AP pip to undo)' };
      app.setCharacter(next);
      return true;
    };
    var equipped = app.canon.gear.gear.filter(function (g) { return c.gear.selected_ids.indexOf(g.id) !== -1; });
    var weapons = equipped.filter(function (g) { return g.category === 'Weapons' && g.die && g.skill; });
    var defenseSkills = app.canon.skills.skills.filter(function (s) { return s.category === 'Defense'; });
    var trainedDefense = defenseSkills.filter(function (s) { return (c.skills[s.id] && c.skills[s.id].ranks) > 0; });
    var children = [];

    var moveCost = econ.movement.ap_cost_per_move, feet = econ.movement.feet_per_ap, maxFeet = econ.movement.max_normal_movement_per_turn_feet;
    children.push(UI.el('div', { class: 'p7-action-row' }, [
      UI.el('div', { class: 'p7-action-label', text: 'Move' }),
      UI.button('Move ' + feet + ' ft (' + moveCost + ' AP)', function () {
        var total = p.movedFeet + feet;
        if (spendAp(moveCost, null, 'Moved ' + feet + ' ft — ' + total + ' ft this turn')) p.movedFeet = total;
      }, { small: true, disabled: c.play.current_ap < moveCost || p.movedFeet >= maxFeet }),
      UI.el('div', { class: 'p7-action-hint', text: p.movedFeet + ' / ' + maxFeet + ' ft this turn. There is no Run action — just move again.' })
    ]));

    var atkCost = econ.ordinary_attack_ap_cost;
    children.push(UI.el('div', { class: 'p7-action-row' }, [
      UI.el('div', { class: 'p7-action-label', text: 'Attack' }),
      weapons.length
        ? UI.el('div', { class: 'p7-chip-row' }, weapons.map(function (g) {
          return UI.button(g.name + ' (' + atkCost + ' AP)', function () {
            var skill = app.canon.skills.skills.filter(function (s) { return s.name === g.skill; })[0];
            selectSkill(app, p, skill.id); setRollSetup(p, { gearId: g.id });
            spendAp(atkCost, null, 'Attacking with ' + g.name + ': roll ' + skill.name + ' below, then use the resolver');
          }, { small: true, disabled: c.play.current_ap < atkCost });
        }))
        : UI.el('div', { class: 'p7-action-hint', text: 'No weapon equipped — equip one on the Gear tab, or pick an unarmed/melee Skill in the roller.' })
    ]));

    children.push(UI.el('div', { class: 'p7-action-row' }, [
      UI.el('div', { class: 'p7-action-label', text: 'Defend' }),
      UI.el('div', { class: 'p7-chip-row' }, (trainedDefense.length ? trainedDefense : defenseSkills).map(function (s) {
        return UI.chip(s.name, p.skillId === s.id, function () { p.notice = null; selectSkill(app, p, s.id); app.render(); });
      })),
      UI.el('div', { class: 'p7-action-hint', text: 'Active defense: roll it against the attacker’s total. Armor that fits is added as your Gear die.' })
    ]));

    var swapCost = rc.vam.field_swap_ap_cost;
    children.push(UI.el('div', { class: 'p7-action-row' }, [
      UI.el('div', { class: 'p7-action-label', text: 'VAMs' }),
      UI.button('Field Swap (' + swapCost + ' AP)', function () {
        var res = State.fieldSwap(c.play, rc);
        if (!res.legal) { p.notice = { kind: 'warn', text: res.reason }; app.render(); return; }
        var next = clone(c); next.play = res.play;
        next.meta.updated_at = new Date().toISOString();
        app.character = next; app.save();
        app.goTo('vams');
      }, { small: true, disabled: c.play.current_ap < swapCost }),
      UI.el('div', { class: 'p7-action-hint', text: 'Pays ' + swapCost + ' AP once, then opens VAMs so you can swap any number of loaded VAMs.' })
    ]));

    // Condition-removal actions come straight from the canonical registry (e.g. Prone → Stand, 1 AP).
    app.canon.conditions.conditions.forEach(function (cond) {
      if (c.play.conditions.indexOf(cond.id) === -1) return;
      (cond.removal || []).forEach(function (r) {
        if (r.type !== 'ACTION' || r.ap === undefined) return;
        var label = r.action || r.name;
        children.push(UI.el('div', { class: 'p7-action-row' }, [
          UI.el('div', { class: 'p7-action-label', text: cond.name }),
          UI.button(label + ' (' + r.ap + ' AP)', function () {
            spendAp(r.ap, function (next) { next.play.conditions = next.play.conditions.filter(function (id) { return id !== cond.id; }); }, label + ': ' + cond.name + ' removed');
          }, { small: true, disabled: c.play.current_ap < r.ap })
        ]));
      });
    });

    return UI.section('Actions', children);
  }

  var SOURCE_GROUPS = [
    { type: 'skill', label: 'Skill' }, { type: 'ability', label: 'Abilities' }, { type: 'gear', label: 'Gear' },
    { type: 'vam', label: 'VAM' }, { type: 'advantage', label: 'Advantage' }, { type: 'mastery', label: 'Mastery' }
  ];

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function renderRollLauncher(app, c, rc, p) {
    var skills = app.canon.skills.skills;
    var skill = skillById(app, p.skillId);
    var isMastered = c.progression.mastered_skill_ids.indexOf(skill.id) !== -1;
    var edge = State.sessionEdge(c, rc);
    var box = UI.section('Roll', []);
    box.classList.add('p7-roll-section');

    // 1 · Skill
    var trained = skills.filter(function (s) { return (c.skills[s.id] && c.skills[s.id].ranks) > 0; });
    var shown = p.showAllSkills || !trained.length ? skills : trained;
    if (shown.indexOf(skill) === -1) shown = shown.concat([skill]);
    var skillStep = UI.el('div', { class: 'p7-roll-step' }, [UI.el('div', { class: 'p7-roll-step-label', text: '1 · Skill' })]);
    var cats = [];
    shown.forEach(function (s) { if (cats.indexOf(s.category) === -1) cats.push(s.category); });
    cats.forEach(function (cat) {
      if (cats.length > 1) skillStep.appendChild(UI.el('div', { class: 'p7-roll-cat', text: cat }));
      skillStep.appendChild(UI.el('div', { class: 'p7-chip-row' }, shown.filter(function (s) { return s.category === cat; }).map(function (s) {
        var mastered = c.progression.mastered_skill_ids.indexOf(s.id) !== -1;
        return UI.chip(s.name + (mastered ? ' ★' : ''), s.id === skill.id, function () { p.notice = null; selectSkill(app, p, s.id); app.render(); });
      })));
    });
    skillStep.appendChild(UI.button(p.showAllSkills ? 'Show only my trained Skills' : 'Show all ' + skills.length + ' Skills', function () { p.showAllSkills = !p.showAllSkills; app.render(); }, { small: true, variant: 'ghost' }));
    box.appendChild(skillStep);

    // 2 · Named sources: Gear, VAM, Mastery
    var sources = UI.el('div', { class: 'p7-roll-step' }, [UI.el('div', { class: 'p7-roll-step-label', text: '2 · Named dice sources (optional)' })]);
    var relevantIds = State.relevantGear(skill, c.gear.selected_ids, app.canon.gear.gear).map(function (g) { return g.id; });
    var equipped = app.canon.gear.gear.filter(function (g) { return c.gear.selected_ids.indexOf(g.id) !== -1 && g.die; });
    var fitsFirst = equipped.filter(function (g) { return relevantIds.indexOf(g.id) !== -1; })
      .concat(equipped.filter(function (g) { return relevantIds.indexOf(g.id) === -1; }));
    sources.appendChild(UI.el('div', { class: 'p7-roll-cat', text: 'Gear — at most ' + rc.gear.ordinary_primary_relevant_limit + ' primary relevant item (✓ = listed for ' + skill.name + ')' }));
    sources.appendChild(fitsFirst.length
      ? UI.el('div', { class: 'p7-chip-row' }, fitsFirst.map(function (g) {
        var fits = relevantIds.indexOf(g.id) !== -1;
        return UI.chip(g.name + ' ' + g.die + (fits ? ' ✓' : ''), p.gearId === g.id, function () { setRollSetup(p, { gearId: p.gearId === g.id ? null : g.id }); app.render(); });
      }))
      : UI.el('div', { class: 'p7-action-hint', text: 'No dice-bearing Gear equipped (Gear tab).' }));
    if (p.gearId && relevantIds.indexOf(p.gearId) === -1) {
      var g0 = gearById(app, p.gearId);
      sources.appendChild(UI.note(g0.name + ' is listed for ' + g0.skill + ', not ' + skill.name + ' — only use it if your GM agrees it is relevant here.', 'warn'));
    }

    var dieVams = State.selfDieVams(c.vams.loaded_ids, app.canon.vams.vams);
    if (dieVams.length) {
      sources.appendChild(UI.el('div', { class: 'p7-roll-cat', text: 'Loaded VAM dice — only when the VAM’s trigger applies' }));
      sources.appendChild(UI.el('div', { class: 'p7-chip-row' }, dieVams.map(function (v) {
        var eff = v.effects.filter(function (e) { return e.op === 'ADD_DIE' && !e.target; })[0];
        return UI.chip(v.name + ' ' + eff.die + (eff.scope ? ' (' + humanize(eff.scope) + ')' : ''), p.vamId === v.id, function () { setRollSetup(p, { vamId: p.vamId === v.id ? null : v.id }); app.render(); });
      })));
    }

    if (isMastered) {
      var accessVams = State.masteryAccessVams(c.vams.loaded_ids, app.canon.vams.vams);
      sources.appendChild(UI.el('div', { class: 'p7-roll-cat', text: skill.name + ' is Mastered — its Mastery die needs explicit access' }));
      sources.appendChild(UI.el('div', { class: 'p7-chip-row' }, accessVams.map(function (v) {
        return UI.chip('Access via ' + v.name, p.masterySource === v.id, function () { setRollSetup(p, { masterySource: p.masterySource === v.id ? null : v.id }); app.render(); });
      }).concat([UI.chip('GM-granted access', p.masterySource === 'gm', function () { setRollSetup(p, { masterySource: p.masterySource === 'gm' ? null : 'gm' }); app.render(); })])));
    }
    box.appendChild(sources);

    // 3 · Situation: Advantage / Disadvantage / Inspired / Conditions
    var situation = UI.el('div', { class: 'p7-roll-step' }, [UI.el('div', { class: 'p7-roll-step-label', text: '3 · Situation' })]);
    var sitChips = [
      UI.chip('Advantage', p.advantage, function () { setRollSetup(p, { advantage: !p.advantage }); app.render(); }),
      UI.chip('Disadvantage', p.disadvantage, function () { setRollSetup(p, { disadvantage: !p.disadvantage }); app.render(); })
    ];
    if (edge && edge.edge.id === 'inspired' && !edge.used) {
      sitChips.push(UI.chip('Spend Inspired (Edge): Advantage', p.inspired, function () { setRollSetup(p, { inspired: !p.inspired }); app.render(); }));
    }
    situation.appendChild(UI.el('div', { class: 'p7-chip-row' }, sitChips));
    situation.appendChild(UI.el('div', { class: 'p7-action-hint', text: 'Advantage adds ' + rc.dice_sources.advantage_disadvantage.advantage.die + '; Disadvantage removes your smallest Ability die. One of each cancels out; neither stacks.' }));

    var activeConds = app.canon.conditions.conditions.filter(function (cond) { return c.play.conditions.indexOf(cond.id) !== -1; });
    var baseOpts = { skillId: skill.id, skillsRegistry: skills, characterState: c, rulesCore: rc };
    // Which active Conditions propose Disadvantage for this Skill — asked of the builder itself, one Condition at a time.
    var proposing = activeConds.filter(function (cond) {
      return RollBuilder.buildRollPool(Object.assign({ activeConditions: [cond] }, baseOpts)).conditionSources.length > 0;
    });
    if (proposing.length) {
      situation.appendChild(UI.el('div', { class: 'p7-roll-cat', text: 'Conditions proposing Disadvantage — your GM decides if each hinders this roll' }));
      situation.appendChild(UI.el('div', { class: 'p7-chip-row' }, proposing.map(function (cond) {
        var applies = p.waivedConditions.indexOf(cond.id) === -1;
        return UI.chip(cond.name + (applies ? ': applies' : ': waived by GM'), applies, function () {
          setRollSetup(p, { waivedConditions: applies ? p.waivedConditions.concat([cond.id]) : p.waivedConditions.filter(function (id) { return id !== cond.id; }) });
          app.render();
        });
      })));
    }
    box.appendChild(situation);

    // 4 · Difficulty
    var diffStep = UI.el('div', { class: 'p7-roll-step' }, [UI.el('div', { class: 'p7-roll-step-label', text: '4 · Difficulty' })]);
    diffStep.appendChild(UI.el('div', { class: 'p7-chip-row' }, [UI.chip('Opposed / none', p.difficulty === null, function () { p.difficulty = null; if (p.result) p.result.difficulty = null; app.render(); })].concat(
      Object.keys(rc.difficulty).map(function (k) {
        var n = rc.difficulty[k];
        return UI.chip(capitalize(humanize(k)) + ' ' + n, p.difficulty === n, function () { p.difficulty = n; if (p.result) p.result.difficulty = n; app.render(); });
      }))));
    box.appendChild(diffStep);

    var built = RollBuilder.buildRollPool(Object.assign({
      gearCandidates: p.gearId ? [gearById(app, p.gearId)] : [],
      vamCandidates: p.vamId ? [vamById(app, p.vamId)].map(function (v) {
        // Only self-targeted ADD_DIE effects reach the builder; ally-targeted dice belong in someone else's pool.
        return Object.assign({}, v, { effects: v.effects.filter(function (e) { return e.op === 'ADD_DIE' && !e.target; }) });
      }) : [],
      activeConditions: activeConds.filter(function (cond) { return p.waivedConditions.indexOf(cond.id) === -1; }),
      advantageReasons: [].concat(p.advantage ? ['situational (GM)'] : [], p.inspired ? ['Inspired (Edge)'] : []),
      disadvantageReasons: p.disadvantage ? ['situational (GM)'] : [],
      masteryAccessGranted: isMastered && !!p.masterySource
    }, baseOpts));
    app.rollPreview = built;

    box.appendChild(renderPoolPreview(built));
    built.restrictions.forEach(function (r) { box.appendChild(UI.note(r, 'warn')); });
    built.warnings.forEach(function (w) { box.appendChild(UI.note(w, 'warn')); });

    // Roll: App ROLL or physical dice (G01/G05) — both consume exactly built.pool.
    box.appendChild(UI.el('div', { class: 'p7-chip-row' }, [
      UI.chip('App ROLL', p.mode === 'digital', function () { setRollSetup(p, { mode: 'digital' }); app.render(); }),
      UI.chip('Physical dice', p.mode === 'physical', function () { setRollSetup(p, { mode: 'physical' }); app.render(); })
    ]));
    var rollBtn = UI.button(p.mode === 'digital' ? 'ROLL ' + built.pool.length + ' DICE' : 'I rolled these — enter faces', function () {
      var rolled = p.mode === 'digital' ? RollBuilder.rollPool(built.pool, rc, Math.random) : RollBuilder.startManualRoll(built.pool, rc);
      p.result = { rolled: rolled, skillId: skill.id, skillName: skill.name, difficulty: p.difficulty, mode: p.mode };
      p.rerollPick = false;
      p.combatResult = null;
      p.notice = null;
      if (p.inspired) {
        p.inspired = false;
        var next = clone(c); next.play.edge_used = true; app.setCharacter(next);
        return;
      }
      app.render();
    }, { variant: 'primary' });
    rollBtn.classList.add('p7-roll-btn');
    box.appendChild(rollBtn);

    if (p.result) box.appendChild(renderRollResult(app, c, rc, p));
    return box;
  }

  function renderPoolPreview(built) {
    var rows = SOURCE_GROUPS.map(function (grp) {
      var dice = built.pool.filter(function (d) { return d.source_type === grp.type; });
      if (!dice.length) return null;
      return UI.el('div', { class: 'p7-pool-row' }, [
        UI.el('div', { class: 'p7-pool-label', text: grp.label }),
        UI.el('div', { class: 'p7-pool-dice' }, dice.map(function (d) {
          return UI.el('span', { class: 'p7-pool-die p7-pool-die-' + d.source_type, title: d.reason }, [
            UI.el('b', { text: d.die }), UI.el('span', { text: ' ' + d.label })
          ]);
        }))
      ]);
    });
    if (built.removedDice.length) {
      rows.push(UI.el('div', { class: 'p7-pool-row' }, [
        UI.el('div', { class: 'p7-pool-label', text: 'Removed' }),
        UI.el('div', { class: 'p7-pool-dice' }, built.removedDice.map(function (d) {
          return UI.el('span', { class: 'p7-pool-die p7-pool-die-removed' }, [UI.el('b', { text: d.die }), UI.el('span', { text: ' ' + d.source_id + ' — ' + d.reason })]);
        }))
      ]));
    }
    return UI.el('div', { class: 'p7-pool-preview' }, [UI.el('div', { class: 'p7-roll-step-label', text: 'Your pool — ' + built.pool.length + ' dice' })].concat(rows));
  }

  function renderRollResult(app, c, rc, p) {
    var res = p.result, rolled = res.rolled;
    var skill = skillById(app, res.skillId);
    var feature = State.sessionFeature(c);
    var edge = State.sessionEdge(c, rc);
    var sparkIdx = rolled.complete ? State.naturalOneRerollIndices(c, skill, rolled.results) : [];
    var drivenReady = rolled.complete && edge && edge.edge.id === 'driven' && !edge.used;
    var physical = res.mode === 'physical';

    // A physical reroll clears the face for the player to re-enter; an app reroll rolls it.
    var reroll = function (i, markUsed) {
      res.rolled = RollBuilder.rerollDie(rolled, i, rc, physical ? null : Math.random);
      p.rerollPick = false;
      p.combatResult = null;
      var next = clone(c); markUsed(next.play); app.setCharacter(next);
    };

    var dice = rolled.results.map(function (r, i) {
      var blank = r.face !== null && r.scored === 0;
      var cell = [
        UI.el('div', { class: 'p7-die-face' + (blank ? ' p7-die-blank' : '') + (r.face === null ? ' p7-die-pending' : ''), text: r.face === null ? '?' : String(r.face) }),
        UI.el('div', { class: 'p7-die-caption', text: r.die + ' · ' + r.label }),
        UI.el('div', { class: 'p7-die-caption' + (blank ? ' p7-die-caption-blank' : ''), text: r.face === null ? 'tap the face' : blank ? 'blank · 0' : '+' + r.scored })
      ];
      if (r.rerolled) cell.push(UI.el('div', { class: 'p7-die-caption', text: 'rerolled' + (r.previous_face ? ' (was ' + r.previous_face + ')' : '') }));
      if (r.face === null) {
        var faces = [];
        for (var f = 1; f <= State.sidesOf(r.die); f++) {
          (function (face) {
            faces.push(UI.dieChip(String(face), function () { res.rolled = RollBuilder.setFace(rolled, i, face, rc); app.render(); }, {}));
          }(f));
        }
        cell.push(UI.el('div', { class: 'p7-face-picker' }, faces));
      }
      if (sparkIdx.indexOf(i) !== -1) {
        cell.push(UI.button('Reroll · ' + feature.name, function () { reroll(i, function (play) { play.vitality_spark_used = true; }); }, { small: true, variant: 'primary' }));
      }
      if (p.rerollPick && drivenReady) {
        cell.push(UI.button('Reroll · Driven', function () { reroll(i, function (play) { play.edge_used = true; }); }, { small: true, variant: 'primary' }));
      }
      return UI.el('div', { class: 'p7-die-cell' + (r.face === null ? ' p7-die-cell-wide' : '') }, cell);
    });

    var children = [
      UI.el('div', { class: 'p7-roll-step-label', text: (physical ? 'Physical roll' : 'App roll') + ' — ' + res.skillName }),
      UI.el('div', { class: 'p7-die-grid' }, dice)
    ];

    if (!rolled.complete) {
      children.push(UI.note('Tap the face showing on each of your physical dice. Faces ' + rc.protocol_dice.blank_faces.join(', ') + ' are blanks and score 0.', 'default'));
    } else {
      children.push(UI.el('div', { class: 'p7-total', text: 'Total ' + rolled.total }));
      if (res.difficulty !== null) {
        var ev = RollBuilder.evaluateDifficulty(rolled.total, res.difficulty, rc);
        children.push(UI.el('div', { class: 'p7-verdict ' + (ev.success ? 'p7-verdict-success' : 'p7-verdict-fail'), text:
          (ev.success ? 'SUCCESS' : 'FAILURE') + ' vs ' + res.difficulty + ' — ' +
          (ev.margin === 0 ? 'met exactly, no winning margin' : (ev.margin > 0 ? 'winning' : 'failing') + ' margin ' + Math.abs(ev.margin) + (ev.band ? ' (' + ev.band + ')' : '')) }));
      } else {
        children.push(UI.el('div', { class: 'p7-action-hint', text: 'Opposed roll: compare with the other side’s total in the resolver below. Winning margins: ' + rc.margin_bands.map(function (b) { return b.label + ' ' + b.min + (b.max === null ? '+' : '–' + b.max); }).join(', ') + '.' }));
      }
      if (sparkIdx.length) children.push(UI.note(feature.name + ' is ready: tap “Reroll” on a die showing a natural 1. You must keep the new result.', 'success'));
      if (drivenReady) {
        children.push(UI.button(p.rerollPick ? 'Cancel Driven reroll' : 'Spend Driven (Edge): reroll one die', function () { p.rerollPick = !p.rerollPick; app.render(); }, { small: true }));
      }
    }
    // Reserved area for any later-authorized blank-pattern rule (Screen Map → Play → result display).
    children.push(UI.el('div', { class: 'p7-blank-pattern', text: rc.matched_blanks.enabled
      ? 'Blank patterns: enabled'
      : 'Blank patterns: Matched Blanks are ' + rc.matched_blanks.release_state + ' in this playtest — blanks simply score 0.' }));

    return UI.el('div', { class: 'p7-roll-result' }, children);
  }

  function renderCombatResolver(app, c, rc, p) {
    var rolled = p.result && p.result.rolled.complete ? p.result.rolled : null;
    var myTotal = rolled ? rolled.total : null;
    var maxHpVal = State.maxHp(startingHpOf(c, rc), c.progression.level, c.progression.edge_id === 'durable', rc);
    var setOpp = function (v) { p.opponentTotal = Math.max(0, v); p.combatResult = null; app.render(); };
    var box = UI.section('Attack & Defense', [
      UI.el('div', { class: 'p7-action-hint', text: 'Opposed: the attacker must beat the defender’s total. Damage = the winning margin — no separate damage die, and armor already counted in the defense roll.' }),
      UI.el('div', { text: 'Your last roll: ' + (myTotal === null ? '— roll above first' : myTotal + ' (' + p.result.skillName + ')') }),
      UI.el('div', { class: 'p7-btn-row p7-btn-row-tight p7-opp-row' }, [
        UI.el('span', { class: 'p7-stepper-label', text: 'Their total' }),
        UI.button('−5', function () { setOpp(p.opponentTotal - 5); }, { small: true, disabled: p.opponentTotal === 0 }),
        UI.button('−1', function () { setOpp(p.opponentTotal - 1); }, { small: true, disabled: p.opponentTotal === 0 }),
        UI.el('span', { class: 'p7-stepper-value', text: String(p.opponentTotal) }),
        UI.button('+1', function () { setOpp(p.opponentTotal + 1); }, { small: true }),
        UI.button('+5', function () { setOpp(p.opponentTotal + 5); }, { small: true })
      ]),
      UI.el('div', { class: 'p7-btn-row' }, [
        UI.button('I attacked', function () { p.combatResult = Object.assign({ role: 'attack' }, State.resolveAttack(myTotal, p.opponentTotal)); app.render(); }, { variant: 'primary', disabled: myTotal === null }),
        UI.button('I defended', function () { p.combatResult = Object.assign({ role: 'defend' }, State.resolveAttack(p.opponentTotal, myTotal)); app.render(); }, { variant: 'primary', disabled: myTotal === null })
      ])
    ]);
    var r = p.combatResult;
    if (r) {
      if (r.role === 'attack') {
        box.appendChild(UI.note(r.hit ? 'HIT — you deal ' + r.damage + ' damage (winning margin).' : 'MISS — your total did not beat their defense.', r.hit ? 'success' : 'warn'));
      } else if (r.hit) {
        box.appendChild(UI.note('You are HIT for ' + r.damage + ' damage.', 'warn'));
        if (!r.applied) {
          box.appendChild(UI.button('Take ' + r.damage + ' damage', function () {
            r.applied = true;
            var next = clone(c); next.play.current_hp = State.applyHpChange(c.play.current_hp, -r.damage, maxHpVal); app.setCharacter(next);
          }, { variant: 'danger' }));
        } else {
          box.appendChild(UI.note(r.damage + ' damage applied to your HP.', 'default'));
        }
      } else {
        box.appendChild(UI.note('Defended — the attack did not beat your total. No damage.', 'success'));
      }
    }
    return box;
  }

  function renderLoadedVams(app, c, rc, p) {
    var loaded = c.vams.loaded_ids.map(function (id) { return vamById(app, id); }).filter(Boolean);
    if (!loaded.length) return UI.section('Loaded VAMs', [UI.el('div', { class: 'p7-action-hint', text: 'No VAMs loaded — load them on the VAMs tab.' })]);
    var dieVamIds = State.selfDieVams(c.vams.loaded_ids, app.canon.vams.vams).map(function (v) { return v.id; });
    var masteryVamIds = State.masteryAccessVams(c.vams.loaded_ids, app.canon.vams.vams).map(function (v) { return v.id; });
    var isMastered = c.progression.mastered_skill_ids.indexOf(p.skillId) !== -1;
    return UI.section('Loaded VAMs', [UI.el('div', { class: 'p7-vam-grid' }, loaded.map(function (v) {
      var action = null;
      if (dieVamIds.indexOf(v.id) !== -1) {
        action = UI.button(p.vamId === v.id ? 'Remove from roll' : 'Add its die to roll', function () { setRollSetup(p, { vamId: p.vamId === v.id ? null : v.id }); app.render(); }, { small: true, variant: p.vamId === v.id ? 'secondary' : 'primary' });
      } else if (masteryVamIds.indexOf(v.id) !== -1 && isMastered) {
        action = UI.button(p.masterySource === v.id ? 'Stop Mastery access' : 'Grant Mastery access', function () { setRollSetup(p, { masterySource: p.masterySource === v.id ? null : v.id }); app.render(); }, { small: true, variant: 'primary' });
      }
      var inRoll = p.vamId === v.id || p.masterySource === v.id;
      return UI.card([
        UI.el('div', { class: 'p7-vam-name', text: v.name }),
        UI.el('div', { class: 'p7-vam-meta', text: formatFamily(v.family) + ' · ' + v.bar + ' BAR' }),
        UI.el('div', { class: 'p7-resource-text', text: vamEffectSummary(v) }),
        action
      ], { class: 'p7-vam-card' + (inRoll ? ' p7-vam-in-roll' : '') });
    }))]);
  }

  function renderConditions(app, c) {
    return UI.section('Conditions', [
      // Chips need their own flex-wrap row — .p7-section is itself a flex
      // *column*, so chips passed straight in would stack one-per-line.
      UI.el('div', { class: 'p7-chip-row' }, app.canon.conditions.conditions.map(function (cond) {
        var active = c.play.conditions.indexOf(cond.id) !== -1;
        return UI.chip(cond.name, active, function () {
          var next = clone(c);
          next.play.conditions = active ? next.play.conditions.filter(function (id) { return id !== cond.id; }) : next.play.conditions.concat([cond.id]);
          app.setCharacter(next);
        });
      })),
      UI.el('div', { class: 'p7-action-hint', text: 'Active Conditions show in Status, add their removal actions (e.g. Stand) to Actions, and propose Disadvantage in the roller where they apply.' })
    ]);
  }

  // ---------------------------------------------------------------
  // ADVANCEMENT screen
  // ---------------------------------------------------------------
  function renderAdvancement(app, container) {
    var c = app.character, rc = app.canon.rulesCore;
    container.appendChild(UI.help('Preview what each Level unlocks — BAR ceiling, Edge slots, Ability growth, and Mastery slots. Tap Advance once your GM confirms you’ve leveled up; nothing here changes automatically.'));
    var maxLevel = Math.max.apply(null, Object.keys(rc.levels).map(Number));
    for (var lvl = 1; lvl <= maxLevel; lvl++) {
      container.appendChild(renderLevelCard(app, c, rc, lvl, maxLevel));
    }
  }

  /**
   * Which Level unlocks which choice is read from rc, not hardcoded here —
   * an A42 human read-through found an earlier draft of this function keyed
   * directly off literal Level numbers (2/3/5/4/6), which would silently
   * stop tracking the rules if a future revision moved a slot to a
   * different Level. Ability growth reads rc.abilities.growth_levels
   * directly; Edge and Mastery availability are derived from whether the
   * current Level's slot count is nonzero / increased over the prior Level.
   */
  function renderLevelCard(app, c, rc, lvl, maxLevel) {
    var data = rc.levels[String(lvl)];
    var prevData = rc.levels[String(lvl - 1)]; // undefined below Level 1, which is fine — treated as 0 slots
    var state = lvl < c.progression.level ? 'completed' : lvl === c.progression.level ? 'current' : 'upcoming';
    var children = [
      UI.el('div', { class: 'p7-level-title', text: 'Level ' + lvl + ' — ' + state }),
      UI.el('div', { text: 'BAR ceiling ' + data.bar + ' · Edge slots ' + data.edge_slots + ' · Ability growth ' + data.ability_growth_slots + ' · Mastery slots ' + data.mastery_slots })
    ];

    if (state === 'current') {
      if (data.edge_slots > 0 && !c.progression.edge_id) {
        children.push(UI.el('div', { class: 'p7-btn-row' }, rc.edges.map(function (e) {
          return UI.button(e.name, function () {
            var next = JSON.parse(JSON.stringify(c)); next.progression.edge_id = e.id; app.setCharacter(next);
          }, { small: true });
        })));
      }
      if (rc.abilities.growth_levels.indexOf(lvl) !== -1) {
        var slotsUsedAtLevel = c.progression.ability_growth.filter(function (g) { return g.level === lvl; }).length;
        if (slotsUsedAtLevel === 0) {
          children.push(UI.el('div', { class: 'p7-btn-row' }, rc.abilities.ids.map(function (id) {
            return UI.button('Grow ' + id, function () {
              var next = JSON.parse(JSON.stringify(c));
              next.progression.ability_growth.push({ level: lvl, ability_id: id });
              app.setCharacter(next);
            }, { small: true });
          })));
        }
      }
      var newMasterySlotsThisLevel = data.mastery_slots - (prevData ? prevData.mastery_slots : 0);
      if (newMasterySlotsThisLevel > 0) {
        var slotsAvail = State.masterySlots(lvl, rc) - c.progression.mastered_skill_ids.length;
        if (slotsAvail > 0) {
          children.push(UI.el('div', { class: 'p7-note', text: slotsAvail + ' Mastered Skill slot(s) available — pick in Skills → Edit by tapping "Master" (see Skills tab)' }));
        }
      }
      if (lvl < maxLevel) {
        children.push(UI.button('Advance to Level ' + (lvl + 1), function () {
          var next = JSON.parse(JSON.stringify(c));
          next.progression.level = lvl + 1;
          next.play.current_hp = Math.min(next.play.current_hp, State.maxHp(startingHpOf(next, rc), next.progression.level, next.progression.edge_id === 'durable', rc));
          app.setCharacter(next);
        }, { variant: 'primary' }));
      } else {
        children.push(UI.note('Maximum Level reached.', 'success'));
      }
    }

    if (state === 'completed' && lvl === c.progression.level - 1) {
      children.push(UI.button('Reduce to Level ' + lvl, function () {
        var warn = State.levelReductionWarnings(c, lvl, rc);
        if (warn.hasWarnings && !confirm('Reducing will invalidate: ' + warn.warnings.join(' | ') + '\\n\\nProceed anyway?')) return;
        var next = JSON.parse(JSON.stringify(c)); next.progression.level = lvl; app.setCharacter(next);
      }, { variant: 'danger', small: true }));
    }

    return UI.card(children, { class: 'p7-level-card p7-level-' + state });
  }

  // ---------------------------------------------------------------
  Screens.render = function (app, container) {
    var map = { character: renderCharacter, skills: renderSkills, vams: renderVams, gear: renderGear, play: renderPlay, advancement: renderAdvancement };
    (map[app.screen] || renderCharacter)(app, container);
  };

  window.P7.Screens = Screens;
}());
