// Package room holds the live multiplayer state: rooms (a game + two players)
// and the hub that creates and looks them up.
package room

import (
	"errors"
	"sync"

	"github.com/erendgrmnc/chess3d/server/internal/game"
	"github.com/erendgrmnc/chess3d/server/internal/protocol"
)

// ErrRoomFull is returned when a third player tries to join a 1v1 room.
var ErrRoomFull = errors.New("room is full")

// Sender is the transport seam: a connected player we can push messages to.
// The transport layer's client implements this, so room depends on an
// abstraction rather than on the concrete WebSocket type.
type Sender interface {
	Send(protocol.ServerMessage)
}

// Room is one 1v1 game. All state changes go through the mutex, so the room is
// safe to drive concurrently from each player's read goroutine.
type Room struct {
	Code string

	mu       sync.Mutex
	game     *game.Game
	white    Sender
	black    Sender
	lastMove *protocol.LastMove
}

// NewRoom creates an empty room with a fresh game.
func NewRoom(code string) *Room {
	return &Room{Code: code, game: game.New()}
}

// Join seats a player as White (first) or Black (second) and returns their color.
func (r *Room) Join(s Sender) (string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var color string
	switch {
	case r.white == nil:
		r.white, color = s, "w"
	case r.black == nil:
		r.black, color = s, "b"
	default:
		return "", ErrRoomFull
	}

	s.Send(protocol.ServerMessage{Type: protocol.MsgJoined, Room: r.Code, Color: color})

	if color == "b" {
		// Both seats filled: tell White and sync the starting position to both.
		send(r.white, protocol.ServerMessage{Type: protocol.MsgOpponentJoined})
		r.broadcastState()
	} else {
		send(s, r.stateMessage())
	}
	return color, nil
}

// Move validates a move on behalf of `s` and, if legal, broadcasts the new state.
func (r *Room) Move(s Sender, from, to, promotion string) {
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
func (r *Room) Resign(s Sender) {
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
func (r *Room) Leave(s Sender) {
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
func (r *Room) IsEmpty() bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.white == nil && r.black == nil
}

func (r *Room) colorOf(s Sender) string {
	switch s {
	case r.white:
		return "w"
	case r.black:
		return "b"
	default:
		return ""
	}
}

func (r *Room) stateMessage() protocol.ServerMessage {
	return protocol.ServerMessage{
		Type:     protocol.MsgState,
		FEN:      r.game.FEN(),
		Turn:     r.game.Turn(),
		LastMove: r.lastMove,
		Status:   r.game.Status(),
		History:  r.game.History(),
	}
}

func (r *Room) broadcastState() { r.broadcast(r.stateMessage()) }

func (r *Room) broadcast(m protocol.ServerMessage) {
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
