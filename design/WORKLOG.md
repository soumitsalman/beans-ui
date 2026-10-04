# Beans UI Working Log

## 2026-10-04 — Initial feed skeletons and category navigation

- Reproduced the blank feed during category navigation and the stale Now highlight after the category finished loading in the live browser.
- Home/category client navigation now starts its feed without suspending page rendering, exposing ArticleSection's existing loading skeletons. Server rendering and initial hydration retain the awaited feed snapshot, cursors and error handling.
- Category navigation uses the router's current path for its explicit active state, color, variant and aria-current. NuxtPage keys derive from the incoming page route so category changes remount the appropriate feed independently of Nuxt's deferred useRoute update.
- Verification: focused ESLint, Nuxt typecheck, production build, analytics checks and discovery integration checks passed, including initial home/category SSR content and feed filters. The type checker emitted an existing optional Vue Router editor-plugin resolution warning but exited successfully. The cloud browser denied the local fixture URL, so delayed-load/rapid-navigation browser verification remains pending deployment. graphifyy is unavailable; direct code inspection was used.

## 2026-10-03 — Footer Feedback popup

- Replaced the footer Contact link with a Feedback button using the same Tally form and popup attributes as the header Help improve Beans control. Shared the form ID between both controls; Privacy and Terms remain external links.
- Verification: focused ESLint, Nuxt typecheck, production build, and discovery integration checks passed. Browser inspection confirmed the footer renders a Feedback button with the same form ID as the header; clicking it opened a Tally iframe at `/popup/9q8zrE`. graphifyy remains unavailable; direct component inspection was used.

## 2026-10-03 — Remove article back link

- Removed the Back to news button above the article snapshot on `/articles/{id}`. The article snapshot now starts the loaded detail page.
- Verification: focused ESLint, Nuxt typecheck, and whitespace checks.

## 2026-10-03 — Article-detail tag placement

- Moved region and entity badges below the three-line summary in the article snapshot. If a summary is absent, badges follow the title; if both badge lists are empty, no tag row renders.
- Verification: focused ESLint, Nuxt typecheck, production build, and discovery integration checks passed. Mock-backed article-page DOM inspection confirmed title → summary → region/entity tags → share actions. graphifyy remains unavailable; direct component inspection was used.

## 2026-10-03 — Softer share-action foreground

- Changed the shared Copy and social-action buttons to a #ccc foreground, with a subtle #ddd hover state. The same component supplies the ArticleCard share dialog and the article-detail footer.
- Verification: focused ESLint, Nuxt typecheck, production build, and discovery integration checks passed. Mock-backed browser inspection confirmed `rgb(204, 204, 204)` on Copy and all five social actions in the feed-card dialog, and on the article-detail Copy button. The shared component renders all six detail actions. graphifyy remains unavailable; direct component/data-flow inspection was used.

## 2026-10-03 — Single-day coverage timeline

- Coverage published entirely on one valid UTC calendar day now renders a single centered favicon group and date label, replacing the separate first/middle/last nodes. Publisher icons are deduplicated and capped at five with a remaining-source count; selecting the group opens the existing orbit with every coverage article and source.
- Added `sharedCoverageDate` for full calendar-date comparison, including year. Empty, invalid or missing dates do not collapse. Different days retain the existing responsive chronological timeline; coverage changes reset selection.
- Verification: focused ESLint, Nuxt typecheck, production build, discovery HTTP regressions and whitespace checks pass. Direct date checks cover UTC offsets, midnight/year boundaries, empty/missing/invalid dates and singleton coverage. Mock-backed browser checks confirm one Oct 2 group for 36 articles/seven sources, five icons plus +2, expansion retaining all articles/sources, and no overflow at 320px/1280px (305px/1265px document/scroll widths). A two-day fixture retains first/latest endpoints and responsive middle groups. Reproduce with `BEANS_COVERAGE_FIXTURE=same-day` or `multi-day` before `node scripts/verify-discovery.mjs --serve`. Viewport restored. graphifyy is unavailable; direct component/data-flow inspection was used.

## 2026-10-03 — Direct article-detail sharing

- Removed the snapshot's extra Original reporting/Published paragraph and its date formatter. The compact publisher/date row and original title link remain; supplied credit/publication data remain in structured metadata.
- Added an ArticleCard-style divided footer with six circular Copy, X, LinkedIn, Reddit, Threads and Email actions aligned right. Detail actions share Beans coverage when available, otherwise the attributed original URL. Shared `ArticleShareActions.vue` renders the same controls in existing feed-card modals, which retain their destination chooser.
- Verification: focused ESLint, Nuxt typecheck, production build, discovery HTTP regressions and whitespace checks pass. Browser inspection at 320px confirms all six actions, the divider/right alignment, absent extra attribution sentence and no overflow (305px document/scroll widths). Clipboard access was denied; the selectable correct coverage URL fallback fits and emits no false success event. X produces one coverage-share event. Feed-card modal still switches to the correctly attributed original URL. Viewport restored. graphifyy is unavailable; direct component/data-flow inspection was used.

## 2026-10-03 — Stronger image-summary contrast

- Applied the approved gradient sketch: a separate image-wide gradient is opaque at the bottom, 85% opaque at 35% of image height, and transparent at 70%. Summary text and Markdown links use near-white stone tones through the shared renderer's optional image treatment. The upper image remains visible; summaries retain their two-line limit and position above tags.
- The gradient ignores pointer events so the image link remains usable. Image-free/failed-image cards and article detail retain their normal summary colors. No panel or new image asset was added.
- Verification: focused ESLint, Nuxt typecheck, production build, existing discovery HTTP regressions and whitespace checks pass. Browser inspection at 320px confirms the rendered gradient stops, near-white summary/link colors, two-line 40px summary height, normal fallback colors and no horizontal overflow (305px document/scroll width). Viewport restored. graphifyy is unavailable; direct component inspection was used.

## 2026-10-03 — Two-line card summaries

- ArticleCard renders available, trimmed summary content through the existing MarkdownSummary component, cropped at two lines. With a usable image, the summary overlays a dark gradient above entities/regions. Without an image, it appears below the title and before those tags. Missing summaries leave no empty block.
- Kept the image link separate from the summary overlay so Markdown links do not create nested anchors. Added a mounted image check for failures that occur before SSR hydration attaches error listeners; failed images move the summary and tags into the text layout.
- Updated design/failure criteria and expanded existing mock fixtures with long Markdown summaries, missing summaries and a failed image. Verification: focused ESLint, Nuxt typecheck, production build, HTTP discovery regressions and whitespace checks pass. Browser checks at 320px confirm 40px/two-line cropping of 180px text, correct summary/tag order, no nested links, missing-summary omission and failed-image fallback; document/scroll widths match at 305px. Viewport restored. graphifyy is unavailable; direct component/data-flow inspection was used.

## 2026-10-03 — Remove archives and simplify page headers

- Deleted the archive page/route and removed category archive controls, sitemap/llms entries and the archive-specific page-key behavior. `/archive` now returns 404.
- Removed the Category eyebrow and source-page Back to news button. Added a visible Trending News home heading using the category heading's wrapper and typography. Updated design, audit and verification records to reflect archive removal.
- Verification: lint, Nuxt typecheck, production build, discovery HTTP regressions and `git diff --check` pass. Mock-backed browser checks confirm identical home/category heading classes, no category archive link/eyebrow, no source back button and no horizontal overflow at 320px (305px document/scroll widths). Temporary viewport restored. graphifyy is unavailable; direct source inspection was used. No deployment performed.

## 2026-10-03 — Minimalist news-reader direction

- Removed the home product introduction, example/follow/archive controls and long discovery guide. Now renders news cards and More; descriptive SEO metadata and an accessible heading remain. Now loads five trending articles per batch across all categories using its two-day window, retaining SSR hydration and cursor continuation. Category feeds retain their existing mixed selection.
- Removed Archive, RSS and How it works from the footer. Merged methodology, source/signal limitations, corrections and sharing guidance into About through `HowBeansWorks.vue`. `/methodology` permanently redirects to `/about-beans#how-it-works`; sitemap and llms links reflect the consolidated destination. Existing archive/feed endpoints remain accessible without reader-facing promotions.
- Updated design/data-source guidance, verification expectations and traffic/GEO audit records so home word-count heuristics do not override the minimalist reader experience. No original publisher content or backend API was changed. `graphifyy` remains unavailable; direct component/data-flow inspection was used.
- Verification: lint, typecheck, production build, analytics checks and discovery HTTP regressions pass. Browser checks confirm five initial cards, ten after More, trending-only continuation with no category filter, merged About content, the methodology redirect, simplified footer and no horizontal overflow at 320px. Temporary browser viewport restored after checks.

## 2026-10-03 — Final traffic/GEO verification

- Finished the remaining local code work and verified it against all 26 GEO recommendations: 19 addressed locally, 3 partial because authoritative attribution/identity data is missing, and 4 external editorial/reputation actions. The crosswalk records those boundaries; deployment and a fresh crawl remain necessary.
- Final `pnpm lint`, `pnpm typecheck` and `pnpm build` passed. Analytics checks and the discovery HTTP suite passed against the production build. Final verification-script ESLint and `git diff --check` passed after adding browser request tracing.
- Final mock-backed browser checks confirmed five initial cards without a client feed refetch, ten after More, populated article/source/category routes, 20-to-16 archive pagination, search and methodology navigation, successful copying of both share destinations, preserved publisher parameters/fragments, modal status reset, and one event per copy/social action. Skip activation focuses the main region without adding a page view. Captured growth events omit raw search text and use destination-specific page titles.
- At 320px, inspected routes and the share modal have no horizontal page overflow. Category layout also fits 768px and 1280px (document/scroll widths 753/753 and 1265/1265). Restored the browser viewport and stopped temporary fixture servers after verification.
- Web Vitals LCP/CLS events were observed locally. Automated/background browser timings are not a reliable field baseline, and real-user INP, traffic, indexing, seven-day returns and a new GEO score remain unmeasured. No deployment or external publication was performed. See `VERIFICATIONS.md` and `GEO-AUDIT-VERIFICATION.md` for evidence and release gates.

## 2026-10-02 — Traffic implementation and GEO remediation

- Implemented the code audit: preferred Beans origin and Fly-host redirect; SSR initial feeds/details with hydrated cursors and deferred enrichment; route metadata/JSON-LD; confirmed 404/410 vs retryable 503; search noindex; dynamic sitemap, crawlable archive and RSS; coverage/original sharing; methodology and home positioning; privacy-conscious growth events and Web Vitals collection.
- Completion audit found and fixed missing component imports in archive/detail sharing, an over-specific escaped-title test, a Node fetch Host-header test limitation, and navigation telemetry that could miss views or carry the previous title. Pageview tracking now waits for the destination's metadata, deduplicates route/query navigation and ignores fragment-only changes. Publisher events use explicit original-reporting links.
- Read all GEO recommendations and visually checked the action-list pages. Added HTTPS/security headers, public HTML ETag revalidation, private/no-store search/error responses, a 30-second public presentation-feed cache, keyboard skip navigation, responsive WebP logo assets, reserved article-image space, supplied original author attribution and publication citations, verified Cafecito policy/contact/team links, and substantive home guidance. Upstream Beans/Espresso APIs and backend services were not modified.
- Original header PNG: 1,139,566 bytes. New 24/48/72px WebP variants: 174/466/832 bytes. The fixture warm home response measured 36.1 ms with no upstream feed requests; this is a local mechanism check, not a field performance claim.
- Added `design/GEO-AUDIT-VERIFICATION.md`, mapping all 26 recommendations to implementations, evidence and external dependencies. Do not fabricate missing author biographies, modification dates, public profiles, testimonials, certifications, original research or backlinks. Verified current official contact, privacy and terms pages over HTTP; the policies explicitly cover Beans.
- Verification so far: production build, lint, typecheck, analytics unit checks, and expanded fixture HTTP checks pass. HTTP checks cover rendered content, metadata/schema, error statuses, archive pagination, sitemap/RSS, preferred-origin redirects, security headers, ETag/304, cache isolation, image dimensions and home content. Browser checks confirmed mobile layouts, feed continuation without duplicate initial requests, source/category/article navigation, both share destinations and clipboard-denied fallback. Final browser/performance evidence is recorded in `VERIFICATIONS.md` after the final build.
- `graphifyy` was requested but is not installed and no graph was available; direct code/data-flow inspection was used. No deployment or external publication was performed. Field Web Vitals, indexing changes, return rates and GEO rescore require a deployed site and observation period.

## 2026-10-02 — Discoverability and traffic audit

- Audited https://beans.cafecito.tech through live browser inspection, initial HTML/HTTP checks and local Nuxt code review. Split the prioritized action list into `design/TRAFFIC-AUDIT-CODE.md` and `design/TRAFFIC-AUDIT-NON-CODE.md`; no application or backend implementation was requested or performed.
- Confirmed the Fly-domain canonical/sitemap configuration, missing initial news/story/source content, generic social previews, publisher-only share URLs, nine static sitemap entries, button-only pagination and an HTTP 200 response for an all-zero article ID. Flagged one apparently unrelated coverage item and count-definition differences for human review.
- Documented success checks, sequencing, growth metrics and evidence limits; consulted official Google Search guidance. Search Console/GA reports and Core Web Vitals were not accessed, so current traffic/indexing/performance remain unmeasured. graphifyy/graphify and graph artifacts were unavailable; direct inspection traced the relevant code.
- Files: `design/TRAFFIC-AUDIT-CODE.md`, `design/TRAFFIC-AUDIT-NON-CODE.md`, `design/WORKLOG.md`. Verification: browser and HTTP evidence; documentation review; `git diff --check`. No build/test run required for this documentation-only audit.

## 2026-10-02 — Selected coverage source orbit

- Replaced the selected multi-source cluster's vertical timeline on `/articles/{id}` with source favicons arranged around its article count, following `avatar-circle-samples/open-orbit.svg` and `avatar-wreath.svg` in the existing dark coffee theme.
- Up to eight articles use the open orbit; larger clusters use a wreath. Repeated publishers share one avatar while contributing to the center article total. Above twelve unique sources, previous/next controls page through every source and reset when changing groups or reopening. Source links, tooltips, and favicon/system fallbacks remain available.
- Files: `app/components/news/ArticleDetailSections.vue`, `app/components/news/CoverageSourceOrbit.vue`, `app/types/coverage.ts`, `app/utils/coverageOrbit.ts`, and coverage guidance in DESIGN/VERIFICATIONS. Existing coverage chips, first/last events, Related, and API fetching remain unchanged.
- Verification: focused ESLint, Nuxt typecheck, and production build passed with home API prerender disabled. Mock-backed browser checks covered an eight-article open orbit, a 331-article/25-source wreath, all source pages, final-page disabled navigation, close/reopen reset, cluster switching, fallback icons, and no page overflow at 320px/768px/1280px. Live API coverage was not checked. Graphify query was attempted but this checkout has no graph file; direct component inspection traced the implementation.

## 2026-10-02 — Search source placeholder

- Changed the Sources example to `bbc, apnews`, matching values returned by the live `/articles/search` domain filter. The API returned articles for `domains=bbc` and `domains=apnews`, and none for `domains=bbc.co.uk`, `domains=bbc.com`, or a full BBC URL in the checked requests.
- Files: `app/pages/search.vue`, `design/DATASOURCES.md`.

## 2026-10-02 — Source feed empty-result fallback

- Updated `/sources/{id}` (the checkout has no `/stories/{id}` page) to fetch English news first; empty API data retries without content type, then without language if still empty. Stops at the first non-empty response, retains source/sort/limit/cursor, and preserves the existing error/retry behavior and source-ID validation.
- Replaced Latest news with a Nuxt USeparator above the source feed.
- Files: `app/composables/useBeansApi.ts`, `app/pages/sources/[id].vue`, and source guidance in DATASOURCES/DESIGN/VERIFICATIONS.
- Verification: mocked API checks passed for all three fallback stages, early stopping, all-empty results, initial/fallback errors, source and cursor retention, final response cursor, and parameter immutability. Focused ESLint and Nuxt typecheck passed. Browser layout and live API behavior were not verified; the proxy smoke attempt could not connect because no local server was running. Graphify query was unavailable because this checkout has no graph.

Code snapshot SHA-256: `180bc786b4be3c6313912449258f91b15011ed2e75b26908e21a9574ed91347e`

Hash inputs: 50 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-02 — Search discovery form

- Replaced Discovery with Discover News; removed the introductory heading/description and result-limit note.
- Made Topic full width with “What do you want to find”; changed Tags to comma-separated text and added comma-separated Sources with example news domains.
- Tags/Sources stack below md and use two columns at md and wider. Sources persist in URLs and map to the existing search API `domains` filter, including domain-only searches, pagination, and retry.
- Files: `app/pages/search.vue`, `app/utils/searchQuery.ts`, `app/composables/useSearchFeed.ts`, and search guidance in DESIGN/DATASOURCES/VERIFICATIONS.
- Verification: focused ESLint, Nuxt typecheck, production build, and direct comma-list normalization/URL round-trip assertions passed. Browser layout and live domain-filtered results were not verified. Used installed binaries because pnpm's package-manager bootstrap failed on its cache database.

## 2026-10-01 — Default Nuxt avatar groups

- Removed visual overrides from both UAvatarGroup instances: other-publisher favicons in shared article cards and favicon samples in article coverage. Kept their existing maximum counts.
- Files: `app/components/news/ArticleCard.vue`, `app/components/news/ArticleDetailSections.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.
- Verification: focused ESLint passes. Browser inspection shows Nuxt's default 32px avatars, 6px overlap, and ring on the Daily Post Nigeria source card and multi-source coverage groups. The source and article pages have 305px document width at a 320px viewport.

Code snapshot SHA-256: `9bd39d8396c064d821369208b2c107052eebb6a8e1ec2cb09fe739367d500ac1`

Hash inputs: 50 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01 — Category umbrella update

- Merged the Security & Defense category values into World & Politics, now labeled `World & Politics` with slug `world-and-politics`.
- Moved rights, inclusion, identity, LGBTQ, migration, accessibility, and civil rights/society values from World & Politics to Culture & Lifestyle. Updated the design map and acceptance criteria to reflect the category assignments.
- Files: `app/settings/categories.ts`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.

## 2026-10-01 — Shared card avatar overlap on source feeds

- Increased the shared article-card UAvatarGroup overlap to half of each 32px favicon, making two-icon source groups visibly stacked. This component serves home, category, source, and search feeds.
- Files: `app/components/news/ArticleCard.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.
- Verification: focused ESLint passes. The reported Daily Post Nigeria source card shows two 32px other-source avatars 16px apart in a 48px-wide group. Its 320px viewport has a 305px document width.

Code snapshot SHA-256: `09221c6d87a7e3ef79ae02fef20428984627d6f0eb48a99cb8a842751bfb1109`

Hash inputs: 50 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01 — Card publisher avatar overlap

- Increased the other-publisher UAvatarGroup to 32px avatars with 12px overlap and contrasting rings. Removed the child size override so the Nuxt group controls avatar size consistently. Publisher source links remain individually accessible.
- Files: `app/components/news/ArticleCard.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.
- Verification: focused ESLint passes. Browser inspection confirms five loaded overlapping favicon links and a 112px group width. At 320px, the document width is 305px.

Code snapshot SHA-256: `160ece60dd4e7180d863e1081fc5ca9bfd6139be0e83ec33a67bd5d14340f37b`

Hash inputs: 50 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01 — Share and coverage refinement

- Removed the share modal description and distinguished its trigger with a separate neutral soft circular control to the right of social counts. Restored small L/R characters beside ideology arrows and removed the Espresso signal tooltip suffix.
- Flattened card publisher links into direct Nuxt UAvatarGroup children for consistent overlap and maximum handling.
- Coverage groups now count unique source identities; single-source groups show a plain favicon/date. Multi-source groups open a bounded chronological source/favicon timeline without article titles. Related items reuse the card source/date component with separate source and publisher links.
- Files: `app/components/news/ArticleCard.vue`, `ArticleShareModal.vue`, `ArticleSignals.vue`, `StoryConfidenceBadge.vue`, `ArticleDetailSections.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.
- Verification: focused ESLint and production build pass; Nuxt typecheck exits successfully with the existing missing Vue Router language-plugin warning. Browser checks verify multi-source expansion, plain single-source nodes, source/date related rows, restored R label, description-free modal, and separate share action. Avatar links measure 28px and overlap by 6px. At 320px, the six-article story has 305px document width. External share submission and clipboard failure were not exercised.

Code snapshot SHA-256: `a806012142568032d3c1994b980f63cede849c823a653f2aec0fd8035afa7e42`

Hash inputs: 50 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01 — Article UI corrections

- Put the source name and publish date on one row in a shared card/page component: prominent source name, muted caption date. Standardized confidence, ideology, and trend icons to 14px; ideology now uses its arrow icon with a tooltip.
- Replaced share options with one row of six 32px circular icon controls: Copy, X, LinkedIn, Reddit, Threads, Email. Added accessible labels/tooltips; the footer share trigger is icon-only and matches the 12px primary-colored social icons. Preserved the attributed canonical publisher URL and copy failure fallback.
- Restored the source favicon overlap above the card edge without a separate banner. Updated design and verification contracts.
- Files: `app/components/news/ArticleSourceLine.vue`, `ArticleCard.vue`, `ArticleSnapshot.vue`, `ArticleSignals.vue`, `StoryConfidenceBadge.vue`, `ArticleShareModal.vue`, `app/pages/sources/[id].vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.
- Verification: focused ESLint and production build pass. Nuxt typecheck exits successfully with a missing Vue Router language-plugin warning. Browser inspection confirms desktop and 320px card/page layouts, accessible share destinations, six 32px share controls, and source favicon overlap. Mobile source/article document width is 305px at a 320px viewport; source avatar extends 39px above its card. Clipboard failure and external share submission were not exercised. Used installed Node binaries after the pnpm launcher attempted an unavailable store/network operation.

Code snapshot SHA-256: `ee90e95fe8ef34fae5cdb5b367d90c4f3c53d3a1e8670c1705e174fc5510c9c0`

Hash inputs: 50 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01

- Reorganized article card and snapshot metadata/signals, added a publisher-link share modal with forced Beans attribution, raised card publisher favicons to five, and removed the source profile banner. Updated the UI and data-source contracts.
- Files: `app/components/news/ArticleCard.vue`, `app/components/news/ArticleSignals.vue`, `app/components/news/ArticleShareModal.vue`, `app/components/news/ArticleSnapshot.vue`, `app/components/news/ArticleTrendCounts.vue`, `app/components/news/ArticleSection.vue`, `app/composables/useArticleEnrichment.ts`, `app/pages/index.vue`, `app/pages/categories/[category_slug].vue`, `app/pages/sources/[id].vue`, `app/utils/outboundUrl.ts`, `design/DESIGN.md`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.
- Verification: focused ESLint, Nuxt typecheck, and production build pass. Browser inspection confirmed the desktop card, article title link, share options, and banner-free source header. URL utility check confirmed UTM replacement, preservation of other query data and fragments, and invalid URL rejection. A 320px viewport and clipboard failure were not verified in this environment.

Code snapshot SHA-256: `248497a0f928e9851c8c71efed12ce4215f7143e8129906ab6817471b2c4263d`

Hash inputs: 49 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01

- Added `en` to the English language query list, ahead of the 20 locale and alias values. Updated the data-source list and the verification guard for this omission. Earlier direct API and app-proxy comparisons showed results with `en` and empty lists without it.
- Files: `app/composables/useBeansApi.ts`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.
- Verification: the configured array exactly matches the requested 21 values; ESLint on `useBeansApi.ts` and Nuxt typecheck pass.

Code snapshot SHA-256: `b31582efaec507d8ea0e25af923b69e3deda3365ce53377454936d64d570c384`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01

- Beans API list-valued filters now remain arrays during query serialization, producing repeated query keys instead of comma-containing single values. English languages are passed as an array; tags, sources, domains, categories, regions, entities, and exclusion IDs use the same multivalue encoding. Updated the data-source contract accordingly.
- Files: `app/composables/useBeansApi.ts`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.
- Verification: checked the installed `ufo` query serializer emits one key per array item; ESLint on `useBeansApi.ts` and Nuxt typecheck pass.

Code snapshot SHA-256: `a225043244f8850b86f51a2aae1e4949cfd5cca042fdd073fe5f3cc5423e75f4`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01

- Corrected the English `languages` query value: requests now send the API locale strings (`en-ae` through `en-za`, plus `english`) instead of numeric IDs. Updated the data-source language list and verification wording accordingly.
- Files: `app/composables/useBeansApi.ts`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.
- Verification: ESLint on `useBeansApi.ts` and Nuxt typecheck pass.

Code snapshot SHA-256: `8e5ce1908a60fe0d8850f6d7c164e10e7b94b5eddd8344967da3d2100b57c4ca`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01

- Article Coverage, Related, and publisher avatars now all use `/private/stories/{story_id}/articles`; Coverage pages 100 at a time, Related pages five at a time with English languages, and avatars make one 50-item request for up to three other source IDs. Source-page latest news now uses `/private/articles/unique` with `sources={id}` and `sort=recent`.
- Files: `app/composables/useBeansApi.ts`, `app/pages/articles/[id].vue`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.
- Verification: ESLint on changed implementation files and Nuxt typecheck pass. Live API behavior was not rechecked.

Code snapshot SHA-256: `ee148f7457ab33485522e4004d3db53663d3930ab78008d662e05846633f48ec`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01

- Article detail Coverage now pages `/private/stories/{story_id}/articles` at 100 items, while Related retains its five-item `/private/articles/{article_id}/similar` feed. Feed-card source avatars make one 50-item story-articles request and select up to three unique sources, excluding the card article's source; no avatar cursor follow-up is made.
- Files: `app/composables/useBeansApi.ts`, `app/composables/useArticleEnrichment.ts`, `app/pages/articles/[id].vue`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.
- Verification: ESLint on changed implementation files and Nuxt typecheck pass. Live API behavior was not rechecked.

Code snapshot SHA-256: `088dd83fd04f0c7cd7b1ba987bf13c552d1e2057a4629681912de2ea2721160a`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-10-01

- Source-page article requests now use `sources={route ID}` regardless of the source metadata domain. News requests use the full English language ID CSV (`30`–`49`) instead of `languages=en`; the data source contract lists each ID and language value. Updated source-feed verification criteria and retained the earlier live proxy result as historical, since the revised request has not been rechecked live.
- Files: `app/composables/useBeansApi.ts`, `app/composables/useNewsFeed.ts`, `app/pages/sources/[id].vue`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.
- Verification: ESLint on the three changed implementation files and Nuxt typecheck pass. `pnpm` wrapper could not open its SQLite store, so the checked-in local binaries were run directly. Live API behavior was not rechecked.

Code snapshot SHA-256: `f622ff78711e69812087dfb4364ca885c41679819427ceb61bbbfc34813d894a`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30T23:05:00Z

- Added a subtle `gap-1` between the article title and its confidence/ideology indicators, and between the indicators when both appear.
- Files: `app/components/news/ArticleCard.vue`, `design/VERIFICATIONS.md`.
- Verification: ESLint on `ArticleCard.vue`, Nuxt typecheck, and `git diff --check` pass.

## 2026-09-30

- Article detail Coverage similar-article requests omit `languages` and `content_type`; Related requests omit `content_type` and retain `languages`. All other similar-article callers and data pulls retain their existing filters.
- Files: `app/composables/useBeansApi.ts`, `app/pages/articles/[id].vue`, `design/VERIFICATIONS.md`.

## 2026-09-30T22:47:33Z

- Replaced the confidence text badge with a low/medium/high signal-strength icon in the existing error/warning/success colors. Replaced ideology text with blue `← L` or red `→ R`, and removed visible trend labels while keeping their existing icons. Tooltips expose the full confidence, ideology, and trend labels on hover and keyboard focus; the indicators have no badge fill or outline.
- Applied icon-only trend treatment to both article cards and the article snapshot.
- Files: `app/components/news/StoryConfidenceBadge.vue`, `app/components/news/ArticleCard.vue`, `app/components/news/ArticleSnapshot.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`, `design/WORKLOG.md`.
- Verification: ESLint on all three changed Vue components, Nuxt typecheck, production build, and `git diff --check` pass.

Code snapshot SHA-256: `0a406633ad8350f8a7e1050f109d7512ad2e1981762f09cdf5f0a9dfe782d9cb`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30T22:27:45Z

- Added the existing entity and region tag badges below article titles when a card has no image or its image fails. Cards with a usable image keep the tags overlaid at the image bottom; each card still caps at two regions and two entities.
- Files: `app/components/news/ArticleCard.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`, `design/WORKLOG.md`.
- Verification: ESLint on `ArticleCard.vue`, Nuxt typecheck, production build, and `git diff --check` pass.

Code snapshot SHA-256: `9a077ffc8c661b5e317f6fe1471245d2933ab658cbdea393f812fb546aa06b22`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30T22:19:18Z

- Moved the related article total from its standalone text label into the shared trend-count row. It now appears as a files icon followed by a compact count beside positive mentions, comments, and likes; zero and missing values stay hidden.
- Files: `app/components/news/ArticleCard.vue`, `app/components/news/ArticleTrendCounts.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`, `design/WORKLOG.md`.
- Verification: ESLint on both changed Vue components, Nuxt typecheck, and `git diff --check` pass.

Code snapshot SHA-256: `36456eafaa7bf7bac1f017a139eabd3cc8cfdea3727897e9b630f0d8023b5fb8`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30T22:04:00Z

- Replaced the overflowing Coverage favicon pile with a compact chronological rail. First and last articles remain visible; middle articles are partitioned into one, up to three, or up to five selectable date-range groups at small, medium, and extra-large widths. Each group shows at most one, two, or three distinct publisher icons and its article count.
- Opening a group shows every article in a height-limited list with publisher, time, and outbound link. The Related feed and its cursor behavior remain unchanged.
- Files: `app/components/news/ArticleDetailSections.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`, `design/WORKLOG.md`.
- Verification: ESLint on the component, Nuxt typecheck, production build, and `git diff --check` pass. A browser viewport inspection was unavailable in this environment, so the 320px visual acceptance scenario remains to be checked in a branch preview.

Code snapshot SHA-256: `c65d504139b1ec8e3bbeecd09e3f9d360c8a0eca5018275804ad1b062fb52522`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30T21:13:24Z

- Removed fixed left margins from the confidence and ideology badges appended to card titles. Inline text spacing still separates badges on the same line; a badge wrapping onto another line now starts flush with the title.
- Files: `app/components/news/ArticleCard.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.
- Verification: At 320px, the second home card's wrapped ideology badge and title both start at x=31px, with no horizontal page overflow. ESLint on the card and Nuxt typecheck pass.

Code snapshot SHA-256: `976cbe5cc61d5a4b67c2b2f7ad24b03d4f0cd45a8dc7910a8d5f9cac9984b14f`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30T21:11:33Z

- Moved the confidence badge from the category row to the title, before ideology. Matched the ideology badge to confidence's `sm` size, fully rounded shape, and padding while retaining its colored outline. Empty or missing confidence/ideology values leave no badge.
- Files: `app/components/news/ArticleCard.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.
- Verification: ESLint on the card and Nuxt typecheck pass. Browser checks showed ideology appended after the title, no blank confidence badge on cards without confidence, and no overflow at 320px. The live cards checked had no confidence value, so the two-badge state was checked in component structure and matching classes.

Code snapshot SHA-256: `1b52ac03ce6e29cde868abcbd9da7d402358645b34bb23b78fef7afc290f89f5`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30T21:06:11Z

- Moved the existing outlined `Leans Left`/`Leans Right` badge from the category row to immediately after the article title in the shared card. Kept the title link separate and added a text-space separator for readable heading text.
- Files: `app/components/news/ArticleCard.vue`, `design/DESIGN.md`, `design/VERIFICATIONS.md`.
- Verification: ESLint and Nuxt typecheck pass. Browser inspection on home at desktop and 320px shows the badge after the title, including a wrapped title, with no horizontal overflow.

Code snapshot SHA-256: `f2c53231b8887b06e8791a7736dce4cca9993e0a42c5259ba5cd49db5ef4ff49`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30T21:03:45Z

- Show the feed-card related article count only when `trend.related` is positive. Keep the existing other-publisher favicon group without an `Other sources` label, and keep positive social counts visible even when the related count is zero. Hide the footer when all three are absent.
- Files: `app/components/news/ArticleCard.vue`, `design/DESIGN.md`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.
- Verification: ESLint on the card and Nuxt typecheck pass. Browser inspection of five home cards showed no `0 articles`, positive related counts still visible, and publisher avatars retained.

Code snapshot SHA-256: `3ec5e14ea5d2bba1fecc2dc229dff154c8d0b59283843b4ced84acf4c7fef609`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30T20:52:09Z

- Removed the `Other publishers` card label. Home and category cards now show the trend icon beside publish time. Ideology moved beside category as an outlined blue/red `Leans Left`/`Leans Right` badge. Added the missing trend-count component import used by the shared card.
- Source pages now place a larger circular favicon across a header banner and display a link icon plus the source URL without `http(s)://`; the outbound destination still uses the normalized complete URL.
- Fixed empty source news panels: the live Beans API returned zero for known BBC and PsyPost source UUID filters but five matching articles with a cursor for each source's `domain`. The UI now loads metadata first, requests latest news by that domain, and accepts only rows matching the route source ID. Source-ID filtering remains the fallback when metadata has no domain.
- Files: `app/components/news/ArticleCard.vue`, `ArticleSection.vue`, `app/pages/index.vue`, `app/pages/categories/[category_slug].vue`, `app/pages/sources/[id].vue`, `app/composables/useBeansApi.ts`, `useNewsFeed.ts`, and design documents.
- Verification: live proxy requests confirmed the source-filter discrepancy and domain workaround. Browser inspection showed five BBC news cards with More, the profile-style favicon, scheme-free URL, and home card metadata placement. At 320px, home and source pages had no horizontal overflow. Nuxt typecheck, production build, and ESLint on changed files pass. Whole-app ESLint still reports only the existing quote-style error at `app/composables/useGoogleAnalytics.ts:31`.

Code snapshot SHA-256: `92fa59dac722686f4a350dd9bee688fbbb9b3ff572f0ca2d5109358c78fd8697`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30T20:29:11Z

- Replaced the home and category carousel/grid with a single five-article vertical feed using a 1:4 trending/latest mix, cross-feed exclusions, independent cursors, de-duplication, and exhausted-stream fill. Search now uses the same article card. Added publisher source pages and article detail routes; removed the story route.
- Added batch Espresso confidence and similar-article enrichment, the five-distinct-publisher card stack, source-filtered latest feeds, article Coverage and Related sections, and source URL normalization for API values without a scheme.
- Preserved the two-day/seven-day feed windows, English/news filters, category and search contracts, story-ID navigation gate, referral parameters, and same-origin proxies. No backend changes.
- Files: `app/`, `shared/types/telemetry.ts`, `design/DESIGN.md`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.
- Verification: Nuxt typecheck and production build pass; ESLint passes on changed implementation files. Whole-app ESLint has one existing error at `app/composables/useGoogleAnalytics.ts:31`. Proxy checks confirmed unique feeds, populated `exclude_ids`, batch confidence, similar articles, source detail, and source-filtered latest responses; empty `exclude_ids=` is rejected and omitted. Route smoke checks returned 200 for home/category/search/article/source and 404 for the removed story route. At 320px, the category card stacked vertically; article detail showed its linked image, Coverage timeline, and Related rows. Source detail now links a bare source URL to HTTPS. The selected source feed returned no current articles, so live card rendering there remains unverified.

Code snapshot SHA-256: `328316d63915699a3f377b413e7563b7bd96cd028d27c689f1606b3060480056`

Hash inputs: 47 application/configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; Vue/TypeScript/CSS files plus both configuration files, hashed as path + NUL + file bytes + NUL in lexical path order.

## 2026-09-30

- Appended the 24 broad category ids from `classifications.yaml` onto the existing eight groups, stored in the snake_case form the classifier writes. Every previous category value stays in its group so older articles still match.
- Guard: each new id appears once. Group slugs are unchanged. Agriculture sits with Climate & Energy; law and public safety sit with World, Politics & Society.
- Moved cybersecurity and data-protection values into Tech & Innovation: threat intelligence, privacy engineering, network security, identity and access, digital forensics, and `cybersecurity_and_privacy`. Security & Defense keeps military, homeland safety, and weaponry.
- Moved `education_and_humanities` into World, Politics & Society.
- Files: `app/settings/categories.ts`, `design/DESIGN.md`.
- Verification: ESLint on `categories.ts` passes. Browser: the eight tabs are unchanged. Climate & Energy shows the agriculture and Earth description. Culture & Lifestyle shows the arts, food, and home description. Tech & Innovation and Security & Defense still render trending stories.

Code snapshot SHA-256: `5d9858c7bc39181082493a096d0bba61bd95742caac3de6d4f8dc4f1565b3172`

Hash inputs: 45 application and configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-17

- Updated the eight category groups to match `classifications.yaml`: added snake_case `sports_and_athletics` and `television_and_streaming` under Culture & Lifestyle, and corrected Science & Health `nanotechnology_and_nanomataterials` to `nanotechnology_and_nanomaterials`.
- Guard: all 121 yaml category IDs map once, in snake_case; group slugs are unchanged. Culture feeds send the new values; Science feeds send the corrected nanomaterials value.
- Files: `app/settings/categories.ts`, `design/DESIGN.md`.
- Verification: Nuxt typecheck and production build pass. ESLint on `categories.ts` passes; `corepack pnpm lint` remains blocked by the existing unused `appendPropagationArticles` in `app/pages/stories/[story_id].vue`. Browser: home still shows Now plus the eight groups; Culture & Lifestyle requests include `sports_and_athletics` and `television_and_streaming` and render sports stories; Science & Health requests include `nanotechnology_and_nanomaterials` (not the old typo) and render health/research stories.

Code snapshot SHA-256: `2af7b06af72bd9aaaa9e1cd478864b3c29b5ab08c461eb7200eb518d08481275`

Hash inputs: 45 application and configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-16

- Replaced the header Contact external link with the Help improve Beans Tally popup (form `9q8zrE`). The Tally widget is loaded once in the application shell and the header button uses Tallys popup data attributes.
- Verification: Tallys published popup embed contract specifies the `9q8zrE` data attributes; ESLint passes for `app/layouts/default.vue`.

Code snapshot SHA-256: `f67dc6a4cb68280ff6ab01f53b341d6478c09a600c4572d05b756657370e98c6`

Hash inputs: 45 application and configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-13

- Fixed Google Analytics 4 so the official `gtag.js` snippet is in SSR `<head>`: async `https://www.googletagmanager.com/gtag/js?id=G-KPG0Y2MBV9` plus inline `dataLayer.push(arguments)` init. The previous client stub pushed rest-parameter arrays and could overwrite `window.gtag` after `gtag.js` loaded, so `config` never reached GA4.
- Guard: `gtag('config')` still uses `send_page_view: false`; the router hook sends one sanitized `page_view` per path. Query strings stay off `page_path` / `page_location`. The measurement ID remains public runtime config (`NUXT_PUBLIC_GA_MEASUREMENT_ID`).
- Browser: SSR HTML for `/` contained both Google tag scripts in `<head>`. Home, `/categories/tech-and-innovation`, `/search?q=secret-query`, and an in-app navigation to `/about-beans` each queued a `page_view` for `G-KPG0Y2MBV9` as gtag `arguments` objects (not arrays); `gtag.js` stamped them with `gtm.uniqueEventId`. Search location was `/search` with no query.
- Verification: Nuxt typecheck passes.

Code snapshot SHA-256: `e61f01547d34314e648c81c54810803b8073ee380cf60d36d6d5c1a20688383d`

Hash inputs: 45 application and configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-11

- Story cards now show `Hot` beside the fire trend icon and `Trending` beside the trending-up icon; other trend icons remain unlabeled. The trend-score and Espresso-confidence indicators share the right-aligned metadata group in compressed, snapshot, and detailed cards.
- Espresso confidence badges now read `High Confidence`, `Moderate Confidence`, or `Low Confidence`; their tooltip identifies the value as an Espresso signal.
- Verification: Nuxt typecheck and production build pass. `corepack pnpm lint` remains blocked by the existing unused `appendPropagationArticles` function in `app/pages/stories/[story_id].vue`.

Code snapshot SHA-256: `da7b06fa3bcea017f784fef78033613451b080e3402e96ae9a905f39ebb3ad4b`

Hash inputs: application and configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-10

- Feed story cards now use the story ID from each Top Headlines and Latest News article to load `/private/stories/{id}/propagation`, supplying the complete source preview set used by the avatar group. The private story response supplies the authoritative `articles_count` and `sources_count`; story-less articles keep their existing fallback.
- Verification: existing route enrichment remains covered by lint and typecheck.

## 2026-09-10

- Story detail Propagation now loads all source publication previews from `/private/stories/{id}/propagation` in one request; Coverage continues using `/stories/{id}/articles`.
- Verification: ESLint and Nuxt typecheck pass.

## 2026-09-10

- Story detail now renders the story API `sources_count` and `articles_count` as Propagation header counts; Coverage no longer displays an article count label.
- Verification: ESLint and Nuxt typecheck pass.

## 2026-09-10T19:01:18Z

- Switched Top Headlines and Latest News to `/private/articles/unique`: English news with `sort=trend` over two days and `sort=recent` over seven days. Removed client story/article deduplication and headline limit expansion; both feeds use independent cursors, fetch 20, and reveal five items at a time with stable time windows.
- Removed feed article-detail trend and similar-article requests. Feed trends remain authoritative; private story detail supplies counts and unpaginated private propagation supplies all source previews. Plural and singular API count names normalize to the UI fields; authoritative zero counts are preserved. Existing Espresso confidence enrichment remains.
- Updated feed routing and verification documentation. Files: `app/composables/useBeansApi.ts`, `app/composables/useNewsFeed.ts`, `app/types/news.ts`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.
- Verification: ESLint, Nuxt typecheck, production build, and temporary fixture checks passed for request routes/filters/time windows, five-item reveals, independent cursor continuation, repeated-cursor termination, complete source enrichment, counts, trend preservation, story-less items, and enrichment failure fallback. Build reports Browserslist age and plugin sourcemap warnings. Live API and browser checks were not run.

Code snapshot SHA-256: `4076e5ccb56410e154a89e9a8cac40555e581e053822cc4f859bad9a91349ee6`

Hash inputs: 45 application and configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-10

- Documented the selected Espresso confidence treatment: end-aligned metadata badges labelled only `High`, `Medium`, or `Low`, with an Espresso-signal tooltip and omission for null, missing, or unavailable data. The data chain is `/events/{event_id}/signals` → `/signals/{first_signal_id}` → `data.confidence`.
- Moved story count ownership in the design: the story metadata row has no article/source counts; Coverage owns `N articles` and Propagation owns `N sources`.
- Files: `design/DESIGN.md`, `design/DATASOURCES.md`, `design/VERIFICATIONS.md`.

## 2026-09-09T13:55:41Z

- Replaced Search publisher-source lookup with a two-line query/tags form. Line 1 is the semantic `q` input. Line 2 is `UInputTags` (Space/comma/paste commits a tag; backspace on an empty field removes the last tag).
- Guard: `/articles/search` sends `q` and CSV `tags` only. `sources` is omitted, including leftover `/search?sources=` URLs which are rewritten to `q`/`tags`. `score_threshold=0` is sent only when `q` is non-empty; empty tags omit `tags`. Duplicate/display labels are normalized (lowercase, spaces → `_`).
- Firefox/WebDriver: empty submit explains a topic or tag is required; Space creates tags; results load; tags-only omits `score_threshold` and `sources`; clearing tags drops `tags` from the URL and request; `/search?q=battery&tags=startups&sources=dead-source` hydrates the form and strips `sources`.
- Files: `app/pages/search.vue`, `app/composables/useSearchFeed.ts`, `app/utils/formatters.ts`, `app/utils/searchQuery.ts`, `design/DATASOURCES.md`, `design/DESIGN.md`, `design/VERIFICATIONS.md`, `README.md`.

Code snapshot SHA-256: `b38cd06f5c57169a37ddb56a665f5d6252f5b1e41b2c920d349fbf25fa1d498c`

Hash inputs: 44 application and configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-09T13:53:25Z

- Added a centralized outbound referral helper so every user-facing link to another site appends `utm_source=beans.cafecito.tech` and `utm_medium=referral`.
- Guard: relative/internal routes, same-origin hosts (`beans.cafecito.tech` and `NUXT_PUBLIC_SITE_URL`), mailto/tel/javascript, empty hrefs, and malformed URLs are left unchanged. Existing query strings, hashes, and present UTM values are preserved.
- Wired the helper through story-less article cards, Coverage rows, markdown summary links, header API/Contact, footer Cafecito/Publications/API/Github, and About Beans CTAs.
- SSR on `/`, `/about-beans`, and `/search` showed those chrome/CTA hrefs with the referral params and left `/`, `/search`, `/about-beans`, and `/categories/*` untouched. Canonical URLs stayed without UTM. Live article/coverage URLs rewritten by the helper kept their paths and gained the params.
- Verification: helper cases, markdown link rewrite, ESLint, Nuxt typecheck, and production build pass.

Code snapshot SHA-256: `b38cd06f5c57169a37ddb56a665f5d6252f5b1e41b2c920d349fbf25fa1d498c`

Hash inputs: 44 application and configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

## 2026-09-09T13:39:12Z

- Added Google Analytics 4 (`gtag.js`, `G-KPG0Y2MBV9`) so every client route visit, including SPA navigations, records a `page_view`.
- Guard: `gtag('config')` does not send a page view; the router hook sends one event per path. Page path and location omit query strings so search text is not sent. The measurement ID is public runtime config (`NUXT_PUBLIC_GA_MEASUREMENT_ID`).
- Browser: home, `/categories/tech-and-innovation`, `/about-beans`, `/search?q=secret-query`, and a story route each queued a `page_view` for `G-KPG0Y2MBV9`. The Search location was `/search` with no query. `gtag.js` loaded from googletagmanager.com.
- Verification: ESLint, Nuxt typecheck, and production build pass.

Code snapshot SHA-256: `395fda6597aee9eab5205d23d7c47b47ed52d3766527cb7f673103dddf4e7d89`

Hash inputs: 41 application and configuration files under `app/`, `server/`, `shared/`, `nuxt.config.ts`, and `eslint.config.mjs`; paths and file bytes are hashed in lexical path order.

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

## 2026-09-10

- Implemented non-blocking Espresso confidence enrichment for story feeds and the story detail route. A shared end-aligned badge renders only valid `High`, `Medium`, or `Low` values, with its meaning available through a tooltip.
- Moved count presentation from the detailed story card into the story timeline: Coverage now displays `N articles` and Propagation displays `N sources`, both end aligned.
- Files: `app/composables/useBeansApi.ts`, `app/composables/useNewsFeed.ts`, `app/components/news/StoryConfidenceBadge.vue`, `app/components/news/StoryCard.vue`, `app/components/news/StoryTimeline.vue`, `app/pages/stories/[story_id].vue`, `app/types/news.ts`.
