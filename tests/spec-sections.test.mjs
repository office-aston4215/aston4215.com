import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { readDist, sectionById, stripTags } from './helpers.mjs';

const home = readDist('index.html');
const education = sectionById(home, 'education');

test('education uses schools as subheadings, newest first', () => {
  const schools = [...education.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map((m) => m[1]);
  assert.deepEqual(schools, ['University of California, Berkeley', 'Korea Advanced Institute of Science and Technology (KAIST)', 'Seongdeok High School']);
});

test('education entries show location, period and details', () => {
  const text = stripTags(education).replaceAll('&amp;', '&').replaceAll('&#39;', "'");
  for (const value of [
    'Berkeley, California, USA',
    'Spring 2027',
    'Exchange Program',
    'Daejeon, South Korea',
    '2025–present',
    'Undergraduate, School of Computing',
    "Research on KV cache compaction in Prof. Hyunwoo J. Kim's Machine Learning & Vision Lab",
    'Gwangju, South Korea',
    '2022–2024',
  ])
    assert.ok(text.includes(value), value);
});

test('education does not use periods as row labels', () => {
  assert.ok(!education.includes('<dt'));
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
