import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { readDist, sectionById, stripTags } from './helpers.mjs';

const home = readDist('index.html');

test('education is listed newest first', () => {
  const text = stripTags(sectionById(home, 'education'));
  assert.ok(text.indexOf('UC Berkeley, Exchange Program') < text.indexOf('KAIST, School of Computing'));
  assert.ok(text.indexOf('KAIST, School of Computing') < text.indexOf('Seongdeok High School, Gwangju'));
  for (const period of ['Spring 2027', '2025–present', '2022–2024']) assert.ok(text.includes(period), period);
});

test('contact has every public channel', () => {
  const section = sectionById(home, 'contact');
  for (const href of ['mailto:aston4215@kaist.ac.kr', 'mailto:office.aston4215@gmail.com', 'https://github.com/office-aston4215', 'https://www.instagram.com/aston._.4215/'])
    assert.ok(section.includes(href), href);
  for (const label of ['Academic', 'General', 'GitHub', 'Instagram', '@aston._.4215']) assert.ok(section.includes(label), label);
});

test('spec tables use definition list markup', () => {
  const section = sectionById(home, 'contact');
  assert.match(section, /<dl/);
  assert.match(section, /<dt/);
  assert.match(section, /<dd/);
});

test('empty sections and excluded profiles stay hidden', () => {
  for (const text of ['Publications', 'Projects', 'Notes', 'scholar.google', 'linkedin.com']) assert.ok(!home.includes(text), text);
  assert.ok(!existsSync('dist/notes'));
});
