# Beans UI Working Log

## 2026-09-08T19:11:41Z

- Added structured Fly-visible observability for route visits and content loading. Server access logs record sanitized request/response paths, methods, status codes, and durations; client telemetry records SPA page views and initial versus more content loads for home, category, search, and story Coverage.
- Guard: telemetry records paths, surfaces, feeds, actions, outcomes, and item counts only. Query strings, search text, cursors, user identity, and API keys are excluded.
- Added the telemetry verification case and validated the endpoint locally with a synthetic search path containing a query; the logged path was `/search` only.
- Verification: `corepack pnpm lint`, `corepack pnpm typecheck`, and `corepack pnpm build` pass.

Code snapshot SHA-256: `f5ec519c68a5fd7f9f21016eb2cb4b5ec65ae3cc16848dd630deec81efdfc61d`

Hash inputs: 38 application and configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-08T15:47:20Z

- Added a configurable public site origin (`NUXT_PUBLIC_SITE_URL`) and site-wide canonical, Open Graph, and Twitter metadata. Organization and WebSite JSON-LD now identify Beans as a Project Cafecito web property.
- Added About Beans SoftwareApplication JSON-LD and tightened its product copy: Beans presents source-linked publisher snapshots and discovery context; it does not republish articles or claim to verify their truth.
- Added runtime `/robots.txt`, `/sitemap.xml`, and `/llms.txt` routes. They use the public site origin, block internal `/api/` routes from crawlers, list stable category pages, and direct programmatic or freshness-sensitive work to the Beans API documentation.
- Updated README, deployment/example configuration, and verification criteria to document the public crawlability and AI-agent surfaces.
- Verification: local ESLint passes. The Fly-equivalent production output served `/about-beans`, `/robots.txt`, `/sitemap.xml`, and `/llms.txt`; canonical, Open Graph/Twitter metadata, and `Organization`/`WebSite`/`SoftwareApplication` JSON-LD rendered and parsed. Nuxt typecheck remains blocked by the existing `MarkdownSummary.vue` missing `markdown-it` declaration.

Code snapshot SHA-256: `13bd805ed9c5c343959e651ac4ea62d14dd5e56af3c06c61c08f7935aaad995c`

Hash inputs: 33 application and configuration files under `app/`, `server/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-08T15:22:57Z

- Rebuilt About Beans around four explicit sections: the publisher-news snapshot, the broader public Beans API, source-correlated discovery, and the Project Cafecito product lineup.
- Clarified that Beans presents and links to original publisher reporting, while Espresso Publications publishes editorial/opinion analysis derived from market events and signals. Correlation is presented as supporting context rather than proof of truth.
- Added safe external calls to action for the Beans API, Espresso, and the Cafecito product catalog, plus mobile-first verification criteria.
- Browser verification: desktop renders the product cards in two columns; 320px renders one column with no page or card overflow. The page exposes one H1, all four requested sections, safe external-link attributes, and no console errors.
- Static checks: ESLint and the Nuxt production build pass. Nuxt typecheck remains blocked by the existing `MarkdownSummary.vue` error: TypeScript cannot resolve `markdown-it` or its declarations.
- Files: `app/pages/about-beans.vue`, `design/VERIFICATIONS.md`.

Code snapshot SHA-256: `b1880dc1a22acc7b498d3a07756c4666eac395e3ab82d69b280d0d75cb85233e`

Hash inputs: 30 application and configuration files under `app/`, `server/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-08T14:23:00Z

- Removed leftover agent debug ingest hooks from the home feed composable (localhost:7380 POSTs).
- Guard: `useNewsFeed` no longer posts to `/ingest/...` from `fillTopHeadlinesPool`, `fillLatestNewsPool`, or `loadTopHeadlines`.
- Files: `app/composables/useNewsFeed.ts`.

## 2026-09-08T14:10:00Z

- Story Coverage and Propagation still sent `languages=en` on `/stories/{id}/articles`, which hid non-English members of the same story.
- Guard: `fetchStoryArticles` calls `/stories/{story_id}/articles` with `limit`/`cursor` only. It does not send `languages` or `content_type`. Home news collections still send `languages=en`.
- Browser on `/stories/003d0bb7-2f23-52b4-8869-364dc7d0d7bc`: Coverage includes unfiltered members (bears/Rockies, KFC, Rhode Island, WBUR). `More` requested `/api/beans/stories/{id}/articles?limit=5&cursor=…` with no `languages` and no `content_type`. Story heading stayed the API title/summary.
- Files: `app/composables/useBeansApi.ts`, `design/VERIFICATIONS.md`.

## 2026-09-08T14:05:00Z

- Added a Fly.io multi-stage Dockerfile (pnpm, Nitro `node-server`, listen on 8080) and `.dockerignore`. Runtime image is only `.output`, non-root.
- Guard: Docker build sets `NUXT_SKIP_HOME_PRERENDER=1` so `/` is not prerendered without Flycast/API secrets. Container maps `CAFECITO_API_KEY` / `BEANS_API_BASE_URL` / `ESPRESSO_API_BASE_URL` onto `NUXT_*` runtimeConfig overrides. `fly.toml` sets `HOST`/`PORT` to match `http_service.internal_port`.
- Files: `Dockerfile`, `.dockerignore`, `nuxt.config.ts`, `fly.toml`, `design/VERIFICATIONS.md`.

## 2026-09-08T13:54:42Z

- Replaced the ten narrow category tabs with eight general-news groups: Tech & Innovation, Business & Markets, Science & Health, Climate & Energy, World, Politics & Society, Culture & Lifestyle, Security & Defense, and Industry & Infrastructure.
- Each slug is the kebab-case form of its label. Crypto, blockchain, and DeFi now belong to Business & Markets; the former technology and hardware/robotics/space groups are consolidated under Tech & Innovation; culture and lifestyle are consolidated.
- Preserved every 119 underlying category value exactly once. Updated DESIGN.md so its Category Map matches the UI taxonomy.
- Verified category-value set equality against the tracked baseline; lint and production build pass. Nuxt typecheck remains blocked by the existing missing markdown-it module declaration in app/components/news/MarkdownSummary.vue.

Code snapshot SHA-256: `308cb4219247ed299d7c0faa7806b5f2c8395072c7cae4546250343377d007f9`

Hash inputs: 30 application and configuration files under app/, server/, nuxt.config.ts, and eslint.config.mjs; paths and file bytes are hashed in lexical path order.

## 2026-09-08T13:42:00Z

- Beans (and Espresso) API origins were baked in at config-eval time via `import.meta.env`, so a `.env` `BEANS_API_BASE_URL` never reached the server proxy.
- Guard: server-only `runtimeConfig` reads `process.env.BEANS_API_BASE_URL` / `ESPRESSO_API_BASE_URL` (blank falls back to the fly.dev hosts). Proxies call `useRuntimeConfig(event)` so `NUXT_BEANS_API_BASE_URL` still overrides at runtime. `.env.example` documents the vars.
- Files: `nuxt.config.ts`, `server/api/beans/[...path].get.ts`, `server/api/espresso/[...path].get.ts`, `.env.example`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.

## 2026-09-08T13:40:00Z

- `/stories/{id}` now returns a cleaned `title`, `summary`, and `top_articles`. The UI was still picking the longest article title/summary pair and overwriting that copy when Coverage loaded.
- Guard: `toNewsStory` maps story `title` and `summary` from the story payload. Story detail no longer rewrites title/summary from Coverage, Propagation, or `top_articles`. Missing titles stay empty (no Untitled copy).
- Browser on `/stories/003d0bb7-2f23-52b4-8869-364dc7d0d7bc`: heading and SEO title stay the story `title` (`Loose Women star Judi Love…`); summary stays the story `summary` (`Comedian lived in social housing…`). Coverage rows (North Korea, amusement parks, Fox host, and the next page after `More`) do not replace that copy. Unrelated `top_articles` titles (bears/Rockies) are not used as the story heading.
- Files: `app/composables/useBeansApi.ts`, `app/types/news.ts`, `app/pages/stories/[story_id].vue`, `design/DATASOURCES.md`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.

## 2026-09-08T13:27:00Z

- DATASOURCES news routes now require `languages=en`. Latest was still hitting `/articles/latest` with `content_type=news`, and Coverage used `content_type=news` instead of language.
- Guard: Beans collection helpers always send `languages=en` for `/news/top-headlines`, `/news/latest`, `/news/trending`, and `/stories/{id}/articles`. Latest News uses `/news/latest`. Coverage no longer sends `content_type`. Trending is available as `fetchTrendingNews`.
- Files: `app/composables/useBeansApi.ts`, `app/types/news.ts`, `design/VERIFICATIONS.md`.

## 2026-09-08T00:20:00Z

- Category tabs stayed packed to the start of the content column, so the nav looked left-weighted on wide screens.
- Guard: the tab row is `flex w-max min-w-full justify-between`. When the tabs fit, Now sits at the start of the content column and Politics at the end (`space-between`). When they overflow, the inner nav scrolls and the first tab stays reachable; the page does not overflow.
- Browser CDP on `http://127.0.0.1:3000/`: 1280px `justify-content: space-between`, first/last tabs align with the header column, even ~34px gaps, no page overflow. 320px: inner nav `scrollWidth` 834 > `clientWidth` 320, `Now` visible at scroll start, `Politics` reachable at scroll end, `scrollWidth === clientWidth` on the page. Technology tab still opens `/categories/technology`; Search keeps the same row.
- Files: `app/layouts/default.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.

## 2026-09-08T00:15:00Z

- Propagation used a fixed `w-52` step plus `min-w-max`, so the timeline side-scrolled on small screens and did not fill the story column on wide ones.
- Guard: `UTimeline` is `w-full` with `min-w-0` flex steps; dates wrap (`break-words` / `leading-tight`); grouped avatars use `xs`. No inner `overflow-x-auto`.
- Browser on `/stories/003d0bb7-2f23-52b4-8869-364dc7d0d7bc`: 1280px timeline width 1104 equals Coverage, 5×216px steps, no overflow. 320px timeline 288 equals Coverage, 5×53px steps, page `scrollWidth === clientWidth`.
- Files: `app/components/news/StoryTimeline.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.

## 2026-09-07T23:59:00Z

- Header date live icon read as a static radio glyph with no on-air presence.
- Guard: `lucide:radio` sits over a pulsing, blurred `bg-primary/50` blob plus a primary drop-shadow. Date text stays chip-free (no border, background, or box-shadow). `aria-label` remains `Live, {date}`.
- Browser on `/` and `/categories/technology`: glow `blur(3px)` + `pulse`, icon drop-shadow coffee `rgb(196, 134, 84)`, time `borderWidth: 0` / `boxShadow: none`. 320px: `scrollWidth === clientWidth`.
- Files: `app/layouts/default.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.

## 2026-09-07T15:02:00Z

- Header date chip still used an inset-shadow / border that looked odd. Story `article_count` / `source_count` sat beside Back instead of on the category/date row.
- Guard: date is live icon + `Weekday, MMM dd` with no border, background, or inset shadow. Detailed StoryCard metadata row is `w-full`: category and date at start, humanized `article_count` then `source_count` in an `ml-auto` / `justify-end` cluster, each only when > 0. Back control no longer shows those counts.
- Browser on `/stories/003d0bb7-2f23-52b4-8869-364dc7d0d7bc`: header `borderWidth: 0`, `boxShadow: none`. Metadata row `ELECTIONS AND VOTING` / `14 hrs ago` start, `81 articles` / `2 sources` end (`justify-content: flex-end`, `gapFromRowEnd: 0`). Same at 320px, no overflow. Back row has no counts.
- Files: `app/layouts/default.vue`, `app/components/news/StoryCard.vue`, `app/pages/stories/[story_id].vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.

## 2026-09-07T14:55:00Z

- Home still led with “Live desk / The story, not the noise.” and stacked eyebrows (“Last 24 hours Top headlines”, “Just in Latest news”). Header date was `MMM dd, YYYY` with no live treatment.
- Guard: drop the home hero. Section titles are `Trending` and `Just In` on home and category (no eyebrows). Header date is `Weekday, MMM dd` in an inset-shadow embossed chip with `lucide:radio` live icon; `datetime` is the local ISO date; `aria-label` is `Live, {date}`. Home keeps a visually hidden `h1`.
- Browser: home headings Beans / Trending / Just In; no Live desk / Last 24 hours. Date chip `Monday, Sep 07` with inset highlight/shadow and radio icon. 320px: no overflow; date, mark, Search visible. `/categories/technology` also uses Trending and Just In.
- Files: `app/pages/index.vue`, `app/pages/categories/[category_slug].vue`, `app/layouts/default.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.

## 2026-09-07T14:45:00Z

- Viewport map was still lg/xl 3 Top Headlines + 2 Latest News columns, and md 2 headlines + 1 Latest News column. User wants md and up: 2 headlines + 2 columns; below md: 1 + 1.
- Guard: `CAROUSEL_SLIDE_BASIS_CLASS` is `basis-full md:ps-0 md:px-1.5 md:basis-1/2` (no `lg:basis-1/3`). `LATEST_NEWS_GRID_CLASS` is `grid grid-cols-1 items-start gap-3 md:grid-cols-2`. `SKELETON_COUNT` is 2 so md+ skeletons do not peek. Removed leftover debug ingest `fetch` logs from `StorySection.vue` so lint passes.
- Top Headlines / Latest News still showed word labels (`mentions`, `likes`, `comments`). `StoryTrendCounts` always renders Coverage compact: icon + humanized number, `aria-label` keeps the words for assistive tech. `labeled` prop removed.
- Browser CDP on `http://127.0.0.1:3000/`: 1920/1280/1024/768 → 2 fully visible headlines, 0 peek, Latest News 2 columns; 767/375 → 1 headline, 1 column, no overflow. Count nodes visible text `1` / `10` / `3` with aria `1 mentions` / `10 likes` / `3 comments`. `/categories/technology` at 1280: 2+2. `./node_modules/.bin/eslint` on StorySection / StoryTrendCounts / StoryTimeline exit 0.
- Files: `app/components/news/StorySection.vue`, `app/components/news/StoryTrendCounts.vue`, `app/components/news/StoryTimeline.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.

## 2026-09-07T14:40:00Z

- Top Headlines right-arrow continuation was wired, but `/news/top-headlines?limit=5` page 2 is always empty (`pagination.next_cursor` decodes to `trend_score` `ts:0` while collection rows have no trend). Live comparison: page 1 has 5 articles / 4 unique `story_id`s; the same cursor page 2 is `num_results: 0`; `limit=20` returns 20 articles / 9 unique stories. Latest News `limit=5` + `next_cursor` matches items 6–10 of its `limit=20` set.
- Guard: fetch `limit=20` internally per tab, reveal 5 unique stories, then 10, then 15 from the pool. When the Top Headlines cursor page is empty, expand `limit` (20→40→…→100) and skip already-seen stories instead of stopping at 4–5 cards. Latest News still uses its working cursor after the 20-item batch.
- Files: `app/composables/useNewsFeed.ts`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.

## 2026-09-07T14:32:00Z

- Coffee primary `#b07048` was a bit too dark/roast. Lifted `--color-coffee-400` to `#c48654` (rgb 196, 134, 84), between mocha and the old amber gold, with matching 200/300/500 steps.
- Browser verification: `--ui-primary` and Search CTA background are `#c48654` / `rgb(196, 134, 84)` on home (active Now tab) and `/search`. In-app screenshots timed out; used CDP computed styles.

## 2026-09-07T14:25:00Z

- Foreground primary and accent icons still used Tailwind `amber` (`primary: 'amber'` plus hardcoded `text-amber-*`), so CTAs, active tabs, category labels, trend/propagation/coverage icons, and markdown links read as yellow/gold instead of coffee bean.
- Guard: custom `coffee` scale in `app/assets/css/main.css` (`--color-coffee-400: #b07048` mocha roast). Nuxt UI `primary` maps to `coffee`. `--ui-primary` locked to shade 400 for dark-only. Components use semantic `text-primary` / `outline-primary` instead of amber utilities. No `amber` classes remain in app source.
- Browser verification against `http://127.0.0.1:3000` (cursor-ide-browser + CDP). `--ui-primary` is `#b07048`; active Now/Technology tabs, Search CTA background, trend/propagation/coverage/social icons are `rgb(176, 112, 72)`. Zero `amber` class matches. Home, Search, story `003d0bb7-2f23-52b4-8869-364dc7d0d7bc`, and `/categories/technology` all use the coffee primary. 320px story view: `scrollWidth === clientWidth` (no page overflow). Header Search/API/Contact icons stay cream (`color="neutral"`).
- Files: `app/app.config.ts`, `app/assets/css/main.css`, `app/components/news/StoryCard.vue`, `app/components/news/StoryTimeline.vue`, `app/components/news/StorySection.vue` (eyebrow class only), `app/components/news/StoryTrendCounts.vue`, `app/components/news/MarkdownSummary.vue`, `app/components/news/SignalStrip.vue`, `app/pages/index.vue`, `app/pages/search.vue`, `app/pages/about-beans.vue`, `app/pages/categories/[category_slug].vue`, `design/VERIFICATIONS.md`.

## 2026-09-07T14:16:38Z

- Coverage rows placed mentions beside the source label and only right-aligned likes/comments, so the first row did not match DESIGN (`source_label` start, trend counts end, title on the second row).
- Guard: Coverage reuses `StoryTrendCounts` with `ml-auto` / `justify-end`. Mentions, likes, comments, and shares render together on the source row, only when each value is > 0. Coverage uses compact unlabeled counts so the cluster stays on one line at 320px. Shared counts themselves use `flex-nowrap` so the group stays a single end-aligned cluster. Title stays on the second row. Empty/zero trend values stay omitted.
- Browser verification against `http://127.0.0.1:3000/stories/003d0bb7-2f23-52b4-8869-364dc7d0d7bc` (in-app screenshots timed out; used Playwright Chromium plus CDP layout metrics). Fox host row: source at start, `1` / `13K` / `528` at the row end (`justify-content: flex-end`, `gapFromRowEnd: 0`), title below, no zeros, no page overflow. Same geometry at 1280px and 320px; 320px no longer stacks the counts. Coverage `More` still appended the next five rows. Home still shows labeled `1 mentions` / `13K likes` / `528 comments` on Top Headlines.
- Files: `app/components/news/StoryTimeline.vue`, `app/components/news/StoryTrendCounts.vue`, `design/VERIFICATIONS.md`. `./node_modules/.bin/eslint` on those Vue files and `git diff --check` passed.

## 2026-09-07T14:05:00Z

- Promoted the homepage feed rules into an explicit `Requirements` section in `design/VERIFICATIONS.md`: Top Headlines `limit=5` plus `next_cursor` continuation until null, no `More headlines` button, mentions/likes/comments only when > 0 on headlines/latest/coverage, and the `lg`/`xl` 3+2, `md` 2+1, `sm`/`xs` 1+1 viewport map.
- Aligned Coverage success criteria and the manual verification gate with those same rules. Existing success criteria, failure cases, and test scenarios for carousel continuation, trend overlay, and breakpoints were left in place.

## 2026-09-07T13:57:55Z

- Top Headlines continuation was not wired to the carousel. The last-item check used the last story index, so a 2- or 3-slide viewport never looked “at the end”; Nuxt UI also disables Next when `canScrollNext()` is false, so the right arrow could not request the next cursor. Users depended on a `More headlines` button that DESIGN does not want.
- Guard: initial page stays `limit=5`. When the exposed Embla API reports the last snap (`canScrollNext() === false`) or Next is used there, emit load-more with the stored `next_cursor`. Keep Next enabled while a cursor exists. Bind `select`/`settle`/`reInit` on the unwrapped `emblaApi` (including nested refs). Preserve the current snap after append. Stop when `next_cursor` is null or a page returns no items. Do not auto-loop after an append error; Retry remains. Latest News `More` is unchanged.
- Browser verification against `http://localhost:3000` (Cursor in-app browser tabs vanished immediately; used Playwright Chromium). Live home: first request `/api/beans/news/top-headlines?limit=5`; 5 articles / 4 unique stories after `story_id` dedupe; no `More headlines`; Latest News still has `More`. Reaching the last snap with Next sends `cursor=` + `limit=5`. Live `/news/top-headlines` page 2 currently returns `data: []` and `next_cursor: null`, so Next then disables and no extra slides appear. Mocked 3 cursor pages: 5 → 10 → 15 slides then Next disables. Failed page-2: existing slides stay, “Top headlines could not be loaded right now.” + Retry, no `More headlines`, no further requests after the failed page.
- Files: `app/components/news/StorySection.vue` (carousel cursor/pagination and removal of `More headlines` only; slide-basis/grid classes in this file belong to the responsive-layout slice), `design/VERIFICATIONS.md`. `./node_modules/.bin/eslint` on `StorySection.vue` and `git diff --check` passed. `useNewsFeed` already used `PAGE_SIZE = 5` and `next_cursor`; left unchanged.

## 2026-09-07T13:54:00Z

- Homepage responsive viewport: Top Headlines was locked to one full-width carousel slide (`basis-full`) and Latest News was a single-column stack (`space-y-3`) at every width.
- Guard: Tailwind slide basis and list grid only. Visible top-news slides: 1 below `md` (xs/sm), 2 at `md`, 3 at `lg`/`xl`. Latest News columns: 1 below `lg`, 2 at `lg`/`xl`. Even fractions plus `md:ms-0` / `md:ps-0` so an extra slide does not peek; `sm:start-1` / `sm:end-1` cancel theme `sm:-start-12` arrow overflow. Did not change cursor pagination, the More control, or trend/count rendering.
- Browser verification against `http://localhost:3000` (Cursor in-app browser tabs vanished immediately; used system Firefox via geckodriver). Measured fully-visible slides, peek overlap, grid-template-columns, and page overflow:
  - `xl` 1280px: 3 top slides (0 peek), Latest News 2 columns (`546px 546px`), no overflow
  - `lg` 1024px: 3 top slides (0 peek), Latest News 2 columns (`476px 476px`), no overflow
  - `md` 768px: 2 top slides (0 peek), Latest News 1 column, no overflow
  - `sm` 640px: 1 top slide (0 peek), Latest News 1 column, no overflow
  - `xs`: Firefox headless clamped `innerWidth` to 500px (still below `md`); 1 top slide (0 peek), Latest News 1 column, no overflow
- Files: `app/components/news/StorySection.vue` (slide basis / grid / skeleton classes only; pagination code in the same file is from the carousel-pagination slice), `design/DESIGN.md`, `design/VERIFICATIONS.md`. `./node_modules/.bin/eslint` on `StorySection.vue` and `git diff --check` passed.

## 2026-09-07T13:48:55Z

- Trend stats (mentions, likes, comments) were missing on Top Headlines, Latest News, and Coverage even when article detail had values > 0.
- Root cause: `/news/top-headlines`, `/articles/latest`, and `/stories/{id}/articles` omit `trend`. Detail `/articles/{id}` has `trend.mentions` / `trend.likes` / `trend.comments`. Compressed headline cards never rendered social counts. Snapshot cards omitted `mentions` (only likes/comments/shares). Coverage read collection `article.trend` and never overlaid article-detail trend.
- Guard: render `trend.mentions`, `trend.likes`, `trend.comments`, and `trend.shares` only when the value is a finite number > 0; hide 0 and missing. Overlay from article detail is trend-only (no title/url/summary/image swap). Shared `app/utils/trend.ts` + `StoryTrendCounts.vue`. Coverage and Search enrich via `overlayArticleTrend` with generation guards. Feed enrichment in `useNewsFeed` was already present and left unchanged.
- Browser verification against `http://localhost:3000` (Cursor in-app browser tabs vanished immediately; used system Firefox via geckodriver). After enrich: Fox host headline `1 mentions` / `13K likes` / `528 comments`; White House `1 mentions` / `779 likes` / `129 comments`; Donkeys and Amazon headlines with all-zero detail engagement showed no counts. Latest News on home had 0/missing engagement and showed none. `/categories/technology` showed `1 mentions` / `10 likes` / `3 comments` with no zeros. Coverage on `/stories/003d0bb7-2f23-52b4-8869-364dc7d0d7bc`: Fox host row `1 mentions`, `13K`, `528`; sibling rows with zero engagement omitted counts. Search `election`: Clacton `40 likes` / `107 comments` / `1 mentions`; Stone `1 mentions` / `4 comments` (likes 0 hidden); items with missing/zero detail trend showed no counts.
- Files: `app/utils/trend.ts`, `app/components/news/StoryTrendCounts.vue`, `app/components/news/StoryCard.vue`, `app/components/news/StoryTimeline.vue`, `app/pages/stories/[story_id].vue`, `app/composables/useSearchFeed.ts`, `design/VERIFICATIONS.md`. `./node_modules/.bin/eslint` on those files and `git diff --check` passed.

## 2026-09-06T23:17:30Z

- In-app Browser inspection of `http://localhost:3000/` succeeded (tab `abbbef`). Routes checked: `/`, `/categories/technology`, `/stories/3317387d-881c-5f7f-837a-a489145facd9`, `/search` (topic `battery manufacturing`). Viewports: default mobile-width and `Emulation.setDeviceMetricsOverride` 320×720. No page-level horizontal overflow at 320px. Header date, Beans mark, Search, API, and Contact stayed visible.
- Content-rendering issue found on Latest News: API summaries start with markdown images (`![](http://cdn.newser.com/...)`). `markdown-it` `.disable('image')` left a visible `!` plus an empty image link (`!<a href="...jpeg"></a>`). Root cause was in `MarkdownSummary.vue`, not the feed contract.
- Fix: strip `![...](...)` before inline render; keep `html: false` and images disabled. Re-checked Latest News: summaries now start with prose (e.g. “Older people often have a good idea…”); no leftover `!` or empty image links.
- 320px Top Headlines: default carousel arrows sat at vertical center and covered the category row. `UCarousel` `prev`/`next` now pin to the image band (`top-20`) on small viewports. After reload, arrows sit on the photo; category/date/title remain readable (long category labels still truncate via `max-w-40`).
- Also observed, left as API/data rather than UI fabrication: Egypt drugs headline tagged `VIETNAM`/`DUBLIN`; story category `CANNABIS AND CANNABINOIDS`; Technology latest includes off-topic API taxonomy. Story-less aviation card linked to the original article URL. Search returned battery-related news with `More`. No `/stories/undefined`. No numeric trend scores. Console had no application error UI.
- Files: `design/VERIFICATIONS.md` (markdown-image and 320px carousel cases first), `app/components/news/MarkdownSummary.vue`, `app/components/news/StorySection.vue`. `./node_modules/.bin/eslint` on those Vue files and `git diff --check` passed.

## 2026-09-06T23:04:15Z

- Completion pass after four exclusive parallel slices. `graphifyy` was unavailable; used checked-in `graphify-out/GRAPH_REPORT.md` and `graphify-out/graph.json` as the fallback. The graph still describes the Beans API client (`toNewsArticle` / `articleToStory`), feed/search composables, Story card/section/source/timeline, and home/category/story/search/shell routes.
- Rendering leftovers still present after the slices, and their root causes:
  - Search dropped or collided story-less items because `useSearchFeed` keyed only on `story_id || id`. A URL-only article is now its own item keyed by primary article id/url, and similar-article ids are not search/feed keys.
  - Missing API titles were fabricated as `"Untitled update"` / `"Untitled story"` in `toNewsArticle` / `toNewsStory`. Titles are now omitted/empty; cards and Coverage hide empty headings.
  - A card with no resolvable source still rendered a source group via a `'source'` fallback key and `top_articles.length`, producing a fake “1 source”. Unresolvable sources are omitted.
  - Coverage/Propagation skipped URL-only articles because identity was `article.id` only. Identity is now `id || url`.
- Already fixed and left unchanged: `MarkdownSummary.vue` is complete (`html:false`, inline render, 2/3-line clamps). StoryCard still uses icon-only scores (activity / trending-up / fire) and omits zero social counts.
- Files changed and the requirement they satisfy:
  - `design/VERIFICATIONS.md` — appended still-valid search/shell, card, story, and feed cases before the guard rails.
  - `app/composables/useSearchFeed.ts` — story-less identity; last-submitted empty/error copy; no similar-article keys (`DATASOURCES` article identity, search replacement).
  - `app/composables/useBeansApi.ts` — do not fabricate title (`DATASOURCES` / `INSTRUCTIONS` contract).
  - `app/utils/source.ts`, `StoryCard.vue`, `StorySourceStack.vue` — omit unresolved source groups; keep 404 favicon → default icon.
  - `app/pages/stories/[story_id].vue`, `StoryTimeline.vue` — coverage identity and empty-title omit.
  - `app/pages/search.vue` — empty-publisher copy uses last submitted criteria.
- Static checks: `pnpm` wrapper failed registry signature verification (`@pnpm/exe@10.33.0` / `pnpm@10.33.0` fetch failed). Equivalent local binaries: `./node_modules/.bin/eslint .` exit 0; `./node_modules/.bin/nuxt typecheck` exit 0; `./node_modules/.bin/nuxt build` exit 0 (existing Browserslist/sourcemap warnings only); `git diff --check` exit 0.
- HTTP smoke (not visual): after restarting `./node_modules/.bin/nuxt dev --host 0.0.0.0` outside the sandbox, `127.0.0.1:3000` returned 200 for `/`, `/categories/technology`, `/search`, `/about-beans`, `/stories/example`, and `/stories/{live_story_id}`. SSR HTML includes the Beans mark, Contact (`https://developer.cafecito.tech/contact`) with `noopener noreferrer`, and no fabricated Untitled titles. Live `/api/beans/news/top-headlines?limit=5` returned five news rows.
- Browser inspection: required in-app Browser skill `SKILL.md` was not present in Cursor skills; used `cursor-ide-browser` MCP `INSTRUCTIONS.md` and tool schemas. Availability result: `browser_tabs` list returned empty; `browser_tabs` `new` created ephemeral viewIds (`e15bbc`, `8acd53`) that vanished immediately; `browser_lock` and `browser_navigate` then reported `No browser tab available. Please navigate to a page first.` and `Browser view not found`. No screenshot, viewport (default or 320px), or interaction check could be performed. Visual/touch verification remains incomplete; the goal stays active.

## 2026-09-06T22:41:29Z

- Added [`INSTRUCTIONS.md`](../INSTRUCTIONS.md) as the continuation guide for aligning the UI with the current `DESIGN.md`, `DATASOURCES.md`, and `VERIFICATIONS.md`. It documents the rendering/data contract, content-flow audit, mobile browser inspection workflow for `http://localhost:3000/`, and completion gates.
- Attempted the required in-app Browser inspection. The browser service reported `Browser is not available: iab`, and the available browser list was empty, so no visual or touch verification could be claimed in this run.

## 2026-09-06T22:07:02Z

- Added a visible `More` control below Latest News whenever its cursor is present, and a matching Top Headlines fallback. The carousel-end handler now reads Nuxt UI's unwrapped Embla API, so reaching its final scroll snap requests the next cursor page.
- Feed enrichment now requests the primary article detail only when a feed item has no trend payload, preserving the feed page/order while supplying the returned `trend_score` to the existing score icon.
- Added a reusable, safe Markdown summary renderer. Inline Markdown is rendered with raw HTML disabled; snapshot summaries clamp to two lines and Story detail summaries clamp to three lines.
- Extended `VERIFICATIONS.md` before implementation for carousel continuation, the visible Latest News continuation control, detail-based trend enrichment, Markdown safety, and summary clamps. Live local Beans proxy responses returned continuation cursors for Top Headlines and Latest News; article detail returned a numeric `trend_score` while feed rows omitted it.
- Verified `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check` pass. The in-app Browser connection is unavailable in this environment, so final visual/touch confirmation remains unavailable here.

## 2026-09-06T21:16:37Z

- Added request-token and filter-snapshot guards to both independently paged feeds. A fast category change now clears the previous category's visible cards and prevents a stale response, cursor, error, or source enrichment from updating the newly selected category.
- Scoped those guards to a feed generation rather than an individual cursor request, so source enrichment remains valid when the user loads a later page of the same category.
- Added a page-level retryable empty state for Home and Category while preserving the design requirement to omit empty individual sections.
- Restructured Top Headlines into the specified optional full-width-image card hierarchy and Latest News into the specified optional side-image card with a separate source-and-social-counts row. Story detail continues to use its dedicated metadata hierarchy.
- Made Story detail progressive: the first five latest Coverage rows render without waiting for every Propagation cursor, and Propagation retains its own loading/retry state. Coverage rows now include humanized per-article mentions when provided.
- Added generation guards to Search, so delayed source lookups or result requests cannot overwrite a newer query or block it from starting. Source identity is now domain-based when source metadata is missing, preventing related article URLs from one publisher from inflating source counts.
- Extended `VERIFICATIONS.md` before these changes for in-flight category switching, the fully empty-page state, related-source enrichment during paging, progressive Story detail, Coverage mentions, replacement searches, source-less same-domain deduplication, and the distinct feed-card layouts. `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check` pass. Built-server smoke checks returned HTTP 200 for Home, a category, Story, Search, About, Top Headlines, Latest News, Sources, and semantic Search with its `score_threshold=0` guard rail.
- The in-app browser connection remains unavailable, so visual and touch interaction checks at 320px could not be completed in this environment.

## 2026-09-06T21:06:47Z

- Confirmed local Nuxt development loads the gitignored `.env` `CAFECITO_API_KEY` through existing `runtimeConfig` and keeps it server-only. An authenticated local Beans-proxy Top Headlines request returned HTTP 200 without logging the key.
- Added the Beans semantic-search `score_threshold=0` guard rail for non-empty relevance queries. The live API returns HTTP 200 with the threshold and HTTP 500 without it.
- Extended `VERIFICATIONS.md` for the `.env` boundary and semantic-search failure mode. `pnpm lint` and `pnpm typecheck` pass; production build completed with only existing Browserslist/sourcemap warnings.

## 2026-09-06T17:13:30Z

- Updated `VERIFICATIONS.md` before implementation to cover the canonical shell/routes, search modes, story-less navigation, related sources, and the Google favicon fallback required by `DATASOURCES.md`.
- Aligned the UI with `DESIGN.md`: canonical `/categories/*` and `/stories/*` routes; a dated Beans header; search/API controls; specified footer links and About page; and a news-only Search view with relevance, normalized-tag, and publisher-source filters.
- Removed the out-of-spec Espresso signal rail from Home. Feed cards now enrich source groups from related articles, use the authoritative story source count when available, and open the original URL when no `story_id` exists. Story previews select the longest loaded summary/title pair.
- Verification passed: `pnpm lint`, `pnpm typecheck`, and `pnpm build`; local HTTP smoke checks returned 200 for `/`, `/categories/technology`, `/stories/example`, `/search`, and `/about-beans`.
- The in-app Browser service was unavailable, so the required interactive 320px visual, carousel-end, and live data/error-state checks could not run in this session.

## 2026-09-06T00:39:58Z

Code snapshot SHA-256: `74aba3efa9f843c958457cb5d2848141192779b30949a6748b73988c46e9cb37`

Hash inputs: 24 application and configuration files under `app/`, `server/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

- Preserved feed continuation controls when category filtering removes a page, avoided inferred story counts from partial top articles, and used the default source icon for favicon-free cards.

## 2026-09-06T00:32:30Z

Code snapshot SHA-256: `61e36264595e726d378568011f3e81849b32dd31bbbba44f41836ee32cd05ea7`

Hash inputs: 24 application and configuration files under `app/`, `server/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

- Propagation now uses chronological five-point grouping with first/last story timestamps and grouped intermediate source avatars; source labels and trend shares follow the current UI contract.

## 2026-09-06T00:30:23Z

Code snapshot SHA-256: `541e4f57d41905df5f3e354f3c179e17c8d6ff1d2033e6b2da7e287a2a5fcd37`

Hash inputs: 24 application and configuration files under `app/`, `server/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

- Applied current Propagation grouping guidance: all story articles remain represented, while the timeline renders the first, last, and three grouped intermediate source points; empty feeds now omit their sections after a successful empty response.

## 2026-09-06T00:23:19Z

Code snapshot SHA-256: `6cbdb8ae7f614886836d448f5ca9987bc18784174a6d7bed6622ce3fc71ba2bc`

Hash inputs: 24 application and configuration files under `app/`, `server/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

- Aligned feed and story behavior with `design/VERIFICATIONS.md`: isolated retryable feed states, category-safe five-item cursor paging, carousel-end loading, latest-first Coverage, complete Propagation loading, humanized dates/counts, explicit source fallbacks, and mobile-safe missing-media layouts.

## 2026-09-05T18:33:03Z

Code snapshot SHA-256: `1168b35817716bcfa67e0461551076573b81a8b2ae048844b36e2d0e15e709f9`

Hash inputs: 24 application and configuration files under `app/`, `server/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

- Centralized source labels and favicons: `site_name`, `domain_name`, `base_url`, and the article URL's base URL are used in order for labels; source favicon URLs fall back to the article URL's `/favicon.ico`.

## 2026-09-05T18:21:21Z

Code snapshot SHA-256: `f3d05bdd920079b050676c687d82344ca1c4aee9b5f89682a90380c85d44e323`

Hash inputs: 23 application and configuration files under `app/`, `server/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

- Feed enrichment now retains a loaded feed image when the later story-detail response has no image, preventing an unintended fallback swap.

## 2026-09-05T18:04:33Z

Code snapshot SHA-256: `1c5ee7b79ac435e6ac9055c7259a688b2d189f9c0bb311c9566ec7d4be0a82ab`

Hash inputs: 23 application files under `app/` and `server/`, plus `nuxt.config.ts` and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

- Replaced the stale starter page with home, category, and story-detail routes.
- Added dark coffee/charcoal shared styling, reusable compressed/snapshot/detailed story views, source stacks, and member-article/mention timelines.
- Uses `UCarousel` for Top Headlines, friendly time labels, and capitalized taxonomy labels.
- Uses `UAvatarGroup` for unique favicon sources from the first three story articles, with the authoritative source count beside it.
- Disables lazy loading and suppresses referrers for hotlinked story images and source favicons; story images retain an explicit fallback after a load failure.
- Added cursor-based Beans feeds and optional independent Espresso signal cards behind same-origin server proxies.
- Applied the provided high-level category map as client-side category groups.
- Removed unused starter components.

Known API boundaries:

- Feeds de-duplicate through `story_id`; the live `/stories` collection endpoint currently times out, while story detail and member-article endpoints respond.
- Article mentions are per article. The UI renders a derived story chronology and does not claim a server-provided story-level propagation graph or trend history.
- Espresso events/signals have no declared Beans story or article identifier, so they remain an independent analysis rail.

## 2026-09-05T18:22:23Z

Code snapshot SHA-256: `64455f82bfa29dbe3233580a0fb30da0e88db31e42072de68c179d9afb647068`

Hash inputs: 21 application files under `app/` and `server/`, plus `nuxt.config.ts` and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

- Replaced the story-detail article cards with compact, linked Coverage rows: source favicon and domain followed by the article headline.
