# Data Sources

Primary data sources are the Beans API and Espresso API. Keep API credentials on the server and use the same-origin Nuxt presentation actions documented in [RATE-LIMIT](./RATE-LIMIT.md). Public low-level Beans/Espresso proxies are blocked; action services and discovery fetch upstream internally.

Allow 90 seconds for upstream Beans and Espresso data retrieval. Server presentation actions have a 95-second deadline, and browser actions have a 100-second deadline.

## Beans API

- Base URL: `BEANS_API_BASE_URL` (default `https://cafecito-beans-api.fly.dev`; runtime override `NUXT_BEANS_API_BASE_URL`). The proxy sends `CAFECITO_API_KEY` as `X-API-KEY`. See [beans.openapi.yaml](./beans.openapi.yaml) for documented public routes.
- Send array-valued API filters as repeated query keys (for example, `languages=en&languages=en-ae`), not as a single comma-containing value. News requests use `content_type=news` and these `languages` values: `en`, `en-ae`, `en-at`, `en-au`, `en-be`, `en-ca`, `en-de`, `en-en`, `en-gb`, `en-ie`, `en-in`, `en-mt`, `en-nz`, `en-pk`, `en-se`, `en-sg`, `en-sv`, `en-uk`, `en-us`, `en-za`, `english`.

| API language values |
| --- |
| `en`, `en-ae`, `en-at`, `en-au`, `en-be`, `en-ca`, `en-de`, `en-en`, `en-gb`, `en-ie`, `en-in` |
| `en-mt`, `en-nz`, `en-pk`, `en-se`, `en-sg`, `en-sv`, `en-uk`, `en-us`, `en-za`, `english` |

- Home and category feeds make one `/preview/stories?limit=5` request initially, then one five-story request with the returned `next_cursor` for each More action. Return and render those stories without waiting for publisher icons or confidence. After the cards render, one browser presentation action enriches each five-story batch through the existing story-articles and confidence routes. Omit `sort` and `exclude_ids`; there are no separate trending/latest streams. Retain the existing seven-day recent window, fixed across More requests. Home omits `categories`; category pages retain their category values.
- Keep the existing English `languages`, `content_type=news`, normalized tags and topic filters. Send `q` only when non-empty and `score_threshold` from `NUXT_PUBLIC_DEFAULT_SCORE_THRESHOLD` (default `0.6`) only with q. The home URL and `beans_home_discovery` session cookie retain their existing topic/tag synchronization. Filtered requests retain the 12-hour discovery cache; unfiltered requests retain the 30-second public cache. Failures are not cached.
- Keep the story cursor across More and retries, deduplicate story IDs in the UI, and hide More when no cursor remains. Do not make extra requests to fill a short or duplicate-only response; retain its next cursor for the next More action.
- Fetch story details from `/preview/stories/{id}` with the existing English `languages` and `content_type=news`. Coverage drains `/preview/stories/{id}/articles` in 100-item cursor pages without either filter. Related uses that same member-articles route with both filters and its independent five-item cursor. Story, source, and search favicon avatars use one `/preview/stories/{id}/articles?limit=20` request without cursor continuation: select up to three distinct non-null, non-empty `source.favicon_url` values. Fewer than three is valid. Retain every returned article ID for story confidence, including articles whose favicon is duplicate or missing.
- Fetch source snapshots from `/sources/{id}`. After loading the source, fetch its news from `/articles/latest?sources={id}` with `sort=recent`, `content_type=news`, one repeated `languages` key per English locale above, `limit=5`, and the unchanged cursor. If the API `data` array is empty, fetch again with `content_type` omitted; if it is still empty, fetch again with both `content_type` and `languages` omitted. Stop at the first non-empty response, retain the source ID, sort, limit, and cursor for every attempt, and let request failures use the existing retry state. Keep only articles whose `source.id` matches the route ID. Do not use the source domain for this article query. Use `base_url` when returned, otherwise use the source `url`; normalize a missing URL scheme to `https://` before linking out, but hide the scheme in the displayed label.
- Use `trend.trend_score` only for its threshold-based icon/label. `trend.related` supplies the related-article count when positive; omit zero and missing values. `trend.mentions`, `trend.likes`, and `trend.comments` are lower-bound values; display positive values only.
- Source labels and favicons use the shared helpers in `app/utils/source.ts`, including the Google favicon and system-icon fallbacks.
- Search continues to use `/articles/search`. Map the topic to `q` and send each committed tag as a repeated `tags` query key (normalized lowercase terms with spaces as `_`). Send `content_type=news`, one repeated `languages` key per English locale above, and `limit=5`; send `score_threshold` from `NUXT_PUBLIC_DEFAULT_SCORE_THRESHOLD` (default `0.6`) only with a non-empty `q`; omit empty `tags` and do not send publisher IDs as `sources`. Map the comma-separated Sources input to the API `domains` filter. Live checks showed this filter accepts stored source domain names such as `bbc` and `apnews`, without a URL or suffix. Shareable URLs use `q`, `tags`, and `sources` (domain names).

## Espresso API

- Base URL: `ESPRESSO_API_BASE_URL` (default `https://cafecito-espresso-api.fly.dev`; runtime override `NUXT_ESPRESSO_API_BASE_URL`). Use the internal Espresso presentation service; never expose the API key to client code.
- Fetch confidence in one request to `/preview/confidence?ids=id1,id2,...`, where every ID is a Beans article ID, never a `story_id`. For stories, batch up to 100 distinct article IDs from the favicon response per request. Stop querying a story once a non-null confidence is returned; choose the highest returned value when results conflict (`high` > `medium` > `low`). Display only `high` confidence. Source and search confidence still uses article IDs. Missing values and failed requests omit the badge; confidence is not a truth or fact-check score.

- Story publication dates map from `last_published_at`; article count labels map from the verified API `article_count` field (`artcles_count` is accepted as an input fallback).

## Internal route boundary

- All UI-owned Beans/Espresso calls use `/preview` for internal endpoints. Publisher-avatar enrichment uses `/preview/stories/{story_id}/articles?limit=20`; sitemap/RSS discovery uses `/preview/articles/unique`; Espresso confidence uses `/preview/confidence`. Existing query parameters and public routes remain unchanged. Never fall back to the stale `/private` prefix.
- Preview endpoints stay internal and are excluded from the public OpenAPI specification. The historical 2026-09-30 smoke checks predate this route migration; current verification records are in VERIFICATIONS.md.
