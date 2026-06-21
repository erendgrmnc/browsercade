// Package protocol defines the JSON messages exchanged over the WebSocket.
package protocol

import "encoding/json"

// Client -> server message types.
const (
	MsgCreate = "create" // create a new room; sender becomes the first seat
	MsgJoin   = "join"   // join an existing room by code; sender becomes the second seat
	MsgMove   = "move"   // chess: attempt a move (validated server-side)
	MsgResign = "resign" // chess: resign the game
	MsgRelay  = "relay"  // relay games: forward an opaque payload to the other seat
)

// Server -> client message types.
const (
	MsgJoined         = "joined"         // you joined a room; includes your color/seat
	MsgState          = "state"          // chess: authoritative game state snapshot
	MsgOpponentJoined = "opponentJoined" // the other seat was filled
	MsgOpponentLeft   = "opponentLeft"   // the other player disconnected
	MsgGameOver       = "gameOver"       // chess: game ended (mate/draw/resign)
	MsgError          = "error"          // a request was rejected
	// MsgRelay (reused for server->client): an opaque payload from the other seat.
)

// ClientMessage is anything the browser sends us. Chess uses From/To/Promotion;
// relay games use Game (on create/join) and Payload (on relay).
type ClientMessage struct {
	Type      string          `json:"type"`
	Room      string          `json:"room,omitempty"`
	Game      string          `json:"game,omitempty"`
	From      string          `json:"from,omitempty"`
	To        string          `json:"to,omitempty"`
	Promotion string          `json:"promotion,omitempty"`
	Payload   json.RawMessage `json:"payload,omitempty"`
}

// LastMove is the most recent move, for client-side highlighting.
type LastMove struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// ServerMessage is anything we send back. Fields are omitted when empty so each
// message type only carries what it needs. Chess uses Color/FEN/Turn/...; relay
// games use Game/Seat/Payload.
type ServerMessage struct {
	Type     string          `json:"type"`
	Room     string          `json:"room,omitempty"`
	Game     string          `json:"game,omitempty"`  // relay: game type echoed on join
	Seat     string          `json:"seat,omitempty"`  // relay: "host" | "guest"
	Color    string          `json:"color,omitempty"` // chess: "w" | "b"
	FEN      string          `json:"fen,omitempty"`
	Turn     string          `json:"turn,omitempty"` // "w" | "b"
	LastMove *LastMove       `json:"lastMove,omitempty"`
	Status   string          `json:"status,omitempty"`
	History  []string        `json:"history,omitempty"`
	Result   string          `json:"result,omitempty"` // "1-0" | "0-1" | "1/2-1/2"
	Message  string          `json:"message,omitempty"`
	Payload  json.RawMessage `json:"payload,omitempty"` // relay: opaque game payload
}
