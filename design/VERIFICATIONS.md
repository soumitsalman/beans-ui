## Verification scope

Verify the mobile-first Nuxt UI only. Beans and Espresso remain external data sources behind the existing same-origin proxies; this document does not authorize API or backend changes.

## Success criteria

- Home shows all-category Top Headlines from the last 24 hours and Latest News containing news articles only.
- Top Headlines and Latest News are independently paged with opaque cursors, five items per request, and deduplicated by `story_id`.
- A category tab passes only the category values in its mapped group to both feeds and does not leak content from another group.
- Top Headlines is a horizontal carousel that can fetch the next page at the end of the carousel; Latest News is a vertical list with a discoverable load-more control.
- Empty, loading, and error states preserve page context, explain the state plainly, and let the user retry the affected content or continue using unaffected content.
- News cards link to the matching story. Story detail shows the story metadata, a summary/title pair from a suitable top article, propagation, and source coverage.
- Coverage is latest-first, independently cursor-paged in groups of five, and each article URL is actionable.
- Propagation contains one event per story article, ordered by publication time, and shows only the formatted publication date and source favicon/avatar.
- Source presentation uses the configured source favicon, then the article URL favicon, then the default source icon; labels use the configured site/domain or the article base URL.
- Missing optional images, summaries, categories, regions, entities, trends, and favicons never create broken assets, misleading placeholders, or broken card layouts. News cards omit images when no image exists.
- Counts are humanized. Relative times use hours for under 24 hours, days for 24 hours to under three days, and `MMM dd, YYYY` for older items.
- The interface remains readable and operable at 320px and common mobile viewport sizes in the dark coffee/charcoal theme, with no clipped primary content or page-level horizontal overflow.

## UX failure cases

- A story is repeated in a feed, or a related-source count is presented as an article count.
- Home content is category-filtered, or a category tab leaks content outside its mapped values.
- A feed requests more than five items, drops its cursor, reuses an exhausted cursor, or lets one feed's pagination state affect the other.
- Top Headlines is rendered as a vertical list, Latest News as a carousel, or carousel-end loading is unavailable or undiscoverable.
- A feed's error, loading, or empty state clears successful content from the other feed or gives no retry/continuation path.
- A missing image, favicon, category, region, entity, summary, or trend value leaves broken media, misleading text, an empty label, or unstable card height.
- A raw or implausible timestamp makes recency difficult to scan, or a long snapshot summary exceeds two lines.
- A story card opens the wrong story, loses the selected context without a way back, or renders a source URL as non-actionable text.
- Coverage is not latest-first, pagination repeats articles, or an article link does not open the source URL.
- Propagation contains mentions, trend history, or non-article events; uses the wrong date/favicon; or exposes article titles/source labels in the timeline.
- Horizontal scrolling traps vertical page scroll, hides the next card without an affordance, or requires desktop-only input.
- Low contrast, tiny controls, clipped content, or page-level horizontal overflow makes the dark mobile interface difficult to use.

## Test scenarios

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| Home feed composition | Mixed-category pages containing duplicate story IDs | Home loads | Top Headlines is all-category and recent; Latest News is news-only; both feeds contain unique stories. |
| Category filtering | Fixtures inside and outside one mapped category group | A category tab loads | Both feeds contain only stories matching the group's mapped category values. |
| Feed layouts | At least five stories per feed and another cursor page | The page renders and the user reaches each feed's end | Top Headlines is a horizontal carousel and requests the next five; Latest News remains a vertical list and exposes its load-more control. |
| Independent pagination | Two pages of five items for each feed | The user advances the feeds in either order | Only the selected feed appends its next unique page; existing content and the other feed remain unchanged. |
| End of feed | A feed returns no next cursor or no items | The user reaches its end | No further request or duplicate content is produced, and the feed stays usable. |
| Card fallbacks | Cards with missing optional fields and broken media URLs | Cards render | Images are omitted when absent, intentional default icons are used, metadata is omitted when unavailable, and card geometry remains usable. |
| Time, counts, and summary | Recent, two-day, and older timestamps; large counts; long summaries | Snapshot cards render | Time and counts are humanized, older dates use `MMM dd, YYYY`, and summaries occupy no more than two lines. |
| Story navigation | A visible story card with multiple source articles | The user opens it | The matching story detail loads, provides a way back, shows horizontal propagation, and shows linked vertical Coverage rows. |
| Propagation mapping | Story articles with ordered dates and present/missing favicons | The detailed story loads | There is one timeline item per article, ordered oldest-to-newest, with only the formatted date and favicon/avatar; missing favicons use the default icon. |
| Coverage pagination | A story with more than five articles and a next cursor | The user selects Coverage load more | The next five latest-first articles append once, without duplicates, and each URL is actionable. |
| Mentions excluded | Story articles with mention data | The detailed story loads | No mention request, event, or mention-specific empty state appears. |
| Detail empty state | A story with no articles | Its detail page loads | The story remains usable and Coverage states plainly that no articles are available; propagation is omitted when there are no events. |
| Error isolation and retry | One feed request fails while the other succeeds | The page loads, then the failed feed is retried | Successful content remains visible; only the failed feed reports the error and retry restores it. |
| Mobile usability | 320px and common mobile viewport sizes | The user navigates, scrolls, and opens cards | No page-level horizontal overflow or clipped primary content occurs; controls remain visible and operable by touch. |
| Dark-theme readability | Representative cards, loading, empty, and error states | The interface is inspected | Text, metadata, controls, media fallbacks, and status messages remain distinguishable against the dark theme. |

## Verification gates

- Static checks: `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass.
- Runtime smoke checks: home, category, and story routes load; Beans/Espresso proxy requests preserve `limit=5`, cursors, category filters, and the server-side API-key boundary.
- Manual UI checks: inspect the 320px viewport, a wider mobile viewport, carousel-end loading, latest-news load more, story navigation, Coverage links, loading/empty/error states, and dark-theme contrast.
