// Command server runs the chess3d multiplayer WebSocket server.
package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/erendgrmnc/chess3d/server/internal/room"
	"github.com/erendgrmnc/chess3d/server/internal/transport"
)

func main() {
	addr := flag.String("addr", ":8080", "host:port to listen on")
	flag.Parse()

	hub := room.NewHub()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", transport.Handler(hub))
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	log.Printf("chess3d server listening on %s (ws path: /ws)", *addr)
	if err := http.ListenAndServe(*addr, mux); err != nil {
		log.Fatal(err)
	}
}
