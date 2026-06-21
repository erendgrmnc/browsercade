// Package room holds the live multiplayer state: rooms (a game + two players)
// and the hub that creates and looks them up.
//
// Two room kinds implement the Room interface:
//   - ChessRoom is server-authoritative: it owns a chess engine and validates moves.
//   - RelayRoom (relay_room.go) is game-agnostic: it just forwards opaque payloads
//     between the two seats, so the physics games simulate in the browser.
package room

import (
	"errors"
	"sync"

	"github.com/erendgrmnc/browsercade/server/internal/game"
	"github.com/erendgrmnc/browsercade/server/internal/protocol"
)

// ErrRoomFull is returned when a third player tries to join a 1v1 room.
var ErrRoomFull = errors.New("room is full")

// GameChess is the game type for the authoritative chess room. Any other (or
// empty, for the legacy chess client) is unused here; relay rooms accept any tag.
const GameChess = "chess"

// Sender is the transport seam: a connected player we can push messages to.
// The transport layer's client implements this, so room depends on an
// abstraction rather than on the concrete WebSocket type.
type Sender interface {
	Send(protocol.ServerMessage)
}

// Room is one live 1v1 match. The hub and transport hold this interface so they
// can treat authoritative (chess) and relay (physics) rooms uniformly.
type Room interface {
	Code() string                                  // the join code
	Game() string                                  // the game type, e.g. "chess" | "pool"
	Join(s Sender) error                           // seat a player (errors if full)
	Handle(s Sender, msg protocol.ClientMessage)   // dispatch a gameplay message
	Leave(s Sender)                                 // remove a player, notify the other
	IsEmpty() bool                                  // both seats vacant → reclaimable
}

// ChessRoom is one server-authoritative chess game. All state changes go through
// the mutex, so the room is safe to drive concurrently from each player's read
// goroutine.
type ChessRoom struct {
	code string

	mu       sync.Mutex
	game     *game.Game
	white    Sender
	black    Sender
	lastMove *protocol.LastMove
}

// NewChessRoom creates an empty chess room with a fresh game.
func NewChessRoom(code string) *ChessRoom {
	return &ChessRoom{code: code, game: game.New()}
}

// Code returns the room's join code.
func (r *ChessRoom) Code() string { return r.code }

// Game returns the game type ("chess").
func (r *ChessRoom) Game() string { return GameChess }

// Handle dispatches a gameplay message to the chess-specific handlers.
func (r *ChessRoom) Handle(s Sender, msg protocol.ClientMessage) {
	switch msg.Type {
	case protocol.MsgMove:
		r.Move(s, msg.From, msg.To, msg.Promotion)
	case protocol.MsgResign:
		r.Resign(s)
	}
}

// Join seats a player as White (first) or Black (second).
func (r *ChessRoom) Join(s Sender) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	var color string
	switch {
	case r.white == nil:
		r.white, color = s, "w"
	case r.black == nil:
		r.black, color = s, "b"
	default:
		return ErrRoomFull
	}

	s.Send(protocol.ServerMessage{Type: protocol.MsgJoined, Room: r.code, Color: color})

	if color == "b" {
		// Both seats filled: tell White and sync the starting position to both.
		send(r.white, protocol.ServerMessage{Type: protocol.MsgOpponentJoined})
		r.broadcastState()
	} else {
		send(s, r.stateMessage())
	}
	return nil
}

// Move validates a move on behalf of `s` and, if legal, broadcasts the new state.
func (r *ChessRoom) Move(s Sender, from, to, promotion string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	color := r.colorOf(s)
	if color == "" {
		return
	}
	if r.black == nil {
		send(s, errorMessage("waiting for an opponent"))
		return
	}
	if r.game.Turn() != color {
		send(s, errorMessage("not your turn"))
		return
	}
	if err := r.game.Move(from, to, promotion); err != nil {
		send(s, errorMessage("illegal move"))
		return
	}

	r.lastMove = &protocol.LastMove{From: from, To: to}
	r.broadcastState()
	if r.game.IsOver() {
		r.broadcast(protocol.ServerMessage{
			Type:   protocol.MsgGameOver,
			Status: r.game.Status(),
			Result: r.game.Result(),
		})
	}
}

// Resign ends the game in favour of the resigning player's opponent.
func (r *ChessRoom) Resign(s Sender) {
	r.mu.Lock()
	defer r.mu.Unlock()

	color := r.colorOf(s)
	if color == "" {
		return
	}
	result := "0-1" // White resigned
	if color == "b" {
		result = "1-0"
	}
	r.broadcast(protocol.ServerMessage{Type: protocol.MsgGameOver, Status: "resigned", Result: result})
}

// Leave removes a player and notifies the other that their opponent left.
func (r *ChessRoom) Leave(s Sender) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var other Sender
	switch s {
	case r.white:
		r.white, other = nil, r.black
	case r.black:
		r.black, other = nil, r.white
	default:
		return
	}
	send(other, protocol.ServerMessage{Type: protocol.MsgOpponentLeft})
}

// IsEmpty reports whether both seats are vacant, so the hub can reclaim the room.
func (r *ChessRoom) IsEmpty() bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.white == nil && r.black == nil
}

func (r *ChessRoom) colorOf(s Sender) string {
	switch s {
	case r.white:
		return "w"
	case r.black:
		return "b"
	default:
		return ""
	}
}

func (r *ChessRoom) stateMessage() protocol.ServerMessage {
	return protocol.ServerMessage{
		Type:     protocol.MsgState,
		FEN:      r.game.FEN(),
		Turn:     r.game.Turn(),
		LastMove: r.lastMove,
		Status:   r.game.Status(),
		History:  r.game.History(),
	}
}

func (r *ChessRoom) broadcastState() { r.broadcast(r.stateMessage()) }

func (r *ChessRoom) broadcast(m protocol.ServerMessage) {
	send(r.white, m)
	send(r.black, m)
}

func send(s Sender, m protocol.ServerMessage) {
	if s != nil {
		s.Send(m)
	}
}

func errorMessage(text string) protocol.ServerMessage {
	return protocol.ServerMessage{Type: protocol.MsgError, Message: text}
}
