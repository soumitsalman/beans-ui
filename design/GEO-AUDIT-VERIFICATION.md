# GEO audit remediation and verification

Current direction (2026-10-03): the archive page/route is removed, along with category, sitemap and llms references. Prior archive implementation notes below are historical; current discovery relies on news/category/source links and the dynamic sitemap. Now has a visible Trending News heading; category eyebrows and source Back to news controls are removed.

Source: [Audit · GEO.pdf](./Audit%20%C2%B7%20GEO.pdf), geo.new report `aud_4a3ba86d19586318e5ca5ec5c766530d`, revision 22, 2026-10-02. The report inspected the home page's initial HTML, not the whole app. Its 52/100 score is a historical observation; this change does not claim a new score, ranking, or citation rate.

The 26 numbered recommendations on pages 12–14 are mapped below. **Implemented** means the local code addresses the finding; deployment and another live crawl are still necessary. **External** means code cannot truthfully supply the missing evidence. **Partial** identifies that boundary explicitly.

## Product-direction update — 2026-10-03

Beans is a publisher-news reader. The user's minimalist UI direction supersedes recommendations to add explanatory volume, question blocks and promotional follow controls to Now. Home retains news, descriptive metadata and structured data; source/signal explanations and the sharing checklist are consolidated on About. The older implementation evidence below records the preceding audit response, not a requirement to restore home prose. `/methodology` redirects to About; Archive/RSS routes remain available without footer or home promotions. Now uses five trending articles across all categories; category feeds retain the 1+4 mix. A fresh GEO result may still flag home word-count heuristics, which are intentionally subordinate to the reader experience.

## Quick wins

| # | Finding | Resolution and evidence |
| --- | --- | --- |
| 1 | Canonical target (CORE-06) | Implemented: preferred Beans origin in runtime/deployment defaults; one route-specific canonical, matching sitemap/robots/OG URLs; Fly-host 308 preserves path/query. HTTP fixture checks cover all primary routes. |
| 2 | HSTS/security headers (SEC-02/03) | Implemented: HTTPS HSTS, CSP, frame protection, nosniff, referrer and permissions policies. Local HTTPS-forwarding fixture verifies headers. HSTS does not force unverified subdomains; production HTTPS must be checked after deployment. CSP allows inline scripts/styles needed by the existing Nuxt app, with restricted script hosts, no objects and no framing. |
| 3 | Source attribution (CIT-13) | Implemented: server-rendered publisher identity/date and original-reporting title link; supplied credit and publication date in the cited-work metadata. The extra visible attribution paragraph was removed at the user's direction. Beans summaries are not presented as original reporting. |
| 4 | Description length (CORE-04) | Implemented: descriptive home metadata within the report's advisory 120–160-character range; route-specific descriptions for other pages. Story excerpts may legitimately be longer. |
| 5 | Title length (CORE-02) | Implemented: descriptive Beans home title within the advisory 30–70-character range; specific route titles. Publisher headlines are preserved rather than truncated only to satisfy a checker. |
| 6 | Cache headers (PERF-11) | Implemented: public HTML uses ETag and mandatory revalidation; unchanged content returns 304. Search and error HTML are private/no-store. Sitemap/RSS have bounded cache lifetimes. |
| 7 | Server response time (PERF-12) | Implemented mechanism: public feed results cached for 30 seconds in the UI's existing presentation proxy, without modifying upstream APIs. Search and errors are not cached. Warm fixture home took 36.1 ms with zero upstream feed requests. This is local evidence, not a production latency promise. |
| 8 | URL in sitemap (ACC-19) | Implemented: home and useful routes use the preferred origin; recent story-backed articles and sources are included. HTTP regression checks cover entries and outage behavior. |
| 9 | Skip link (A11Y-05) | Implemented: first focusable element links to the focusable main region, with visible keyboard-focus styling. |

## Medium-term recommendations

| # | Finding | Resolution and evidence |
| --- | --- | --- |
| 1 | Author attribution/bio (EAT-03/04) | Partial: the documented API `author` field is retained in cited-work metadata when supplied; the extra visible byline paragraph was removed at the user's direction. About links to the verified Cafecito team page. The API does not expose article-author bio/profile URLs; no person, credentials or bio is invented for a publisher or news aggregator. |
| 2 | Publication/modification dates (EAT-12) | Partial: original publication time is visible and included on the cited CreativeWork. The API does not provide a confirmed modification date; none is fabricated, and the home feed is not mislabeled as an authored article. |
| 3 | Three sameAs profiles/entity consistency (SCH-07, ENT-02) | Partial: Beans is modeled as the product/WebSite and Project Cafecito as its provider; the repository identifies the product, and the verified Project Cafecito GitHub organization identifies the provider. The accessible home H1 names Beans. Three independent official profile platforms have not been verified; unrelated founder profiles are not inserted as organization identities. |
| 4 | Image dimensions (IMG-04) | Implemented: all images in fixture home/category/article/source HTML have width and height; article media reserves an aspect ratio. Nuxt UI avatars already derive dimensions from their configured sizes. |
| 5 | Contact point (ENT-05, EAT-09) | Implemented: ContactPoint links to the verified private Cafecito contact page, also visible in the footer and methodology. No unverified phone/email or response-time guarantee is added. |
| 6 | Lists/tables (CIT-07) | Implemented: About contains the source/signal explanations and a practical sharing checklist; Now stays focused on news. |
| 7 | Modern/responsive images (IMG-06/07) | Implemented for the audited first-party logo: 24/48/72px WebP sources with `srcset`, sizes and intrinsic dimensions. The original logo is 1,139,566 bytes; variants are 174, 466 and 832 bytes. Publisher images remain direct hotlinks under the project data contract; generating third-party derivatives would require a separate delivery decision. |
| 8 | Three public profiles (ENT-04) | External: verify or establish real official profiles first. Do not create fake profiles, imply affiliations, or use founder accounts as equivalent organization identities merely to reach a count. |
| 9 | Question headings (CIT-05) | Implemented: About has clear headings for coverage, selection, signal definitions and sharing; home question blocks were removed at the user’s direction. |
| 10 | Primary-source links (EAT-07) | Implemented: SSR article detail links to the original publication; byline/date attribution stays with that work. Home cards link to populated detail pages, and story-less cards link directly to the publisher. |
| 11 | Specific figures (CIT-08) | Implemented with factual product definitions: 5 all-category trending items on Now; 1 trending + 4 latest on category feeds; 2-day and 7-day selection windows. No invented statistics, accuracy rates or research results. |
| 12 | Privacy/terms links (EAT-10) | Implemented: global footer links to existing official policies. Direct HTTP inspection on 2026-10-02 confirmed that the current terms/privacy pages cover Beans, despite stale search cache text describing only Espresso. No policy text was authored or changed. |

## Strategic recommendations

| # | Finding | Resolution and evidence |
| --- | --- | --- |
| 1 | Scorable content blocks (CIT-01/02/03) | Implemented: substantive explanations and factual selection definitions rendered on About. Home content-block scoring is intentionally subordinate to the minimalist news-reader UI. |
| 2 | Domain authority/backlinks (ENT-08) | External: earned links, editorial mentions and distribution need actual outreach. Existing code cannot prove a higher Moz score or new referring domains. See the non-code audit. |
| 3 | Content depth (EAT-05) | Implemented: About contains the merged methodology and source/signal explanations. Home shows SSR headlines and linked source detail without a word-count target. Content volume alone is not treated as proof of editorial quality. |
| 4 | First-hand experience/original data (EAT-01/02) | External: publish a genuine, reviewed comparison study or measured user case study with sources and methodology. Product behavior and local engineering measurements are not misrepresented as original journalism. |
| 5 | Reviews/testimonials/certifications (EAT-16) | External: obtain authentic, permissioned evidence first. No fabricated testimonials, ratings, certifications or AggregateRating schema is added. |

## Other report observations

- Robots access remains open. Optional Markdown negotiation, API catalogs, MCP cards, agent skill indexes, OAuth, commerce and WebMCP declarations are unscored or inapplicable to this news UI; this change does not invent unsupported capabilities. Existing `llms.txt` links to the UI's new discovery routes and the separate developer API surface.
- Wikipedia/Wikidata entries are informational and require genuine entity eligibility. None is fabricated.
- The report did not measure field Core Web Vitals and did not fetch inner pages. Mobile fixture checks, browser metrics and HTML tests must be distinguished from production data and from a new GEO audit.

## Reproduce and release gates

Final local verification (2026-10-03): 19 recommendations addressed by code, 3 partial and 4 external. Lint, typecheck, production build, analytics/HTTP regressions and mock-backed browser interactions pass. Browser checks cover hydration without an initial client feed refetch, pagination, both share destinations, clipboard success, skip focus, privacy-conscious events and responsive layouts. See [the verification record](./VERIFICATIONS.md#traffic-and-geo-completion--2026-10-03) for evidence and measurement limits. These results do not establish a new GEO score or field performance improvement.

1. Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, then `pnpm verify:discovery`.
2. Run `node scripts/verify-discovery.mjs --serve`. Browse `http://127.0.0.1:4921/` at 320px. The fixture replaces Google Analytics with a local collector at `/__events`; browser request paths are at `/__requests`, and upstream requests are at `http://127.0.0.1:4919/__requests`. It uses progressive Web Vitals reports for lab inspection; production defaults to final reports.
3. Exercise More, category/article/source navigation, archive next page (direct route), About, both sharing destinations, publisher links, search and the skip link. Confirm one page view with the correct route title, no raw search text in captured growth events, and no horizontal overflow.
4. After deployment, verify headers/redirects using public HTTPS, inspect real API data and social previews, submit the sitemap in Search Console/Bing, rerun GEO, and collect field Web Vitals and seven-day returns before claiming traffic/performance improvement.

Verified reference destinations: [contact](https://cafecito.tech/contact), [privacy](https://cafecito.tech/docs/privacy-policy/), [terms](https://cafecito.tech/docs/terms-of-use/), [team](https://cafecito.tech/docs/about-us/), [GitHub organization](https://github.com/projectcafecito).
