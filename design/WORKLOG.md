# Beans UI Working Log

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
