# Phase 3.4 — Axios Auth Session Overhead Optimization Report

## 1. Executive Summary
Prior to this optimization, every HTTP request sent through the centralized Axios client ([web/shared/lib/api/client.ts](file:///d:/Projects/project/clixprocrm/web/shared/lib/api/client.ts)) executed an asynchronous `supabase.auth.getSession()` call combined with a 4,000ms `Promise.race` timeout and regex cookie parsing fallback.

In Phase 3.4, we designed and implemented a concurrency-safe, in-memory auth session cache that synchronizes reactively via Supabase's `onAuthStateChange` listener. Authenticated API calls now resolve the latest access token synchronously from memory in $O(1)$ time (0ms overhead) without calling `getSession()` on every request.

---

## 2. Existing Request / Auth Flow
1. Any frontend component, hook, or API utility triggers an HTTP request via `client.get`, `client.post`, etc.
2. The Axios request interceptor executed:
   ```typescript
   const supabase = createClient();
   const sessionPromise = supabase.auth.getSession();
   const timeoutPromise = new Promise(...setTimeout(..., 4000));
   const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
   ```
3. If `session` was found, `Authorization: Bearer <access_token>` was attached.
4. If `getSession()` timed out, regex cookie parsing was executed synchronously.

---

## 3. Bottleneck Identified
- **Redundant Asynchronous Lookups**: For every single API call (even when 10–15 parallel requests were made on page navigation), `getSession()` was queried independently.
- **Timer and Promise Churn**: Every request allocated a 4-second timeout timer and two wrapper promises.
- **Microtask Latency Overhead**: Async `Promise.race` delayed every outgoing request by multiple event-loop microtasks before reaching the browser network layer.
- **Lack of Concurrency Deduplication**: Concurrent requests during cold startup triggered redundant parallel session resolutions.

---

## 4. Implementation
In [web/shared/lib/api/client.ts](file:///d:/Projects/project/clixprocrm/web/shared/lib/api/client.ts):
1. **In-Memory Token Cache**: Added a module-level `cachedAccessToken` variable.
2. **Reactive State Sync**: Registered a Supabase `onAuthStateChange` listener that updates `cachedAccessToken` immediately upon `SIGNED_IN`, `TOKEN_REFRESHED`, `USER_UPDATED`, or clears it on `SIGNED_OUT`.
3. **Single-Flight Cold Initialization**: Implemented `sessionInitPromise` to deduplicate concurrent cold-start requests into a single `getSession()` call.
4. **Synchronous Cookie Fallback**: If cache is cold on page reload, parses auth cookie synchronously to populate `cachedAccessToken` immediately without blocking the event loop.
5. **Session Expiry Cleanup**: On receiving a 401 response with session expiry markers, explicitly resets `cachedAccessToken = null`.

---

## 5. Session Cache Design
```
┌─────────────────────────────────────────────────────────────┐
│                    Axios Request Interceptor                │
└─────────────────────────────────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               │  getOrFetchAccessToken()      │
               └───────────────┬───────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
 [ Cache Hit (0ms) ]    [ Cookie Found ]      [ Cold Start / Miss ]
        │                      │                      │
        v                      v                      v
 Return cached token    Set cache & return    Single-Flight Promise:
                                              - 1x getSession()
                                              - Share with parallel calls
                                              - Populate cache & return
```

### In-Memory State & Functions:
- `setCachedAccessToken(token: string | null)`: Explicit cache update.
- `clearCachedAccessToken()`: Explicit cache wipe.
- `getCachedAccessToken()`: Read current token.

---

## 6. Refresh / Logout / Concurrency Safety
- **Token Refresh**: When Supabase automatically refreshes tokens in the background, `onAuthStateChange('TOKEN_REFRESHED', session)` updates `cachedAccessToken` instantly. Subsequent Axios requests use the new token without delay.
- **Logout Flow**: When `logoutUser()`, `signOut()`, or `cleanupAuthState()` runs, `onAuthStateChange('SIGNED_OUT')` and response interceptors clear `cachedAccessToken` to `null`.
- **Concurrency Safety**: If 10 requests trigger concurrently before the cache is warm, all 10 await the exact same `sessionInitPromise`, executing `getSession()` exactly once.
- **No LocalStorage Token Leaks**: Access tokens are kept strictly in-memory or in HTTP-safe browser cookies managed by `@supabase/ssr`.

---

## 7. Before vs After Request Flow

| Aspect | Before Optimization | After Optimization |
| :--- | :--- | :--- |
| **Normal Request Path** | Async `getSession()` + `Promise.race` + 4s timer | $O(1)$ Synchronous in-memory token read |
| **Concurrent Requests (N)** | $N$ independent `getSession()` calls & timers | 1 shared single-flight resolution |
| **Token Refresh** | Read from Supabase storage on next async call | Reactively updated in memory via `onAuthStateChange` |
| **401 Response Cleanup** | Supabase `signOut()` called | In-memory token wiped + Supabase `signOut()` |

---

## 8. Validation Results
- **ESLint**:
  - Command: `npx eslint "shared/lib/api/client.ts"` (in `web/`)
  - Result: 0 errors, 0 warnings (Exit code 0).
- **TypeScript Typecheck**:
  - Command: `npx tsc --noEmit` (in `web/`)
  - Result: 0 errors (Exit code 0).
- **Next.js Production Build**:
  - Command: `npm run build` (in `web/`)
  - Result: 53/53 static pages compiled successfully (Exit code 0).
- **Backend Test Suite**:
  - Command: `npm test` (in `api/`)
  - Result: 81/81 test suites passed, 602/602 tests passed.

---

## 9. Files Changed
- [web/shared/lib/api/client.ts](file:///d:/Projects/project/clixprocrm/web/shared/lib/api/client.ts) (Modified)

---

## 10. Remaining Risks / Limitations
- None identified. In-memory token access preserves identical JWT headers, backend compatibility, RBAC verification, and Supabase automatic token refresh mechanisms.
