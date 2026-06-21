# chess3d server

Server-authoritative multiplayer for chess3d, over WebSocket.

The server is the single source of truth: it owns the game, **validates every
move** (an illegal or forged move is rejected), and broadcasts authoritative
state to both players. Clients render state; they never decide it.

## Run

Requires **Go 1.22+**.

```bash
cd server
go mod tidy        # fetch deps + generate go.sum (first run only)
go run ./cmd/server # listens on :8080, WebSocket at /ws
```

Override the address with `-addr`:

```bash
go run ./cmd/server -addr :9000
```

Health check: `GET /health` → `ok`.

## Configuration

| Env var | Default | Purpose |
| ------- | ------- | ------- |
| `PORT` | `8080` | Port to listen on. Set automatically by Render and most PaaS hosts. |
| `ALLOWED_ORIGINS` | *(unset)* | Comma-separated browser origins allowed to open WebSockets (CSWSH guard). **Unset = accept any origin** (dev only). In production set it to your frontend, e.g. `https://your-site.vercel.app`. |

The `-addr` flag, if given, overrides `PORT`.

## Deploy to Render (free)

This repo includes a [`render.yaml`](../render.yaml) blueprint and a `Dockerfile`.

1. Push the repo to GitHub.
2. In Render: **New → Blueprint**, select the repo. Render reads `render.yaml`
   and provisions a free Docker web service from `server/`.
3. After the first deploy, set **`ALLOWED_ORIGINS`** (Environment tab) to your
   deployed frontend origin and redeploy.
4. Your endpoint is `wss://<service>.onrender.com/ws` — point the web client at it.

Notes:
- Render's free tier **sleeps after ~15 min idle**; the first request then cold-starts (~30–60s). Games in progress are unaffected (not idle).
- Render terminates TLS, so clients connect over `wss://` automatically.
- Run `go mod tidy` and commit `go.sum` to pin dependencies and speed up builds.

## Layout

```
cmd/server        entrypoint (flags, HTTP mux)
internal/
  protocol        JSON message types (client <-> server)
  game            authoritative rules/state (wraps notnil/chess)
  room            Room (game + 2 players) and Hub (matchmaking by code)
  transport       WebSocket Client; adapts a connection to room.Sender
```

`room` depends on a small `Sender` interface, not on the WebSocket type — so the
transport can change without touching game logic.

## Protocol

All messages are JSON. Connect to `ws://<host>/ws`.

### Client → server

| `type`   | fields | meaning |
| -------- | ------ | ------- |
| `create` | — | create a room; you become White |
| `join`   | `room` | join a room by code; you become Black |
| `move`   | `from`, `to`, `promotion?` | attempt a move (squares like `e2`,`e4`) |
| `resign` | — | resign the game |

### Server → client

| `type`            | fields | meaning |
| ----------------- | ------ | ------- |
| `joined`          | `room`, `color` | you're seated (`color` = `w`/`b`) |
| `state`           | `fen`, `turn`, `lastMove`, `status`, `history` | authoritative snapshot |
| `opponentJoined`  | — | the other seat filled |
| `opponentLeft`    | — | opponent disconnected |
| `gameOver`        | `status`, `result` | game ended (`result` = `1-0`/`0-1`/`1/2-1/2`) |
| `error`           | `message` | a request was rejected |

## Flow

1. Player A sends `create` → gets `joined {color:"w"}` + initial `state`.
2. Player A shares the room code; Player B sends `join {room}` → gets `joined {color:"b"}`; both get `state`, A also gets `opponentJoined`.
3. Each `move` is validated; on success both receive a fresh `state` (and `gameOver` if it ended).
