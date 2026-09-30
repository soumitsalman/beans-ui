# DESIGN UPDATE
Remove /stories/{id} page
Introduce /articles/{id} page
Introduce /sources/{id} page
Update Articles look and feel similar to social media feed like X/Twitter

# / page and /categories/{} page
Merge trending news and latest / just in news into the same vertical panel similar to current Just In panel
Pull in 5 at a time: 1 for trending , 4 for latest. pass in `?exclude_ids=` query param for both cases.
for `/private/articles/unique?sort=trending` pass in `exclude_ids=<list of items already pulled in for latest>`
for `/private/articles/unique?sort=latest pass` in `exclude_ids=<list of items already pulled in for trending>`
use ESPRESSO API `/private/confidence?ids=id1,id2,id3` for retrieving confidence values in batch where ids are the `id` of the articles and not the `story_id`
More` button pulls in 5 more and keeps going

article display card: Look and feel similar to X/Twitter
favicon_avatar source_name published_time   |   confidence trend_score
category Title
Image_url hot link. (entitiesX2, regionsX2) bottom overlay, idelogy (left->blue, right->red, others->omit) top right overlay
Other publishers avatar N articles | mentions, comments, likes
for other publisher's avatar data use BEANS API `/private/articles/{id}/similar` for data. Stop if >=5 diff sources or `next_cursor == null`

A click on the article's source avatar + source name navigates to `/sources/{id}`

# /sources/{id} page
data routes: BEANS API `/sources/{id}` and `/latest/articles?sources={id}`
display: source snapshot, latest news
source snapshot:
favicon, source name
description
base_url
Latest news view
Similar to `/` and `/categories/{}` page - minus the interleaving of trending&latest

# /articles/{id} page
Shows article snapshot, coverage (previously propagation), related (previously coverage)
Snapshot data route: BEANS API /articles/{id} , ESPRESSO api /private/confidence?ids={id} for confidence_score
Snapshot display: Maintain the similar display as the current /stories/{id} card + image_url hotlink on the left side of the card

Coverage data route: BEANS API /private/articles/{id}/similar . retrieve 100 at a time until next_cursor is null
Coverage display: current timeline display of source favicons and publish dates
Related data route: BEANS API /private/articles/{id}/similar . retrieve 5 at a time. click on `More` button retrieves more until `next_cursor` 
Related display: maintain current display of coverage items (before refactoring)

# Unchanged
- use of language=en and content_type=news remains unchanged
- Other behavior related to article naviagtion stays unchanged e.g. if `article.story_id != null` navigate to /articles/{id} page or else to the `url` of the article