/**
 * Protocol 7 v0.188 — Touch UI Components
 * ------------------------------------------------------------
 * Authority: PROJECT_DOCUMENTATION/APP_REBUILD/P7_v0.188_MOBILE_INTERACTION_LOCK_r001.md
 *
 * Every mechanical control in the app is built from these primitives so
 * the "no typing except Vector name" and "~44px minimum touch target"
 * rules are enforced in one place instead of per-screen. Plain DOM,
 * no framework — this is a zero-build-step static site.
 */
(function (root) {
  'use strict';
  var C = {};

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  C.el = el;

  /** Large tap target. variant: 'primary'|'secondary'|'danger'|'ghost'. */
  C.button = function (label, onClick, opts) {
    opts = opts || {};
    var b = el('button', { class: 'p7-btn p7-btn-' + (opts.variant || 'secondary') + (opts.small ? ' p7-btn-small' : ''), onclick: onClick, text: label });
    if (opts.disabled) b.disabled = true;
    return b;
  };

  /** Toggle chip for filters, conditions, family selectors. */
  C.chip = function (label, active, onClick) {
    return el('button', { class: 'p7-chip' + (active ? ' p7-chip-active' : ''), onclick: onClick, text: label });
  };

  /** +/- stepper. No numeric keyboard entry anywhere. */
  C.stepper = function (label, value, onChange, opts) {
    opts = opts || {};
    var min = opts.min === undefined ? 0 : opts.min;
    var max = opts.max === undefined ? Infinity : opts.max;
    var valueEl = el('span', { class: 'p7-stepper-value', text: String(value) });
    var minus = C.button('−', function () { if (value > min) onChange(value - (opts.step || 1)); }, { small: true, disabled: value <= min });
    var plus = C.button('+', function () { if (value < max) onChange(value + (opts.step || 1)); }, { small: true, disabled: value >= max });
    return el('div', { class: 'p7-stepper' }, [
      el('span', { class: 'p7-stepper-label', text: label }), minus, valueEl, plus
    ]);
  };

  /** Tappable die-notation card (used for Ability assignment and face pickers). */
  C.dieChip = function (die, onClick, opts) {
    opts = opts || {};
    return el('button', {
      class: 'p7-die-chip' + (opts.selected ? ' p7-die-chip-selected' : '') + (opts.disabled ? ' p7-die-chip-disabled' : ''),
      onclick: opts.disabled ? null : onClick, text: die
    });
  };

  /** BAR/HP-style meter bar. */
  C.meter = function (label, used, ceiling) {
    var pct = ceiling > 0 ? Math.min(100, (used / ceiling) * 100) : 0;
    var over = used > ceiling;
    return el('div', { class: 'p7-meter' }, [
      el('div', { class: 'p7-meter-label', text: label + ': ' + used + ' / ' + ceiling }),
      el('div', { class: 'p7-meter-track' }, [
        el('div', { class: 'p7-meter-fill' + (over ? ' p7-meter-over' : ''), style: 'width:' + pct + '%' })
      ])
    ]);
  };

  C.card = function (children, opts) {
    return el('div', { class: 'p7-card' + (opts && opts.class ? ' ' + opts.class : '') }, children);
  };

  C.section = function (title, children) {
    return el('section', { class: 'p7-section' }, [
      title ? el('h2', { class: 'p7-section-title', text: title }) : null
    ].concat(children));
  };

  C.badge = function (label, kind) {
    return el('span', { class: 'p7-badge p7-badge-' + (kind || 'default'), text: label });
  };

  C.note = function (text, kind) {
    return el('p', { class: 'p7-note p7-note-' + (kind || 'default'), text: text });
  };

  root.P7 = root.P7 || {};
  root.P7.UI = C;
}(typeof window !== 'undefined' ? window : this));
