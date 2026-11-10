# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Frontend for **Ace Spade**, a multiplayer card game (Spades-style bidding/trick-taking, plus Clan Battle and Poker modes). Talks to `ace-spade-backend` (Spring Boot). See `ARCHITECTURE.md` for the full cross-repo picture.

## Commands

```bash
npm install
npm run dev        # Vite on :5173, proxies /api and /ws to http://localhost:8080
npm run build      # `tsc && vite build` -> dist/. tsc is the only type check/lint.
npm run preview
```

- There is **no test runner and no linter** configured. `npm run build` (strict `tsc` with `noUnusedLocals`/`noUnusedParameters`) is the correctness gate; unused imports or params fail the build.
- The backend (plus Redis and MySQL) must be running for anything beyond the login screen.
- Production is served under a subpath. `VITE_BASE_PATH` (Docker default `/acespade/`) sets Vite `base`, the router `basename`, the axios `baseURL` and the SockJS URL. Always derive URLs from `import.meta.env.BASE_URL` (as `services/api.ts` and `services/websocket.ts` do); never hardcode `/api` or `/ws`.
- Docker image only emits `/dist` (`FROM scratch`); it is meant to be copied into an nginx stage by an external compose file that is not in this repo.

## Architecture

**Two transports, one server.** REST (axios, `services/*Api.ts`) handles auth, room create/join/rejoin, leaderboards, seasons and admin. Everything in a live game goes over a single STOMP-over-SockJS connection (`services/websocket.ts`). That module holds a module-level singleton client and a connection key of `roomCode:sessionToken`.

**Two separate credentials:**
- JWT (access + refresh) from `authApi`, stored in localStorage key `ace-spade-auth`. The axios request interceptor in `services/api.ts` refreshes it when it is within 30s of expiry. Only REST uses it.
- A per-room **session token** (`X-Session-Token` STOMP CONNECT header), returned by create/join/rejoin/spectate and stored in localStorage key `acespade_session`. This is what authenticates the WebSocket and identifies the `playerId`.

**Server-driven state.** `store/gameStore.ts` (Zustand, ~550 lines) is the single game state. The UI never computes game rules; it applies events:
- `/topic/game/{room}` -> `handleGameEvent` switches on `GameEvent.type` (`ROOM_UPDATED`, `BID_PLACED`, `CARD_PLAYED`, `TRICK_ENDED`, `ROUND_ENDED`, `POKER_UPDATE`, ...).
- `/user/queue/hand` -> private hand updates; `/user/queue/snapshot` -> full state resync; `/user/queue/errors` -> error toasts.
- Client actions are `send*` helpers publishing to `/app/game/{room}/{start|bid|play|ready|vote-bot|kick|team|poker|chat|leave|pause|resume}`.

When adding a game event or action, change **both** repos: the `EventType` union / payload types in `src/types/game.ts` must mirror the backend `dto/GameEvent.EventType` and DTOs, and a new `case` is needed in `handleGameEvent`.

**Reconnect / resume.** `App.tsx` `SessionBootstrap` runs `services/sessionRestore.ts` on load: if a stored session exists it calls the backend resume endpoint, `applyResume`s into the store and navigates to `/game`. `/game` redirects to `/` when `roomCode` is empty, so store hydration order matters. `scheduleDisconnect` delays socket teardown by 500ms so React StrictMode remounts do not drop the connection; use it (not `disconnect`) from effect cleanups.

**Game modes** (`constants/gameModes.ts`, mirrors backend `GameMode`): `CLASSIC`, `RUTHLESS_HIDDEN`, `CLAN_BATTLE`, `POKER`. Only Classic and Ruthless are ranked and have their own MMR, leaderboard and season rewards. Poker uses a separate `poker` slice and `PokerTable` UI; Clan Battle adds team scores/names.

**Layout:** `pages/` are routes (`GamePage` and `LobbyPage` are the large ones), `components/` the reusable UI, `store/` has `authStore`, `gameStore` and `displayStore`, and `constants/tiers.ts` drives rank/tier badges and rewards. Styling is inline styles plus Framer Motion; there is no CSS framework.

`mockups/` and `samples/` are static HTML design references only. They are not part of the build.
