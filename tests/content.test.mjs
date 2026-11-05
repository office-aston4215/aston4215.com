import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { readDist } from './helpers.mjs';

test('invalid content fails the build and names the field', () => {
  const file = 'src/content/education.yaml';
  const original = readFileSync(file, 'utf8');
  try {
    appendFileSync(file, '- id: broken\n  period: "2020"\n  start: "not a number"\n  title: Broken\n');
    const r = spawnSync('npx', ['astro', 'build', '--outDir', '.tmp-ext'], { shell: true, encoding: 'utf8' });
    assert.notEqual(r.status, 0);
    assert.match(r.stdout + r.stderr, /start/);
  } finally {
    writeFileSync(file, original);
  }
});

test('home shows the name from profile.yaml', () => {
  assert.match(readDist('index.html'), /Tae-Yoon Kim/);
});
