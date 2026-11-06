import assert from 'node:assert/strict';
import { test } from 'node:test';
import { between, readDist, stripTags } from './helpers.mjs';

const home = readDist('index.html');

test('one h1 with the name', () => {
  assert.deepEqual([...home.matchAll(/<h1[^>]*>([^<]*)<\/h1>/g)].map((m) => m[1]), ['Tae-Yoon Kim']);
});

test('lead shows the two requested lines in order', () => {
  const lead = between(home, '<p class="lead"', '</p>');
  const lines = [...lead.matchAll(/<span[^>]*>([^<]*)<\/span>/g)].map((m) => m[1].replaceAll('&amp;', '&'));
  assert.deepEqual(lines, ['Korea Advanced Institute of Science and Technology', 'AI & Software Researcher']);
  assert.ok(stripTags(lead).includes('Technology AI'), 'lines must stay separate words for screen readers and search');
});

test('portrait is optimized and described', () => {
  assert.match(home, /<source[^>]+image\/avif/);
  assert.match(home, /<source[^>]+image\/webp/);
  assert.match(home, /alt="Portrait of Tae-Yoon Kim"/);
  assert.match(home, /fetchpriority="high"/);
  assert.ok(!/loading="lazy"/.test(between(home, '<picture', '</picture>')));
});
