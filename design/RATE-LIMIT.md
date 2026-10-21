# Beans UI action rate limits

## Success criteria and failure modes

- Every document entry and public action is checked before Beans/Espresso work; script requests and UI requests have the same policy. Ten accepted actions in a rolling 60 seconds are allowed per verified browser ID, then 429 with Retry-After. SSR subrequests and action fan-out consume no extra quota.
- A signed cookie identifies a browser across changing IPs. Invalid, expired, future-dated, or missing cookies receive a fresh server identity and also use the 10/minute anonymous-IP fallback. All browsers share a separate 60/minute IP ceiling. These controls bound resets, while shared networks can still hit the fallback/ceiling.
- A configured Redis URL uses Redis Lua to check every applicable key and insert one unique member atomically, using Redis TIME. An absent or whitespace-only URL uses process-local memory in development and production; its synchronous check/update enforces the same rolling-window policy. Expired entries are removed on requests. Both stores keep HMAC hashes rather than raw IPs/IDs. Memory counters reset on process restart and are independent across instances; Redis shares counters across Machines. Use the same signing secret on every Machine.
- No public arbitrary backend proxy remains. Action inputs have allowlisted fields, constrained IDs/cursors/lists, fixed result sizes and bounded upstream page loops. Cookie IDs, forwards, click handlers and client-supplied permissions never authorize internal calls.
- A missing/short production signing secret, invalid/missing trusted IP or configured Redis outage returns 503 with Retry-After=5 before upstream work. A missing Redis URL selects memory and does not cause 503. A configured but unavailable Redis never silently switches to memory. Local Nuxt development can use an ephemeral signing secret.
- Personalized responses including cookie-bearing public pages are private/no-store. API errors show a specific rate-limit message. Automatic $fetch retries are disabled for actions.

## Public boundary

`POST /api/actions/{feed,search,story,source,coverage,related,signals}` charges one action. Home/category feed batches request five stories with one cursor and omit sort/exclusion parameters. Search returns five enriched results. Source returns its snapshot and initial feed in one action. Story returns its snapshot, confidence, complete bounded coverage and initial Related page. Coverage retry and Related More each count once. Enrichment runs inside those server actions, including SSR; this increases initial response latency compared with post-hydration enrichment. The former no-op `page` action is removed.

Nuxt middleware charges data document routes `/`, non-empty `/search`, `/categories/:slug`, `/stories/:id` and `/sources/:id`. SSR accesses a function attached to the real request event after the check; nothing equivalent is exposed through a client header or token. Hydration reuses payloads. Client navigation to data pages invokes their action endpoint. About, methodology and empty Search navigation spend no quota, including document requests. Assets, telemetry, robots, sitemap and unknown routes do not consume this quota. Former `/api/beans/**` and `/api/espresso/**` GET proxies return 404. The sitemap lists stable public routes and does not call Beans.

Actions have one 65-second deadline across their entire assembly; uncached upstream fetches receive its abort signal, and subsequent fetches check it before starting. Each upstream request has a 60-second timeout with retries disabled. Shared cached feeds use their independent 60-second fetch timeout so one caller cannot abort another caller's cache fill; the caller still exits at its action deadline. Browser actions time out after 70 seconds. Deadline failures return 503 with Retry-After=5. A 429 starts a browser-wide countdown from Retry-After, suppresses further action requests and disables Find, Search, Clear, More and Retry until expiry. Recovery requires a user action; it never automatically retries. Existing articles stay visible during feed/search refresh and failed refreshes; feed Retry preserves whether the failed request was a refresh or continuation.

## Fly/Docker configuration

Set the signing secret on every Fly Machine before deploying:

```sh
fly secrets set NUXT_RATE_LIMIT_COOKIE_SECRET="<same random 32+ character secret>"
```

Leave `NUXT_RATE_LIMIT_REDIS_URL` unset or blank to use memory. To share quotas later, set it to your Redis URL; use `rediss://` when the Redis service requires TLS. `fly.toml` sets `NUXT_RATE_LIMIT_TRUST_FLY=true`; Docker already passes runtime environment variables to Nitro, so no build-time secret is needed. This assumes traffic reaches the app through Fly Proxy and no external CDN precedes Fly. Keep direct/private ingress controlled; a caller able to reach the app without Fly Proxy could supply that trusted header. Elsewhere, leave trust disabled and use the socket IP. The anonymous cookie is HttpOnly, Secure in production, SameSite=Lax, Path=/ and has an enforced 30-day signed lifetime. Changing the signing secret resets browser identities.

Fly documents the original connection header at [Request headers](https://docs.fly.io/networking/request-headers). Redis documents atomic Lua rate checks at [Rate limiter](https://redis.io/docs/latest/develop/use-cases/rate-limiter/).

## Verification cases

`pnpm verify:rate-limit:memory` requires no Redis instance. It verifies concurrent admission, exact rolling expiry and rejection without charging other keys, then runs two production processes with empty Redis URLs to verify SSR content, ten-action browser limits, independent process counters, anonymous-IP fallback, the IP ceiling and rejection before upstream work.

`pnpm verify:rate-limit` uses an isolated Redis instance at `redis://127.0.0.1:4930` (override with TEST_REDIS_URL) and production `.output`. It verifies signatures/expiry/IP normalization, 30 concurrent requests admitting exactly ten, rolling expiration/TTL, cross-Machine/cross-IP browser quotas, cookie reset resistance, the IP ceiling, document single charging, rejected calls making zero upstream requests, proxy bypass blocking, malformed input and Redis outage behavior. Test with a dedicated Redis instance; the default local database is cleared after the test.

`pnpm verify:action-loading` covers deadline cancellation, completion/error cleanup and Retry-After parsing. The memory HTTP suite also covers a stalled upstream returning 503 and closing its connection, and static navigation after quota exhaustion. `pnpm verify:discovery` uses the same local Redis fixture and verifies action-backed SSR, metadata, feed/search filters, cached upstream streams and errors. Browser checks at 320px cover shared cooldown and disabled controls, retained articles on failure/timeout, refresh Retry without stale cursors, and no page actions on About/empty Search client navigation. Run `node scripts/verify-discovery.mjs --serve --loading-fixture` for controlled cooldown, delayed-response and client-timeout browser fixtures.
