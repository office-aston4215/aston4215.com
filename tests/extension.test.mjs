import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { after, before, test } from 'node:test';
import { between, buildFixture, FIXTURE_OUT } from './helpers.mjs';

let ext = '';

before(() => {
  const r = buildFixture({
    'publications.yaml': '- id: fixture-paper\n  period: "2028"\n  start: 2028\n  title: Fixture Paper\n  authors: [Tae-Yoon Kim]\n  venue: Fixture Venue\n',
    'projects.yaml': '- id: fixture-project\n  period: "2028"\n  start: 2028\n  title: Fixture Project\n  summary: Fixture summary\n',
    'notes/fixture-note.md': '---\ntitle: Fixture Note\ndate: 2028-01-02\nsummary: Fixture note summary\n---\n\nFixture note body.\n',
    'notes/fixture-draft.md': '---\ntitle: Fixture Draft\ndate: 2028-01-03\nsummary: Fixture draft summary\ndraft: true\n---\n\nDraft body.\n',
  });
  assert.equal(r.status, 0, r.output);
  ext = readFileSync(`${FIXTURE_OUT}/index.html`, 'utf8');
});

after(() => rmSync(FIXTURE_OUT, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

test('added content appears everywhere it should', () => {
  assert.match(ext, /<h2[^>]*>Publications/);
  assert.match(ext, /<h2[^>]*>Projects/);
  assert.ok(ext.includes('Fixture Paper') && ext.includes('Fixture Venue') && ext.includes('Fixture summary'));
  const nav = between(ext, '<nav', '</nav>');
  for (const href of ['/#publications', '/#projects', '/notes/']) assert.ok(nav.includes(href), href);
  assert.ok(existsSync(`${FIXTURE_OUT}/notes/index.html`));
  assert.ok(readFileSync(`${FIXTURE_OUT}/notes/fixture-note/index.html`, 'utf8').includes('Fixture note body.'));
});

test('the notes link stays available on phones', () => {
  assert.match(between(ext, '<nav', '</nav>'), /<li[^>]*class="[^"]*always[^"]*"[^>]*>\s*<a[^>]*href="\/notes\/"/);
});

test('draft notes are not published', () => {
  assert.ok(!existsSync(`${FIXTURE_OUT}/notes/fixture-draft`));
  assert.ok(!readFileSync(`${FIXTURE_OUT}/notes/index.html`, 'utf8').includes('Fixture Draft'));
  assert.ok(!readFileSync(`${FIXTURE_OUT}/sitemap-0.xml`, 'utf8').includes('fixture-draft'));
});
