import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readDist, sectionById } from './helpers.mjs';

const home = readDist('index.html');
const section = sectionById(home, 'research');

test('research section shows topic, lab, professor and lab link', () => {
  for (const text of ['Research', 'KV cache compaction', 'Lab', 'KAIST', 'Prof. Hyunwoo J. Kim'])
    assert.ok(section.includes(text), text);
  assert.match(section, /href="https:\/\/mlv\.kaist\.ac\.kr\/"[^>]*>\s*Visit lab site ›/);
});

test('graphic has 33 hidden pairs, a legend, and fixed offsets', () => {
  assert.equal([...section.matchAll(/class="kv/g)].length, 33);
  assert.match(section, /aria-hidden="true"/);
  assert.match(section, />key</);
  assert.match(section, />value</);
  assert.match(section, /--x:\s*33;\s*--y:\s*2;\s*--d:\s*21/);
});
