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
