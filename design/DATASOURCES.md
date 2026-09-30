# Data Sources

Primary data sources are the Beans API and Espresso API. Keep API credentials on the server and use the existing same-origin Nuxt proxies.

## Beans API

- Base URL: `BEANS_API_BASE_URL` (default `https://cafecito-beans-api.fly.dev`; runtime override `NUXT_BEANS_API_BASE_URL`). The proxy sends `CAFECITO_API_KEY` as `X-API-KEY`. See [beans.openapi.yaml](./beans.openapi.yaml) for documented public routes.
- News requests use `content_type=news` and `languages=en`.
- Home and category feed requests use `/private/articles/unique`: trending uses `sort=trend` and a fixed two-day `from`; latest uses `sort=recent` and a fixed seven-day `from`. Both retain their cursor and selected category filters across pages.
- The mixed feed loads one trending article, then four latest articles. Send the latest article IDs as `exclude_ids` to trending and the trending IDs as `exclude_ids` to latest. Keep IDs from prior batches in each exclusion list. The UI de-duplicates article IDs as a fallback and fills an exhausted feed's remaining allocation from the other feed.
- Fetch article details from `/articles/{id}`. Fetch similar articles from `/private/articles/{id}/similar`; feed publisher stacks continue by cursor until five distinct other sources are found or the cursor ends. Article detail Coverage uses pages of 100 through the final cursor; Related uses an independent five-item cursor.
- Fetch source snapshots from `/sources/{id}`. After loading the source, fetch its news from `/articles/latest?domains={source.domain}` with `content_type=news`, `languages=en`, `limit=5`, and the unchanged cursor. Keep only articles whose `source.id` matches the route ID. If the source has no domain, fall back to `sources={id}`. Use `base_url` when returned, otherwise use the source `url`; normalize a missing URL scheme to `https://` before linking out, but hide the scheme in the displayed label.
- Use `trend.trend_score` only for its threshold-based icon/label. `trend.related` supplies the related-article count when positive; omit zero and missing values. `trend.mentions`, `trend.likes`, and `trend.comments` are lower-bound values; display positive values only.
- Source labels and favicons use the shared helpers in `app/utils/source.ts`, including the Google favicon and system-icon fallbacks.
- Search continues to use `/articles/search`. Map the topic to `q` and committed tags to `tags` (CSV of normalized lowercase terms with spaces as `_`). Send `content_type=news`, `languages=en`, and `limit=5`; send `score_threshold=0` only with a non-empty `q`; omit empty `tags` and do not send `sources`. Shareable URLs use `q` and `tags` and ignore leftover `sources`.

## Espresso API

- Base URL: `ESPRESSO_API_BASE_URL` (default `https://cafecito-espresso-api.fly.dev`; runtime override `NUXT_ESPRESSO_API_BASE_URL`). Use the same-origin Espresso proxy; never expose the API key to client code.
- Fetch confidence in one request to `/private/confidence?ids=id1,id2,...`, where every ID is a Beans article ID, never a `story_id`. The UI associates each result with its article ID and displays only `high`, `medium`, or `low` as the existing confidence badges. Missing values and failed requests omit the badge; confidence is not a truth or fact-check score.

## Contract note

`exclude_ids`, the private similar-article route, and the Espresso batch-confidence route are not described in the checked-in Beans OpenAPI spec. Proxy smoke checks on 2026-09-30 confirmed that populated `exclude_ids` values are accepted by trending and latest unique feeds; omit the parameter when the list is empty because `exclude_ids=` returns HTTP 400. `/private/articles/{id}/similar` returned the paginated article envelope, and `/private/confidence?ids=...` returned a `data` list keyed by article `id` with a discrete `confidence` value. `/sources/{id}` returned source metadata including `url` and `domain`. For BBC and PsyPost, `/articles/latest?sources={id}` returned HTTP 200 with zero items despite known news articles from those IDs. `/articles/latest?domains={source.domain}` returned five matching news articles with a next cursor for both sources; a hostname in `domains` returned zero for BBC, so use the API's source-domain value. These proxy checks do not replace a published API contract; update this note and the spec when one is available.
