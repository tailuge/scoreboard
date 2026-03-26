Use a two-layer identity model and keep the redirect contract simple.

  Model

  - profileId: stable player identity. Stored in localStorage. Survives browser restarts.
  - userName: stable display name. Stored in localStorage.
  - sessionId: live browser context identity. Generated in memory on page load. Not stored in localStorage.
  - clientId: optional alias for sessionId if you want clearer naming in presence payloads.

  What each ID is for

  - profileId: rankings, match history attribution, rematch targeting, deep links, redirects between app pages.
  - sessionId: lobby presence membership, “is this me?”, deduping exact live connections, multi-tab/iframe safety.

  Presence payload
  Publish presence with both IDs:

  {
    messageType: "presence",
    type: "join",
    profileId,
    userId: profileId, // optional compatibility field if your library expects userId
    userName,
    meta: {
      sessionId,
      origin: location.origin,
      ua: navigator.userAgent,
    },
    tableId,
    ruleType,
    opponentProfileId,
  }

  If you can add top-level fields instead of meta, even better:

  {
    profileId,
    sessionId,
    userName,
    ...
  }

  UI rules

  - Filter “me” by sessionId, not profileId.
  - Challenge/rematch/navigation should target profileId.
  - React keys for live presence rows should use sessionId if you want each tab visible separately.
  - If you want one row per human, dedupe by profileId and choose the “best” session to display.

  Recommended lightweight behavior
  For your app, I would do this:

  - Lobby list:
      - Show one row per profileId
      - Ignore rows whose sessionId === mySessionId
      - If multiple sessions exist for the same profileId, merge them into one display row
      - Prefer an “idle lobby” session over an in-game session for challengeability, or just show status summary
  - Challenge/rematch:
      - Send to profileId
      - Receiver accepts from whichever current sessionId is active
      - If needed, include targetSessionId only for very specific one-tab targeting, but default to profileId

  This keeps normal single-user behavior stable while avoiding two-tab confusion.

  Storage

  - localStorage:
      - profileId
      - userName
  - memory only:
      - sessionId
  - optional:
      - sessionStorage can hold sessionId if you want browser back/forward in the same tab to preserve the same live identity
        briefly, but memory-only is safer for iframe weirdness.

  Redirect contract
  Because your game app redirects with id,name in the query string and users may also hit Back, keep redirects based on stable
  identity only.

  Use:

  - profileId
  - userName

  Do not pass sessionId through game URLs unless you specifically need to restore the exact same live lobby session. Usually you
  do not.

  Example:

  /game?profileId=p123&userName=Alice
  /lobby?profileId=p123&userName=Alice

  On return to lobby:

  1. Read profileId and userName from query params if present.
  2. Persist them to localStorage.
  3. Generate a fresh sessionId.
  4. Join lobby presence with { profileId, sessionId, userName }.

  That means:

  - same player identity survives redirects and restarts
  - each lobby visit is a fresh live connection
  - back button and finished-game redirect remain simple

  Why this fits your current flows

  - Single user: behaves exactly how you want, because profileId and userName stay stable.
  - Two tabs: same person can open two live sessions without one being mistaken for the other.
  - Two iframes: same-origin storage sharing stops being a problem because live identity is not taken from shared storage.
  - Redirected game URLs: remain lightweight and stable, since they carry only durable identity.

  Decision point
  Choose one of these UI semantics:

  1. One person, one row:

  - dedupe by profileId
  - best for public lobby UX

  2. One connection, one row:

  - key by sessionId
  - best for debugging or operator visibility

  For this app, I’d recommend profileId for domain logic and sessionId for transport/live presence, with the lobby displaying one
  row per profileId.

  Minimal migration plan

  1. Rename current durable userId concept to profileId mentally, even if you keep field compatibility.
  2. Introduce generated sessionId on each lobby mount.
  3. Include both in presence.
  4. Change “other users” filtering to use sessionId.
  5. Keep redirects using only profileId and userName.
  6. Optionally dedupe lobby display by profileId.

  If you want, I can turn this into a concrete field-level spec for your current UserContext, MessagingContext, and lobby list
  logic without editing code.
