# browsercade

A little **arcade of 3D browser games** — built with React Three Fiber, with
server-authoritative online multiplayer over a Go WebSocket backend.

> Each game is a self-contained module registered in a catalogue; the arcade
> shell lazy-loads a game's (heavy, 3D) bundle only when you open it. Online play
> is a shared layer, so adding a multiplayer game doesn't mean rebuilding netcode.

## Games

| Game | Status | Notes |
| --- | --- | --- |
| ♟️ **3D Chess** | ✅ Playable | vs a hand-written negamax engine (Web Worker), or a friend online (server validates every move). |
| 🏓 **Ping Pong** | ✅ Playable | Table-tennis rally vs AI; mouse moves your paddle. |
| 🏀 **Basketball Hoop** | ✅ Playable | Aim + power with the mouse, click to shoot, on a 60-second clock. |
| 🍺 **Beer Pong** | ✅ Playable | Arc the ball into the cups; clear the whole rack. |
| 🎱 **Pool** | ✅ Playable | Break and sink all 15 — hand-rolled 2D physics, rendered in 3D. |

## Tech stack

| Area | Tech |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router |
| 3D | three.js, React Three Fiber, drei |
| Multiplayer | Go, WebSocket (server-authoritative) |

## Monorepo layout

```
browsercade/
├── web/      # React + Vite frontend (the arcade + games)
└── server/   # Go WebSocket multiplayer server
```

### Frontend architecture (`web/src`)

```
arcade/         registry (game catalogue) + Home + routing shell
games/
  chess/        a self-contained game module (default-exports its root component)
    domain/     framework-agnostic rules/AI (GameController, Engine, Opponent, …)
    components/ 3D board scene + chess UI
    hooks/      useChessGame / useOnlineGame
    workers/    ai.worker.ts (engine off the main thread)
  ping-pong/    (planned) — same module shape
  …
shared/
  ui/           cross-game controls (Button, SegmentedControl)
  net/          shared multiplayer config
App.tsx         routes: "/" → arcade, "/play/:id" → a game
```

Why it's shaped this way:

- **A game is a module.** Adding one = a folder under `games/` + one entry in `arcade/registry.ts`. The shell does the rest (routing, lazy-loading).
- **Single responsibility / DIP.** In chess, `GameController` owns the rules, `NegamaxEngine` owns search, the hook owns React, and the opponent is an `Opponent` interface — local AI today, online over WebSocket as a parallel implementation.
- **Code-split by game.** The arcade home is tiny; each game's Three.js bundle loads on demand.

## Getting started

Requires **Node 18+** (and **Go 1.22+** for the multiplayer server).

```bash
git clone https://github.com/erendgrmnc/browsercade.git
cd browsercade/web
npm install
npm run dev          # http://localhost:5173
```

Build for production:

```bash
cd web
npm run build        # outputs to web/dist
npm run preview
```

Online play connects to `VITE_SERVER_URL` (see `web/.env.example`), defaulting to
the deployed server. Set it to `ws://localhost:8080/ws` to use a local server.

### Multiplayer server

```bash
cd server
go run ./cmd/server  # WebSocket server on :8080 (see server/README.md)
```

## Roadmap

- [x] Arcade shell: game registry, routing, lazy-loaded game modules
- [x] **Chess** — 3D board, negamax AI (Web Worker), server-authoritative online play
- [x] **Ping Pong** — 3D, vs AI
- [x] **Basketball Hoop** — 3D, mouse aim, shot clock
- [x] **Beer Pong** — 3D, clear the rack
- [x] **Pool** — 3D render + hand-rolled 2D physics, sink all 15
- [ ] Online multiplayer for the arcade games (host-authoritative relay)
- [ ] Generalize the Go server to host multiple real-time game types

## License

MIT — see [LICENSE](./LICENSE).
