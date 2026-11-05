import assert from 'node:assert/strict';
import { test } from 'node:test';
import { between, readDist } from './helpers.mjs';

const home = readDist('index.html');
const notFound = readDist('404.html');

test('nav lists only existing sections', () => {
  const nav = between(home, '<nav', '</nav>');
  for (const href of ['/#research', '/#education', '/#experience', '/#honors', '/#contact', 'https://github.com/office-aston4215', 'mailto:aston4215@kaist.ac.kr'])
    assert.ok(nav.includes(href), href);
  for (const label of ['Publications', 'Projects', 'Notes'])
    assert.ok(!nav.includes(label), label);
});

test('skip link targets main', () => {
  assert.match(home, /href="#main"/);
  assert.match(home, /<main[^>]*id="main"/);
});

test('Inter is not preloaded', () => assert.ok(!/rel="preload"[^>]*woff2/.test(home)));

test('no executable scripts', () => {
  assert.equal([...home.matchAll(/<script(?![^>]*application\/ld\+json)/g)].length, 0);
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
