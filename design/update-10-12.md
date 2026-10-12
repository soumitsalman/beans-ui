# Page structure
- article page: `/articles/{article.id}` page becomes `/stories/{story.id}` page

# Change backend API routes
- home page: `/preview/stories`
- categories page: `/preview/stories?categories=<category_ids>`
- stories page: `/preview/stories/<story_id>?languages=<language>&content_type=<content_type>`
- stories sources favicon avatar group: `/preview/stories/<story_id>/articles?limit=20`. Take max 5 distinct favicons from this group. Avoid iterative call if <5 distinct favicons
- for `stories/{id}` page's coverage use `/preview/stories/{id}/article` without `languages` and `content_type` filter. Pull 100 at a time until loading is complete. For related use the same route but with `languages` and `content_type` query params but `limit=5` at a time
- for story confidence score use the `article.id` list received during sources favicon list. For home page and category page, batch 100 ids queries at a time. stop querying for confidence score for a story when at least 1 of it's article ids return a non-null value. in case of conflicting non-null value use the highest confidence value

# Data field mapping
- use `story.last_published_at` as the published date
- use `story.artcles_count` value for N articles label

# UI changes
- Introduce an StoryCard for home page and categories page. Similar to ArticleCard minus the source.favicon and source.site_name 
- Click on story card always goes to stories page
- Display confidence value ONLY when it is high

Remains unchanged:
- sources page and its routes
- existing logic and values of `languages`, `content_type`, `q`, `score_threshold` filter
- confidence score path

For local test:
- use https://localhost:8080 for beans api (already in .env file)