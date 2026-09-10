# Data Sources
Primary data sources are Beans API and Espresso API

### Beans API
- Provides publisher contents like news, blogs, earnings_report, press_release, whitepapers etc. 
- Provides individual published items as well as clustered group of similar items.
- Base URL: env var `BEANS_API_BASE_URL` (default `https://cafecito-beans-api.fly.dev`; runtime override `NUXT_BEANS_API_BASE_URL`) | Set `X-API-KEY` header value from env var `CAFECITO_API_KEY` | [Swagger Spec](./beans.openapi.yaml)
- Use `/news/top-headlines?languages=en` for pulling in top news from the last 24 hours
- Use `/news/latest?languages=en` for latest news (lacks trend data)
- Use `/news/trending?languages=en` for trending news (contains trend data)
- Use `/articles/{article.id}` for details on the news article and trend data
- Use `/articles/{article.id}/similar` for similar articles
- Use `/stories/{article.story_id}` field for pulling in the story that the article belongs to. This also contains the sources_count and articles_count for all articles with that story_id
- Use `/stories/{article.story_id}/articles` for news coverage in that story
- Use `article.story_id` field to deduplicate articles. If `story_id` is null or missing, treat it as its own cluster/unique
- Story Title, Summary, and Top Articles: Use `title`, `summary`, and `top_articles` from `/stories/{id}` as returned.
- Source Favicon: Use `source.favicon` or `https://www.google.com/s2/favicons?domain={article.url}`
- Source Label: Use `source.site_name` or `source.domain_name` or `base_url_without_scheme_prefix(article.url)`
- `trend.trend_score` is a beans platform specific subjective value
- `trend.mentions`, `trend.likes`, `trend.comments` are lower limit values
- Fetch `limit=20` internally and reveal 5 unique `story_id`s at a time | Use `next_cursor` to fetch more as needed when that cursor returns items | `/news/top-headlines` `next_cursor` currently returns `data: []` (cursor `ts` is 0 while collection rows omit trend), so continue by expanding `limit` instead of treating that empty cursor as end-of-feed
- Use `/articles/search` for the Search page. Map the topic input to `q` and committed tags to `tags` (CSV of normalized terms: lowercase, spaces to `_`). Send `content_type=news`, `limit=5`, and `score_threshold=0` only when `q` is non-empty. Omit `tags` when none are selected. Do not send `sources` from the Search UI. Shareable `/search` URLs use the same `q` and `tags` query params and ignore leftover `sources`.

### Espresso API
- Base URL: env var `ESPRESSO_API_BASE_URL` (default `https://cafecito-espresso-api.fly.dev`; runtime override `NUXT_ESPRESSO_API_BASE_URL`). Use the existing same-origin Espresso proxy; do not expose the API key to client code.
- Confidence resolution starts from an Espresso event ID. For an article/news card, use `article.id`; for a story card, use `story.top_articles[0].id`. Request `/events/{event_id}/signals`, use the first returned signal ID, then request `/signals/{first_signal_id}` and read `data.confidence`.
- `data.confidence` is a discrete value: `high`, `medium`, `low`, `null`, or absent. Only the three named values are displayable. No returned signal, a failed signal-detail request, `null`, and a missing field all mean confidence is unavailable and the UI omits it.
- Espresso confidence expresses the related signal's confidence; it is not a fact-check or truth score for the publisher reporting.
