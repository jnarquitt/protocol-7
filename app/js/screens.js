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

  function renderCreation(app) {
    var w = ensureCreation(app);
    var rc = app.canon.rulesCore;
    var wrap = UI.el('div', { class: 'p7-creation' });

    wrap.appendChild(UI.el('div', { class: 'p7-creation-steps', text: 'Create a Vector — Step: ' + w.step }));

    if (w.step === 'path') {
      wrap.appendChild(UI.section('Choose a starting path', [
        UI.el('div', { class: 'p7-btn-row' }, [
          UI.button('Custom Vector', function () { w.path = 'custom'; w.step = 'name'; app.render(); }, { variant: 'primary' }),
          UI.button('Preconfigured Vector', function () { w.step = 'preset'; app.render(); }, { variant: 'primary' })
        ]),
        UI.note('Already have a save? Import it instead of creating a new Vector.', 'default'),
        UI.button('Import a Save…', function () { promptImport(app); })
      ]));
    } else if (w.step === 'preset') {
      wrap.appendChild(UI.section('Choose an Identity (Level 1 · ' + rc.levels['1'].bar + ' BAR ceiling)', [
        UI.el('div', { class: 'p7-preset-grid' }, Presets.PRESETS.map(function (p) {
          var bar = Presets.presetLoadedBar(p, app.canon.vams.vams);
          return UI.card([
            UI.el('div', { class: 'p7-preset-name', text: p.name }),
            UI.el('div', { class: 'p7-preset-bar', text: bar + ' BAR' }),
            UI.el('div', { class: 'p7-preset-identity', text: p.identity }),
            UI.button('Choose ' + p.name, function () {
              w.path = 'preconfigured'; w.presetId = p.id;
              // Playtest default: a neutral ability array so no per-archetype
              // ability design is silently baked in here. Fully editable next step.
              rc.abilities.ids.forEach(function (id, i) { w.abilityAssignment[id] = rc.abilities.starting_multiset[i]; });
              w.remainingDice = [];
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
    var box = UI.section('Assign Abilities — tap a die, then tap an Ability', [
      UI.el('div', { class: 'p7-die-pool' }, w.remainingDice.map(function (die, idx) {
        return UI.dieChip(die, function () { w.pendingDie = { die: die, idx: idx }; app.render(); }, { selected: w.pendingDie && w.pendingDie.idx === idx });
      })),
      UI.el('div', { class: 'p7-ability-grid' }, ids.map(function (id) {
        var assigned = w.abilityAssignment[id];
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
          assigned ? UI.button('clear', function () {
            w.remainingDice.push(w.abilityAssignment[id]);
            w.abilityAssignment[id] = null;
            app.render();
          }, { small: true }) : null
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
    box.appendChild(UI.el('div', { class: 'p7-budget-banner' + (alloc.legal ? '' : ' p7-budget-over'), text: 'Skill Ranks: ' + alloc.spent + ' / ' + alloc.budget + ' spent' }));

    var cats = app.canon.skills.categories;
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

    box.appendChild(UI.meter('BAR', used, ceiling));
    box.appendChild(UI.el('div', { class: 'p7-note', text: 'Authorization: ' + auth }));
    box.appendChild(UI.note('Starting VAM Loadout — ' + (w.path === 'preconfigured' ? "this is the preset's default; Load/Unload freely before you create the Vector." : 'optional — load any Level 1 VAMs now, or skip and load them later.'), 'default'));

    box.appendChild(UI.el('div', { class: 'p7-vam-grid' }, vams.map(function (v) {
      var loaded = w.loadedVamIds.indexOf(v.id) !== -1;
      var otherLoadedBar = used - (loaded ? v.bar : 0);
      var legality = State.vamLegality(v, 1, otherLoadedBar, rc);
      var canToggle = loaded || legality.legal;
      return UI.card([
        UI.el('div', { class: 'p7-vam-name', text: v.name }),
        UI.el('div', { class: 'p7-vam-meta', text: v.family + ' · Lv' + v.level + ' · ' + v.bar + ' BAR' }),
        !canToggle ? UI.note(legality.reasons.join('; '), 'warn') : null,
        UI.button(loaded ? 'Unload' : 'Load', function () {
          if (loaded) w.loadedVamIds = w.loadedVamIds.filter(function (id) { return id !== v.id; });
          else w.loadedVamIds.push(v.id);
          app.render();
        }, { disabled: !canToggle, variant: loaded ? 'danger' : 'primary', small: true })
      ], { class: 'p7-vam-card' });
    })));

    box.appendChild(UI.el('div', { class: 'p7-btn-row' }, [
      UI.button('← Back', function () { w.step = 'skills'; app.render(); }),
      UI.button('Continue →', function () { w.step = 'review'; app.render(); }, { variant: 'primary' })
    ]));
    return box;
  }

  function renderReviewStep(app, w, rc) {
    var vams = app.canon.vams.vams;
    var vamsById = byId(vams);
    var box = UI.section('Review & Create', [
      UI.el('div', { text: 'Name: ' + (w.name || '(unnamed)') }),
      UI.el('div', { text: 'Path: ' + w.path + (w.presetId ? ' (' + w.presetId + ')' : '') }),
      UI.el('div', { text: 'Abilities: ' + rc.abilities.ids.map(function (id) { return id + '=' + w.abilityAssignment[id]; }).join(', ') }),
      UI.el('div', { text: 'VAMs (' + State.loadedBar(w.loadedVamIds, vams) + ' BAR): ' + (w.loadedVamIds.length ? w.loadedVamIds.map(function (id) { return vamsById[id] ? vamsById[id].name : id; }).join(', ') : '(none loaded)') }),
      UI.button('Create Vector', function () { finalizeCreation(app, w, rc); }, { variant: 'primary' }),
      UI.button('← Back', function () { w.step = 'vams'; app.render(); })
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

    container.appendChild(UI.el('div', { class: 'p7-tabbar' }, ['trained', 'all', 'edit'].map(function (t) {
      return UI.chip(t === 'trained' ? 'My Trained Skills' : t.charAt(0).toUpperCase() + t.slice(1), tab === t, function () { app.skillsTab = t; app.render(); });
    })));

    var alloc = State.allocateSkillRanks(c.skills, rc, c.progression.level);
    container.appendChild(UI.el('div', { class: 'p7-budget-banner' + (alloc.legal ? '' : ' p7-budget-over'), text: 'Skill Ranks: ' + alloc.spent + ' / ' + alloc.budget + ' spent, ' + alloc.remaining + ' remaining' }));

    var trainedOnly = tab === 'trained';
    var editable = tab === 'edit';
    var cats = app.canon.skills.categories;
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
      children.push(UI.button('Roll', function () { app.rollSkillId = s.id; app.goTo('play'); }, { small: true, variant: 'primary' }));
    }
    return UI.card(children, { class: 'p7-skill-card' });
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
    var families = ['all'].concat(app.canon.vams.families);
    container.appendChild(UI.el('div', { class: 'p7-tabbar' }, families.map(function (f) {
      return UI.chip(f, app.vamFamilyFilter === f, function () { app.vamFamilyFilter = f; app.render(); });
    })));
    container.appendChild(UI.chip('Loaded Only', !!app.vamLoadedOnly, function () { app.vamLoadedOnly = !app.vamLoadedOnly; app.render(); }));

    var list = vams.filter(function (v) {
      if (app.vamFamilyFilter !== 'all' && v.family !== app.vamFamilyFilter) return false;
      if (app.vamLoadedOnly && c.vams.loaded_ids.indexOf(v.id) === -1) return false;
      return true;
    });

    container.appendChild(UI.el('div', { class: 'p7-vam-grid' }, list.map(function (v) {
      var loaded = c.vams.loaded_ids.indexOf(v.id) !== -1;
      var otherLoadedBar = used - (loaded ? v.bar : 0);
      var legality = State.vamLegality(v, c.progression.level, otherLoadedBar, rc);
      var canToggle = loaded || legality.legal;
      return UI.card([
        UI.el('div', { class: 'p7-vam-name', text: v.name }),
        UI.el('div', { class: 'p7-vam-meta', text: v.family + ' · Lv' + v.level + ' · ' + v.bar + ' BAR' }),
        (v.effects || []).some(function (e) { return e.op === 'ALLOW_MASTERY'; }) ? UI.badge('Mastery-enabling', 'mastery') : null,
        !canToggle ? UI.note(legality.reasons.join('; '), 'warn') : null,
        UI.button(loaded ? 'Unload' : 'Load', function () {
          var next = JSON.parse(JSON.stringify(c));
          if (loaded) next.vams.loaded_ids = next.vams.loaded_ids.filter(function (id) { return id !== v.id; });
          else next.vams.loaded_ids.push(v.id);
          app.setCharacter(next);
        }, { disabled: !canToggle, variant: loaded ? 'danger' : 'primary', small: true })
      ], { class: 'p7-vam-card' });
    })));
  }

  // ---------------------------------------------------------------
  // GEAR screen
  // ---------------------------------------------------------------
  function renderGear(app, container) {
    var c = app.character, gear = app.canon.gear.gear;
    if (!app.gearEraFilter) app.gearEraFilter = 'all';
    var eras = ['all'].concat(app.canon.gear.era_filters);
    container.appendChild(UI.el('div', { class: 'p7-tabbar' }, eras.map(function (e) {
      return UI.chip(e, app.gearEraFilter === e, function () { app.gearEraFilter = e; app.render(); });
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
          }, { small: true, variant: selected ? 'danger' : 'primary' })
        ], { class: 'p7-gear-card' });
      })));
    });
  }

  // ---------------------------------------------------------------
  // PLAY screen
  // ---------------------------------------------------------------
  var CONDITION_IDS_CACHE = null;
  function renderPlay(app, container) {
    var c = app.character, rc = app.canon.rulesCore, skills = app.canon.skills.skills;
    var maxHpVal = State.maxHp(startingHpOf(c, rc), c.progression.level, c.progression.edge_id === 'durable', rc);

    container.appendChild(UI.section('Status', [
      UI.el('div', { class: 'p7-hp-row' }, [
        UI.el('div', { class: 'p7-hp-readout', text: 'HP ' + c.play.current_hp + ' / ' + maxHpVal }),
        UI.stepper('', c.play.current_hp, function (v) {
          var next = JSON.parse(JSON.stringify(c)); next.play.current_hp = State.applyHpChange(0, v, maxHpVal); app.setCharacter(next);
        }, { min: 0, max: maxHpVal })
      ]),
      UI.el('div', { class: 'p7-ap-row' }, [
        UI.el('span', { text: 'AP: ' }),
        UI.el('div', { class: 'p7-ap-pips' }, [0, 1, 2].map(function (i) {
          var filled = i < c.play.current_ap;
          return UI.el('button', {
            class: 'p7-ap-pip' + (filled ? ' p7-ap-pip-filled' : ''),
            onclick: function () {
              var next = JSON.parse(JSON.stringify(c));
              next.play.current_ap = filled ? i : i + 1;
              app.setCharacter(next);
            }
          });
        }))
      ]),
      UI.button('Use Reaction (' + (c.play.reaction_available ? 'Available' : 'Used') + ')', function () {
        var res = State.resolveReaction(c.play, rc);
        if (!res.legal) { alert(res.reason); return; }
        var next = JSON.parse(JSON.stringify(c)); next.play = res.play; app.setCharacter(next); alert(res.reason);
      }, { disabled: !c.play.reaction_available, variant: 'primary' }),
      UI.button('Start New Turn', function () {
        var next = JSON.parse(JSON.stringify(c)); next.play = State.startNewTurn(c.play, rc); app.setCharacter(next);
      })
    ]));

    container.appendChild(UI.section('Conditions', app.canon.conditions.conditions.map(function (cond) {
      var active = c.play.conditions.indexOf(cond.id) !== -1;
      return UI.chip(cond.name, active, function () {
        var next = JSON.parse(JSON.stringify(c));
        next.play.conditions = active ? next.play.conditions.filter(function (id) { return id !== cond.id; }) : next.play.conditions.concat([cond.id]);
        app.setCharacter(next);
      });
    })));

    container.appendChild(renderRollLauncher(app, c, rc, skills));
    container.appendChild(renderCombatResolver(app, c));
  }

  function renderRollLauncher(app, c, rc, skills) {
    if (!app.rollSkillId) app.rollSkillId = (c.progression.mastered_skill_ids[0] || skills[0].id);
    if (!app.rollFlags) app.rollFlags = { advantage: false, disadvantage: false, mastery: false, gear: null, vam: null };

    var trainedSkills = skills.filter(function (s) { return (c.skills[s.id] && c.skills[s.id].ranks) > 0; });
    var box = UI.section('Roll Launcher (one canonical roll builder)', [
      UI.el('div', { class: 'p7-tabbar' }, (trainedSkills.length ? trainedSkills : skills.slice(0, 5)).map(function (s) {
        return UI.chip(s.name, app.rollSkillId === s.id, function () { app.rollSkillId = s.id; app.render(); });
      })),
      UI.el('div', { class: 'p7-btn-row' }, [
        UI.chip('Advantage', app.rollFlags.advantage, function () { app.rollFlags.advantage = !app.rollFlags.advantage; app.render(); }),
        UI.chip('Disadvantage', app.rollFlags.disadvantage, function () { app.rollFlags.disadvantage = !app.rollFlags.disadvantage; app.render(); }),
        UI.chip('Mastery Access', app.rollFlags.mastery, function () { app.rollFlags.mastery = !app.rollFlags.mastery; app.render(); })
      ])
    ]);

    var built = RollBuilder.buildRollPool({
      skillId: app.rollSkillId, skillsRegistry: skills, characterState: c, rulesCore: rc,
      gearCandidates: [], vamCandidates: [],
      advantageReasons: app.rollFlags.advantage ? ['player-declared'] : [],
      disadvantageReasons: app.rollFlags.disadvantage ? ['player-declared'] : [],
      masteryAccessGranted: app.rollFlags.mastery
    });
    app.rollPreview = built;

    box.appendChild(UI.el('div', { class: 'p7-roll-preview', text: built.explanation }));
    if (built.restrictions.length) box.appendChild(UI.note(built.restrictions.join(' | '), 'warn'));
    box.appendChild(UI.button('ROLL', function () {
      var rolled = RollBuilder.rollPool(built.pool, rc, Math.random);
      app.rollResult = rolled;
      app.render();
    }, { variant: 'primary' }));

    if (app.rollResult) {
      box.appendChild(UI.el('div', { class: 'p7-roll-result', text: 'Total: ' + app.rollResult.total + ' — ' + app.rollResult.results.map(function (r) { return r.label + ':' + r.face + (r.scored ? '' : '(blank)'); }).join(', ') }));
    }
    return box;
  }

  function renderCombatResolver(app, c) {
    if (app.opponentTotal === undefined) app.opponentTotal = 0;
    var myTotal = app.rollResult ? app.rollResult.total : 0;
    var box = UI.section('Active Defense Resolver', [
      UI.el('div', { text: 'Your last roll total: ' + myTotal }),
      // 60 is a UI-only stepper ceiling for manual entry, not a rule value —
      // there is no canonical maximum roll total.
      UI.stepper('Opponent Total', app.opponentTotal, function (v) { app.opponentTotal = v; app.render(); }, { min: 0, max: 60 }),
      UI.button('Resolve', function () {
        var res = State.resolveAttack(myTotal, app.opponentTotal);
        app.combatResult = res;
        app.render();
      }, { variant: 'primary' })
    ]);
    if (app.combatResult) {
      box.appendChild(UI.note(app.combatResult.hit ? 'HIT — margin ' + app.combatResult.margin + ', damage ' + app.combatResult.damage : 'MISS — margin ' + app.combatResult.margin, app.combatResult.hit ? 'success' : 'warn'));
    }
    return box;
  }

  // ---------------------------------------------------------------
  // ADVANCEMENT screen
  // ---------------------------------------------------------------
  function renderAdvancement(app, container) {
    var c = app.character, rc = app.canon.rulesCore;
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
