import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { readDist, sectionById, stripTags } from './helpers.mjs';

const home = readDist('index.html');
const plain = (html) => stripTags(html).replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('’', "'");
const subheadings = (html) => [...html.matchAll(/<h3[^>]*>([^<]*)<\/h3>/g)].map((m) => m[1].replaceAll('&amp;', '&'));

function assertIncludes(html, values) {
  const text = plain(html);
  for (const value of values) assert.ok(text.includes(value), value);
}

test('sections follow the CV order', () => {
  const ids = ['research', 'research-experience', 'education', 'honors', 'experience', 'leadership', 'skills', 'contact'];
  const positions = ids.map((id) => home.indexOf(`id="${id}"`));
  assert.ok(positions.every((p) => p >= 0), positions.join());
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('research experience lists both labs with details, newest first', () => {
  const section = sectionById(home, 'research-experience');
  assert.deepEqual(subheadings(section), [
    'KAIST Machine Learning and Vision Lab, Individual Study (CS.91100)',
    'KAIST Urban Robotics Lab, Individual Study (EE.91100)',
  ]);
  assertIncludes(section, [
    'Undergraduate Research Student, Advisor: Prof. Hyunwoo J. Kim',
    'Undergraduate Research Student, Advisor: Prof. Hyun Myung',
    'September 2026 – Present',
    'June 2026 – August 2026',
    'Studied frontier LLM architectures (Kimi K3, GLM-5.3-Flash) and FlashAttention versions 1 through 4',
    'Developing Gramian SVD Checkpoint Compaction',
    'finding DAISY most accurate (29.5% inlier ratio)',
  ]);
});

test('education uses schools as subheadings, newest first', () => {
  assert.deepEqual(subheadings(sectionById(home, 'education')), [
    'University of California, Berkeley',
    'Korea Advanced Institute of Science and Technology (KAIST)',
    'Saint Francis Catholic Secondary School',
    'Gwangju Seongdeok High School',
  ]);
});

test('education entries show CV details', () => {
  const section = sectionById(home, 'education');
  assertIncludes(section, [
    'Exchange Student, UCEAP Reciprocity Program',
    'January 2027 – May 2027',
    'Undergraduate Program, School of Computing',
    'GPA: 4.11 / 4.3',
    'Expected graduation: February 2029',
    'Machine Learning, Introduction to Artificial Intelligence, Computer Organization, System Programming, Data Structure, Discrete Mathematics',
    'Ontario, Canada',
    'Study abroad coursework in General Studies',
    'High School Diploma',
    '2022 – January 2025',
  ]);
  assert.ok(!section.includes('<dt'));
});

test('honors are listed newest first', () => {
  const text = plain(sectionById(home, 'honors'));
  const order = ['Freshman Oblige Project Dean', 'Color Your 2025 Project Dean', 'School of Freshman Dean', 'Highest Honor for Academic Excellence', 'Meritorious Service Award'];
  const positions = order.map((award) => text.indexOf(award));
  assert.ok(positions.every((p) => p >= 0), positions.join());
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('experience and leadership show roles and details', () => {
  assertIncludes(sectionById(home, 'experience'), [
    'Global Institute For Talented EDucation',
    'JuniorKAIST Teaching Tutor',
    'KAIST CS.10001 Introduction to Programming',
    'Undergraduate Teaching Assistant',
    'Supported Python instruction for first-year students through teaching materials and Q&A.',
  ]);
  assertIncludes(sectionById(home, 'leadership'), [
    'President of Club Association',
    'President of Student System Programming Committee',
    'March 2023 – February 2024',
  ]);
});

test('skills show technical, language and research interests', () => {
  assertIncludes(sectionById(home, 'skills'), [
    'C, Python, Java, JavaScript, PHP, MySQL, ROS, Docker',
    'Korean (Native), English (TOEIC 880, DET 115)',
    'Efficient LLM Inference, AI Security, Defense Robotics, Cyber-Physical Systems',
  ]);
});

test('skills keep the CV order', () => {
  const labels = [...sectionById(home, 'skills').matchAll(/<dt[^>]*>([^<]*)<\/dt>/g)].map((m) => m[1]);
  assert.deepEqual(labels, ['Technical', 'Language', 'Research Interests']);
});

test('the lab tile names the advisor', () => {
  assertIncludes(sectionById(home, 'research'), ['Advisor: Prof. Hyunwoo J. Kim']);
});

test('phone number and street address stay off the site', () => {
  assert.ok(!/\+\d{1,3}[\s-]?\d|\b\d{2,3}-\d{3,4}-\d{4}\b/.test(stripTags(home)), 'phone number found');
  assert.ok(!/\bDaehak-ro\b|\bYuseong-gu\b/.test(home), 'street address found');
});

test('contact has every public channel', () => {
  const section = sectionById(home, 'contact');
  for (const href of ['mailto:aston4215@kaist.ac.kr', 'mailto:office.aston4215@gmail.com', 'https://github.com/office-aston4215', 'https://www.instagram.com/aston._.4215/'])
    assert.ok(section.includes(href), href);
  for (const label of ['Academic', 'General', 'GitHub', 'Instagram', '@aston._.4215']) assert.ok(section.includes(label), label);
});

test('label and value sections use definition list markup', () => {
  for (const id of ['contact', 'skills', 'honors']) {
    const section = sectionById(home, id);
    assert.match(section, /<dl/, id);
    assert.match(section, /<dt/, id);
    assert.match(section, /<dd/, id);
  }
});

test('empty sections and excluded profiles stay hidden', () => {
  for (const text of ['id="publications"', 'id="projects"', '/notes/', 'scholar.google', 'linkedin.com']) assert.ok(!home.includes(text), text);
  assert.ok(!existsSync('dist/notes'));
});
