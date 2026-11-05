// Usage: PW_DIR=<folder with playwright installed> [SKIP_BROWSERS=firefox] [PAGES=/,/notes/] node scripts/browser-check.cjs <url> <output folder>
// Runs on every push in .github/workflows/deploy.yml, so there is no need to install browsers locally.
// Playwright stays out of package.json; it is only needed for this check.
const fs = require('node:fs');
const path = require('node:path');
const { chromium, firefox, webkit } = require(path.join(process.env.PW_DIR, 'node_modules', 'playwright'));

const [base, outDir] = process.argv.slice(2);
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
const HEADER = 52;
const PAGES = (process.env.PAGES ?? '/').split(',');
const failures = [];

function check(browser, name, ok, detail = '') {
  if (!ok) failures.push(`${browser}: ${name} ${detail}`);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${browser}: ${name} ${ok ? '' : detail}`);
}

const movedPx = (page) =>
  page.evaluate(() => {
    const kv = [...document.querySelectorAll('.kv')].find((el) => Number(el.style.getPropertyValue('--d')) > 0);
    const d = Number(kv.style.getPropertyValue('--d'));
    const m = new DOMMatrixReadOnly(getComputedStyle(kv).transform);
    return { moved: m.m41, expected: -(d * kv.offsetWidth) / 2 };
  });

const isFinal = ({ moved, expected }) => Math.abs(moved - expected) < 1;
const isStart = ({ moved }) => Math.abs(moved) < 1;

async function scrollGraphicToCentre(page) {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector('.grid').scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(250);
}

async function checkTabOrder(label, page) {
  const expectedLinks = await page.evaluate(() => document.querySelectorAll('a[href]').length);
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement.className);
  check(label, 'first Tab reaches the skip link', first.includes('skip-link'), first);
  await page.evaluate(() => (document.documentElement.style.scrollBehavior = 'auto'));
  const seen = new Set();
  let hidden = '';
  let noOutline = '';
  for (let i = 0; i < expectedLinks + 3; i++) {
    const state = await page.evaluate(() => {
      const el = document.activeElement;
      if (el.tagName !== 'A') return null;
      el.scrollIntoView({ block: 'nearest' });
      const style = getComputedStyle(el);
      return {
        href: el.getAttribute('href') + el.textContent,
        top: el.getBoundingClientRect().top,
        inHeader: !!el.closest('header'),
        skip: el.classList.contains('skip-link'),
        outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
      };
    });
    if (state) {
      seen.add(state.href);
      if (!state.inHeader && !state.skip && state.top < HEADER) hidden = state.href;
      if (!state.outline) noOutline = state.href;
    }
    await page.keyboard.press('Tab');
  }
  check(label, 'Tab reaches every link', seen.size >= expectedLinks, `${seen.size}/${expectedLinks}`);
  check(label, 'focused links clear the header', !hidden, hidden);
  check(label, 'focused links show an outline', !noOutline, noOutline);
}

async function run(label, type, launch = {}) {
  let browser;
  try {
    browser = await type.launch(launch);
  } catch (error) {
    check(label, 'browser launch', false, error.message.split('\n')[0]);
    return;
  }

  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext();
    if (scheme === 'dark') await ctx.addInitScript(() => localStorage.setItem('theme', 'dark'));
    const page = await ctx.newPage();
    const problems = [];
    page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('requestfailed', (r) => problems.push(`${r.url()} ${r.failure()?.errorText}`));
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(outDir, `${label}-${scheme}-${width}.png`), fullPage: true });
      for (const pagePath of PAGES) {
        await page.goto(new URL(pagePath, base).href, { waitUntil: 'networkidle' });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(label, `${scheme} ${width}px ${pagePath} has no horizontal overflow`, overflow <= 0, `by ${overflow}px`);
        const overlaps = await page.evaluate(() =>
          [...document.querySelectorAll('dt')].filter((dt) => {
            const range = document.createRange();
            range.selectNodeContents(dt);
            const text = range.getBoundingClientRect();
            const value = dt.nextElementSibling.getBoundingClientRect();
            return text.bottom > value.top + 1 && text.top < value.bottom - 1 && text.right > value.left + 0.5;
          }).length,
        );
        check(label, `${scheme} ${width}px ${pagePath} labels do not overlap values`, overlaps === 0, `${overlaps} rows`);
      }
    }
    check(label, `${scheme} console and network are clean`, problems.length === 0, problems.join('; '));
    await ctx.close();
  }

  const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
  await page.goto(base, { waitUntil: 'networkidle' });
  const overlap = await page.evaluate(() => {
    const a = document.querySelector('.brand').getBoundingClientRect();
    const b = document.querySelector('.email').getBoundingClientRect();
    return a.right > b.left;
  });
  check(label, '320px name and Email button do not overlap', !overlap);
  const notesLink = await page.evaluate(() => {
    const links = [...document.querySelectorAll('nav a[href="/notes/"]')];
    return links.length === 0 || links.some((a) => a.getBoundingClientRect().width > 0);
  });
  check(label, '320px notes link is visible when notes exist', notesLink);
  const lines = await page.evaluate(() => {
    const oneLine = (el) => el.getBoundingClientRect().height < parseFloat(getComputedStyle(el).fontSize) * 1.7;
    return { name: oneLine(document.querySelector('h1')), emails: [...document.querySelectorAll('.contact-handle')].every(oneLine) };
  });
  check(label, '320px name stays on one line', lines.name);
  check(label, '320px emails do not break mid-address', lines.emails);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base, { waitUntil: 'networkidle' });
  const fold = await page.evaluate(() =>
    ['h1', '.lead', '.portrait'].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().bottom)),
  );
  check(label, '1440x900 shows name, lead and portrait', fold.every((b) => b <= 900), fold.join(','));

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base, { waitUntil: 'networkidle' });
    const gaps = await page.evaluate(() => {
      const header = document.querySelector('header').getBoundingClientRect();
      const name = document.querySelector('h1').getBoundingClientRect();
      const portrait = document.querySelector('.portrait').getBoundingClientRect();
      const band = document.querySelector('#research').getBoundingClientRect();
      return { above: name.top - header.bottom, below: band.top - portrait.bottom };
    });
    check(label, `${width}px space under the portrait matches the space above the name`, Math.abs(gaps.above - gaps.below) <= 1, JSON.stringify(gaps));
  }

  await page.setViewportSize({ width: 1440, height: 700 });
  for (const id of ['research', 'education', 'contact']) {
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.click(`nav a[href="/#${id}"]`);
    await page.waitForTimeout(900);
    const top = await page.evaluate((i) => document.getElementById(i).getBoundingClientRect().top, id);
    check(label, `#${id} lands below the header`, top >= HEADER && top < 700, `top=${Math.round(top)}`);
  }

  await page.goto(base, { waitUntil: 'networkidle' });
  // Safari-family browsers skip links on Tab unless the user enables it, so WebKit cannot run this part.
  if (label !== 'webkit') await checkTabOrder(label, page);

  const supportsTimeline = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
  await page.goto(base, { waitUntil: 'networkidle' });
  const atTop = await movedPx(page);
  await scrollGraphicToCentre(page);
  const atCentre = await movedPx(page);
  check(label, 'graphic ends packed in view', isFinal(atCentre), JSON.stringify(atCentre));
  check(
    label,
    supportsTimeline ? 'graphic starts spread out at the top' : 'graphic is packed without scroll timelines',
    supportsTimeline ? isStart(atTop) : isFinal(atTop),
    JSON.stringify(atTop),
  );
  console.log(`     ${label}: scroll timeline support = ${supportsTimeline}`);
  await page.close();

  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const rp = await reduced.newPage();
  await rp.goto(base, { waitUntil: 'networkidle' });
  const r = await movedPx(rp);
  check(label, 'reduced motion shows the packed graphic', isFinal(r), JSON.stringify(r));
  await reduced.close();

  const darkCtx = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1440, height: 900 } });
  const dp = await darkCtx.newPage();
  await dp.goto(base, { waitUntil: 'networkidle' });
  const bodyBg = () => getComputedStyle(document.body).backgroundColor;
  const firstVisit = await dp.evaluate(bodyBg);
  check(label, 'a first visit on a dark system is light', firstVisit === 'rgb(255, 255, 255)', firstVisit);

  const toggle = dp.locator('[data-theme-choice="dark"]');
  const lightChoice = dp.locator('[data-theme-choice="light"]');
  check(label, 'toggle starts unpressed', (await toggle.getAttribute('aria-pressed')) === 'false');
  await toggle.scrollIntoViewIfNeeded();
  const target = await toggle.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const hits = (dy) => el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2 + dy));
    return { width: box.width, tall: hits(-21) && hits(21) };
  });
  check(label, 'toggle target is at least 44px', target.width >= 44 && target.tall, JSON.stringify(target));
  await toggle.click();
  await dp.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)');
  check(label, 'toggle shows it is pressed', (await toggle.getAttribute('aria-pressed')) === 'true');
  await dp.reload({ waitUntil: 'networkidle' });
  const restored = await dp.evaluate(bodyBg);
  check(label, 'dark theme survives a reload', restored === 'rgb(0, 0, 0)', restored);
  check(label, 'toggle stays pressed after a reload', (await toggle.getAttribute('aria-pressed')) === 'true');

  await lightChoice.focus();
  await dp.keyboard.press('Enter');
  await dp.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)');
  await dp.reload({ waitUntil: 'networkidle' });
  const backToLight = await dp.evaluate(bodyBg);
  check(label, 'keyboard switches back to light and it is saved', backToLight === 'rgb(255, 255, 255)', backToLight);
  await toggle.click();
  await dp.waitForFunction(() => getComputedStyle(document.body).backgroundColor === 'rgb(0, 0, 0)');

  const dark = await dp.evaluate(() => ({
    bg: getComputedStyle(document.body).backgroundColor,
    filter: getComputedStyle(document.querySelector('.portrait')).filter,
  }));
  check(label, 'dark page background is black', dark.bg === 'rgb(0, 0, 0)', dark.bg);
  check(label, 'dark portrait is dimmed', dark.filter.includes('brightness'), dark.filter);
  await darkCtx.close();

  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const np = await noScript.newPage();
  await np.goto(base);
  check(label, 'toggle is hidden without scripts', !(await np.locator('.theme-toggle').isVisible()));
  await noScript.close();

  await browser.close();
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const skip = (process.env.SKIP_BROWSERS ?? '').split(',');
  const browsers = [
    ['chromium', chromium],
    ['edge', chromium, { channel: 'msedge' }],
    ['firefox', firefox],
    ['webkit', webkit],
  ];
  for (const [label, type, launch] of browsers) {
    if (skip.includes(label)) console.log(`SKIP ${label}: excluded by SKIP_BROWSERS`);
    else await run(label, type, launch);
  }
  console.log(failures.length ? `\n${failures.length} FAILED\n${failures.join('\n')}` : '\nALL PASSED');
  process.exit(failures.length ? 1 : 0);
})();
