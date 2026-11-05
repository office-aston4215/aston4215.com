import { readFileSync } from 'node:fs';
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
