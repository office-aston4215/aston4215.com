import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { between } from './helpers.mjs';

const OUT = '.tmp-ext';
const originals = new Map();
const NOTE = 'src/content/notes/fixture-note.md';
const DRAFT = 'src/content/notes/fixture-draft.md';

function replaceFile(path, content) {
  originals.set(path, readFileSync(path, 'utf8'));
  writeFileSync(path, content);
}

let ext = '';

before(() => {
  try {
    replaceFile('src/content/publications.yaml', '- id: fixture-paper\n  period: "2028"\n  start: 2028\n  title: Fixture Paper\n  authors: [Tae-Yoon Kim]\n  venue: Fixture Venue\n');
    replaceFile('src/content/projects.yaml', '- id: fixture-project\n  period: "2028"\n  start: 2028\n  title: Fixture Project\n  summary: Fixture summary\n');
    writeFileSync(NOTE, '---\ntitle: Fixture Note\ndate: 2028-01-02\nsummary: Fixture note summary\n---\n\nFixture note body.\n');
    writeFileSync(DRAFT, '---\ntitle: Fixture Draft\ndate: 2028-01-03\nsummary: Fixture draft summary\ndraft: true\n---\n\nDraft body.\n');
    const r = spawnSync('npx', ['astro', 'build', '--outDir', OUT], { shell: true, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    ext = readFileSync(`${OUT}/index.html`, 'utf8');
  } finally {
    for (const [path, content] of originals) writeFileSync(path, content);
    rmSync(NOTE, { force: true });
    rmSync(DRAFT, { force: true });
  }
});

after(() => rmSync(OUT, { recursive: true, force: true }));

test('added content appears everywhere it should', () => {
  assert.match(ext, /<h2[^>]*>Publications/);
  assert.match(ext, /<h2[^>]*>Projects/);
  assert.ok(ext.includes('Fixture Paper') && ext.includes('Fixture Venue') && ext.includes('Fixture summary'));
  const nav = between(ext, '<nav', '</nav>');
  for (const href of ['/#publications', '/#projects', '/notes/']) assert.ok(nav.includes(href), href);
  assert.ok(existsSync(`${OUT}/notes/index.html`));
  assert.ok(readFileSync(`${OUT}/notes/fixture-note/index.html`, 'utf8').includes('Fixture note body.'));
});

test('draft notes are not published', () => {
  assert.ok(!existsSync(`${OUT}/notes/fixture-draft`));
  assert.ok(!readFileSync(`${OUT}/notes/index.html`, 'utf8').includes('Fixture Draft'));
  assert.ok(!readFileSync(`${OUT}/sitemap-0.xml`, 'utf8').includes('fixture-draft'));
});
