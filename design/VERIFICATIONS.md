# Beans UI Verifications

This document defines implementation acceptance for the mobile-first UI. It does not claim live API behavior unless a check is listed under the verification record.

## Success criteria

- Home and category routes render one vertical article feed. Each five-item batch loads one trending result and four latest results, passes opposite-feed article IDs in `exclude_ids`, de-duplicates IDs, fills from the remaining feed when one is exhausted, and retains the two-day/seven-day date windows.
- Source pages render a publisher snapshot with the favicon overlapping a header banner, a scheme-free URL label with a link icon, and latest source articles in five-item cursor pages without trending interleaving. Domain-filtered results must match the route source ID.
- Article cards show source identity, publish time, category, title followed by confidence then an outlined `Leans Left`/`Leans Right` badge, trend icon, optional image, up to two entities and regions, up to five distinct other-publisher avatars without a text heading, `trend.related` only when positive, and only positive mentions/comments/likes. Confidence and ideology badges share a size and rounded shape; missing or empty values are omitted. On home and category cards, trend sits beside publish time.
- Article cards route to `/articles/{article.id}` only when `story_id` exists; otherwise the article URL remains the destination. Source links appear only when a source ID exists. Image URLs remain direct outbound hot links.
- Article detail loads `/articles/{id}` and batch confidence by article ID. Coverage drains similar-article pages of 100 into the favicon/date timeline. Related uses a separate five-item cursor and the existing article-row presentation.
- Search keeps its query/tag controls, URL behavior, API filters, and five-item pagination while rendering the shared article card.
- Existing theme, header, category mapping, footer, date/count formatting, confidence labels, source/favicons fallback, referral parameters, and server-only API credentials remain intact.
- At 320px and common mobile widths, cards and controls remain usable with no page-level horizontal overflow.

## Failure cases to guard against

- One feed's exclusion set omits previously loaded IDs, duplicate articles appear, or a feed's cursor repeats and causes an infinite fetch loop.
- One feed's failure removes already loaded cards, retry loses its cursor, or a failed stream is incorrectly marked exhausted.
- A category/source route change lets a stale request overwrite the new page; source filters or category filters leak into another feed. A source-ID-only filter returns an empty feed even though domain-filtered news exists, or the domain results include another source ID.
- Missing article/source IDs create invalid internal links; missing or failed images/favicons leave broken media.
- Missing confidence or ideology renders a fabricated value, numeric trend scores appear, social counts show zero, or a source count is confused with `trend.related`.
- Coverage and Related share or overwrite cursor state, repeated articles show twice, a failed Coverage page discards earlier pages, or More remains after the related cursor ends.
- The title links to a story ID instead of the article ID, or a story-less article stops opening its publisher URL.
- Search sends publisher filters or loses its existing `q`, normalized `tags`, news-only, relevance-threshold, and cursor behavior.
- External links lose existing query strings, hashes, or UTM values; API keys appear in client requests or runtime configuration.

## Acceptance scenarios

| Scenario | Given | When | Then |
| --- | --- | --- | --- |
| Mixed first batch | Trending and latest each return several articles | Home loads | Requests are sequential: trending limit 1, then latest limit 4 with the trending IDs excluded; five unique cards appear. |
| Cross-feed exclusion | Multiple More batches are loaded | Each stream requests another page | Trending excludes IDs already loaded from latest; latest excludes IDs already loaded from trending; dates and category filters stay fixed. |
| Feed exhaustion | Trending or latest returns fewer items or ends | More is clicked | The other stream fills remaining slots when possible; More disappears when both streams are exhausted. |
| Cursor safety | A response returns an empty page, null cursor, or repeated cursor | A feed loads | Pagination terminates or advances safely without duplicate cards or an infinite loop. |
| Source snapshot | A valid source ID is opened | Source page loads | `/sources/{id}` metadata supplies `domain`; `/articles/latest?domains={domain}` returns articles verified against the route source ID; a bare `url` is normalized to HTTPS for the link and displayed without the scheme; the source feed pages five at a time. |
| Card layout | Home and category cards have trend, confidence, and ideology | Cards render | Trend icon is inline with publish date; title is followed by confidence then outlined `Leans Left` or `Leans Right` in the same size and rounded shape; a badge wrapping to a new line starts at the title's left edge; missing badges are omitted; publisher avatars appear without `Other publishers` text. |
| Card destinations | Articles with and without `story_id`, with/without `source.id` | User clicks title, publisher, avatar, or image | Story-backed article opens `/articles/{article.id}`; story-less article opens its URL; source links require an ID; image opens its image URL. |
| Publisher enrichment | Similar articles include repeated and primary publishers | A feed card enriches | At most five distinct other-publisher avatars appear without a text heading; pagination stops at five sources or the final cursor; a related count appears only for positive `trend.related`. Zero does not hide avatars or positive social counts. |
| Confidence batch | Several article IDs have mixed confidence data | Feed enrichment completes | One comma-separated batch request uses article IDs; available labels render and missing results are omitted. |
| Article detail | Article has multiple similar pages | Detail route loads | Snapshot appears independently; Coverage drains 100-item pages; Related loads five and advances its own cursor with More, including when a page has no articles but still has a next cursor. |
| Search preservation | Query, tags, and a `sources` URL parameter are supplied | Search runs | Existing URL cleanup and Beans query parameters remain correct; results use the shared article cards. |
| Mobile layout | Home, category, source, search, and article routes are rendered at 320px | Pages are inspected | No horizontal page overflow; links, labels, images, and More controls remain operable. |
| Proxy boundary | API calls are made in browser and server contexts | Requests are inspected | Browser calls target same-origin Nuxt proxies; API credentials remain server-only. |

## Verification record

- Nuxt typecheck and the production build pass after the source-feed and card changes. ESLint on changed implementation files passes. Whole-app ESLint reports only the existing double-quoted string at `app/composables/useGoogleAnalytics.ts:31`, outside this change.
- Live proxy checks on 2026-09-30: unique trending/latest feeds returned HTTP 200; populated `exclude_ids` was accepted, while an empty `exclude_ids=` returned HTTP 400 and is now omitted. The batch confidence route returned article IDs and discrete confidence values. Private similar articles returned paginated article data. Source detail returned metadata. `sources={id}` returned zero latest articles for BBC and PsyPost despite known articles; `domains={source.domain}` returned five matching articles and a cursor for both. API credentials were read only by the server-side proxies.
- Route smoke checks: `/`, a category, `/search`, `/articles/{id}`, and `/sources/{id}` returned HTTP 200; the removed `/stories/{id}` route returned HTTP 404. Browser checks showed the shared card on a 320px category viewport, five shared search cards, article detail sections, and source metadata. A source whose API `url` lacked a scheme exposed a broken relative link during inspection; the source page now normalizes it to `https://`, and the retest points to the external source URL with referral parameters. The BBC source page now visibly renders five source-matched articles, a More cursor, the overlapping favicon, and the scheme-free `www.bbc.co.uk` label. The home card shows date and Hot inline plus an outlined `Leans Right` badge beside category.
- Batch ordering, exclusions, de-duplication, exhaustion fill, cursor retries, and independent detail cursors are acceptance scenarios above. Live API checks confirmed parameter acceptance and response envelopes but do not exhaustively simulate every pagination or failure case.
- At 320px, the home card and source profile remain within the viewport (document scroll width 305px for a 320px viewport), and the source favicon still crosses the banner edge. The visible home card places Hot beside its date and the outlined ideology beside category. The source page shows five BBC cards and More.
- After the related-count guard, ESLint on `ArticleCard.vue` and Nuxt typecheck pass. Browser inspection of five home cards shows no `0 articles` label; positive `4 articles` and `9 articles` labels still render, and publisher avatars remain visible without an `Other sources` heading.
- After moving ideology to the title, the home card visibly places the outlined badge after the linked title, including when the title wraps at 320px. The document has no horizontal overflow at that width, the title and badge have a text-space separator, and ESLint plus Nuxt typecheck pass.
- After moving confidence to the title, the shared card places it before ideology and omits either missing value. The ideology badge uses the confidence badge's `sm` size, full rounding, and padding. Browser checks on home showed missing-confidence cards without a blank badge and a wrapped title/ideology at 320px with no horizontal overflow; ESLint on `ArticleCard.vue` and Nuxt typecheck pass. The live checked cards did not supply confidence, so the two-badge visual state was verified by component structure and matching classes rather than a live card.
- Removed fixed left margins from the title badges while retaining inline text separation. At 320px, a wrapped ideology badge on the second home card begins at x=31px, the same as its title; the document scroll width remains 305px. ESLint on `ArticleCard.vue` and Nuxt typecheck pass.
