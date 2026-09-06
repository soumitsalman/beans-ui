# Data Sources
Primary data sources are Beans API and Espresso API

### Beans API
- Provides publisher contents like news, blogs, earnings_report, press_release, whitepapers etc. 
- Provides individual published items as well as clustered group of similar items.
- Base URL: `https://cafecito-beans-api.fly.dev` | Set `X-API-KEY` header value from env var `CAFECITO-API-KEY` | [Swagger Spec](./beans.openapi.yaml)
- Use `/news/top-headlines` for pulling in top news from the last 24 hours
- Use `/articles/latest?content_type=news` for latest news (lacks trend data)
- Use `/articles/trending?content_type=news` for trending news (contains trend data)
- Use `/articles/{article.id}` for details on the news article and trend data
- Use `/articles/{article.id}/similar?content_type=news` for similar articles
- Use `/stories/{article.story_id}` field for pulling in the story that the article belongs to
- Use `/stories/{article.story_id}/articles?content_type=news` for news coverage in that story
- Use `article.story_id` field to deduplicate articles. If `story_id` is null or missing, treat it as its own cluster/unique
- Story Title & Summary: Use article that has the longest summary and title
- Source Favicon: Use `source.favicon` or `https://www.google.com/s2/favicons?domain={article.url}`
- Source Label: Use `source.site_name` or `source.domain_name` or `base_url_without_scheme_prefix(article.url)`
- `trend.trend_score` is a beans platform specific subjective value
- `trend.mentions`, `trend.likes`, `trend.comments` are lower limit values
- Fetch limit=5 | Use `next_cursor` to fetch more as needed