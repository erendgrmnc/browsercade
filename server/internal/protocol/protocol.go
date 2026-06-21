// Package protocol defines the JSON messages exchanged over the WebSocket.
package protocol

// Client -> server message types.
const (
	MsgCreate = "create" // create a new room; sender becomes White
	MsgJoin   = "join"   // join an existing room by code; sender becomes Black
	MsgMove   = "move"   // attempt a move (validated server-side)
	MsgResign = "resign" // resign the game
)

// Server -> client message types.
const (
	MsgJoined         = "joined"         // you joined a room; includes your color
	MsgState          = "state"          // authoritative game state snapshot
	MsgOpponentJoined = "opponentJoined" // the other seat was filled
	MsgOpponentLeft   = "opponentLeft"   // the other player disconnected
	MsgGameOver       = "gameOver"       // game ended (mate/draw/resign)
	MsgError          = "error"          // a request was rejected
)

// ClientMessage is anything the browser sends us.
type ClientMessage struct {
	Type      string `json:"type"`
	Room      string `json:"room,omitempty"`
	From      string `json:"from,omitempty"`
	To        string `json:"to,omitempty"`
	Promotion string `json:"promotion,omitempty"`
}

// LastMove is the most recent move, for client-side highlighting.
type LastMove struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// ServerMessage is anything we send back. Fields are omitted when empty so each
// message type only carries what it needs.
type ServerMessage struct {
	Type     string    `json:"type"`
	Room     string    `json:"room,omitempty"`
	Color    string    `json:"color,omitempty"` // "w" | "b"
	FEN      string    `json:"fen,omitempty"`
	Turn     string    `json:"turn,omitempty"` // "w" | "b"
	LastMove *LastMove `json:"lastMove,omitempty"`
	Status   string    `json:"status,omitempty"`
	History  []string  `json:"history,omitempty"`
	Result   string    `json:"result,omitempty"` // "1-0" | "0-1" | "1/2-1/2"
	Message  string    `json:"message,omitempty"`
}
