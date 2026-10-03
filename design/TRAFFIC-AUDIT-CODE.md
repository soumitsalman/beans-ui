# Beans discoverability and traffic audit — code work

Current direction (2026-10-03): the archive page/route is removed, along with category, sitemap and llms references. Prior archive implementation notes below are historical; current discovery relies on news/category/source links and the dynamic sitemap. Now has a visible Trending News heading; category eyebrows and source Back to news controls are removed.

Audit date: 2026-10-02. Target: https://beans.cafecito.tech. These recommendations are based on live browser inspection, initial HTML/HTTP checks, and local Nuxt code review.

## Implementation status (2026-10-03)

Product-direction update: Now is a minimalist all-category trending feed. Positioning and methodology live on About, with `/methodology` redirected there. Archive/RSS are no longer promoted on home or in the footer. This supersedes the original visible-home-copy/follow-entry recommendations below; metadata and SSR news remain.

The P0/P1 code paths below are implemented locally, with regression checks in `scripts/verify-discovery.mjs` and `scripts/verify-analytics.mjs`. Completion-review fixes include archive/detail component imports and metadata-aware navigation analytics. P2 now includes Web Vitals instrumentation, RSS following, bounded presentation caching and measured first-party logo optimization. Field improvements and seven-day returns remain post-deployment measurements, not code-test claims.

The additional [GEO report crosswalk](./GEO-AUDIT-VERIFICATION.md) accounts for all 26 recommendations in `Audit · GEO.pdf`. It distinguishes local technical fixes from genuine editorial/reputation work. Read `VERIFICATIONS.md` for the final verification record and `TRAFFIC-AUDIT-NON-CODE.md` for external actions. The original evidence below describes the pre-change live site.

## Evidence

- The live canonical, `og:url`, social-image origin, sitemap URLs, and `robots.txt` sitemap point to `https://cafecito-beans-app.fly.dev`; `fly.toml` also sets that origin.
- Home and category initial HTML contain no headline links. Sampled article and source pages return loading shells with generic metadata; content appears after JavaScript runs.
- The sitemap contains only home, About, and seven category URLs. Articles and sources are absent.
- Article/source/category social metadata inherits generic Beans titles and banner imagery. About has route-specific metadata.
- The share dialog sends readers to the original publisher URL with Beans UTM parameters, not to a Beans page.
- An all-zero article ID returns HTTP 200 with the same loading shell as a valid article.
- Existing GA4/page-view and `page_view`/`content_load` telemetry were found; explicit share, coverage-open, search-submit, and publisher-click events were not.
- No Lighthouse or field Core Web Vitals measurement was performed. `graphifyy`/`graphify` were unavailable, so direct code inspection was used.

## Prioritized actions

| Priority | Rectifying action | Acceptance check |
| --- | --- | --- |
| P0 | Make `beans.cafecito.tech` the canonical origin in Nuxt defaults and deployment configuration. Update canonical, OG, JSON-LD, sitemap, robots, and llms links together. Add a permanent redirect from the Fly hostname that preserves path/query. | Every page has one Beans canonical; every sitemap URL uses Beans; Fly URLs redirect to the matching Beans URL without loops. |
| P0 | Fetch initial home/category/article/source data through SSR-compatible Nuxt data fetching such as `useAsyncData`; hydrate it instead of immediately refetching. Keep nonessential enrichment off the critical path. | Plain HTTP fetches contain real headlines, article summaries or source identity, and route-specific titles. Loading failures are not presented as empty feeds. |
| P0 | Add “Share Beans coverage” for articles with an internal detail route and retain “Share original article” separately. | A shared coverage URL opens a populated Beans page and that page links clearly to the original source. |
| P1 | Expand the sitemap to selected useful article/source pages. Add crawlable archive or next-page links beside “More,” and preserve durable article URLs. | Stories beyond the first five have an HTML link path or sitemap entry; only useful, nonempty canonical pages are indexed. |
| P1 | Return real 404/410 for confirmed missing resources; distinguish temporary upstream failures. Apply intentional `noindex,follow` behavior to internal search-result URLs. | Missing articles return an appropriate status; outages retain retry behavior; search variants have deliberate indexing rules in initial HTML. |
| P1 | Generate page-specific title, description, OG/Twitter metadata, representative images, and matching WebPage/CollectionPage/Breadcrumb JSON-LD where visible content supports it. | Non-JavaScript previews show the real story/source/category title and suitable image; Beans is not presented as the original publisher. |
| P1 | Add a compact visible home value proposition such as “See how different publishers cover the same story,” linked to a strong example. Add a methodology/help page covering confidence, ideology, counts, timing, and corrections. | A first-time visitor understands the product and does not mistake confidence for fact checking. |
| P1 | Extend analytics with `coverage_open`, `share_coverage`, `search_submit`, and `publisher_click`; validate one page view per navigation and separate inbound Beans referrals from outbound publisher referrals. | Controlled visits produce expected events once; raw sensitive search terms are not logged. |
| P2 | Measure mobile Core Web Vitals, then optimize measured bottlenecks such as image dimensions/loading, responsive delivery, JS cost, and delayed enrichment. Add a follow/subscribe entry point. | Field measurements and seven-day return rates improve; changes follow evidence rather than assumptions. |

## Sequence

1. Correct origin/redirects and initial rendering; establish analytics and Search Console baselines.
2. Ship coverage sharing, specific previews, deeper discovery links/sitemap, positioning, and missing-resource handling.
3. Run a four-week distribution pilot and use landing-page and event data to prioritize further work.

Official references: [canonical consolidation](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading), [Discover](https://developers.google.com/search/docs/appearance/google-discover).
