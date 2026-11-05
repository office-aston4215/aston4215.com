import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { readDist, sectionById } from './helpers.mjs';

const home = readDist('index.html');
const section = sectionById(home, 'research');

test('research section shows topic, lab, professor and lab link', () => {
  for (const text of ['Research', 'KV cache compaction', 'Lab', 'KAIST', 'Prof. Hyunwoo J. Kim'])
    assert.ok(section.includes(text), text);
  assert.match(section, /href="https:\/\/mlv\.kaist\.ac\.kr\/"[^>]*>\s*Visit lab site ›/);
});

test('scroll timeline survives CSS minification', () => {
  // The build inlines small stylesheets and writes larger ones to files, so check both.
  const css = readdirSync('dist/_astro')
    .filter((name) => name.endsWith('.css'))
    .map((name) => readFileSync(`dist/_astro/${name}`, 'utf8'))
    .join('');
  const styles = home + css;
  // Browsers reject an `animation` shorthand containing view(), which silently disables the motion.
  assert.ok(!/animation:[^;}]*view\(\)/.test(styles), 'view() was merged into the animation shorthand');
  assert.match(styles, /animation-timeline:\s*(view\(\)|var\()/);
  assert.match(styles, /animation-range:\s*entry 30% cover 55%/);
});

test('graphic has 33 hidden pairs, a legend, and fixed offsets', () => {
  assert.equal([...section.matchAll(/class="kv/g)].length, 33);
  assert.match(section, /aria-hidden="true"/);
  assert.match(section, />key</);
  assert.match(section, />value</);
  assert.match(section, /--x:\s*33;\s*--y:\s*2;\s*--d:\s*21/);
});
