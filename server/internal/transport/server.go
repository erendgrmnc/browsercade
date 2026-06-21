package transport

import (
	"net/http"

	"github.com/gorilla/websocket"

	"github.com/erendgrmnc/chess3d/server/internal/room"
)

// Handler returns an http.HandlerFunc that upgrades requests to WebSocket and
// runs a Client against the given hub.
//
// allowedOrigins is a browser-origin allowlist that guards against cross-site
// WebSocket hijacking. If empty (e.g. local dev), all origins are accepted.
func Handler(hub *room.Hub, allowedOrigins []string) http.HandlerFunc {
	allow := make(map[string]bool, len(allowedOrigins))
	for _, o := range allowedOrigins {
		allow[o] = true
	}

	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			if len(allow) == 0 {
				return true // unconfigured (dev): accept any origin
			}
			origin := r.Header.Get("Origin")
			if origin == "" {
				return true // non-browser client: no Origin header to forge
			}
			return allow[origin]
		},
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
