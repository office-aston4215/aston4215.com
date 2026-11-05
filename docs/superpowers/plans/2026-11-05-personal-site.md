# aston4215.com 개인 사이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스펙의 원페이지 연구자 사이트를 Astro로 구현하고, `main` Push로 `https://aston4215.com`에 자동 배포한다.

**Architecture:** Astro 정적 사이트다. 콘텐츠는 Content Collections(YAML, Markdown)에 두고, 컴포넌트가 이를 읽어 영역과 메뉴를 표시한다. 배포는 GitHub Actions가 빌드 결과를 GitHub Pages에 올리는 방식이며, 클라이언트 JavaScript는 없다.

**Tech Stack:** Astro 7, TypeScript 6, CSS 변수, `@fontsource-variable/inter`, `@astrojs/sitemap`, `node:test`, 임시 설치한 Playwright, Lighthouse

**Spec:** `docs/superpowers/specs/2026-11-05-personal-site-design.md` (모든 색, 크기, 문구, 간격 값은 스펙의 5장과 2장을 그대로 쓴다)

## Global Constraints

- 표시 내용은 스펙 2장의 사실만 쓴다. 정의, 성과, 수치, 한글 이름, 비공개 프로젝트 이름을 추가하지 않는다.
- 페이지에 실행되는 `<script>`를 넣지 않는다. 구조화 데이터 `application/ld+json`만 허용한다.
- 의존성은 `astro`, `@astrojs/sitemap`, `@astrojs/check`, `typescript@^6`, `@fontsource-variable/inter`뿐이다. `@astrojs/check`가 TypeScript 7을 지원하지 않으므로 `^6`으로 고정한다.
- 색은 스펙의 색 표에 있는 값만 쓴다. 그라디언트, 블러, 그림자를 쓰지 않는다.
- 기본 서체 스택은 `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter Variable", system-ui, sans-serif`이다. Inter는 preload하지 않는다.
- DNS, Cloudflare, Pages 설정을 바꾸지 않는다. `public/CNAME`을 만들지 않는다.
- Astro 7 기본값 `compressHTML: 'jsx'`는 줄바꿈 공백을 없앨 수 있으므로, 인라인 요소 사이 공백은 `{' '}`로 명시한다.
- `gh`가 PATH에 없으면 `"/c/Program Files/GitHub CLI/gh.exe"`를 쓴다.
- 작업은 `site-v1` 브랜치에 커밋하고, Task 8에서만 `main`을 만들어 Push한다.

## Review Focus

1. 콘텐츠 작성자가 YAML 필드를 틀리게 쓴 경우: 빌드가 실패하고 잘못된 사이트가 배포되지 않아야 한다. (Task 1)
2. 폭 320px과 긴 이메일 주소: 줄바꿈되어 가로 스크롤이 생기지 않고 헤더 버튼과 이름이 겹치지 않아야 한다. (Task 7)
3. 키보드 Tab이나 앵커 이동의 대상이 고정 헤더 뒤에 가려지는 경우: 대상이 헤더 아래에 보여야 한다. (Task 7)
4. 스크롤 타임라인 미지원 브라우저와 모션 최소화 설정: 셀 그래픽이 흩어진 채 멈추지 않고 모인 상태로 보여야 한다. (Task 7)
5. Windows에서 만든 lockfile로 Linux CI가 빌드하는 경우와 없는 주소로 직접 접속하는 경우: `sharp`가 동작해 빌드가 성공하고, 스타일이 적용된 404가 표시되어야 한다. (Task 8)

---

## 파일 구조

| 파일 | 책임 |
|---|---|
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore` | 프로젝트 설정 |
| `src/content.config.ts`, `src/content/*` | 콘텐츠 형식과 데이터 |
| `src/styles/global.css` | 토큰, 초기화, 공용 포커스와 링크 스타일 |
| `src/layouts/Base.astro` | 문서 뼈대, 메타데이터, 건너뛰기 링크, Nav, `main`, Footer |
| `src/components/Nav.astro`, `Mark.astro`, `Footer.astro` | 공통 영역 |
| `src/components/Hero.astro` | 이름, 소개, 사진 |
| `src/components/Tile.astro`, `KvGraphic.astro` | Research 영역 |
| `src/components/SpecBlock.astro`, `SpecRow.astro` | 사양표 |
| `src/pages/*` | 라우트 |
| `tests/helpers.mjs`, `tests/*.test.mjs` | 빌드 결과 검사 |
| `scripts/browser-check.cjs` | 브라우저 화면 검사 |
| `.github/workflows/deploy.yml` | 배포 |

---

### Task 1: 프로젝트 기반과 콘텐츠 모델

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/content.config.ts`, `src/content/profile.yaml`, `src/content/education.yaml`, `src/content/publications.yaml`, `src/content/projects.yaml`, `src/content/notes/.gitkeep`, `src/pages/index.astro`, `tests/helpers.mjs`, `tests/content.test.mjs`
- Move: `src/assets/logo-light.svg`, `src/assets/logo-dark.svg` → `public/`

**Interfaces:**
- Produces: 컬렉션 `profile`(항목 id `main`), `education`, `publications`, `projects`, `notes`. 필드는 스펙 6장과 같다.
- Produces: `tests/helpers.mjs`의 `readDist(path: string): string`, `pngSize(path: string): {width, height}`, `between(html, start, end): string`, `stripTags(html): string`, `sectionById(html, id): string`. 각 테스트 파일은 `home = readDist('index.html')`, `notFound = readDist('404.html')`로 읽는다. `ext`는 Task 5의 `.tmp-ext/index.html`이다
- Produces: 스크립트 `dev`, `build`(`astro check && astro build`), `preview`, `test`(`node --test --test-concurrency=1 "tests/*.test.mjs"`)

- [ ] **Step 1: 작업 브랜치를 만든다**

Run: `git switch -c site-v1`
Expected: `Switched to a new branch 'site-v1'`

- [ ] **Step 2: 설정 파일을 만들고 의존성을 설치한다**

`astro.config.mjs`는 `site: 'https://aston4215.com'`과 `sitemap()`을 설정한다. `.gitignore`는 `node_modules/`, `dist/`, `.astro/`, `.tmp-ext/`, `*.log`를 포함한다.

Run: `npm install astro @astrojs/sitemap @astrojs/check typescript@^6 @fontsource-variable/inter`
Expected: 오류 없이 설치되고 `package-lock.json`이 생성된다.

- [ ] **Step 3: 실패하는 테스트를 쓴다**

`tests/content.test.mjs`에 다음을 쓴다.

```js
test('invalid content fails the build and names the field', () => {
  // education.yaml 끝에 start가 문자열인 항목을 임시로 추가하고 try/finally로 복원한다
  const r = spawnSync('npx', ['astro', 'build', '--outDir', '.tmp-ext'], { shell: true, encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout + r.stderr, /start/);
});

test('home shows the name from profile.yaml', () => {
  assert.match(readDist('index.html'), /Tae-Yoon Kim/);
});
```

- [ ] **Step 4: 테스트가 실패하는지 확인한다**

Run: `npm test`
Expected: FAIL. `dist/index.html`이 없거나 컬렉션 형식이 정의되지 않았다.

- [ ] **Step 5: 컬렉션과 데이터, 임시 홈을 구현한다**

`src/content.config.ts`는 YAML에 `file()` 로더, `notes`에 `glob({ pattern: '**/[^_]*.md', base: './src/content/notes' })`를 쓰고, `z`는 `astro/zod`에서 가져온다. 스키마는 추가 필드를 거부하도록 `.strict()`를 쓴다. `start`는 `z.number().int()`, `url`과 `labUrl`은 `z.url()` 또는 현재 Zod 버전의 동등한 검증을 쓴다.

데이터 파일에 스펙 2장의 값을 넣는다. 학력 `start`는 2027, 2025, 2022이다. `publications.yaml`과 `projects.yaml`의 내용은 `[]`이다. `index.astro`는 `getEntry('profile', 'main')`의 이름만 출력한다.

- [ ] **Step 6: 테스트와 빌드를 통과시킨다**

Run: `npm run build; npm test`
Expected: 빌드 성공, 테스트 2개 PASS. 빈 컬렉션 경고 외 오류 없음. 테스트 후 `git status`에서 `education.yaml`이 원래 내용 그대로다.

- [ ] **Step 7: 커밋한다**

```bash
git add .gitignore package.json package-lock.json astro.config.mjs tsconfig.json public src tests docs
git commit -m "feat: scaffold Astro project and content model"
```

---

### Task 2: 디자인 토큰과 공통 영역

**Files:**
- Create: `src/styles/global.css`, `src/layouts/Base.astro`, `src/components/Mark.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`, `src/pages/404.astro`, `tests/layout.test.mjs`, `tests/contrast.test.mjs`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `profile` 컬렉션
- Produces: `<Base title: string, description: string>` (slot은 `<main id="main">` 안에 렌더링)
- Produces: CSS 변수 `--bg`, `--band`, `--tile`, `--feature`, `--text`, `--muted`, `--line`, `--button-bg`, `--button-text`, `--margin`, `--mono`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```js
// tests/layout.test.mjs (readDist로 index.html, 404.html 검사)
test('nav lists only existing sections', () => {
  const nav = between(home, '<nav', '</nav>');
  for (const href of ['/#research', '/#education', '/#contact', 'https://github.com/office-aston4215', 'mailto:aston4215@kaist.ac.kr'])
    assert.ok(nav.includes(href), href);
  for (const label of ['Publications', 'Projects', 'Notes'])
    assert.ok(!nav.includes(label), label);
});
test('skip link targets main', () => assert.match(home, /href="#main"/));
test('Inter is not preloaded', () => assert.ok(!/rel="preload"[^>]*woff2/.test(home)));
test('no executable scripts', () =>
  assert.equal([...home.matchAll(/<script(?![^>]*application\/ld\+json)/g)].length, 0));
test('logo keeps the supplied geometry', () => {
  assert.ok(home.includes('M480.27 207.59 L576.37 374.04'));
  assert.ok(home.includes('M524.4 609.34 L695.9 609.34'));
  assert.ok(home.includes('204.76 193.45 614.48 637.09'));
});
test('footer shows copyright and domain', () => {
  assert.match(home, /Copyright © \d{4} Tae-Yoon Kim/);
  assert.ok(home.includes('aston4215.com'));
});
test('404 page offers a way home', () => {
  assert.match(notFound, /Page not found/);
  assert.match(notFound, /href="\/"[^>]*>\s*Go to home/);
});
```

```js
// tests/contrast.test.mjs: global.css에서 라이트, 다크 변수를 정규식으로 읽어 WCAG 대비를 계산한다
// 라이트: muted/bg, muted/band, text/bg, text/band, button-text/button-bg
// 다크: muted/bg, muted/band, muted/tile, text/tile, button-text/button-bg
// 강조 타일: #F5F5F7/feature, #A1A1A6/feature (양쪽 모드)
// 모든 쌍이 4.5 이상인지 assert
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run build; npm test`
Expected: 새 테스트 FAIL (`nav` 없음, `global.css` 없음).

- [ ] **Step 3: 공통 영역을 구현한다**

- `global.css`: 스펙의 색 표를 `:root`와 `@media (prefers-color-scheme: dark)`로 정의하고 `color-scheme`을 맞춘다. 서체, 본문 크기, 포커스, 링크 호버, `scroll-padding-top: 72px`, 부드러운 스크롤(모션 최소화 시 해제)을 넣는다.
- `Base.astro`: `@fontsource-variable/inter/opsz.css`와 `global.css`를 가져온다. `lang="en"`, title, description, canonical, 파비콘 링크(`/logo-light.svg`, `/logo-dark.svg`를 `media`로 분리), 건너뛰기 링크, Nav, main, Footer를 구성한다.
- `Nav.astro`: 입력 없이 직접 컬렉션을 읽는다. Notes 조건은 Task 5에서 `isPublished`로 연결하고, 이 Task에서는 `notes` 항목이 있을 때로 둔다. 순서는 Research, Publications(항목 있을 때), Projects(항목 있을 때), Education, Contact, Notes(공개 글 있을 때), GitHub, Email이다. 내부 링크는 다른 페이지에서도 동작하도록 `/#id`를 쓴다. 768px 미만에서는 로고, 이름, Email만 남긴다.
- `Mark.astro`: 스펙의 `viewBox`와 제공 SVG의 두 경로를 그대로 쓰고 `fill: currentColor`, 폭 20px, `aria-hidden="true"`이다.
- `Footer.astro`: `Copyright © {빌드 연도} Tae-Yoon Kim`과 `aston4215.com`을 띠 배경에 표시한다.
- `404.astro`: `Page not found`와 `Go to home` 링크, 페이지 제목 `Page not found | Tae-Yoon Kim`.

- [ ] **Step 4: 테스트를 통과시킨다**

Run: `npm run build; npm test`
Expected: 전체 PASS.

- [ ] **Step 5: 커밋한다**

```bash
git add src tests
git commit -m "feat: add design tokens and shared layout"
```

---

### Task 3: Hero와 사진

**Files:**
- Create: `src/components/Hero.astro`, `tests/hero.test.mjs`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `<Base>`, `profile`
- Produces: `<Hero profile={profile.data} />`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```js
test('one h1 with the name', () => {
  assert.deepEqual([...home.matchAll(/<h1[^>]*>([^<]*)<\/h1>/g)].map(m => m[1]), ['Tae-Yoon Kim']);
});
test('lead sentence keeps the research term together', () => {
  const text = stripTags(home).replaceAll(' ', ' ').replaceAll('&nbsp;', ' ').replaceAll('&#160;', ' ').replaceAll('&amp;', '&');
  assert.ok(text.includes('Undergraduate at KAIST, researching KV cache compaction in the Machine Learning & Vision Lab.'));
  assert.match(home, /KV(&nbsp;|&#160;| )cache(&nbsp;|&#160;| )compaction/);
});
test('portrait is optimized and described', () => {
  assert.match(home, /<source[^>]+image\/avif/);
  assert.match(home, /<source[^>]+image\/webp/);
  assert.match(home, /alt="Portrait of Tae-Yoon Kim"/);
  assert.match(home, /fetchpriority="high"/);
  assert.ok(!/loading="lazy"/.test(between(home, '<picture', '</picture>')));
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run build; npm test`
Expected: Hero 테스트 3개 FAIL.

- [ ] **Step 3: `Hero.astro`를 구현한다**

`astro:assets`의 `Picture`에 `src/assets/portrait.jpg`를 넣고, `formats={['avif', 'webp']}`, `fallbackFormat="jpg"`, `widths={[340, 680, 1020]}`, `sizes="min(340px, 64vw)"`, `loading="eager"`, `fetchpriority="high"`를 준다. 크기, 여백, 다크 모드 처리는 스펙 5장의 서체, 격자, 사진 항목을 따른다. `lead`의 공백 묶기는 YAML 원문을 바꾸지 않고 컴포넌트에서 `KV cache compaction`과 `Vision Lab`의 공백만 ` `로 치환한다.

- [ ] **Step 4: 테스트를 통과시킨다**

Run: `npm run build; npm test`
Expected: 전체 PASS.

- [ ] **Step 5: 커밋한다**

```bash
git add src tests
git commit -m "feat: add hero with optimized portrait"
```

---

### Task 4: Research 타일과 셀 그래픽

**Files:**
- Create: `src/components/Tile.astro`, `src/components/KvGraphic.astro`, `tests/research.test.mjs`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `<Base>`, `profile`
- Produces: `<Tile label: string, title: string, emphasis?: boolean>` (slot은 제목 아래)
- Produces: `<KvGraphic />`, 각 쌍은 `.kv` 클래스와 인라인 `--d` 값을 가진다 (Task 7 검사에서 사용)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```js
test('research section shows topic, lab, professor and lab link', () => {
  const s = sectionById(home, 'research');
  for (const t of ['Research', 'KV cache compaction', 'Lab', 'KAIST', 'Prof. Hyunwoo J. Kim'])
    assert.ok(s.includes(t), t);
  assert.match(s, /href="https:\/\/mlv\.kaist\.ac\.kr\/"[^>]*>\s*Visit lab site ›/);
});
test('graphic has 33 hidden pairs, a legend, and no numbers in text', () => {
  const s = sectionById(home, 'research');
  assert.equal([...s.matchAll(/class="kv/g)].length, 33);
  assert.match(s, /aria-hidden="true"/);
  assert.match(s, />key</);
  assert.match(s, />value</);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run build; npm test`
Expected: Research 테스트 FAIL.

- [ ] **Step 3: 컴포넌트를 구현한다**

`KvGraphic.astro`의 배치는 다음 값으로 고정한다.

```js
const rows = [
  [1, 5, 9, 14, 20, 26],
  [0, 3, 8, 12, 18],
  [2, 6, 11, 17, 22, 28, 33],
  [4, 9, 15, 24],
  [1, 7, 10, 16, 21, 29],
  [3, 13, 19, 27, 31],
];
// 행 y, 순번 i, 시작 열 x에 대해 --x:x, --y:y, --d:x - i * 2
```

격자는 `position: relative; aspect-ratio: 36 / 7.2`이다. 각 쌍은 `position: absolute`, `left: x × (100/36)%`, `top: y × (100/6)%`, 폭 `2 × (100/36)%`, 높이 `100/6 %`이고, 안에 key와 value 칸 두 개를 flex로 둔다. 각 칸의 `margin`은 1.5px, `border-radius`는 2px이다.

기본 상태는 모인 상태인 `transform: translateX(calc(var(--d) * -50%))`이다. `@supports (animation-timeline: view())`와 `@media (prefers-reduced-motion: no-preference)` 안에서만 `transform: none`에서 시작하는 애니메이션을 적용하고, `animation-timeline: view()`, `animation-range: entry 30% cover 55%`, `animation-timing-function: linear`, `animation-fill-mode: both`를 준다.

타일 격자와 색은 스펙 5장을 따른다. 라벨은 고정폭 서체이며 HTML 구조는 라벨 `span`, 제목 `h2`이다.

- [ ] **Step 4: 테스트를 통과시킨다**

Run: `npm run build; npm test`
Expected: 전체 PASS.

- [ ] **Step 5: 커밋한다**

```bash
git add src tests
git commit -m "feat: add research tiles and KV graphic"
```

---

### Task 5: 사양표와 콘텐츠 확장

**Files:**
- Create: `src/lib/notes.ts`, `src/components/SpecBlock.astro`, `src/components/SpecRow.astro`, `src/pages/notes/[...index].astro`, `src/pages/notes/[slug].astro`, `tests/spec-sections.test.mjs`, `tests/extension.test.mjs`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `<Base>`, 모든 컬렉션
- Produces: `<SpecBlock id: string, title: string>` (`dl` slot), `<SpecRow label: string>` (`dd` slot)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```js
// tests/spec-sections.test.mjs
test('education is listed newest first', () => {
  const t = stripTags(sectionById(home, 'education'));
  assert.ok(t.indexOf('UC Berkeley, Exchange Program') < t.indexOf('KAIST, School of Computing'));
  assert.ok(t.indexOf('KAIST, School of Computing') < t.indexOf('Seongdeok High School, Gwangju'));
  for (const p of ['Spring 2027', '2025–present', '2022–2024']) assert.ok(t.includes(p));
});
test('contact has every public channel', () => {
  const s = sectionById(home, 'contact');
  for (const href of ['mailto:aston4215@kaist.ac.kr', 'mailto:office.aston4215@gmail.com',
    'https://github.com/office-aston4215', 'https://www.instagram.com/aston._.4215/'])
    assert.ok(s.includes(href), href);
  for (const label of ['Academic', 'General', 'GitHub', 'Instagram', '@aston._.4215']) assert.ok(s.includes(label));
});
test('empty sections and excluded profiles stay hidden', () => {
  for (const t of ['Publications', 'Projects', 'Notes', 'scholar.google', 'linkedin.com'])
    assert.ok(!home.includes(t), t);
  assert.ok(!existsSync('dist/notes'));
});
```

```js
// tests/extension.test.mjs: 임시 콘텐츠를 넣어 .tmp-ext로 빌드하고 finally로 원상 복구한다
// 추가: publications.yaml 1개, projects.yaml 1개, notes/fixture-note.md, notes/fixture-draft.md(draft: true)
test('added content appears everywhere it should', () => {
  assert.ok(/<h2[^>]*>Publications/.test(ext) && /<h2[^>]*>Projects/.test(ext));
  assert.ok(between(ext, '<nav', '</nav>').includes('/notes/'));
  assert.ok(existsSync('.tmp-ext/notes/index.html'));
  assert.ok(existsSync('.tmp-ext/notes/fixture-note/index.html'));
});
test('draft notes are not published', () => {
  assert.ok(!existsSync('.tmp-ext/notes/fixture-draft'));
  assert.ok(!readFileSync('.tmp-ext/notes/index.html', 'utf8').includes('fixture-draft'));
  assert.ok(!readFileSync('.tmp-ext/sitemap-0.xml', 'utf8').includes('fixture-draft'));
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run build; npm test`
Expected: 새 테스트 FAIL.

- [ ] **Step 3: 사양표와 Notes 라우트를 구현한다**

- 표시 순서는 스펙 4장을 따른다. 각 컬렉션은 `start` 내림차순으로 정렬하고, 항목이 없으면 영역 전체를 렌더링하지 않는다.
- Publications 행은 `period`를 라벨로, 제목(`url`이 있으면 링크), 저자, 발표처를 값으로 표시한다. Projects 행은 `period`를 라벨로, 제목(`url`이 있으면 링크), 요약을 값으로 표시한다.
- `[...index].astro`의 `getStaticPaths`는 공개 글이 있을 때만 `[{ params: { index: undefined } }]`, 없으면 `[]`를 반환한다. `[slug].astro`는 공개 글마다 경로를 만든다. 글 목록은 날짜 내림차순이며 제목, 날짜, 요약을 표시한다. 본문은 `render()`로 렌더링하고 줄 길이 65자 이내로 제한한다.
- `draft` 판별은 `src/lib/notes.ts`의 `isPublished(note): boolean` 하나로 통일해 Nav, 목록, 상세 페이지가 함께 쓴다.

- [ ] **Step 4: 테스트를 통과시킨다**

Run: `npm run build; npm test`
Expected: 전체 PASS. 테스트 후 `git status`에 픽스처와 YAML 변경이 남지 않는다.

- [ ] **Step 5: 커밋한다**

```bash
git add src tests
git commit -m "feat: add spec sections and content extension"
```

---

### Task 6: SEO와 공유 자산

**Files:**
- Create: `public/apple-touch-icon.png`, `public/favicon-32.png`, `public/og.png`, `public/robots.txt`, `tests/seo.test.mjs`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Consumes: `<Base>`, `profile`, `pngSize`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

```js
test('metadata', () => {
  assert.match(home, /<title>Tae-Yoon Kim<\/title>/);
  assert.match(home, /<link rel="canonical" href="https:\/\/aston4215\.com\/"/);
  assert.match(home, /property="og:image" content="https:\/\/aston4215\.com\/og\.png"/);
  assert.match(home, /name="twitter:card" content="summary_large_image"/);
  assert.match(home, /rel="apple-touch-icon"/);
  assert.match(home, /media="\(prefers-color-scheme: dark\)"/);
});
test('Person data matches the spec and omits alumniOf', () => {
  const p = JSON.parse(between(home, 'application/ld+json">', '</script>'));
  assert.equal(p['@type'], 'Person');
  assert.equal(p.name, 'Tae-Yoon Kim');
  assert.equal(p.url, 'https://aston4215.com/');
  assert.deepEqual(p.email, ['aston4215@kaist.ac.kr', 'office.aston4215@gmail.com']);
  assert.deepEqual(p.sameAs, ['https://github.com/office-aston4215', 'https://www.instagram.com/aston._.4215/']);
  assert.equal(p.affiliation.name, 'KAIST');
  assert.ok(p.image.startsWith('https://aston4215.com/'));
  assert.ok(!('alumniOf' in p));
});
test('images and crawl files exist at the right sizes', () => {
  assert.deepEqual(pngSize('dist/og.png'), { width: 1200, height: 630 });
  assert.deepEqual(pngSize('dist/apple-touch-icon.png'), { width: 180, height: 180 });
  assert.deepEqual(pngSize('dist/favicon-32.png'), { width: 32, height: 32 });
  assert.match(readDist('robots.txt'), /Sitemap: https:\/\/aston4215\.com\/sitemap-index\.xml/);
  assert.ok(existsSync('dist/sitemap-index.xml'));
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm run build; npm test`
Expected: SEO 테스트 FAIL.

- [ ] **Step 3: PNG 자산을 만든다**

임시 HTML을 Chrome headless로 캡처하되, 생성 스크립트는 저장소에 남기지 않는다. 아이콘은 `logo-light.svg`를 그대로 축소한다. 공유 이미지는 흰 배경 왼쪽에 로고와 이름 `Tae-Yoon Kim`만 넣고, Inter 600과 스펙의 `#1D1D1F`를 쓴다.

Run: `node -e "for (const f of ['og','apple-touch-icon','favicon-32']) { const b = require('fs').readFileSync('public/'+f+'.png'); console.log(f, b.readUInt32BE(16), b.readUInt32BE(20)) }"`
Expected: `og 1200 630`, `apple-touch-icon 180 180`, `favicon-32 32 32`

- [ ] **Step 4: 메타데이터를 구현한다**

`Base.astro`에 Open Graph, Twitter Card, JSON-LD를 넣는다. 설명은 `lead`이고, `image`는 처리된 사진의 절대 주소, `affiliation`은 `{"@type":"Organization","name":"KAIST"}`이다. `robots.txt`는 전체 허용과 Sitemap 주소를 담는다.

- [ ] **Step 5: 테스트를 통과시킨다**

Run: `npm run build; npm test`
Expected: 전체 PASS.

- [ ] **Step 6: 커밋한다**

```bash
git add public src tests
git commit -m "feat: add SEO metadata and share assets"
```

---

### Task 7: 브라우저와 품질 검증

**Files:**
- Create: `scripts/browser-check.cjs`
- Modify: 검사에서 발견된 문제가 있는 파일

**Interfaces:**
- Consumes: `.kv`와 `--d`, `/#research`, `/#education`, `/#contact`, `#main`
- Produces: `PW_DIR`에 Playwright가 있을 때 `node scripts/browser-check.cjs <url> <출력 폴더>`로 실행하는 검사. 실패 시 종료 코드 1

- [ ] **Step 1: Playwright를 프로젝트 밖에 설치한다**

Run: `mkdir -p "$TEMP/pw" && npm --prefix "$TEMP/pw" install playwright && npx --prefix "$TEMP/pw" playwright install chromium firefox webkit`
Expected: 설치 성공. `package.json`에 변경 없음.

- [ ] **Step 2: 검사 스크립트를 쓴다**

`require(process.env.PW_DIR + '/node_modules/playwright')`로 불러온다. 브라우저는 `chromium`, `chromium`의 `channel: 'msedge'`, `firefox`, `webkit`이다. 각 브라우저에서 다음을 검사한다.

| 검사 | 통과 조건 |
|---|---|
| 폭 320, 390, 768, 1024, 1440, 1920px | `scrollWidth <= innerWidth`, 라이트와 다크 전체 화면 캡처 저장 |
| 폭 320px 헤더 | 이름과 Email 버튼의 사각형이 겹치지 않음 |
| 1440×900 첫 화면 | `h1`, 소개 문장, 사진의 `bottom`이 900 이하 |
| 콘솔과 네트워크 | 오류 메시지와 실패한 요청 없음 (외부 링크는 요청하지 않음) |
| 앵커 3개 | 메뉴 클릭 후 대상 제목의 `top`이 52 이상이고 화면 안에 있음 |
| Tab 순회 | 첫 포커스가 건너뛰기 링크, 모든 링크 도달, 헤더 밖 요소의 `top`이 52 이상, 포커스 외곽선 표시 |
| 셀 그래픽 | 아래 규칙 |
| 다크 모드 | 페이지 배경 `rgb(0, 0, 0)`, 사진 `filter`에 `brightness` 포함 |
| 없는 주소 | Task 8에서 실제 주소로 검사 |

셀 그래픽은 `--d`가 0이 아닌 첫 `.kv`로 판단한다. 최종 위치는 쌍 폭의 `-d × 50%` 이동이다.

- `CSS.supports('animation-timeline: view()')`가 참이면, 스크롤 맨 위에서는 이동 없음이고 그래픽을 화면 가운데로 스크롤하면 최종 위치다.
- 거짓이면 스크롤 위치와 관계없이 최종 위치다.
- `reducedMotion: 'reduce'`로 연 페이지는 항상 최종 위치다.

- [ ] **Step 3: 검사를 실행한다**

`npm run build` 후 `npm run preview`를 백그라운드로 띄운다.

Run: `PW_DIR="$TEMP/pw" node scripts/browser-check.cjs http://localhost:4321 "$TEMP/site-shots"`
Expected: 모든 브라우저 PASS, 종료 코드 0.

- [ ] **Step 4: 캡처를 눈으로 검토한다**

폭별 라이트와 다크 캡처를 읽어 스펙 5장의 구성과 비교한다. 겹침, 어색한 줄바꿈, 사진 경계 문제를 고치고 Step 3을 다시 실행한다.
Expected: 시각 문제 없음. 고친 내용을 커밋 메시지에 적는다.

- [ ] **Step 5: Lighthouse를 측정한다**

Run: `lighthouse http://localhost:4321/ --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="$TEMP/lh-mobile.json" --chrome-flags="--headless=new" --quiet`
Run: `lighthouse http://localhost:4321/ --preset=desktop --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="$TEMP/lh-desktop.json" --chrome-flags="--headless=new" --quiet`
Expected: 두 JSON의 네 항목 `score`가 모두 0.95 이상. 미달이면 원인을 고치고 다시 측정한다.

- [ ] **Step 6: 전체 테스트를 다시 실행하고 커밋한다**

Run: `npm run build; npm test`
Expected: 전체 PASS.

```bash
git add scripts src tests
git commit -m "test: add browser checks and fix findings"
```

---

### Task 8: 배포와 실제 주소 검증

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm run build`, `scripts/browser-check.cjs`
- Produces: `main` Push 시 자동 배포

- [ ] **Step 1: 워크플로를 쓴다**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

- [ ] **Step 2: 공개 전 변경 내역을 확인한다**

Run: `git add .github && git commit -m "ci: deploy to GitHub Pages" && git log --oneline && git ls-files`
Expected: 비공개 프로젝트 이름이나 불필요한 파일이 없고, `node_modules`, `dist`가 포함되지 않는다.

사용자가 비공개로 지정한 프로젝트 이름을 `git grep -nEi`로 검색한다. 이름 목록은 저장소 문서에 적지 않고, 로컬 메모리의 `site-identity`에서 가져온다.
Expected: 일치 없음.

- [ ] **Step 3: 사용자 확인을 받는다**

Push하면 사이트, 사진 원본, 저장소 파일이 공개된다. 캡처와 파일 목록을 보여 주고 공개 승인을 받는다. 승인 없이 다음 단계로 가지 않는다.

- [ ] **Step 4: `main`을 만들어 Push한다**

Run: `git branch main site-v1 && git switch main && git push -u origin main`
Expected: Push 성공.

- [ ] **Step 5: 워크플로 완료를 기다린다**

Run: `gh run watch --repo office-aston4215/aston4215.com --exit-status $(gh run list --repo office-aston4215/aston4215.com --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected: build와 deploy 모두 성공. `sharp`나 lockfile 문제로 실패하면 로그의 원인을 고쳐 다시 Push한다.

- [ ] **Step 6: 실제 주소를 검증한다**

Run: `for u in https://aston4215.com/ http://aston4215.com/ https://www.aston4215.com/ https://aston4215.com/no-such-page; do curl -s -o /dev/null -w "$u %{http_code} %{redirect_url}\n" "$u"; done`
Expected: 첫 주소 200, `http`와 `www` 301이며 `https://aston4215.com/`로 이동, 마지막 주소 404.

Run: `curl -s https://aston4215.com/no-such-page | grep -c "Go to home"`
Expected: 1 이상.

Run: `gh api repos/office-aston4215/aston4215.com/pages --jq '{cname,https_enforced,protected_domain_state}'`
Expected: `aston4215.com`, `true`, `verified`.

- [ ] **Step 7: 실제 주소로 브라우저 검사와 Lighthouse를 실행한다**

Run: `PW_DIR="$TEMP/pw" node scripts/browser-check.cjs https://aston4215.com "$TEMP/site-shots-prod"`
Expected: 모든 브라우저 PASS.

Task 7 Step 5의 명령을 `https://aston4215.com/`로 실행한다.
Expected: 모바일과 데스크톱의 네 항목이 모두 95점 이상.

- [ ] **Step 8: 자동 배포를 확인한다**

`main`에 커밋이 추가될 때마다 워크플로가 실행되는지 `gh run list`로 확인한다. Task 8의 첫 Push와, 이후 수정이 있으면 그 Push의 실행 기록으로 판단한다.
Expected: 해당 커밋의 실행이 성공으로 기록된다.

- [ ] **Step 9: 사용자에게 확인을 요청한다**

Instagram 링크가 의도한 계정으로 열리는지, GitHub 프로필 이름을 `Tae-Yoon Kim`으로 통일할지 사용자에게 확인한다.
