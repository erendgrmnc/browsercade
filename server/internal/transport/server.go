package transport

import (
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/erendgrmnc/chess3d/server/internal/room"
)

// Handler returns an http.HandlerFunc that upgrades requests to WebSocket and
// runs a Client against the given hub.
func Handler(hub *room.Hub) http.HandlerFunc {
	upgrader := websocket.Upgrader{
		// Demo: allow any origin. Tighten this to the deployed web origin in prod.
		CheckOrigin: func(_ *http.Request) bool { return true },
	}

	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return // Upgrade already wrote an error response.
		}
		client := newClient(conn, hub)
		go client.writePump()
		client.readPump()
	}
}
