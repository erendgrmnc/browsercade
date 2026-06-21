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
	rooms map[string]*Room
}

// NewHub creates an empty hub.
func NewHub() *Hub {
	return &Hub{rooms: make(map[string]*Room)}
}

// Create makes a new room with a unique code and registers it. The bool is
// false when the server is at capacity (maxRooms).
func (h *Hub) Create() (*Room, bool) {
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
	r := NewRoom(code)
	h.rooms[code] = r
	return r, true
}

// Get looks up a room by its code.
func (h *Hub) Get(code string) (*Room, bool) {
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
