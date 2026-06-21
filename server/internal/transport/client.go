// Package transport adapts WebSocket connections to the room layer. A Client
// owns one connection, pumps messages in/out, and implements room.Sender.
package transport

import (
	"time"

	"github.com/gorilla/websocket"

	"github.com/erendgrmnc/chess3d/server/internal/protocol"
	"github.com/erendgrmnc/chess3d/server/internal/room"
)

const (
	sendBuffer = 16
	pingPeriod = 30 * time.Second
	writeWait  = 10 * time.Second
)

// Client is one connected player.
type Client struct {
	conn *websocket.Conn
	hub  *room.Hub
	room *room.Room

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

// readPump reads client messages until the connection closes, then cleans up.
func (c *Client) readPump() {
	defer func() {
		if c.room != nil {
			c.room.Leave(c)
			if c.room.IsEmpty() {
				c.hub.Remove(c.room.Code)
			}
		}
		c.close()
	}()

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
		c.room = c.hub.Create()
		if _, err := c.room.Join(c); err != nil {
			c.Send(protocol.ServerMessage{Type: protocol.MsgError, Message: err.Error()})
		}

	case protocol.MsgJoin:
		r, ok := c.hub.Get(msg.Room)
		if !ok {
			c.Send(protocol.ServerMessage{Type: protocol.MsgError, Message: "room not found"})
			return
		}
		c.room = r
		if _, err := r.Join(c); err != nil {
			c.Send(protocol.ServerMessage{Type: protocol.MsgError, Message: err.Error()})
		}

	case protocol.MsgMove:
		if c.room != nil {
			c.room.Move(c, msg.From, msg.To, msg.Promotion)
		}

	case protocol.MsgResign:
		if c.room != nil {
			c.room.Resign(c)
		}
	}
}

// writePump delivers queued messages and sends periodic pings to keep the
// connection alive through proxies.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer ticker.Stop()

	for {
		select {
		case m := <-c.send:
			if err := c.conn.WriteJSON(m); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.conn.WriteControl(websocket.PingMessage, nil, time.Now().Add(writeWait)); err != nil {
				return
			}
		case <-c.done:
			return
		}
	}
}
