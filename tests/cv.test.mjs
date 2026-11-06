import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { between, readDist } from './helpers.mjs';

const PDF = '/Tae-Yoon-Kim-CV.pdf';
const home = readDist('index.html');
const cv = readDist('cv/index.html');
const pdfPages = (readFileSync(`dist${PDF}`, 'latin1').match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length;

test('the CV PDF is deployed', () => {
  assert.ok(readFileSync(`dist${PDF}`, 'latin1').startsWith('%PDF-'));
  assert.ok(pdfPages > 0);
});

test('every PDF page has a preview image, so a new CV cannot ship with stale pages', () => {
  const images = readdirSync('src/assets/cv').filter((name) => /^page-\d+\.png$/.test(name));
  assert.equal(images.length, pdfPages, images.join());
});

test('CV page shows every page in order and offers the download', () => {
  assert.match(cv, /<h1[^>]*>Curriculum Vitae<\/h1>/);
  const alts = [...cv.matchAll(/<img[^>]*alt="([^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(alts, Array.from({ length: pdfPages }, (_, i) => `Curriculum Vitae, page ${i + 1} of ${pdfPages}`));
  assert.match(cv, new RegExp(`<a[^>]*href="${PDF}"[^>]*download`));
});

test('hero has no CV buttons', () => {
  const hero = between(home, '<section class="container hero"', '</section>');
  assert.ok(hero.length > 0);
  assert.ok(!hero.includes('<a'), 'the hero shows only the name, lead and portrait');
});

test('nav links to the CV page', () => {
  assert.ok(between(home, '<nav', '</nav>').includes('href="/cv/"'));
});

test('sitemap lists the CV page', () => {
  assert.ok(readDist('sitemap-0.xml').includes('<loc>https://aston4215.com/cv/</loc>'));
});
