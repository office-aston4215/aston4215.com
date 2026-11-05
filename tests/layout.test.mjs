import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { test } from 'node:test';
import { between, readDist } from './helpers.mjs';

const home = readDist('index.html');
const notFound = readDist('404.html');

test('nav lists only existing sections', () => {
  const nav = between(home, '<nav', '</nav>');
  for (const href of ['/#research', '/#labs', '/#education', '/#experience', '/#honors', '/#contact', 'https://github.com/office-aston4215', 'mailto:aston4215@kaist.ac.kr'])
    assert.ok(nav.includes(href), href);
  for (const label of ['Publications', 'Projects', 'Notes'])
    assert.ok(!nav.includes(label), label);
});

test('header shows Aston4215 next to the logo', () => {
  const brand = between(home, '<a class="brand"', '</a>');
  assert.match(brand, /aria-label="Aston4215, home"/);
  assert.match(brand, />Aston4215</);
  assert.ok(!brand.includes('Tae-Yoon Kim'));
});

test('skip link targets main', () => {
  assert.match(home, /href="#main"/);
  assert.match(home, /<main[^>]*id="main"/);
});

test('Inter is not preloaded', () => assert.ok(!/rel="preload"[^>]*woff2/.test(home)));

test('the theme scripts are the only executable scripts', () => {
  const scripts = [...home.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 2);
  for (const [script] of scripts) assert.match(script, /theme/);
});

test('inline scripts ship without comments', () => {
  const scripts = [...home.matchAll(/<script(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)];
  for (const [, body] of scripts) assert.ok(!/(^|\s)\/\/|\/\*/.test(body), body);
});

test('only the Latin font file is deployed', () => {
  const fonts = readdirSync('dist/_astro').filter((name) => name.endsWith('.woff2'));
  assert.equal(fonts.length, 1, fonts.join());
  assert.match(fonts[0], /^inter-latin-opsz-normal\./);
});

test('logo keeps the supplied geometry', () => {
  assert.ok(home.includes('M480.27 207.59 L576.37 374.04'));
  assert.ok(home.includes('M524.4 609.34 L695.9 609.34'));
  assert.ok(home.includes('204.76 193.45 614.48 637.09'));
});

test('footer shows copyright and domain', () => {
  const footer = between(home, '<footer', '</footer>');
  assert.match(footer, /Copyright © \d{4} Tae-Yoon Kim/);
  assert.ok(footer.includes('aston4215.com'));
});

test('404 page offers a way home', () => {
  assert.match(notFound, /Page not found/);
  assert.match(notFound, /href="\/"[^>]*>\s*Go to home/);
});
