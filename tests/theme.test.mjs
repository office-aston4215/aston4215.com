import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import { between, readDist } from './helpers.mjs';

const home = readDist('index.html');
const notFound = readDist('404.html');
const css = readdirSync('dist/_astro')
  .filter((name) => name.endsWith('.css'))
  .map((name) => readFileSync(`dist/_astro/${name}`, 'utf8'))
  .join('');
// Link tags are left out because the favicons follow the system: they sit on the browser's tab, not on the page.
const styles = (home + notFound).replace(/<link[^>]*>/g, '') + css;

const headScript = home.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';

// Runs the theme script against stand-ins for what it reads and returns the theme it chose.
function themeFor(storage) {
  const root = { dataset: {} };
  vm.runInNewContext(headScript, { document: { documentElement: root }, localStorage: storage });
  return root.dataset.theme;
}

const stored = (value) => ({ getItem: () => value });

test('a first visit is light whatever the system prefers', () => {
  assert.equal(themeFor(stored(null)), 'light');
  assert.ok(!styles.includes('prefers-color-scheme'), 'a style still follows the system theme');
  assert.ok(!headScript.includes('matchMedia'), 'the theme script still reads the system theme');
});

test('a saved dark theme is restored', () => assert.equal(themeFor(stored('dark')), 'dark'));

test('a saved value that is not a theme falls back to light', () => assert.equal(themeFor(stored('blue')), 'light'));

test('blocked storage falls back to light', () => {
  const blocked = { getItem: () => { throw new Error('denied'); } };
  assert.equal(themeFor(blocked), 'light');
});

test('the theme is set before the page renders', () => {
  assert.ok(headScript, 'theme script not found');
  assert.ok(home.indexOf(headScript) < home.indexOf('<body'), 'theme script must run in the head');
});

test('the footer offers Light and Dark on every page, with Light chosen', () => {
  for (const page of [home, notFound]) {
    const footer = between(page, '<footer', '</footer>');
    assert.match(footer, /role="group"[^>]*aria-label="Theme"/);
    assert.match(footer, /<button[^>]*type="button"[^>]*data-theme-choice="light"[^>]*aria-pressed="true"[^>]*>\s*Light\s*</);
    assert.match(footer, /<button[^>]*type="button"[^>]*data-theme-choice="dark"[^>]*aria-pressed="false"[^>]*>\s*Dark\s*</);
  }
});

test('the header no longer holds a theme control', () => {
  assert.ok(!between(home, '<header', '</header>').includes('theme-toggle'));
});

test('the toggle is hidden when scripts cannot run', () => {
  assert.match(styles, /html:not\(\[data-theme\]\)[^{]*\.theme-toggle[^{]*\{\s*display:\s*none/);
});

test('dark styles only depend on the chosen theme', () => {
  assert.match(styles, /\[data-theme=["']?dark["']?\][^{]*\{[^}]*color-scheme:\s*dark/);
  assert.match(styles, /\[data-theme=["']?dark["']?\][^{]*\.portrait/);
});
