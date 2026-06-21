# chess3d

Browser-playable **3D chess**. Play against a hand-written AI engine now; online
multiplayer over WebSocket (Go backend) is in progress.

> Built as a portfolio demo around real-time / networked systems — the AI runs in
> a Web Worker, and the architecture is set up so multiplayer slots in as a new
> implementation of the same `Opponent` seam rather than a rewrite.

---

## Features

- ♟️ **3D board** rendered with React Three Fiber — orbit the camera, click a piece to see legal moves, with selection / last-move / capture / check highlighting.
- 🤖 **Play vs AI** — a from-scratch **negamax search with alpha-beta pruning** and a material + piece-square evaluation, run **off the UI thread in a Web Worker**. Difficulty = search depth.
- 🎚️ Play as White or Black, three difficulty levels, undo, board flip, live move list.
- 🌐 **Online multiplayer** — play a friend via a 4-letter room code over a server-authoritative Go WebSocket backend (`server/`). The server validates every move.

## Tech stack

| Area | Tech |
| --- | --- |
| Frontend | React 18, TypeScript, Vite |
| 3D | three.js, React Three Fiber, drei |
| Chess rules | [chess.js](https://github.com/jhlywa/chess.js) |
| AI | Hand-written negamax + alpha-beta (no external engine) |
| Multiplayer (WIP) | Go, WebSocket |

## Monorepo layout

```
chess3d/
├── web/      # React + Vite frontend (this is the playable app)
└── server/   # Go WebSocket server for online multiplayer (WIP)
```

### Frontend architecture (`web/src`)

The code is split so rules, AI, and UI don't bleed into each other — and so the
opponent is an abstraction, not a hard-coded local engine:

```
domain/
  chess/      GameController (wraps chess.js), types, square helpers   ← framework-agnostic
  ai/         Engine interface + NegamaxEngine, evaluation, move ordering, PSTs
  opponent/   Opponent interface, LocalAIOpponent (Web Worker)         ← DI seam
workers/      ai.worker.ts — runs the engine off the main thread
hooks/        useChessGame — bridges domain ↔ React
components/   board/ (3D scene) + ui/ (reusable controls) + ChessGame
config/       theme (palette)
```

Why it's shaped this way:

- **Single responsibility** — `GameController` knows the rules, `NegamaxEngine` knows search, the hook knows React. None know about each other's concerns.
- **Dependency inversion** — `useChessGame` depends on the `Opponent` interface. `LocalAIOpponent` (Web Worker) satisfies it today; a `RemoteOpponent` (WebSocket) can satisfy it for multiplayer with **no changes to the UI or game flow**.
- **Open/closed** — a stronger AI (e.g. Stockfish WASM) is a new `Engine` implementation; nothing else changes.

## Getting started

Requires **Node 18+** (and **Go 1.22+** later, for the multiplayer server).

```bash
# clone
git clone https://github.com/erendgrmnc/chess3d.git
cd chess3d

# run the frontend
cd web
npm install
npm run dev          # http://localhost:5173
```

Build for production:

```bash
cd web
npm run build        # outputs to web/dist
npm run preview      # serve the production build locally
```

The **Online** mode connects to the multiplayer server at `VITE_SERVER_URL`
(see `web/.env.example`). It defaults to the deployed server, so online play
works out of the box; set it to `ws://localhost:8080/ws` to use a local server.

### Multiplayer server (WIP)

```bash
cd server
go run ./cmd/server  # starts the WebSocket server (default :8080)
```

## Roadmap

- [x] 3D board + interaction (React Three Fiber)
- [x] Local AI opponent (negamax + alpha-beta) in a Web Worker
- [x] Server-authoritative online multiplayer (Go + WebSocket): rooms, matchmaking, move validation
- [ ] Reconnection / resume after disconnect
- [ ] Time controls (chess clocks)
- [ ] glTF piece models, promotion picker

## License

MIT — see [LICENSE](./LICENSE).
