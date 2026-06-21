package room

import (
	"sync"

	"github.com/erendgrmnc/browsercade/server/internal/protocol"
)

// RelayRoom is a game-agnostic 1v1 room. It owns no game state: it seats two
// players (host first, guest second) and forwards each "relay" payload to the
// other seat. All game rules and simulation live in the browser, so one server
// serves every physics game without re-implementing any of them.
type RelayRoom struct {
	code string
	game string

	mu    sync.Mutex
	host  Sender
	guest Sender
}

// NewRelayRoom creates an empty relay room tagged with its game type.
func NewRelayRoom(code, gameType string) *RelayRoom {
	return &RelayRoom{code: code, game: gameType}
}

// Code returns the room's join code.
func (r *RelayRoom) Code() string { return r.code }

// Game returns the game type this room relays (e.g. "pool").
func (r *RelayRoom) Game() string { return r.game }

// Join seats a player as host (first) or guest (second).
func (r *RelayRoom) Join(s Sender) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	var seat string
	switch {
	case r.host == nil:
		r.host, seat = s, "host"
	case r.guest == nil:
		r.guest, seat = s, "guest"
	default:
		return ErrRoomFull
	}

	s.Send(protocol.ServerMessage{Type: protocol.MsgJoined, Room: r.code, Game: r.game, Seat: seat})

	// Both seats filled: let the host know its opponent has arrived. The clients
	// negotiate the initial game state themselves over relay payloads.
	if seat == "guest" {
		send(r.host, protocol.ServerMessage{Type: protocol.MsgOpponentJoined})
	}
	return nil
}

// Handle forwards a relay payload to the other seat. Non-relay messages are
// ignored (a relay room has no moves to validate).
func (r *RelayRoom) Handle(s Sender, msg protocol.ClientMessage) {
	if msg.Type != protocol.MsgRelay {
		return
	}
	r.mu.Lock()
	other := r.other(s)
	r.mu.Unlock()
	send(other, protocol.ServerMessage{Type: protocol.MsgRelay, Payload: msg.Payload})
}

// Leave removes a player and notifies the other that their opponent left.
func (r *RelayRoom) Leave(s Sender) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var other Sender
	switch s {
	case r.host:
		r.host, other = nil, r.guest
	case r.guest:
		r.guest, other = nil, r.host
	default:
		return
	}
	send(other, protocol.ServerMessage{Type: protocol.MsgOpponentLeft})
}

// IsEmpty reports whether both seats are vacant, so the hub can reclaim the room.
func (r *RelayRoom) IsEmpty() bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.host == nil && r.guest == nil
}

// other returns the seat opposite to s (caller holds the lock).
func (r *RelayRoom) other(s Sender) Sender {
	switch s {
	case r.host:
		return r.guest
	case r.guest:
		return r.host
	default:
		return nil
	}
}
