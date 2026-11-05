import assert from 'node:assert/strict';
import { test } from 'node:test';
import { between, readDist, stripTags } from './helpers.mjs';

const home = readDist('index.html');

test('one h1 with the name', () => {
  assert.deepEqual([...home.matchAll(/<h1[^>]*>([^<]*)<\/h1>/g)].map((m) => m[1]), ['Tae-Yoon Kim']);
});

test('lead sentence keeps the research term together', () => {
  const text = stripTags(home).replaceAll('\u00a0', ' ').replaceAll('&nbsp;', ' ').replaceAll('&#160;', ' ').replaceAll('&amp;', '&');
  assert.ok(text.includes('Undergraduate at KAIST, researching KV cache compaction in the Machine Learning & Vision Lab.'));
  assert.match(home, /KV(&nbsp;|&#160;|\u00a0)cache(&nbsp;|&#160;|\u00a0)compaction/);
});

test('portrait is optimized and described', () => {
  assert.match(home, /<source[^>]+image\/avif/);
  assert.match(home, /<source[^>]+image\/webp/);
  assert.match(home, /alt="Portrait of Tae-Yoon Kim"/);
  assert.match(home, /fetchpriority="high"/);
  assert.ok(!/loading="lazy"/.test(between(home, '<picture', '</picture>')));
});
