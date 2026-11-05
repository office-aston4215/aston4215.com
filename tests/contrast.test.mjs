import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync('src/styles/global.css', 'utf8');

function tokens(block) {
  return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]));
}

const light = tokens(css.slice(0, css.indexOf('prefers-color-scheme: dark')));
const dark = { ...light, ...tokens(css.slice(css.indexOf('prefers-color-scheme: dark'))) };

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const pairs = [
  ['muted', 'bg'],
  ['muted', 'band'],
  ['muted', 'tile'],
  ['text', 'bg'],
  ['text', 'band'],
  ['text', 'tile'],
  ['button-text', 'button-bg'],
  ['feature-text', 'feature'],
  ['feature-label', 'feature'],
];

for (const [mode, t] of [['light', light], ['dark', dark]]) {
  for (const [fg, bg] of pairs) {
    test(`${mode}: ${fg} on ${bg} meets AA`, () => {
      assert.ok(t[fg] && t[bg], `missing token ${fg} or ${bg}`);
      assert.ok(ratio(t[fg], t[bg]) >= 4.5, `${t[fg]} on ${t[bg]} = ${ratio(t[fg], t[bg]).toFixed(2)}`);
    });
  }
}
