/**
 * Protocol 7 v0.188 — Application Controller
 * ------------------------------------------------------------
 * Boots canonical data, owns the ONE persisted character-state object
 * (ARCH-001), routes between the six primary screens (Character, Skills,
 * VAMs, Gear, Play, Advancement) per the Screen & Interaction Map, and
 * autosaves to localStorage (no account) per the Requirements Bible.
 *
 * This file does not compute any mechanical value itself — every derived
 * number a screen shows comes from state.js/roll-builder.js. It only
 * owns "what screen is showing" and "read/write the one character object".
 */
(function () {
  'use strict';
  var State = window.P7.State;
  var Persistence = window.P7.Persistence;
  var Presets = window.P7.Presets;
  var Data = window.P7.Data;

  var STORAGE_KEY = 'p7-character-v0188';
  var SCREENS = ['character', 'skills', 'vams', 'gear', 'play', 'advancement'];

  var App = {
    canon: null,
    character: null,
    screen: 'character',
    creation: null, // transient in-progress creation wizard state, or null
    rollPreview: null, // transient last-built roll pool for the Play screen
    root: null
  };

  function log(msg) { console.log('[Protocol 7] ' + msg); }

  App.init = function () {
    App.root = document.getElementById('app-root');
    return Data.loadCanonicalData().then(function (canon) {
      App.canon = canon;
      Presets.validatePresets(canon.vams.vams, canon.rulesCore, canon.skills.skills); // throws on drift — fail loudly, not silently
      App.loadFromStorage();
      App.render();
      log('booted. rulesCore ' + canon.rulesCore.rules_version + ', ' + canon.skills.skills.length + ' Skills, ' + canon.vams.vams.length + ' VAMs, ' + canon.gear.gear.length + ' Gear.');
    }).catch(function (err) {
      App.root.innerHTML = '';
      App.root.appendChild(window.P7.UI.el('div', { class: 'p7-fatal', text: 'Protocol 7 failed to load canonical data or presets: ' + err.message }));
      console.error(err);
    });
  };

  App.loadFromStorage = function () {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (e) { return; }
    if (!raw) return;
    var result = Persistence.importCharacter(raw, App.canon.rulesCore);
    if (result.legal) {
      App.character = result.character;
    } else {
      log('stored save was not loaded: ' + result.reason);
      App.lastLoadRejection = result.reason;
    }
  };

  App.save = function () {
    if (!App.character) return;
    try {
      var json = Persistence.exportCharacter(App.character, App.canon.rulesCore);
      localStorage.setItem(STORAGE_KEY, json);
    } catch (e) {
      console.error('Save refused:', e.message);
    }
  };

  App.setCharacter = function (character) {
    character.meta.updated_at = new Date().toISOString();
    App.character = character;
    App.save();
    App.render();
  };

  App.deleteCharacter = function () {
    App.character = null;
    App.creation = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    App.screen = 'character';
    App.render();
  };

  App.goTo = function (screen) {
    App.screen = screen;
    App.render();
  };

  App.render = function () {
    if (!App.character) App.screen = 'character';
    App.root.innerHTML = '';
    var UI = window.P7.UI;
    var shell = UI.el('div', { class: 'p7-shell' });

    var header = UI.el('header', { class: 'p7-header' }, [
      UI.el('a', { class: 'p7-home-link', href: '../index.html', text: '⌂ Protocol 7' }),
      UI.el('a', { class: 'p7-rules-link', href: '../rules.html', target: '_blank', rel: 'noopener', text: 'Rules Guide ↗' }),
      App.character ? UI.el('div', { class: 'p7-header-char', text: (App.character.identity.character_name || 'Unnamed Vector') + ' · L' + App.character.progression.level }) : UI.el('div', { class: 'p7-header-title', text: 'v0.188 PLAYTEST' })
    ]);
    shell.appendChild(header);

    var content = UI.el('main', { class: 'p7-content', id: 'p7-screen-content' });
    shell.appendChild(content);
    window.P7.Screens.render(App, content);

    var nav = UI.el('nav', { class: 'p7-nav' }, SCREENS.map(function (s) {
      var locked = !App.character && s !== 'character';
      var btn = UI.el('button', {
        class: 'p7-nav-btn' + (App.screen === s ? ' p7-nav-btn-active' : '') + (locked ? ' p7-nav-btn-locked' : ''),
        onclick: locked ? null : function () { App.goTo(s); },
        text: s.charAt(0).toUpperCase() + s.slice(1)
      });
      if (locked) btn.disabled = true;
      return btn;
    }));
    shell.appendChild(nav);

    App.root.appendChild(shell);
  };

  window.P7.App = App;
  document.addEventListener('DOMContentLoaded', App.init);
}());
