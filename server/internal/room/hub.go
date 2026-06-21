package room

import (
	"crypto/rand"
	"sync"
)

// codeAlphabet excludes easily-confused characters (0/O, 1/I).
const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

const codeLength = 4

// maxRooms bounds memory on small/free hosts. Reaching it makes Create fail
// rather than letting room creation grow without limit.
const maxRooms = 5000

// Hub owns all live rooms and hands out join codes.
type Hub struct {
	mu    sync.Mutex
	rooms map[string]Room
}

// NewHub creates an empty hub.
func NewHub() *Hub {
	return &Hub{rooms: make(map[string]Room)}
}

// Create makes a new room for the given game type with a unique code and
// registers it. An empty or "chess" game type yields an authoritative chess
// room (the legacy chess client sends no game field); any other type yields a
// game-agnostic relay room. The bool is false at capacity (maxRooms).
func (h *Hub) Create(gameType string) (Room, bool) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if len(h.rooms) >= maxRooms {
		return nil, false
	}

	var code string
	for {
		code = randomCode()
		if _, taken := h.rooms[code]; !taken {
			break
		}
	}

	var r Room
	if gameType == "" || gameType == GameChess {
		r = NewChessRoom(code)
	} else {
		r = NewRelayRoom(code, gameType)
	}
	h.rooms[code] = r
	return r, true
}

// Get looks up a room by its code.
func (h *Hub) Get(code string) (Room, bool) {
	h.mu.Lock()
	defer h.mu.Unlock()
	r, ok := h.rooms[code]
	return r, ok
}

// Remove deletes a room (called once it's empty).
func (h *Hub) Remove(code string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.rooms, code)
}

func randomCode() string {
	b := make([]byte, codeLength)
	_, _ = rand.Read(b)
	for i := range b {
		b[i] = codeAlphabet[int(b[i])%len(codeAlphabet)]
	}
	return string(b)
}
