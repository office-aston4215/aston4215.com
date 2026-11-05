import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { pngSize, readDist } from './helpers.mjs';

const home = readDist('index.html');

test('metadata', () => {
  assert.match(home, /<title>Tae-Yoon Kim<\/title>/);
  assert.match(home, /name="description" content="Undergraduate at KAIST/);
  assert.match(home, /<link rel="canonical" href="https:\/\/aston4215\.com\/"/);
  assert.match(home, /property="og:image" content="https:\/\/aston4215\.com\/og\.png"/);
  assert.match(home, /property="og:title" content="Tae-Yoon Kim"/);
  assert.match(home, /name="twitter:card" content="summary_large_image"/);
  assert.match(home, /rel="apple-touch-icon"/);
  assert.match(home, /media="\(prefers-color-scheme: dark\)"/);
});

test('Person data matches the spec and omits alumniOf', () => {
  const json = home.match(/<script[^>]*application\/ld\+json[^>]*>(.*?)<\/script>/s)?.[1];
  assert.ok(json, 'JSON-LD block missing');
  const person = JSON.parse(json);
  assert.equal(person['@type'], 'Person');
  assert.equal(person.name, 'Tae-Yoon Kim');
  assert.equal(person.url, 'https://aston4215.com/');
  assert.deepEqual(person.email, ['aston4215@kaist.ac.kr', 'office.aston4215@gmail.com']);
  assert.deepEqual(person.sameAs, ['https://github.com/office-aston4215', 'https://www.instagram.com/aston._.4215/']);
  assert.equal(person.affiliation.name, 'KAIST');
  assert.ok(person.image.startsWith('https://aston4215.com/'));
  assert.ok(!('alumniOf' in person));
});

test('images and crawl files exist at the right sizes', () => {
  assert.deepEqual(pngSize('dist/og.png'), { width: 1200, height: 630 });
  assert.deepEqual(pngSize('dist/apple-touch-icon.png'), { width: 180, height: 180 });
  assert.deepEqual(pngSize('dist/favicon-32.png'), { width: 32, height: 32 });
  assert.match(readDist('robots.txt'), /Sitemap: https:\/\/aston4215\.com\/sitemap-index\.xml/);
  assert.ok(existsSync('dist/sitemap-index.xml'));
});

test('sitemap lists the home page but not the 404 page', () => {
  const sitemap = readDist('sitemap-0.xml');
  assert.ok(sitemap.includes('<loc>https://aston4215.com/</loc>'));
  assert.ok(!sitemap.includes('404'));
});
