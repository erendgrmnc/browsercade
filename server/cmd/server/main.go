// Command server runs the chess3d multiplayer WebSocket server.
package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/erendgrmnc/chess3d/server/internal/room"
	"github.com/erendgrmnc/chess3d/server/internal/transport"
)

func main() {
	addr := flag.String("addr", "", "host:port to listen on (defaults to :$PORT, then :8080)")
	flag.Parse()

	hub := room.NewHub()
	allowedOrigins := parseOrigins(os.Getenv("ALLOWED_ORIGINS"))

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", transport.Handler(hub, allowedOrigins))
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		// Readable cross-origin so the web client can probe readiness (wake the
		// free-tier server) before opening a WebSocket.
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	listenAddr := resolveAddr(*addr)
	if len(allowedOrigins) == 0 {
		log.Print("warning: ALLOWED_ORIGINS not set — accepting WebSocket connections from any origin")
	}
	log.Printf("chess3d server listening on %s (ws path: /ws)", listenAddr)
	if err := http.ListenAndServe(listenAddr, mux); err != nil {
		log.Fatal(err)
	}
}

// resolveAddr prefers an explicit -addr flag, then $PORT (set by hosts like
// Render), then a local default.
func resolveAddr(flagAddr string) string {
	if flagAddr != "" {
		return flagAddr
	}
	if port := os.Getenv("PORT"); port != "" {
		return ":" + port
	}
	return ":8080"
}

// parseOrigins splits a comma-separated origin allowlist, trimming blanks.
func parseOrigins(raw string) []string {
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			origins = append(origins, t)
		}
	}
	return origins
}
