# Ace Spade Frontend

React + TypeScript UI for the Ace Spade multiplayer trick-taking card game.

## Stack

- React 18, TypeScript, Vite
- Zustand (state), STOMP over SockJS (WebSocket)
- Framer Motion (animations)

## Local development

```bash
npm install
npm run dev
```

Runs at **http://localhost:5173** and proxies `/api` and `/ws` to the backend at `http://localhost:8080`.

Start the [ace-spade-backend](https://github.com/rohit94875/ace-spade-backend) first (Redis + MySQL required).

## Production build

```bash
npm run build
```

Output in `dist/`. In production the app is served under `/acespade/` (see `vite.config.ts` `base`).

## Docker

Built as part of the homelab stack — see parent `ace-spade/docker-compose.yml` on the home server.
