# aston4215.com 개인 사이트 설계 스펙

- 작성일: 2026-11-05
- 대상: `https://aston4215.com`
- 범위: 첫 공개 버전과, 이후 콘텐츠를 추가하는 구조

## 1. 목표와 성공 기준

KAIST 학부생 연구자 Tae-Yoon Kim의 개인 사이트를 만든다. 교수·연구자와 기업·채용 담당자가 소속, 연구 주제, 학력, 연락처를 몇 초 안에 파악할 수 있어야 한다.

성공 기준은 다음과 같다.

1. 아래 2장의 사실만 표시하고, 제공되지 않은 정보는 만들어 넣지 않는다.
2. 1440×900 화면에서 스크롤 없이 이름, 소개 문장, 사진이 모두 보인다.
3. `main`에 Push하면 자동으로 빌드되어 `https://aston4215.com`에 배포된다.
4. 코드 수정 없이 YAML 또는 Markdown만 추가해 논문, 프로젝트, 글을 게시할 수 있다.
5. Lighthouse 성능, 접근성, 권장 사항, SEO가 모두 95점 이상이다.

## 2. 콘텐츠

사이트 언어는 영어다. 한글 이름은 제공되지 않았으므로 표기하지 않는다.

| 항목 | 표시 내용 |
|---|---|
| 이름 | Tae-Yoon Kim |
| 소개 문장 | Undergraduate at KAIST, researching KV cache compaction in the Machine Learning & Vision Lab. |
| 연구 | KV cache compaction |
| 연구실 | Machine Learning & Vision Lab, KAIST (`https://mlv.kaist.ac.kr/`) |
| 연구실 교수 | Prof. Hyunwoo J. Kim |
| 학력 | Spring 2027: UC Berkeley, Exchange Program |
| 학력 | 2025–present: KAIST, School of Computing |
| 학력 | 2022–2024: Seongdeok High School, Gwangju |
| 이메일 | Academic: `aston4215@kaist.ac.kr` |
| 이메일 | General: `office.aston4215@gmail.com` |
| GitHub | `office-aston4215` (`https://github.com/office-aston4215`) |
| Instagram | `@aston._.4215` (`https://www.instagram.com/aston._.4215/`) |
| 사진 | `src/assets/portrait.jpg` |
| 로고 | `public/logo-light.svg`, `public/logo-dark.svg` |

표시 규칙은 다음과 같다.

- `aston4215`는 주소와 계정 이름으로만 쓰고, 브랜드 문구로 쓰지 않는다.
- KV cache compaction의 정의나 성과 설명은 제공되기 전까지 쓰지 않는다.
- 논문, 수상, 프로젝트는 현재 없거나 비공개이므로 표시하지 않는다.
- Google Scholar와 LinkedIn 링크는 넣지 않는다.

## 3. 범위

### 첫 버전에 포함

- 원페이지 홈 `/`와 `/404`
- 상단 고정 내비게이션 헤더
- 라이트·다크 모드 자동 전환 (기기 설정을 따르며 전환 버튼 없음)
- 스크롤에 연동되는 KV 셀 모션 1개
- 파비콘, 공유 이미지, sitemap, robots.txt, 구조화 데이터
- GitHub Actions 자동 배포

### 첫 버전에 미포함

검색, 문의 양식, 방문자 분석, 다국어, RSS, CV 다운로드.
필요해지면 별도 작업으로 추가한다.

## 4. 정보 구조

```text
/                  Hero, Research, Education, Contact
/404               찾을 수 없는 페이지 안내와 홈 링크

콘텐츠를 추가하면 자동으로 나타나는 영역
/의 Publications   publications.yaml에 항목이 있을 때
/의 Projects       projects.yaml에 항목이 있을 때
/notes/            공개 글이 1개 이상 있을 때
/notes/<slug>/     글마다 생성
```

홈의 표시 순서는 Hero, Research, Publications, Projects, Education, Contact다. 항목이 없는 영역은 제목과 메뉴 링크를 모두 표시하지 않는다.

### 헤더

높이 52px의 상단 고정 헤더이며, 아래쪽에 1px 구분선을 둔다.

| 위치 | 데스크톱 (768px 이상) | 모바일 |
|---|---|---|
| 왼쪽 | 로고 20px와 이름, 홈 링크 | 같음 |
| 오른쪽 | Research, Education, Contact, GitHub 링크와 Email 버튼 | Email 버튼 |

- 콘텐츠가 추가되면 Publications, Projects, Notes 링크가 해당 순서대로 나타난다.
- Email 버튼은 `mailto:aston4215@kaist.ac.kr`로 연결한다.
- 모바일에서는 페이지가 한 번의 스크롤로 끝나므로 햄버거 메뉴를 두지 않는다.

## 5. 디자인 시스템

### 콘셉트

Apple 제품 페이지의 구성 원칙을 연구자 프로필에 맞게 다시 해석한다. 사람을 제품처럼 소개하는 첫 화면, 연구를 보여 주는 타일, 사양표처럼 정리한 이력으로 이어진다. Apple의 로고, 문구, 페이지를 복제하지 않는다.

기술적인 인상은 장식이 아니라 세 가지로 만든다.

1. KV 쌍이 모이는 셀 그래픽
2. 메타데이터에만 쓰는 고정폭 서체
3. Tech Specs 형식의 이력 표

### 색

| 역할 | 라이트 | 다크 |
|---|---|---|
| 페이지 배경 | `#FFFFFF` | `#000000` |
| 띠 배경 | `#F5F5F7` | `#1D1D1F` |
| 일반 타일 | `#FFFFFF` | `#2A2A2C` |
| 강조 타일 | `#000000` | `#2A2A2C` |
| 본문 | `#1D1D1F` | `#F5F5F7` |
| 보조 텍스트 | `#6E6E73` | `#A1A1A6` |
| 구분선 | `#D2D2D7` | `#424245` |
| 버튼 배경과 글자 | `#1D1D1F`, `#FFFFFF` | `#F5F5F7`, `#1D1D1F` |

강조 타일의 글자는 양쪽 모드 모두 `#F5F5F7`, 라벨은 `#A1A1A6`이다. 셀 그래픽은 key `#6E6E73`, value `#F5F5F7`이다. 그 외 색은 쓰지 않는다.

### 서체

| 역할 | 서체 |
|---|---|
| 기본 | `-apple-system`, `BlinkMacSystemFont`, `"SF Pro Text"`, `"Inter Variable"`, `system-ui`, `sans-serif` |
| 메타데이터 | `ui-monospace`, `"SF Mono"`, `Menlo`, `Consolas`, `monospace` |

Apple 기기에서는 시스템 서체인 SF로 표시한다. 그 외 기기를 위해 Inter(OFL-1.1)를 `@fontsource-variable/inter`의 광학 크기 축 파일로 자체 호스팅한다. SF 폰트 파일을 직접 배포하지 않는다. Apple 기기에서는 Inter를 내려받지 않도록 preload하지 않으며, `font-display: swap`을 쓴다. 고정폭 서체는 시스템 서체만 쓴다.

| 요소 | 크기 | 굵기 | 자간, 행간 |
|---|---|---|---|
| 이름 (`h1`) | `min(14vw, clamp(52px, 8.6vw, 112px))` | 600 | -0.032em, 1.02 |
| 소개 문장 | `clamp(21px, 2.3vw, 28px)` | 500, 보조 색 | -0.018em, 1.2 |
| 강조 타일 제목 | `clamp(30px, 4vw, 48px)` | 600 | -0.028em, 1.05 |
| 일반 타일 제목 | `clamp(26px, 2.8vw, 32px)` | 600 | -0.022em, 1.1 |
| 사양표 제목 | 28px | 600 | -0.02em, 1.05 |
| 본문 | 17px | 400 | -0.011em, 1.47 |
| 헤더 링크 | 13px | 400 | 본문과 같음 |
| 메타데이터 | 12~14px | 400~500, 고정폭 | 0, 1.3~1.75 |
| 푸터 | 12px | 400 | 본문과 같음 |

"KV cache compaction"과 "Vision Lab"은 줄바꿈되지 않게 공백을 묶는다.

### 격자

- 콘텐츠 최대 폭 1120px, 좌우 여백 `clamp(20px, 4vw, 48px)`
- 12열, 열 간격 16px
- 타일 모서리 28px, 타일 안쪽 여백 `clamp(24px, 3vw, 36px)`
- Hero는 가운데 정렬, 나머지 영역은 왼쪽 정렬

### 페이지 구성

```text
[로고 이름]             Research Education Contact GitHub (Email)
-----------------------------------------------------------------
                       Tae-Yoon Kim
                 Undergraduate at KAIST, ...
                         [사진]
=================================================================  띠 배경
 [Research                              ] [Lab                  ]
 [KV cache compaction                   ] [Machine Learning     ]
 [셀 그래픽, key/value 범례             ] [& Vision Lab         ]
                                          [KAIST, 교수, 사이트  ]
=================================================================
 ----------------------------------------------------------------
 Education          Spring 2027     UC Berkeley, Exchange Program
                    2025–present    KAIST, School of Computing
                    2022–2024       Seongdeok High School, Gwangju
 ----------------------------------------------------------------
 Contact            Academic        aston4215@kaist.ac.kr
                    General         office.aston4215@gmail.com
                    GitHub          office-aston4215
                    Instagram       @aston._.4215
=================================================================
 Copyright © 2026 Tae-Yoon Kim                      aston4215.com
```

| 영역 | 크기 |
|---|---|
| Hero 위 여백 | `clamp(48px, 6vw, 72px)` |
| 띠 위아래 여백 | `clamp(56px, 7vw, 96px)` |
| 타일 폭 | 강조 8열, 일반 4열, 간격 16px |
| 사양표 제목과 값 | 제목 1~4열, 값 5~12열 |
| 사양표 왼쪽 값 열 | 150px, 모바일 118px |

768px 미만에서는 타일과 사양표 제목을 한 열로 쌓고, 사양표 행의 두 열은 유지한다. 380px 미만에서는 사양표 행도 한 열로 쌓아 이메일 주소가 중간에서 끊기지 않게 한다.

### 로고

- 제공된 SVG의 도형 좌표를 바꾸지 않는다.
- 헤더에서는 두 경로를 inline SVG로 넣고 `fill: currentColor`로 테마를 따른다. 제공 파일의 배경 사각형은 쓰지 않는다.
- 도형에 맞춘 `viewBox`는 `204.76 193.45 614.48 637.09`이다.
- 파비콘은 `media="(prefers-color-scheme: dark)"`로 나누어 제공 파일을 그대로 쓴다.

### 사진

- 원본은 1555×2000 JPEG이고 EXIF 위치 정보가 없다. 잘라내지 않고 비율을 유지한다.
- 폭 `min(340px, 64vw)`로 가운데에 두고, 아래쪽을 띠 배경에 맞닿게 한다.
- 라이트 모드에서는 테두리 없이 배경을 페이지와 잇는다.
- 다크 모드에서는 위쪽 모서리만 28px로 둥글게 하고 `filter: brightness(.92)`를 준다.
- Astro 이미지 처리로 AVIF, WebP, JPEG와 340·680·1020px 폭을 생성하고 즉시 로드한다.
- 대체 텍스트는 `Portrait of Tae-Yoon Kim`이다.

### 셀 그래픽과 모션

강조 타일 안에 key(회색)와 value(흰색) 쌍이 6행으로 놓인다. 쌍이 흩어진 상태에서 왼쪽으로 빈틈없이 모여 compaction을 보여 준다.

- 연구 방법이나 결과를 나타내지 않는 개념 그림이다. 수치와 설명 문구를 넣지 않고, 범례는 `key`와 `value`만 쓴다.
- 쌍의 위치는 고정 배열로 정의하며 빌드 결과에 HTML로 포함한다. 화면 낭독기에서는 숨긴다.
- CSS `animation-timeline: view()`로 스크롤 위치에 연동하고, 범위는 `entry 30%`부터 `cover 55%`까지다. JavaScript를 쓰지 않는다.
- 이 기능이 없는 브라우저와 `prefers-reduced-motion: reduce`에서는 모인 상태로 표시한다.

이 모션 외의 자동 모션은 쓰지 않는다. 사진과 타일의 등장 효과, 호버 시 커지는 효과도 쓰지 않는다.

### 링크와 포커스

본문 링크는 평소 밑줄 없이 표시하고 호버 시 밑줄을 표시한다. 외부로 나가는 타일 링크에는 `›`를 붙인다. 키보드 포커스는 2px 본문색 외곽선과 3px 간격으로 표시한다.

### 쓰지 않는 요소

그라디언트, 글래스모피즘, 블러, 그림자, 파란색 등 유채색 강조, 섹션 번호, 전부 대문자 라벨.

## 6. 콘텐츠 모델

Astro Content Collections로 형식을 검증한다. 형식이 틀리면 빌드가 실패해 배포되지 않는다.

| 컬렉션 | 파일 | 필드 |
|---|---|---|
| `profile` | `src/content/profile.yaml` | `id`, `name`, `lead`, `research`, `lab`, `labUrl`, `institution`, `professor`, `emails[]` (`label`, `address`), `links[]` (`label`, `handle`, `url`) |
| `education` | `src/content/education.yaml` | `id`, `period`, `start`, `title` |
| `publications` | `src/content/publications.yaml` | `id`, `period`, `start`, `title`, `authors[]`, `venue`, `url?` |
| `projects` | `src/content/projects.yaml` | `id`, `period`, `start`, `title`, `summary`, `url?` |
| `notes` | `src/content/notes/*.md` | `title`, `date`, `summary`, `draft` (기본값 `false`) |

- `period`는 화면에 그대로 표시하는 문자열이고, `start`는 최신순 정렬에 쓰는 연도 숫자다.
- 첫 버전의 `publications.yaml`과 `projects.yaml`은 빈 목록이고 `notes/`에는 글이 없다.
- `draft: true`인 글은 페이지, sitemap, 메뉴 어디에도 나타나지 않는다.

## 7. 컴포넌트

| 컴포넌트 | 역할 | 입력 |
|---|---|---|
| `Base.astro` | HTML 뼈대, 메타데이터, 파비콘, 구조화 데이터, 전역 스타일 | `title`, `description` |
| `Nav.astro` | 고정 헤더, 콘텐츠 유무에 따른 메뉴 | 없음 (컬렉션을 직접 읽음) |
| `Mark.astro` | 로고 inline SVG | 없음 |
| `Hero.astro` | 이름, 소개 문장, 사진 | `profile` |
| `Tile.astro` | Research와 Lab 타일 | `label`, `title`, `emphasis` |
| `KvGraphic.astro` | 셀 그래픽과 범례 | 없음 |
| `SpecBlock.astro` | 사양표 제목과 행 묶음 | `id`, `title` |
| `SpecRow.astro` | 왼쪽 메타데이터와 오른쪽 값 한 행 | `label`, slot |
| `Footer.astro` | 저작권 표기와 도메인 | 없음 |

Publications와 Projects는 `SpecBlock`과 `SpecRow`를 재사용한다. 영역별로 다른 레이아웃을 만들지 않는다.

## 8. 기술 구조

- 프레임워크: Astro 7 (정적 출력, 기본 클라이언트 JavaScript 없음)
- 의존성: `astro`, `@astrojs/sitemap`, `@astrojs/check`, `typescript@^6`, `@fontsource-variable/inter`
- 패키지 관리자: npm, `package-lock.json`을 커밋한다
- 스타일: `src/styles/global.css`의 CSS 변수와 컴포넌트 범위 스타일. CSS 프레임워크는 쓰지 않는다
- 런타임: Node 24

```text
.github/workflows/deploy.yml
astro.config.mjs                 site: https://aston4215.com
public/
  apple-touch-icon.png           logo-light.svg에서 생성, 180px
  favicon-32.png                 logo-light.svg에서 생성
  logo-light.svg                 제공 원본, 파비콘으로 사용
  logo-dark.svg                  제공 원본, 파비콘으로 사용
  og.png                         1200×630, 로고와 이름
  robots.txt
src/
  assets/portrait.jpg
  components/                    7장의 컴포넌트
  content/                       6장의 파일
  content.config.ts
  layouts/Base.astro
  pages/index.astro
  pages/404.astro
  pages/notes/[...index].astro   공개 글이 없으면 생성하지 않음
  pages/notes/[slug].astro
  styles/global.css
```

공유 이미지는 흰 배경에 검정 로고와 이름만 넣는다.

## 9. 접근성과 SEO

- 시맨틱 요소를 쓴다: `header`, `nav`, `main`, `section`, `footer`, 제목 위계 `h1`, `h2`
- 사양표는 `dl`, `dt`, `dd`로 작성한다
- 본문으로 건너뛰는 링크를 키보드 포커스 시 표시한다
- 고정 헤더가 앵커 대상을 가리지 않도록 `scroll-padding-top: 72px`를 준다
- 모든 텍스트는 해당 배경에서 WCAG AA 대비(4.5:1) 이상을 지킨다
- 페이지 제목은 `Tae-Yoon Kim`이고, 설명은 소개 문장을 쓴다
- canonical, Open Graph, Twitter Card 메타데이터를 넣는다
- JSON-LD `Person`에 `name`, `url`, `image`, `email`, `affiliation`, `sameAs`를 넣는다. 교환학생 예정인 학교를 졸업 학교로 표시하지 않도록 `alumniOf`는 쓰지 않는다
- `@astrojs/sitemap`으로 sitemap을 생성한다

## 10. 배포

```text
로컬 수정 → main에 Push → GitHub Actions
  → npm run build (astro check, astro build)
  → GitHub Pages → https://aston4215.com
```

워크플로는 `actions/checkout@v7`, `withastro/action@v6`, `actions/deploy-pages@v5`를 쓰고, `main` Push와 수동 실행으로 시작한다. 권한은 `contents: read`, `pages: write`, `id-token: write`만 준다.

이미 설정된 항목은 변경하지 않는다.

| 항목 | 현재 상태 |
|---|---|
| 저장소 | `office-aston4215/aston4215.com` |
| Pages 배포 방식 | GitHub Actions |
| 커스텀 도메인 | `aston4215.com`, 소유권 인증 완료 |
| HTTPS | 강제 적용, 인증서 승인됨 |
| DNS | Cloudflare, GitHub Pages로 직접 연결 |

Actions 배포에서는 GitHub가 `CNAME` 파일을 쓰지 않으므로 `public/CNAME`을 넣지 않는다. 첫 배포 후 도메인 설정이 유지되는지 확인하고, 유지되지 않으면 원인을 조사한다.

## 11. 오류 처리

- 콘텐츠 형식 오류와 타입 오류는 빌드를 실패시켜, 이전 배포본이 그대로 유지되게 한다.
- 없는 주소는 `/404` 페이지에서 `Page not found` 문구와 `Go to home` 링크를 보여 준다.
- 사이트에 서버와 입력 양식이 없으므로 그 외 런타임 오류 처리는 필요하지 않다.

## 12. 검증

배포 전:

1. `npm run build`가 오류 없이 끝난다.
2. 폭 320, 390, 768, 1024, 1440, 1920px에서 넘치는 요소와 가로 스크롤이 없다.
3. 라이트와 다크 모드, 모션 최소화 설정에서 화면을 캡처해 확인한다.
4. 셀 그래픽이 스크롤에 따라 흩어진 상태에서 모인 상태로 움직이는지 확인한다.
5. 모든 내부·외부 링크와 `mailto:` 링크가 올바른 주소를 가리키고, 고정 헤더가 앵커 대상을 가리지 않는다.
6. 키보드만으로 모든 링크에 접근할 수 있고 포커스가 보인다.
7. 사용하는 모든 텍스트와 배경 조합의 대비를 계산해 4.5:1 이상인지 확인한다.
8. Chrome과 Edge에서 콘솔 오류가 없고, Firefox와 WebKit은 Playwright(프로젝트 의존성에 추가하지 않음)로 화면을 확인한다.
9. 임시 콘텐츠로 Publications, Projects, Notes를 추가해 영역과 메뉴가 나타나는지 확인한 뒤 임시 콘텐츠를 제거한다.
10. Lighthouse 네 항목이 95점 이상이다.

배포 후:

1. GitHub Actions 빌드와 배포가 성공한다.
2. `https://aston4215.com`이 200을 반환하고, `http://`와 `www`가 HTTPS 도메인으로 이동한다.
3. Pages API에서 `cname`, `https_enforced`, `protected_domain_state: verified`가 유지된다.
4. 실제 주소에서 Lighthouse를 다시 측정한다.
5. Instagram 링크가 의도한 계정으로 열리는지 사용자가 확인한다.

## 13. 콘텐츠 추가 방법

| 추가할 내용 | 방법 |
|---|---|
| 논문 | `src/content/publications.yaml`에 항목 추가 |
| 프로젝트 | `src/content/projects.yaml`에 항목 추가 |
| 글 | `src/content/notes/<slug>.md` 추가 |
| 학력 | `src/content/education.yaml`에 항목 추가 |
| 소개, 연락처 | `src/content/profile.yaml` 수정 |

저장한 뒤 `main`에 Push하면 자동으로 배포된다.
