// Package transport adapts WebSocket connections to the room layer. A Client
// owns one connection, pumps messages in/out, and implements room.Sender.
package transport

import (
	"log"
	"time"

	"github.com/gorilla/websocket"

	"github.com/erendgrmnc/browsercade/server/internal/protocol"
	"github.com/erendgrmnc/browsercade/server/internal/room"
)

const (
	sendBuffer = 16
	// maxMessageBytes caps inbound frames; a move message is a few dozen bytes,
	// so this bounds memory and blocks oversized-payload DoS.
	maxMessageBytes = 4096
	// pongWait is how long we wait for a pong before treating the peer as dead;
	// pingPeriod must be shorter so a ping always precedes the deadline.
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
	writeWait  = 10 * time.Second
)

// Client is one connected player.
type Client struct {
	conn *websocket.Conn
	hub  *room.Hub
	room room.Room

	send chan protocol.ServerMessage
	done chan struct{}
}

func newClient(conn *websocket.Conn, hub *room.Hub) *Client {
	return &Client{
		conn: conn,
		hub:  hub,
		send: make(chan protocol.ServerMessage, sendBuffer),
		done: make(chan struct{}),
	}
}

// Send queues a message for delivery. Non-blocking: if the buffer is full the
// message is dropped rather than stalling the room (which holds a lock).
func (c *Client) Send(m protocol.ServerMessage) {
	select {
	case c.send <- m:
	case <-c.done:
	default:
	}
}

func (c *Client) close() {
	select {
	case <-c.done:
		// already closed
	default:
		close(c.done)
		_ = c.conn.Close()
	}
}

// leaveCurrentRoom removes the client from its room (if any) and reclaims the
// room once empty, so repeatedly creating/joining rooms cannot leak them.
func (c *Client) leaveCurrentRoom() {
	if c.room == nil {
		return
	}
	c.room.Leave(c)
	if c.room.IsEmpty() {
		c.hub.Remove(c.room.Code())
	}
	c.room = nil
}

// readPump reads client messages until the connection closes, then cleans up.
func (c *Client) readPump() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("recovered from client panic: %v", r)
		}
		c.leaveCurrentRoom()
		c.close()
	}()

	c.conn.SetReadLimit(maxMessageBytes)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		return c.conn.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		var msg protocol.ClientMessage
		if err := c.conn.ReadJSON(&msg); err != nil {
			return
		}
		c.handle(msg)
	}
}

func (c *Client) handle(msg protocol.ClientMessage) {
	switch msg.Type {
	case protocol.MsgCreate:
		c.leaveCurrentRoom()
		r, ok := c.hub.Create(msg.Game)
		if !ok {
			c.Send(protocol.ServerMessage{Type: protocol.MsgError, Message: "server is full, try again later"})
			return
		}
		c.room = r
		if err := r.Join(c); err != nil {
			c.Send(protocol.ServerMessage{Type: protocol.MsgError, Message: err.Error()})
		}

	case protocol.MsgJoin:
		r, ok := c.hub.Get(msg.Room)
		if !ok {
			c.Send(protocol.ServerMessage{Type: protocol.MsgError, Message: "room not found"})
			return
		}
		// Guard against joining a room for a different game (shared code space).
		if msg.Game != "" && msg.Game != r.Game() {
			c.Send(protocol.ServerMessage{Type: protocol.MsgError, Message: "room is for a different game"})
			return
		}
		c.leaveCurrentRoom()
		c.room = r
		if err := r.Join(c); err != nil {
			c.room = nil
			c.Send(protocol.ServerMessage{Type: protocol.MsgError, Message: err.Error()})
		}

	default:
		// move/resign/relay → the room decides what it understands.
		if c.room != nil {
			c.room.Handle(c, msg)
		}
	}
}

// writePump delivers queued messages and sends periodic pings to keep the
// connection alive and to detect dead peers.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		if r := recover(); r != nil {
			log.Printf("recovered from writePump panic: %v", r)
		}
		ticker.Stop()
	}()

	for {
		select {
		case m := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteJSON(m); err != nil {
				return
			}
		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteControl(websocket.PingMessage, nil, time.Now().Add(writeWait)); err != nil {
				return
			}
		case <-c.done:
			return
		}
	}
}
