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
  const ids = ['research', 'labs', 'education', 'honors', 'teaching', 'leadership', 'skills', 'contact'];
  const positions = ids.map((id) => home.indexOf(`id="${id}"`));
  assert.ok(positions.every((p) => p >= 0), positions.join());
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('labs section has a card for each lab, newest first', () => {
  const section = sectionById(home, 'labs');
  assert.match(section, /<h2[^>]*>Labs<\/h2>/);
  assert.deepEqual(subheadings(section), ['Machine Learning & Vision Lab', 'Urban Robotics Lab']);
  assert.ok(!home.includes('id="research-experience"'), 'lab experience is shown twice');
  assertIncludes(section, [
    'Individual Study (CS.91100)',
    'Individual Study (EE.91100)',
    'KAIST, Daejeon, Korea',
    'Undergraduate Research Student',
    'Advisor: Prof. Hyunwoo J. Kim',
    'Advisor: Prof. Hyun Myung',
    'September 2026 – Present',
    'June 2026 – August 2026',
    'Developing Gramian SVD Checkpoint Compaction, a low-rank state compression method for prefix caching in linear-attention models, with GPU experiments toward a paper submission.',
    'Learned modern LLM inference design by studying frontier architectures and FlashAttention, covering KV caching, sparse attention and MoE routing; tested a self-proposed KV cache–sparse indexer design and ruled it out through analysis and small-scale experiments.',
    'Learned the ROS development workflow: building nodes in Docker, simulating a TurtleBot3 in Gazebo, and visualizing LiDAR, IMU and RGB-D streams in RViz.',
    'Gained hands-on experience with LiDAR SLAM (GMapping, Hector) and autonomous navigation, and with classical vs. learned feature matching by benchmarking seven keypoint pipelines from ORB and SIFT to SuperPoint.',
  ]);
  assert.ok(!plain(section).includes('DAISY'), 'old lab details are still shown');
});

test('each lab card shows the lab logo and links to its site', () => {
  const section = sectionById(home, 'labs');
  const cards = section.split('<article').slice(1);
  assert.equal(cards.length, 2);
  for (const [card, url, name] of [
    [cards[0], 'https://mlv.kaist.ac.kr/', 'Machine Learning &amp; Vision Lab'],
    [cards[1], 'https://urobot.kaist.ac.kr/', 'Urban Robotics Lab'],
  ]) {
    assert.match(card, /<img[^>]*\salt(="")?[\s>]/, name);
    assert.ok(card.includes(`href="${url}"`), url);
    assert.ok(card.includes(`aria-label="Visit lab site: ${name}"`), name);
    assert.match(card, />\s*Visit lab site ›/);
  }
});

test('education uses schools as subheadings, newest first', () => {
  assert.deepEqual(subheadings(sectionById(home, 'education')), [
    'University of California, Berkeley',
    'Korea Advanced Institute of Science and Technology (KAIST)',
    'Gwangju Seongdeok High School',
  ]);
});

test('education entries show CV details', () => {
  const section = sectionById(home, 'education');
  assertIncludes(section, [
    'Exchange Student, UCEAP Reciprocity Program',
    'January 2027 – May 2027',
    'B.S. in Computer Science, School of Computing',
    'Expected February 2029',
    'GPA: 4.11 / 4.3',
    'Coursework: Machine Learning, Introduction to Artificial Intelligence, Computer Organization, System Programming, Data Structures',
    'High School Diploma; study abroad at St. Francis Catholic Secondary School, Ontario, Canada (January 2023)',
    'Graduated January 2025',
  ]);
  assert.ok(!plain(section).includes('Discrete Mathematics'), 'coursework does not match the CV');
  assert.ok(!section.includes('<dt'));
});

test('honors are listed newest first', () => {
  const text = plain(sectionById(home, 'honors'));
  const order = ['Freshman Oblige Project Dean', 'Color Your 2025 Project Dean', "Dean's List, School of Freshman", 'Highest Honor for Academic Excellence', 'Meritorious Service Award'];
  const positions = order.map((award) => text.indexOf(award));
  assert.ok(positions.every((p) => p >= 0), positions.join());
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('teaching and leadership follow the CV', () => {
  const teaching = sectionById(home, 'teaching');
  assert.match(teaching, /<h2[^>]*>Teaching<\/h2>/);
  assert.deepEqual(subheadings(teaching), ['JuniorKAIST Teaching Tutor', 'Undergraduate Teaching Assistant']);
  assertIncludes(teaching, [
    'Global Institute For Talented EDucation (GIFTED), KAIST',
    'Lead C programming sessions and review students\' assignments.',
    'Introduction to Programming (CS.10001), KAIST',
    'Support Python instruction for first-year students through Q&A.',
  ]);
  const leadership = sectionById(home, 'leadership');
  assert.deepEqual(subheadings(leadership), ['President, Club Association', 'President, Student System Programming Committee']);
  assertIncludes(leadership, [
    'Student Council, Gwangju Seongdeok High School',
    'Club Association, Gwangju Seongdeok High School',
    'March 2023 – February 2024',
  ]);
  assert.ok(!leadership.includes('<li'), 'the CV lists no leadership details');
});

test('skills and interests follow the CV', () => {
  assertIncludes(sectionById(home, 'skills'), [
    'C, Python, Java, JavaScript, PHP, MySQL',
    'ROS, Gazebo, Docker',
    'Korean (native), English (TOEIC 880, DET 115)',
    'Artificial Intelligence, Large Language Models, Cyber-Physical Systems, Defense Science, Security Systems',
  ]);
});

test('skills keep the CV order', () => {
  const labels = [...sectionById(home, 'skills').matchAll(/<dt[^>]*>([^<]*)<\/dt>/g)].map((m) => m[1]);
  assert.deepEqual(labels, ['Programming', 'Tools', 'Languages', 'Interests']);
});

test('phone number and street address stay off the site', () => {
  assert.ok(!/\+\d{1,3}[\s-]?\d|\b\d{2,3}-\d{3,4}-\d{4}\b/.test(stripTags(home)), 'phone number found');
  assert.ok(!/\bDaehak-ro\b|\bYuseong-gu\b/.test(home), 'street address found');
});

test('contact has every public channel', () => {
  const section = sectionById(home, 'contact');
  for (const href of ['mailto:aston4215@kaist.ac.kr', 'mailto:office.aston4215@gmail.com', 'https://github.com/office-aston4215', 'https://www.instagram.com/aston._.4215/', 'https://www.linkedin.com/in/taeyoon-kim-aston4215'])
    assert.ok(section.includes(`href="${href}"`), href);
  for (const label of ['Academic', 'General', 'GitHub', 'Instagram', '@aston._.4215', 'LinkedIn', 'taeyoon-kim-aston4215']) assert.ok(section.includes(label), label);
});

test('every contact channel is a whole-card link with a logo', () => {
  const section = sectionById(home, 'contact');
  const cards = [...section.matchAll(/<a\b[^>]*class="[^"]*contact-card[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);
  assert.equal(cards.length, 5);
  for (const card of cards) assert.match(card, /<svg[^>]*aria-hidden="true"[^>]*>\s*<path/);
  assert.ok(!section.includes('<dl'), 'contact is still a text list');
  assert.match(section, /--columns:\s*3/);
});

test('Google Scholar has a card with its logo but no link yet', () => {
  const section = sectionById(home, 'contact');
  const card = section.match(/<div\b[^>]*class="[^"]*contact-card[^"]*"[^>]*>[\s\S]*?Google Scholar[\s\S]*?<\/div>/)?.[0] ?? '';
  assert.match(card, /<svg[^>]*aria-hidden="true"[^>]*>\s*<path/);
  assert.ok(!card.includes('href'), 'the Scholar card must not be a link');
  assert.ok(!section.includes('scholar.google'), 'no Scholar address until there is a profile');
});

test('contact channels put academic ones first', () => {
  const text = plain(sectionById(home, 'contact'));
  const order = ['Academic', 'General', 'Google Scholar', 'GitHub', 'LinkedIn', 'Instagram'];
  const positions = order.map((label) => text.indexOf(label));
  assert.ok(positions.every((p) => p >= 0), positions.join());
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('label and value sections use definition list markup', () => {
  for (const id of ['skills', 'honors']) {
    const section = sectionById(home, id);
    assert.match(section, /<dl/, id);
    assert.match(section, /<dt/, id);
    assert.match(section, /<dd/, id);
  }
});

test('empty sections and excluded profiles stay hidden', () => {
  for (const text of ['id="publications"', 'id="projects"', '/notes/']) assert.ok(!home.includes(text), text);
  assert.ok(!existsSync('dist/notes'));
});
