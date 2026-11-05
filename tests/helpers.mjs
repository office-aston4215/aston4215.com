import { spawnSync } from 'node:child_process';
import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const readDist = (path) => readFileSync(join('dist', path), 'utf8');

export function pngSize(path) {
  const b = readFileSync(path);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

export function between(html, start, end) {
  const i = html.indexOf(start);
  if (i < 0) return '';
  const j = html.indexOf(end, i + start.length);
  return j < 0 ? html.slice(i) : html.slice(i, j + end.length);
}

export const stripTags = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

export function sectionById(html, id) {
  const open = html.search(new RegExp(`<(section|div)[^>]*\\bid="${id}"`));
  if (open < 0) return '';
  const tag = html.slice(open + 1, html.indexOf(' ', open));
  const re = new RegExp(`</?${tag}\\b[^>]*>`, 'g');
  re.lastIndex = open;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(open, m.index + m[0].length);
  }
  return html.slice(open);
}

export const FIXTURE_OUT = '.tmp-ext';
let fixtureCount = 0;

// Builds a temporary copy of src/content, so a failed or killed test cannot leave real content changed.
// files maps a path inside the content folder to its new text.
export function buildFixture(files) {
  const dir = `.tmp-content-${process.pid}-${fixtureCount++}`;
  cpSync('src/content', dir, { recursive: true });
  for (const [path, text] of Object.entries(files)) writeFileSync(join(dir, path), text);
  try {
    // A rebuild can briefly collide with file watchers on Windows, which is not the failure under test.
    for (let attempt = 1; ; attempt++) {
      const r = spawnSync('npx', ['astro', 'build', '--outDir', FIXTURE_OUT], {
        shell: true,
        encoding: 'utf8',
        env: { ...process.env, CONTENT_DIR: dir },
      });
      r.output = r.stdout + r.stderr;
      if (attempt === 4 || !/EPERM|EBUSY|ENOTEMPTY/.test(r.output)) return r;
      spawnSync('node', ['-e', 'setTimeout(() => {}, 1500)']);
    }
  } finally {
    // A watcher can keep the folder busy; a leftover git-ignored folder does no harm.
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {}
  }
}
