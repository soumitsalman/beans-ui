# User Management and Personalization UX

This specification covers Beans authentication, account actions, content preferences, private custom pages, and API keys. The first sections define user-visible behavior, permissions, and failure handling; [Implementation design and considerations](#implementation-design-and-considerations) defines the intended technical boundaries without providing code.

## Product boundaries

- Clerk provides authentication and account-management UI. Use its built-in sign-in, sign-up, sign-out, and account-deletion experiences where they meet this specification.
- Zuplo manages API keys. API keys are a developer capability and never replace a Beans user session.
- Personalization changes only what Beans retrieves and displays for its owner. It does not change public categories, global editorial ranking, source content, other users' views, or the Beans/Espresso services.
- Everyone can browse Now, categories, stories, sources, and Search. A visitor may use the page's **More** control once to append one additional result batch. After that, a **Sign in for more content** prompt replaces further continuation loading on that page until the user signs in. An account is required to continue loading beyond that visitor allowance or to persist personal preferences/manage private pages and API keys.
- A user's preferences, custom pages, and API keys are private and single-owner in this version. There is no sharing, collaboration, or public profile surface.

## User states and permissions

| State | Valid actions | Disallowed actions |
| --- | --- | --- |
| Visitor | Browse public content; use Home Find and Search; use **More** once per rendered public page to append the next available batch; start sign-in/sign-up. | Load a second continuation batch on that page before signing in; save a preference; create, manage, or open a private page; manage API keys; delete an account. A temporary browser query must not be presented as a saved preference. |
| Authentication in progress | Complete, cancel, or recover sign-in/sign-up. | Open duplicate authentication dialogs; run account-only mutations; discard the originating route, query, filters, or visible results. |
| Signed-in user | Manage their own account, one active preference, custom pages, API keys, and session. | Read, alter, revoke, publish, or delete another user's content, account, or keys. |
| Expired/unavailable session | Continue public reading and sign in again. | Persist a draft, show private data from the stale session, or imply that an unsaved action succeeded. |
| Deletion pending | Review consequences, cancel, or explicitly confirm deletion. | Delete on one tap, continue account-only work after confirmation, or imply recovery unless the provider explicitly supports it. |

## Entry points and return behavior

- The header has one account control: **Sign in** for visitors; an identifiable account menu for signed-in users. The signed-in menu includes Account, Preferences, Custom pages, API keys, and Sign out.
- Selecting an account-only action while signed out explains the benefit in one short sentence and offers **Sign in** and **Create account**. It preserves the current location, query, filters, and results.
- A successful authentication returns the user to the action and context that initiated it. The protected action is resumed only after the appropriate editor or confirmation is visible.
- Cancelled, closed, or failed authentication returns to the unchanged originating experience. It must not create a preference or page, clear a search, or redirect to Account.
- Error messages are actionable but never expose provider tokens, internal account identifiers, or speculative explanations of account status.

## Sign-up and sign-in flow

1. The user selects **Sign in**, **Create account**, or an account-only action.
2. Beans opens the Clerk experience without replacing the underlying context.
3. The user signs in, signs up, completes required verification, cancels, or receives a recoverable error.
4. On success, the account control updates and Beans returns to the initiating context.
5. A first-time user is offered lightweight preference setup with **Set preferences** and **Not now**. Skipping is a valid completed onboarding path and leaves the normal public-style Home feed intact.

### Valid outcomes

- A verified sign-in/sign-up unlocks only the current user's private actions.
- A returning user sees their saved active preference on Home when one exists.
- A new user can defer personalization and start it later from Home or Account.
- The identity provider may ask for fresh verification before sensitive actions, such as account deletion or API-key management.

### Disallowed outcomes

- Creating an account must not automatically create a preference, page, or key.
- Text entered before authentication is not a saved preference unless the user reviews and explicitly saves it after authentication.
- Do not gate public reading behind authentication.

## Sign out

- **Sign out** is available only from the signed-in account menu or account UI.
- It ends the session and returns to a safe public route—normally the current public page, otherwise Home.
- Account-only controls and personal indicators disappear after sign-out; public browsing remains available.
- If the user has unsaved edits, they must choose to continue editing, discard, or cancel sign-out. Draft loss cannot be silent.

### Disallowed behavior

- Signing out never deletes the account, preferences, custom pages, or API keys.
- Signed-out views, page titles, and transient messages must not reveal personal data.
- A sign-out must not automatically sign the user back in or allow a protected mutation to finish afterward.

## Content preferences

### Purpose and presentation

- An active preference is one plain-language description of topics the user wants Beans to surface. It is a retrieval/display preference, not a promise of complete, neutral, or fact-checked coverage.
- V1 is a single text field. It uses approachable language and never exposes concepts such as embeddings or vectors.
- Signed-in users with no preference see a compact Home prompt asking what they want to follow. Users with an active preference see its saved description, active state, and **Edit**/**Clear** actions.
- The editor explains: “This changes your signed-in Beans home feed only.” Home makes a personalized feed visibly distinct, for example “Following your preferences.” Public categories retain their normal category meaning.
- V2 may add editable tags and news domains through a conversational assistant. Until that experience is explicitly designed and released, V1 must not show inactive tag/domain controls or imply that they are being inferred in the background.

### Save, edit, and clear flow

1. A signed-in user opens Preferences from Home or Account.
2. They enter or revise the plain-language description.
3. The field trims surrounding whitespace and shows whether it is valid. Empty/whitespace-only text is invalid; the visible field limit is enforced before submission.
4. **Save preferences** prevents duplicate submission while retaining the user's text.
5. On success, the saved text and active state update, and Home refreshes when the user returns to it.
6. On failure, the edited text remains available, the error is retryable, and the interface says whether the prior preference remains active.
7. **Clear preferences** asks for confirmation when a preference exists. Confirmation restores the default signed-in Home feed; it does not sign out or delete custom pages.

### Valid actions

- Create, view, replace, or clear one active preference while signed in.
- Express multiple interests in ordinary language when the field accepts the text.
- Save a Home/Search idea only through an explicit save action; a temporary query otherwise remains temporary.

### Disallowed actions and guardrails

- Do not save empty, whitespace-only, over-limit, or failed-validation input; preserve a valid draft while explaining the correction.
- Do not auto-save on typing, infer a preference from reading history, or replace a saved preference because a Home query changed.
- Do not hide personalization or suggest it changes public categories/upstream data.
- Do not use preference text to create an API key, publish a page, enroll notifications, or share data.
- Do not place raw preference text in public URLs, public sharing metadata, or non-essential telemetry.

## Custom pages

Custom pages are private, named, saved search definitions. They supplement—never replace—the public category pages.

### Create from Search

1. The signed-in user performs a Search with a meaningful query and/or committed filters.
2. **Save as custom page** is available only when there is a valid search definition to save. It can remain available for zero results so a narrow topic may be revisited.
3. The dialog displays the exact query/filter summary, asks for a page name, and states that the page is private.
4. The user confirms **Create page**. Only a successful confirmation creates the page, which then opens in its saved view.
5. A failure preserves the proposed name and definition and offers retry or cancel.

### Manage and use pages

- Account lists the owner's pages with name, query summary, and management actions.
- Opening a page re-runs its saved definition and uses the normal loading, empty, retry, and More states. It does not silently rewrite itself to match a newly run Search.
- The owner can explicitly rename, update from a reviewed current Search, or delete a page. Delete requires confirmation and returns to the page list or another safe public route.
- A malformed or unavailable definition shows a recoverable error and management path; it must not quietly broaden to an unrelated category or default feed.

### Valid actions

- Create only while signed in, from a valid definition and non-empty page name that meets the visible field rules.
- Open, rename, update, and delete only pages owned by the current user.
- Keep the private-page treatment clearly distinct from public categories.

### Disallowed actions

- Do not create a page from empty/default Search, an incomplete dialog, an invalid name, duplicate submission, or stale session.
- Do not save today's results as a permanent coverage promise: the saved object is the query definition and must show current retrieval states.
- Do not list private pages in public navigation, sitemaps, or sharing controls, or make them discoverable through a guessed URL.
- Do not let one user access or change another user's page, including through a direct URL.
- Do not overwrite a page definition because a different search was run; updating is explicit and reviewed.

## API keys

API keys are for the signed-in user's own developer use and are managed in the Zuplo experience.

- **API keys** requires a valid session and, if required by the provider, recent re-authentication.
- **API keys** are managed entirely through Zuplo hosted developer portal https://developer.cafecito.tech

### Disallowed API-key actions

- Never redisplay a full existing secret, put it in a URL/log/analytics event, or show it to another user.
- Never create keys for visitors, stale sessions, or a different account.
- Do not describe revocation as rotation without warning that integrations using the old key can stop working.
- A key must not grant account-management access or bypass Beans UI permissions.

## Account deletion

- Deletion is available only in the signed-in account-management experience and may require re-authentication.
- Before confirmation, state that the user will lose account access and their Beans preferences, custom pages, and API-key access subject to the applicable retention policy. Link that policy when available.
- The destructive control has an explicit confirmation step; cancellation returns to Account unchanged.
- A successful deletion ends the session, removes account-only UI, and shows a neutral completion state with a recovery/contact route only when one is actually supported.
- A failed deletion must not sign the user out prematurely or claim completion; retain a safe account state and offer retry/support.

### Disallowed deletion behavior

- Do not allow a visitor or URL/query parameter alone to trigger deletion.
- Do not delete on one accidental tap, imply sign-out deletes an account, or conceal loss of API-key access/personal content.
- Do not promise immediate erasure, recovery, or downstream deletion guarantees unsupported by the provider or retention policy.

## Cross-cutting interaction requirements

- The visitor continuation allowance applies to the user-operated **More** controls on Home, category, source, Search, and Story Related lists. The initial page content remains fully viewable. A visitor's first successful **More** action appends the normal next batch, then replaces/hides **More** and appends a clearly labeled **Sign in for more content** prompt after the rendered list.
- The prompt opens the standard authentication flow and preserves the route, query, filters, currently rendered results, and pagination position. After successful sign-in, normal continuation loading is enabled; do not silently fetch another batch without an explicit user action.
- Until sign-in succeeds, any remaining continuation controls on that page are disabled or unavailable and must not issue an additional content request. Retrying a failed allowed request does not consume a second continuation allowance; no successful extra batch may be appended from that retry.
- Controls are keyboard-operable, visibly focused, clearly named, and announce validation, saving, success, and failure without color alone.
- On narrow screens, menus/dialogs remain within the viewport with a clear cancel/close path and no horizontal overflow.
- Pending save/create/revoke/delete actions prevent duplicate requests; cancellation is never treated as success.
- Network, rate-limit, and session errors say what happened, whether the prior saved state remains intact, and the next valid action. They must never fabricate success.
- Personal data is minimized in UI copy, URLs, notifications, telemetry, and errors. No raw preference text or API secret appears in public sharing metadata.

## Implementation design and considerations

This section guides a future implementation. It does not authorize backend or API changes in the current documentation task.

### Current architecture to preserve

- Keep the Nuxt/Nitro presentation-action boundary. Browsers call same-origin actions; Beans/Espresso credentials remain server-only.
- Keep initial Home, category, source, Search, and Story content server-rendered. Authentication must not turn public pages into client-only shells or delay public content behind Clerk.
- Preserve existing cursor safety, duplicate removal, request-generation guards, timeouts, Retry-After handling, and visible-content-on-error behavior. Authentication and continuation access add policy; they do not replace those protections.
- Use Nuxt UI and shared Beans styles. Account, prompt, and continuation state should be reusable rather than duplicated by page.

| Surface | Existing continuation | Visitor policy scope |
| --- | --- | --- |
| Home | Feed `cursor` | One successful More batch for Home. |
| Category | Feed `cursor` | One per category. |
| Source | `source_cursor` | One per source. |
| Search | Search `cursor` | One per normalized committed query/filter definition. |
| Story | Related `cursor` | One per story's Related list. Initial Coverage remains public and is not truncated by this rule. |

### Authentication and identity boundary

- Clerk is the identity source. Verify its session on the server for every protected read or mutation; client `is_signed_in` state is presentation state, never authorization proof.
- Put only the stable Clerk user ID and necessary session/freshness state in the server request context. Never copy provider tokens into application state, URLs, logs, or telemetry.
- Continue using a signed, HttpOnly anonymous browser identity for signed-out continuation and rate-limit decisions. After sign-in, authorization uses the Clerk identity. Do not merge anonymous activity into an account without a separate explicit product rule.
- Validate post-authentication return targets as same-origin Beans paths. Arbitrary external return URLs are disallowed.
- Resolve auth during SSR and hydrate from the same state to avoid visitor-control flashes for signed-in users or stale private controls after sign-out.
- If Clerk is unavailable, public reading remains available. Personal actions fail closed with an actionable message; cached client state cannot substitute for a verified session.

### Visitor continuation enforcement

The visitor allowance is enforced on the server as well as represented in the UI.

- Centralize the rule across `feed`, `search`, and `related` presentation actions. A non-empty story, source, Search, or Related cursor is a continuation; an initial request is not.
- Scope the allowance by signed anonymous identity plus a normalized page-context fingerprint: Home, category ID, source ID, Story ID/Related, or normalized Search query/tags/domains. Store only hashes required for enforcement, not raw Search or preference text.
- Treat the allowance as one successful continuation per page context—not one per Vue mount. Refresh, hydration, Back/Forward, or reopening the same context must not restore **More**. A different category/source/story or materially different committed Search is a new context.
- Return a server-signed continuation context with the initial snapshot. Bind it to the anonymous identity, surface, normalized context, expected cursor, issue time, and expiry. Reject missing, expired, replayed, mismatched, or altered contexts before upstream work.
- Use a shared production store with atomic `reserved`, `consumed`, and released/expired states. Reserve before upstream work to prevent concurrent double loads; mark consumed after a successful allowed response; release after a definite failure so Retry remains valid. A crashed reservation expires.
- A successful allowed request consumes the allowance even if its batch is empty or contains only duplicates. When no cursor remains, show the natural end state. When another cursor remains, return `sign_in_required` and show **Sign in for more content**.
- A blocked second continuation performs no Beans/Espresso request. Disabled buttons, client counters, raw cursors, and the general rate-limit cookie are not sufficient enforcement.
- Rate limiting remains independent. A 429, timeout, validation failure, or upstream error may affect action quota under the existing policy but must not consume the successful-continuation allowance.
- Signed-in users bypass only this visitor gate and continue normally until cursor exhaustion, still subject to validation and rate limits. Sign-in enables **More** without automatically fetching. Session expiry preserves rendered content and returns the page to `sign_in_required` for further continuation.
- Cookie clearing can reset an anonymous conversion allowance. This is acceptable only if the restriction remains a UX/conversion prompt rather than a security or payment boundary. A stronger identity policy requires separate privacy review; do not silently use broad IP-only blocking that can affect shared networks.

### Shared continuation state

| State | Rendering and permitted action |
| --- | --- |
| `available` | Show **More**; permit one explicit visitor continuation. |
| `loading` | Retain cards, show progress, and block duplicate clicks. |
| `retryable_error` | Retain cards; Retry uses the same unconsumed allowance and cursor. |
| `sign_in_required` | Replace More with the sign-in prompt after the list. |
| `exhausted` | Render neither More nor a misleading sign-in promise. |
| `authenticated_available` | Show normal More while a cursor remains. |

- Implement this state once in a continuation-access composable/view model. Feed/Search composables own data and cursors; the access model owns whether continuation is permitted and which footer control appears.
- Extend the shared article-section footer to render More, Retry, the sign-in prompt, or the natural end state. Story Related should use the same contract even if its list markup remains specialized.
- Announce appended results and the sign-in requirement accessibly without unexpected focus movement. The prompt must remain keyboard-operable and fit at 320px.
- Telemetry may record surface, state transition, and counts. It must exclude raw searches/preferences, Clerk IDs, continuation tokens, API keys, and private page names.

### Personalization data and precedence

- Keep authentication records in Clerk. Store Beans-owned preferences and custom pages separately, keyed by stable Clerk user ID. Never store passwords, provider verification data, or session tokens.
- Use PostgreSQL in production and SQLite for local development, behind one typed repository/migration boundary. Vue components and route handlers should not contain database-dialect behavior.
- Suggested logical records:
  - `user_preferences`: unique owner ID, V1 text, schema version, timestamps, and concurrency version.
  - `custom_pages`: opaque ID, owner ID, name, normalized query/tags/domains, schema version, timestamps, and concurrency version.
  - `continuation_usage`: hashed anonymous identity/context, reservation/consumed state, expiry, and timestamps, with an identity-plus-context uniqueness constraint.
  - `account_cleanup`: idempotency key, owner ID, cleanup state, attempts, and last failure for cross-provider reconciliation.
- Validate and normalize at the server write boundary. Browser validation gives early feedback but is not authoritative. Align V1 preference length with the existing Search-text limit unless product requirements choose a different visible maximum.
- Load the signed-in Home preference on the server and pass it through the existing feed query. Personalized HTML and data responses are private/no-store and excluded from shared page caches.
- An explicit Home query or committed Search applies to that request but does not overwrite the preference. Saving/replacing remains a distinct mutation. Custom pages store normalized Search definitions, never result snapshots.
- Use opaque private-page IDs plus owner checks on every read/mutation. Requests for another user's page return a non-enumerating not-found result.
- Use optimistic concurrency or conditional updates so two tabs cannot silently overwrite a newer preference or custom-page edit.

### Account and provider integration

- Provision local Beans data lazily when the user first saves a preference/page; Clerk sign-up alone need not create a local row.
- Handle Clerk deletion through verified, idempotent webhooks or an equivalent provider-supported flow. Local personalization deletion and external API-access cleanup are separate steps; retry/reconcile partial failures instead of claiming atomic cross-provider deletion.
- Keep API-key creation, display, and revocation entirely in the Zuplo portal at `https://developer.cafecito.tech`. Beans stores no API-key secret and passes no Beans session or secret in the portal URL. Any later SSO must use a provider-supported signed handoff and a validated return target.
- Confirm Clerk, Zuplo, and Beans retention/deletion behavior before finalizing deletion copy. Promise only what all integrated systems can guarantee.

### Failure and security guardrails

- If personal storage is unavailable, public content remains readable; personal operations fail closed and saved state is not replaced with empty defaults.
- If auth expires during a mutation, reject it, retain a safe draft, and request authentication. Do not automatically replay a mutation after sign-in.
- Prevent duplicate submission in the UI and enforce idempotency/uniqueness on the server for fast clicks, concurrent tabs, retries, and webhook redelivery.
- Route/filter changes invalidate older continuation or personal responses through generation guards. Stale responses cannot replace current auth, cursor, preference, or prompt state.
- Never shared-cache authenticated HTML, private pages, account responses, or preference-bearing feeds. Clear private client state before rendering a signed-out view.
- Keep personal text and secrets out of access logs, exceptions, telemetry, history, and support-visible error messages.

### Delivery sequence

1. Add Clerk session resolution, SSR-safe account controls, protected-action helpers, cache isolation, and safe return-context handling.
2. Add centralized continuation enforcement/storage and shared continuation UI across all five public surfaces.
3. Add V1 preference persistence and Home precedence, including edit/clear and draft-preserving failures.
4. Add private custom-page CRUD using existing Search normalization and feed behavior.
5. Add verified account-cleanup orchestration and the authenticated Zuplo portal handoff.
6. Keep V2 conversational tags/domains behind a separate reviewed specification and feature flag.

Each phase must be independently releasable and reversible. Do not expose a control before its server authorization and failure handling are active.

### Verification design

- Unit tests cover the permission/state matrix, normalized context hashing, continuation reserve/complete/release transitions, validation, return-target checks, ownership, and preference/query precedence.
- Server integration tests prove direct actions cannot bypass visitor gating, concurrent More requests yield at most one success, failed allowed requests remain retryable, and signed-in sessions bypass only the continuation gate.
- SSR/cache tests prove public content remains server-rendered/indexable, personalized responses are private, hydration does not duplicate initial requests, and signed-out HTML contains no personal data.
- Browser tests cover all five surfaces, sign-in cancellation/success, session expiry, Back/Forward, refresh of an exhausted context, new Search context, cursor exhaustion, rate-limit interaction, multiple tabs, keyboard operation, and 320px layout.
- Persistence tests cover owner isolation, optimistic conflicts, idempotent deletion/webhooks, PostgreSQL/SQLite migration parity, and partial-cleanup recovery.
- Telemetry tests reject raw preferences, searches, page names, identity IDs, provider tokens, continuation contexts, and API secrets.

### Decisions required before implementation

- Clerk's supported Nuxt/server integration and session-verification pattern.
- The typed persistence/migration library and shared production store for atomic continuation reservations.
- Preference/page-name limits, duplicate-name behavior, and case sensitivity.
- Anonymous allowance lifetime and the intended behavior when privacy settings remove its cookie.
- Clerk/Zuplo deletion guarantees and ownership of partial-cleanup support.
- Whether Zuplo uses a separate login or a supported SSO handoff from Beans.

## Acceptance and failure checks

| Scenario | Success criterion | Failure guardrail |
| --- | --- | --- |
| Sign in from Search | The user returns to the same query/results and can deliberately save a page. | Cancellation/failure changes nothing and creates nothing. |
| Visitor continuation | Home, category, source, Search, and Story Related each append one successful More batch, then show Sign in for more content. | A second continuation request cannot be issued or render until the visitor signs in; initial content and the first appended batch remain visible. |
| First sign-up | The user can set a preference or select Not now. | No preference is silently created; public browsing remains available. |
| Preference save | A confirmed valid entry becomes active and Home labels/uses it. | Invalid/failed save preserves draft and prior preference. |
| Preference clear | Confirmation restores default signed-in discovery. | No sign-out, page deletion, or stale personalized label. |
| Save custom page | A named valid definition becomes a private page. | Empty/default search, invalid name, stale session, or duplicate submit creates no page. |
| Manage custom page | Only the owner can explicitly rename, update, or delete it. | A different search cannot overwrite it; another user cannot access it. |
| Sign out | Session ends; public reading remains possible. | Personal data is hidden and nothing is deleted. |
| Delete account | Consequences, confirmation, and completion/failure status are accurate. | One-click or unsupported-recovery deletion claims are impossible. |
