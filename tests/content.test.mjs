import assert from 'node:assert/strict';
import { readFileSync, rmSync } from 'node:fs';
import { after, test } from 'node:test';
import { buildFixture, FIXTURE_OUT, readDist } from './helpers.mjs';

const education = readFileSync('src/content/education.yaml', 'utf8');

after(() => rmSync(FIXTURE_OUT, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

test('invalid content fails the build and names the field', () => {
  const r = buildFixture({ 'education.yaml': `${education}- id: broken\n  school: Broken\n  location: Nowhere\n  period: "2020"\n  start: "not a number"\n` });
  assert.notEqual(r.status, 0);
  assert.match(r.output, /start/);
});

test('home shows the name from profile.yaml', () => {
  assert.match(readDist('index.html'), /Tae-Yoon Kim/);
});

test('YAML syntax errors fail the build', () => {
  const r = buildFixture({ 'education.yaml': '- id: broken\n  period: "2020\n  start: [unclosed\n' });
  assert.notEqual(r.status, 0, 'education.yaml syntax error passed the build');
  assert.match(r.output, /education\.yaml/);
});

test('entries without an id fail the build', () => {
  const r = buildFixture({ 'education.yaml': '- school: Missing id\n  location: Nowhere\n  period: "2020"\n  start: 2020\n' });
  assert.notEqual(r.status, 0, 'missing id passed the build');
  assert.match(r.output, /missing an id/);
});

test('duplicate ids fail the build', () => {
  const entry = (title) => `- id: same\n  school: ${title}\n  location: Nowhere\n  period: "2020"\n  start: 2020\n`;
  const r = buildFixture({ 'education.yaml': entry('First') + entry('Second') });
  assert.notEqual(r.status, 0, 'duplicate id passed the build');
  assert.match(r.output, /same slug/);
});

test('a note with a blank date fails the build', () => {
  const r = buildFixture({ 'notes/blank-date.md': '---\ntitle: Blank date\ndate:\nsummary: Blank date\n---\n\nBody.\n' });
  assert.notEqual(r.status, 0, 'blank date passed the build');
  assert.match(r.output, /date/);
});
