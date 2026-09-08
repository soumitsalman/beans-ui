## Verification scope

Verify the mobile-first Nuxt UI only. Beans and Espresso remain external data sources behind the existing same-origin proxies; this document does not authorize API or backend changes.

## Requirements

- Top Headlines and Latest News reveal 5 unique `story_id`s at a time. Internal collection fetches use `limit=20`. Reaching the last currently loaded Top Headline (scroll, last snap, or next/right arrow) reveals the next 5 unique stories (5 → 10 → 15). `/news/top-headlines` `next_cursor` currently returns an empty page, so Top Headlines continues by expanding `limit` (20, 40, … 100) and skipping already-seen stories instead of sending that cursor. A 5-article page that shares a `story_id` must not leave the carousel at 4 cards when more unique stories exist in the batch. Latest News continuation uses its working `next_cursor`.
- Top Headlines has no `More headlines` button. Continuation is only via carousel scroll and the next control. Latest News keeps its `More` control.
- Top Headline items, Latest News items, and Coverage items render `trend.mentions`, `trend.likes`, and `trend.comments` when each value is a finite number greater than 0. Zero, null, and missing values are omitted. Visible counts are icon plus humanized number only (Coverage compact pattern); do not render the words `mentions`, `likes`, `comments`, or `shares`.
- Viewport layout by Tailwind breakpoint: `md` and above (≥768px, including `lg`/`xl`) show 2 Top Headlines in view and 2 Latest News columns; below `md` (`sm`/`xs`, <768px) show 1 Top Headline and 1 Latest News column.

## Success criteria

- Home shows all-category Top Headlines from the last 24 hours and Latest News containing news articles only.
- Top Headlines and Latest News are independently paged, reveal five unique `story_id`s at a time from internal `limit=20` fetches, and stay deduplicated by `story_id`.
- A category tab passes only the category values in its mapped group to both feeds and does not leak content from another group.
- Top Headlines is a horizontal carousel that reveals the next five unique stories when the last currently loaded item is reached (scroll, last snap, or next arrow), and it has no `More headlines` control. Latest News is a vertical list with a `More` control directly beneath its loaded rows whenever more unique stories remain.
- Top Headline cards use an optional full-width image followed by category/date/score, title, two regions and entities, then their source group. Latest News uses an optional image at left; its category/date/score, title, taxonomy, and two-line summary appear beside it; its source group and social counts form a separate bottom row.
- Feed cards enrich their primary article with its detail endpoint when feed payloads omit trend data, preserving each feed's original ordering and cursor while exposing valid trend scores and engagement counts.
- Empty, loading, and error states preserve page context, explain the state plainly, and let the user retry the affected content or continue using unaffected content.
- News cards link to the matching story. Story detail shows the story metadata, the longest available summary paired with its title, propagation, and source coverage. The story category/date row starts with category and date and ends with humanized `article_count` then `source_count` (`justify-end`), omitting each count when it is 0 or missing.
- Coverage is latest-first, independently cursor-paged in groups of five, and each article URL is actionable.
- Coverage rows show their source label, linked title, and humanized `trend.mentions`, `trend.likes`, and `trend.comments` when each value is greater than 0, without inventing a count when a value is 0 or absent. Positive trend counts sit on the first row, right-aligned (`justify-end`) opposite the source label, as icon plus number with no word labels; the title stays on the second row.
- Story metadata and the first Coverage page render as soon as they are available; full Propagation may continue loading independently and must not delay the usable story view.
- Snapshot summaries remain markdown-rendered and clamped to two lines; Story-detail summaries use the same safe markdown renderer and clamp to three lines with no raw HTML execution.
- Propagation contains one event per story article, ordered by publication time, and shows only the formatted publication date and source favicon/avatar.
- Source presentation uses the configured source favicon, then the Google favicon service for the article URL domain, then the default source icon; labels use the configured site/domain or the article base URL.
- Missing optional images, summaries, categories, regions, entities, trends, and favicons never create broken assets, misleading placeholders, or broken card layouts. News cards omit images when no image exists.
- Counts are humanized. Relative times use hours for under 24 hours, days for 24 hours to under three days, and `MMM dd, YYYY` for older items.
- The interface remains readable and operable at 320px and common mobile viewport sizes in the dark coffee/charcoal theme, with no clipped primary content or page-level horizontal overflow.
- Brand foreground, active navigation, primary CTAs, accent labels, and accent icons use the coffee-bean primary (`#c48654` / `--color-coffee-400`), a shade between gold and coffee, not amber.
- Top Headlines shows 1 card below Tailwind `md` and 2 cards at `md` and above (`lg`/`xl` included). Latest News is 1 column below `md` and 2 columns at `md` and above. Carousel slides use even viewport fractions so an extra card does not peek. Latest News cards stay in their grid tracks.
- The application shell exposes the canonical `/`, `/categories/{category_slug}`, `/stories/{story_id}`, and `/search` routes. Its header shows the current date as `Weekday, MMM dd` (no year) with a live-indicator icon that has a slight primary glow and no chip/border, the Beans mark, Search control, Beans API control, and Contact control; its footer exposes every specified Cafecito, Publications, API, GitHub, and About link. Home has no “Live desk” / “The story, not the noise.” hero. Feed section titles are `Trending` and `Just In`.
- Search accepts a relevance query, normalized tags, and publisher-source lookup. It sends news-only, five-item cursor pages to Beans, includes `score_threshold=0` whenever it sends a relevance query, keeps source selection separate from text relevance, deduplicates matching stories, discards stale lookup/result responses after a newer search, and plainly supports loading, empty, error, retry, and load-more states.
- A card with a story ID links to `/stories/{story_id}`. A story-less card links directly to its original article URL. Each card’s source group derives from the article and its related articles and reports a distinct-source count rather than treating article count as source count.
- Local Nuxt development reads `CAFECITO_API_KEY` from the gitignored `.env` file into server-only runtime configuration; it is forwarded only by the existing Beans/Espresso proxies and never exposed to client code.

## UX failure cases

- A story is repeated in a feed, or a related-source count is presented as an article count.
- Home content is category-filtered, or a category tab leaks content outside its mapped values.
- A feed requests more than five items, drops its cursor, reuses an exhausted cursor, or lets one feed's pagination state affect the other.
- A category change lets an in-flight response for the previous category replace the current category's feed, briefly leak unrelated stories, or retain its cursor.
- Top Headlines is rendered as a vertical list, Latest News as a carousel, carousel-end loading checks an unavailable nested ref instead of the exposed carousel API, the next arrow is disabled at the last loaded snap while a cursor exists, a `More headlines` control remains on Top Headlines, end detection requires the selected index to be the last item so a multi-slide viewport never fetches, or the Latest News `More` control is absent/buried away from the end of the list while a cursor exists.
- A Top Headlines append jumps the carousel back to the first snap, auto-retries a failed cursor page in a loop, or stops while `next_cursor` is still present after the last loaded item is in view.
- Top Headline cards use Latest News' compact side-image layout, or Latest News moves its source group and social counts into the headline instead of the card's bottom row.
- Feed trend data is omitted because a collection endpoint lacks it, enrichment changes feed ordering/cursors, or a valid score is shown without its threshold icon.
- A feed's error, loading, or empty state clears successful content from the other feed or gives no retry/continuation path.
- When both feeds are empty, the page is left without a plain explanation and retry path after its empty sections are omitted.
- A missing image, favicon, category, region, entity, summary, or trend value leaves broken media, misleading text, an empty label, or unstable card height.
- A raw or implausible timestamp makes recency difficult to scan, or a long snapshot summary exceeds two lines.
- Markdown summary text is rendered literally or as executable raw HTML, or a Story-detail summary exceeds three visual lines.
- A snapshot summary that starts with markdown image syntax (`![](url)` / `![alt](url)`) shows a leftover `!`, an empty image link, or an inline image.
- A story card opens the wrong story, loses the selected context without a way back, or renders a source URL as non-actionable text.
- A story-less article routes to a fabricated story URL, a canonical route is missing, or a header/footer destination is absent or points to the wrong URL.
- A source query is mixed into the relevance query, tags are sent as display labels instead of normalized API values, a new search reuses an old cursor, or a search result leaks non-news content.
- A delayed source lookup or result request from an earlier search replaces the newest criteria, results, cursor, loading state, or error message.
- An empty publisher lookup still calls `/articles/search`, or Retry after that empty lookup re-runs article search instead of `/sources` only.
- Empty or error search copy interpolates in-progress form edits instead of the last submitted criteria.
- A replacement search flashes the previous empty state while source lookup is still running.
- A relevance query omits the Beans `score_threshold` guard rail and triggers a server error instead of returning a retryable result state.
- `/articles/search` sends `score_threshold=0` when `q` is empty, or omits it when `q` is present.
- Search or feed identity uses a similar-article id as a key, so a later primary article is dropped or a story-less URL-only article disappears.
- A missing API title is replaced with fabricated copy such as "Untitled update" or "Untitled story".
- A valid trend score is rendered as a number instead of the activity / trending-up / fire icon for the 500 / 1000 / 10000 thresholds.
- A zero likes, comments, shares, or mentions value is rendered as a count.
- An exhausted Latest News list shows an empty-state message under already loaded rows, or `More` remains after the cursor is gone.
- A 404 favicon leaves a broken-media glyph instead of the default source icon.
- A card with no resolvable source still renders a source group or a fabricated “1 source” count.
- Story metadata stays blocked until the first Coverage page returns, or a `story_id` change keeps stale coverage, cursors, or errors.
- A shorter Coverage summary replaces a longer `top_articles` title+summary pair.
- Propagation dates use raw timestamps or expose title, source label, mentions, or summary text.
- Empty Coverage copy invents an article count, or `article_count` is shown when it is 0.
- Story-detail `article_count` or `source_count` sit beside the back control, wrap under the title, fail to right-align on the category/date row, or render when the value is 0 or missing.
- A category-filtered page drops a row that omits `categories`, or `trend: {}` skips article-detail enrichment.
- Feed enrichment replaces the collection title, url, summary, or image, or an in-flight enrich from a previous category writes into a newly emptied list.
- Related-article sources are omitted, duplicated, or represented by the story/article count.
- Related articles with missing source metadata from different URLs on the same publisher domain are counted as separate sources.
- Loading a later page cancels related-source enrichment for an already visible card in the same feed generation.
- A local API key is ignored by Nuxt, shipped in client runtime configuration, or omitted from proxy requests despite being present in `.env`.
- Coverage is not latest-first, pagination repeats articles, or an article link does not open the source URL.
- A Coverage row omits available article mentions, renders raw counts, or shows a misleading zero/placeholder when mention data is absent.
- Coverage trend counts sit beside the source label, wrap under the title, or fail to right-align on the first row.
- Top Headline or Latest News cards omit `trend.mentions`, `trend.likes`, or `trend.comments` when the value is greater than 0, render those counts when the value is 0 or missing, or show the words `mentions`, `likes`, `comments`, or `shares` beside the numbers.
- Coverage rows skip article-detail trend overlay when the story-articles collection omits `trend`, so available mentions/likes/comments never appear.
- The story view remains blocked on every Propagation cursor before showing its first five Coverage rows, or a Propagation failure hides otherwise loaded Coverage.
- Propagation contains mentions, trend history, or non-article events; uses the wrong date/favicon; or exposes article titles/source labels in the timeline.
- Horizontal scrolling traps vertical page scroll, hides the next card without an affordance, or requires desktop-only input.
- Top Headlines shows the wrong number of cards for the active Tailwind breakpoint (3 at `md`/`lg`/`xl`, or more than 1 below `md`), or a non-fractional slide basis lets an extra card peek into the viewport.
- Latest News uses 2 columns below `md`, more than 2 columns at `md` and above, or a card overflows/wraps out of its grid track into an extra column.
- Low contrast, tiny controls, clipped content, or page-level horizontal overflow makes the dark mobile interface difficult to use.
- Home still shows “Live desk” or “The story, not the noise.”, or feed headings remain “Last 24 hours” / “Top headlines” / “Just in” / “Latest news” instead of `Trending` and `Just In`.
- The header date includes a year, omits the weekday, lacks the live-indicator icon or its glow, or is wrapped in a chip/border.
- Primary CTAs, active category tabs, trend icons, accent labels, or summary links remain amber or gold instead of coffee brown.

## Test scenarios

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| Home feed composition | Mixed-category pages containing duplicate story IDs | Home loads | Top Headlines is all-category and recent; Latest News is news-only; both feeds contain unique stories. |
| Category filtering | Fixtures inside and outside one mapped category group | A category tab loads | Both feeds contain only stories matching the group's mapped category values. |
| Feed layouts | At least five stories per feed and another cursor page | The page renders and the user reaches each feed's end | Top Headlines uses the exposed carousel end state to request the next five; Latest News remains a vertical list and exposes `More` below its loaded rows. |
| Feed card layout | A Top Headline and a Latest News item with image, taxonomy, trend, source, and social data | Both card types render | The Top card follows the full-width-image hierarchy; the Latest card follows its side-image plus separate source-and-counts bottom row hierarchy. |
| Trend enrichment | Feed payloads omit trend data while matching article detail responses contain scores and engagement | Home loads and advances either feed | Cards show the detail trend values and correct threshold icons without changing original item order, deduplication, or cursors. |
| Independent pagination | Two pages of five items for each feed | The user advances the feeds in either order | Only the selected feed appends its next unique page; existing content and the other feed remain unchanged. |
| Category change while loading | A category request is still in flight | The user opens another category before it resolves | Only the newest category response can update either feed; its filters and cursors remain scoped to that category. |
| End of feed | A feed returns no next cursor or no items | The user reaches its end | No further request or duplicate content is produced, and the feed stays usable. |
| Empty page | Both feeds complete with no items | Home or a category page loads | Empty individual sections are omitted, while a page-level message explains that no news is available and offers a retry. |
| Card fallbacks | Cards with missing optional fields and broken media URLs | Cards render | Images are omitted when absent, intentional default icons are used, metadata is omitted when unavailable, and card geometry remains usable. |
| Time, counts, and summary | Recent, two-day, and older timestamps; large counts; long markdown summaries, including unsafe raw HTML | Snapshot and Story-detail cards render | Time and counts are humanized, older dates use `MMM dd, YYYY`, snapshots occupy no more than two lines, detail summaries occupy no more than three, markdown formatting renders, and raw HTML is escaped. |
| Snapshot markdown images | A Latest News summary starts with `![](http://cdn.example/img.jpg)` or `![alt](url)` followed by prose | Home Latest News renders | The summary omits the image, leftover `!`, and empty link; only the prose is shown, still clamped to two lines. |
| 320px carousel chrome | Top Headlines has more than one card at a 320px viewport | The first card is in view | Prev/Next do not cover the category, date, or title; those labels stay readable; page-level overflow remains off. |
| Responsive Top Headlines md+ | At least 2 top headlines at viewport width ≥ 768px (`md`, `lg`, `xl`) | Home renders | Exactly 2 top-news cards fill the carousel viewport; a third card does not peek. |
| Responsive Top Headlines sm/xs | At least 1 top headline at viewport width < 768px (`sm` / default) | Home renders | Exactly 1 top-news card fills the carousel viewport. |
| Responsive Latest News columns | At least 4 latest-news items | Home is viewed at `lg`/`xl`, then `md`, then `sm`/`xs` | Latest News is 2 columns at `md` and above and 1 column below `md`; cards remain in grid tracks without wrapping into an extra column. |
| Story navigation | A visible story card with multiple source articles | The user opens it | The matching story detail loads, provides a way back, shows horizontal propagation, and shows linked vertical Coverage rows. |
| Propagation mapping | Story articles with ordered dates and present/missing favicons | The detailed story loads | There is one timeline item per article, ordered oldest-to-newest, with only the formatted date and favicon/avatar; missing favicons use the default icon. |
| Coverage pagination | A story with more than five articles and a next cursor | The user selects Coverage load more | The next five latest-first articles append once, without duplicates, and each URL is actionable. |
| Coverage mentions | Coverage articles with present and absent mention values | The detailed story loads | Positive mentions, likes, comments, and shares are humanized and right-aligned on the source row; unavailable values are omitted. |
| Coverage trend layout | A coverage article with source label, title, and positive trend counts | Story Coverage renders | The first row is favicon, source label at start, and trend counts at end; the title sits on the second row under the source label. |
| Progressive story detail | A story has first-page Coverage and additional Propagation cursors | The detail page opens | Story metadata and its first five Coverage rows become usable without waiting for all propagation pages; Propagation retains its own loading or retry state. |
| Mentions excluded | Story articles with mention data | The detailed story loads | No mention request, event, or mention-specific empty state appears. |
| Detail empty state | A story with no articles | Its detail page loads | The story remains usable and Coverage states plainly that no articles are available; propagation is omitted when there are no events. |
| Error isolation and retry | One feed request fails while the other succeeds | The page loads, then the failed feed is retried | Successful content remains visible; only the failed feed reports the error and retry restores it. |
| Mobile usability | 320px and common mobile viewport sizes | The user navigates, scrolls, and opens cards | No page-level horizontal overflow or clipped primary content occurs; controls remain visible and operable by touch. |
| Dark-theme readability | Representative cards, loading, empty, and error states | The interface is inspected | Text, metadata, controls, media fallbacks, and status messages remain distinguishable against the dark theme. |
| Coffee-bean foreground | Home, a category tab, Search, and a story with trend icons | Those surfaces render | Active tabs, Search CTA, category labels, trend/propagation/coverage icons, and markdown links use coffee brown; no amber or gold accent remains. |
| Shell and canonical routes | A mobile viewport | The header, category navigation, footer, and each named route are opened | The required `Weekday, MMM dd` date with a live icon and no chip/border, Beans mark, Search/API controls, exact footer destinations, and `/categories/*` and `/stories/*` routes are present and usable. Home shows `Trending` and `Just In` with no Live desk hero. |
| Search modes | A relevance term, normalized tag, and source prefix with matching/non-matching fixtures | The user submits, retries, and loads more results | Requests stay news-only at five items, relevance/tags/source constraints remain distinct, results are deduplicated, and loading, empty, error, and continuation states retain their context. |
| Search replacement | An earlier source lookup or result page is delayed | The user submits a different search before it resolves | Only the newest search can update results, source matches, cursor, loading state, or errors; it begins without waiting for the stale request. |
| Story-less navigation and related sources | One article with a story ID, one without, and related articles sharing/differing sources, including two source-less URLs on one domain | The user opens each card | Story cards use the canonical story route; story-less cards open the original URL; the source group contains no more than five unique source favicons and its total is the unique related-source count. |
| Related-source enrichment while paging | The first page has delayed related-source responses and a second cursor page | The user advances before enrichment resolves | Both pages retain their related-source enrichment; only a replacement feed generation can discard an obsolete enrichment response. |
| Header Contact and 320px chrome | A 320px viewport and the documented Contact URL | The header renders | Contact opens `https://developer.cafecito.tech/contact` with `noopener noreferrer`; the header still shows the `Weekday, MMM dd` date with a live icon and no chip/border, Beans mark, and Search, API, and Contact controls, with no page overflow. |
| Empty publisher lookup | A source prefix that matches no publishers | The user submits or retries that search | `/articles/search` is not called; Retry re-runs `/sources` only; empty copy uses the last submitted source text, not later form edits. |
| Search loading through lookup | A replacement search that must resolve publishers first | The user submits a new search | The page stays in loading through source lookup and does not flash the previous empty state. |
| Search score threshold | A search with a non-empty `q` and a later tag-or-source-only search | Each request is sent | `/articles/search` includes `score_threshold=0` only when `q` is non-empty. |
| Search and feed identity | A story-less URL-only article, plus a page-2 primary that appeared as a page-1 similar article | Search or a feed appends the next page | The story-less item remains with its original URL; similar-article ids are not used as keys, so the page-2 primary still appends. |
| Missing titles | Article and story payloads omit `title` | Cards and story detail render | No “Untitled update” or “Untitled story” copy is invented; the title is omitted or left empty. |
| Icon-only trend score | Scores of 500, 1000, and 10000 | Cards render | The activity, trending-up, and fire icons appear in that order, with no numeric score value. |
| Zero social omitted | A card or Coverage row with 0 likes, comments, shares, or mentions and another with values above 0 | Those rows render | Zero values are omitted; positive values are humanized. |
| Carousel snap continuation | A Top Headlines carousel below `md` (one card in view) with another cursor page | The user reaches the final snap | `canScrollNext() === false` requests the next cursor; the snap stays one card wide. |
| Carousel has no More headlines | Top Headlines has a next cursor | Home or a category page renders | No `More headlines` control is shown; Latest News still shows `More` while its cursor exists. |
| Carousel next at last loaded item | Five loaded headlines, a `next_cursor`, and the last loaded item in view (1-, 2-, or 3-slide viewport) | The user lands on that last snap or clicks Next | A `limit=5` request with that cursor appends the next unique page; the current snap is preserved. |
| Carousel cursor exhaustion | Top Headlines pages until the API returns a null `next_cursor` | The user keeps advancing to the last loaded item | No further headlines request is sent; Next is disabled; loaded slides stay visible with no empty-state under them. |
| Carousel append error | The next cursor page fails | The user is on the last loaded snap | Auto-fetch does not loop; the existing headlines stay; Retry re-requests that cursor page. |
| Exhausted Latest News | Latest News has loaded rows and then returns no next cursor | The list finishes | No empty-state message appears under the rows; `More` is shown only while a cursor exists. |
| Favicon and source fallbacks | A 404 favicon URL, and a card with no resolvable source metadata or URL | Those cards render | The failed favicon uses the default source icon with no broken-media glyph; the source group is omitted instead of showing “1 source”. |
| Progressive story metadata | `/stories/{story_id}` resolves while the first Coverage page is still in flight | The story route opens | Story metadata is usable immediately; Coverage keeps its own loading state. |
| Story meta counts row | A story with category, date, article_count > 0, and source_count > 0 | Story detail renders | The first metadata row is category and date at start, article count then source count at end (`justify-end`); neither count sits beside Back; zeros are omitted. |
| Story id replacement | Coverage or Propagation pages are still in flight | The user opens a different `story_id` | Stale appends, cursors, and errors from the previous story are discarded. |
| Story preview pairing | `top_articles` has a longer title+summary pair than a later Coverage article | Coverage arrives | The shorter Coverage pair does not replace the longer `top_articles` pair. |
| Propagation date-only | Story articles with recent, two-day, and older dates | Propagation renders | Dates use hours, days, or `MMM dd, YYYY`; no title, source label, mentions, or summary appears. |
| Empty Coverage copy | A story with no coverage articles and `article_count` 0 | The story view settles | Copy says no coverage is available; `article_count` is shown only when it is greater than 0. |
| Category row without categories | A category-filtered page includes a row that omits `categories` | That category loads | The row remains; the page does not drop it for missing taxonomy. |
| Empty trend enrichment | A collection row has `trend: {}` while article detail has scores | The feed enriches | Detail trend values are applied without changing order or cursor. |
| Enrichment overlay only | Collection title, url, summary, and image differ from later detail or similar payloads | Enrichment resolves | Only trend, sources, and counts are overlaid; collection title, url, summary, and image stay. |
| Category switch vs enrich | The previous category still has in-flight enrichment after its list was cleared | The user opens another category | The stale enrich cannot write the old category’s stories into the new empty lists. |
| Headline social counts | Top Headlines omit `trend` while article detail has mentions/likes/comments above 0, and another headline has only zeros | Home and category Top Headlines render after enrichment | Compressed cards show icon plus humanized number for mentions, likes, and comments when each value is > 0, with no word labels, and omit each field when it is 0 or missing. |
| Latest social counts | Latest News items with mentions/likes/comments above 0 and items with 0 or omitted trend | Home, category, and Search snapshot cards render | Icon plus humanized number appear only when > 0, with no `mentions`/`likes`/`comments`/`shares` words; zeros and missing values stay hidden. |
| Coverage trend overlay | `/stories/{id}/articles` omits `trend` while matching `/articles/{id}` has positive mentions/likes/comments | Story Coverage loads | Rows overlay detail `trend` only; positive counts render; collection title, url, summary, and image stay; zero/missing counts stay hidden. |

## Verification gates

- Static checks: `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.
- Runtime smoke checks: home, category, story, search, and About routes load; Beans proxy requests preserve `limit=5`, cursors, category filters, news-only search filters, source/tag search constraints, and the server-side API-key boundary sourced from local `.env` when configured.
- Manual UI checks: inspect the 320px viewport, a wider mobile viewport, header/footer destinations, Top Headlines initial `limit=5` and carousel-end `next_cursor` loading with no `More headlines` control, Latest News load more, mentions/likes/comments only when > 0 on headlines/latest/coverage as icon plus number with no word labels, breakpoint slide and column counts (`md`+ 2+2, below `md` 1+1), all search modes, story-less and story navigation, Coverage links, loading/empty/error states, dark-theme contrast, and coffee-bean (not amber/gold) primary accents and icons.
