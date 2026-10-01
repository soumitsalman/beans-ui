# Data Sources

Primary data sources are the Beans API and Espresso API. Keep API credentials on the server and use the existing same-origin Nuxt proxies.

## Beans API

- Base URL: `BEANS_API_BASE_URL` (default `https://cafecito-beans-api.fly.dev`; runtime override `NUXT_BEANS_API_BASE_URL`). The proxy sends `CAFECITO_API_KEY` as `X-API-KEY`. See [beans.openapi.yaml](./beans.openapi.yaml) for documented public routes.
- Send array-valued API filters as repeated query keys (for example, `languages=en&languages=en-ae`), not as a single comma-containing value. News requests use `content_type=news` and these `languages` values: `en`, `en-ae`, `en-at`, `en-au`, `en-be`, `en-ca`, `en-de`, `en-en`, `en-gb`, `en-ie`, `en-in`, `en-mt`, `en-nz`, `en-pk`, `en-se`, `en-sg`, `en-sv`, `en-uk`, `en-us`, `en-za`, `english`.

| API language values |
| --- |
| `en`, `en-ae`, `en-at`, `en-au`, `en-be`, `en-ca`, `en-de`, `en-en`, `en-gb`, `en-ie`, `en-in` |
| `en-mt`, `en-nz`, `en-pk`, `en-se`, `en-sg`, `en-sv`, `en-uk`, `en-us`, `en-za`, `english` |

- Home and category feed requests use `/private/articles/unique`: trending uses `sort=trend` and a fixed two-day `from`; latest uses `sort=recent` and a fixed seven-day `from`. Both retain their cursor and selected category filters across pages.
- The mixed feed loads one trending article, then four latest articles. Send the latest article IDs as `exclude_ids` to trending and the trending IDs as `exclude_ids` to latest. Keep IDs from prior batches in each exclusion list. The UI de-duplicates article IDs as a fallback and fills an exhausted feed's remaining allocation from the other feed.
- Fetch article details from `/articles/{id}`. Use `/private/stories/{story_id}/articles` for both Coverage and Related. Coverage drains 100-item cursor pages through the final cursor without language or content-type filters; Related uses its independent five-item cursor and one repeated `languages` key per English locale above, without `content_type`. Feed-card publisher favicons use one `/private/stories/{story_id}/articles?limit=50` request and select up to five unique source IDs other than the card article's `source.id`; do not follow a cursor for this enrichment. Cards without a `story_id` do not make this request.
- Fetch source snapshots from `/sources/{id}`. After loading the source, fetch its news from `/private/articles/unique?sources={id}` with `sort=recent`, `content_type=news`, one repeated `languages` key per English locale above, `limit=5`, and the unchanged cursor. Keep only articles whose `source.id` matches the route ID. Do not use the source domain for this article query. Use `base_url` when returned, otherwise use the source `url`; normalize a missing URL scheme to `https://` before linking out, but hide the scheme in the displayed label.
- Use `trend.trend_score` only for its threshold-based icon/label. `trend.related` supplies the related-article count when positive; omit zero and missing values. `trend.mentions`, `trend.likes`, and `trend.comments` are lower-bound values; display positive values only.
- Source labels and favicons use the shared helpers in `app/utils/source.ts`, including the Google favicon and system-icon fallbacks.
- Search continues to use `/articles/search`. Map the topic to `q` and send each committed tag as a repeated `tags` query key (normalized lowercase terms with spaces as `_`). Send `content_type=news`, one repeated `languages` key per English locale above, and `limit=5`; send `score_threshold=0` only with a non-empty `q`; omit empty `tags` and do not send `sources`. Shareable URLs use `q` and `tags` and ignore leftover `sources`.

## Espresso API

- Base URL: `ESPRESSO_API_BASE_URL` (default `https://cafecito-espresso-api.fly.dev`; runtime override `NUXT_ESPRESSO_API_BASE_URL`). Use the same-origin Espresso proxy; never expose the API key to client code.
- Fetch confidence in one request to `/private/confidence?ids=id1,id2,...`, where every ID is a Beans article ID, never a `story_id`. The UI associates each result with its article ID and displays only `high`, `medium`, or `low` as the existing confidence badges. Missing values and failed requests omit the badge; confidence is not a truth or fact-check score.

## Contract note

`exclude_ids`, the private story-articles route, and the Espresso batch-confidence route are not described in the checked-in Beans OpenAPI spec. Proxy smoke checks on 2026-09-30 confirmed that populated `exclude_ids` values are accepted by trending and latest unique feeds; omit the parameter when the list is empty because `exclude_ids=` returns HTTP 400. `/private/articles/{id}/similar` returned the paginated article envelope, and `/private/confidence?ids=...` returned a `data` list keyed by article `id` with a discrete `confidence` value. `/sources/{id}` returned source metadata including `url` and `domain`. Earlier checks observed zero articles for `/articles/latest?sources={id}` and five matching articles for `/articles/latest?domains={source.domain}` for BBC and PsyPost; the source page now uses `/private/articles/unique?sources={id}` and that updated behavior has not been rechecked live. These historical proxy checks do not replace a published API contract; update this note and the spec when one is available.
