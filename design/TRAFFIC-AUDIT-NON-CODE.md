# Beans discoverability and traffic audit — non-code work

Audit date: 2026-10-02. Target: https://beans.cafecito.tech. These actions cover deployment operations, search-console work, editorial positioning, distribution, partnerships, and measurement. They pair with the code actions in [TRAFFIC-AUDIT-CODE.md](./TRAFFIC-AUDIT-CODE.md).

## Evidence and limits

- The live sitemap and metadata point to `cafecito-beans-app.fly.dev`, while the requested public site is `beans.cafecito.tech`.
- Public exact-domain search returned no results. This is not proof of zero indexing; Search Console must establish the actual status.
- The sitemap contains nine static URLs and no stories or sources.
- Current footer links are mostly outbound. No reciprocal inbound-link plan was evident from the inspected UI.
- One sampled coverage timeline began with an apparently unrelated July article; this needs human review, not a conclusion about the entire grouping system. A card showed 210 related articles while detail Coverage showed 92, so count definitions should be explained.
- Search Console, GA reports, and Core Web Vitals were not accessed. Current traffic, indexing, and performance baselines are unknown.

## Prioritized actions

| Priority | Rectifying action | Outcome / verification |
| --- | --- | --- |
| P0 | Apply the production public-origin setting alongside the code correction and verify deployed redirects. | Set `NUXT_PUBLIC_SITE_URL=https://beans.cafecito.tech`; confirm the preferred host works and the Fly host redirects. |
| P0 | Verify ownership in Google Search Console and Bing Webmaster Tools. Submit the corrected sitemap and inspect home, category, article, and source URLs. | Establish actual indexing status, canonical selection, rendered HTML, and exclusion reasons. Use [URL Inspection](https://support.google.com/webmasters/answer/9012289). |
| P1 | Choose one initial audience and search intent, such as readers comparing coverage of AI developments. Research their language and publish a small set of useful curated comparison explainers linked from topic pages. | Build relevance beyond a generic all-news feed; attribute publishers and avoid mass-produced duplicate headline pages. |
| P1 | Run a repeatable distribution pilot: three useful story comparisons per week in two channels where the target audience already participates. Use tagged Beans links and a clear reason to inspect coverage. | Compare engaged visits, coverage opens, and shares by channel. Follow each community’s posting rules. |
| P1 | Add contextual inbound links from Cafecito, Espresso publications, developer docs, and the GitHub README. Seek a few relevant newsletter/editorial collaborations demonstrating source comparison. | Verify external links use the preferred Beans domain and referral traffic is measurable. |
| P1 | Review representative story grouping and count definitions with the data owner. Publish honest signal methodology and a corrections/contact policy. | Resolve the apparently unrelated sample and the 210-versus-92 count difference before using either story in promotion. Keep API/backend fixes outside this UI scope. |
| P2 | Start a curated weekly digest with an existing service, test it with a small group of target readers, and revise positioning based on return behavior. | Track signup, engaged return visits, and referral conversion. Test paid promotion only after identifying an effective audience/message and measurable landing-page behavior. |

## GEO report follow-through

- After deployment, rerun the GEO home-page audit and inspect representative inner pages. The historical score is not a new measurement. Verify public HTTPS headers, canonical redirects, sitemap entries and real source content.
- Verify or establish additional genuine Project Cafecito public profiles before adding them to organization `sameAs`. The verified GitHub organization and the Beans repository represent different entities; founder profiles must not be substituted for organization profiles.
- Publish genuine original comparison research or a documented user case study with methodology and sources. Obtain permission for authentic testimonials or ratings; only then add matching markup. Earn editorial links through the distribution/outreach plan.
- Author biography/profile links and confirmed modification dates need authoritative upstream fields or editorial evidence. The UI now retains supplied author names and publication dates; it does not invent missing information.
- Collect mobile field LCP/INP/CLS and seven-day return rates after release. Confirm GA4 enhanced-measurement/history settings do not generate a second automatic page view alongside the explicit application events, and verify captured campaign attribution in the actual property.
- See `GEO-AUDIT-VERIFICATION.md` for the numbered 26-item crosswalk and the limits of local tests.

## Operating metrics

Track weekly: useful indexed Beans URLs; organic impressions/clicks and non-brand queries; engaged referral visits; coverage-open and coverage-share rates; newsletter signups; and seven-day return rate. Set numeric traffic targets after collecting a baseline.

The existing `llms.txt` can keep the corrected origin, but additional AI-specific files are not a priority: [Google says llms.txt is not used for Search or its generative features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide). Consider Google Discover after indexed pages provide distinct value and relevant images; eligibility does not guarantee traffic.
