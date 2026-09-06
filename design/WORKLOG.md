# Beans UI Working Log

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
