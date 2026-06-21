// Package game wraps a chess engine to provide authoritative rules and state.
// The server is the single source of truth: every move is validated here before
// it is accepted, so a malicious or buggy client cannot make an illegal move.
package game

import (
	"errors"

	"github.com/notnil/chess"
)

// ErrIllegalMove is returned when a requested move is not legal in the position.
var ErrIllegalMove = errors.New("illegal move")

// Game is a single chess game.
type Game struct {
	game *chess.Game
}

// New starts a game from the standard opening position.
func New() *Game {
	return &Game{game: chess.NewGame()}
}

// FEN returns the current position in Forsyth–Edwards Notation.
func (g *Game) FEN() string {
	return g.game.FEN()
}

// Turn returns the side to move, "w" or "b".
func (g *Game) Turn() string {
	if g.game.Position().Turn() == chess.White {
		return "w"
	}
	return "b"
}

// Move validates and applies a move given as algebraic squares (e.g. "e2","e4"),
// with an optional promotion piece ("q","r","b","n"). Returns ErrIllegalMove if
// the move is not legal in the current position.
func (g *Game) Move(from, to, promotion string) error {
	want := promotionType(promotion)
	for _, m := range g.game.ValidMoves() {
		if m.S1().String() == from && m.S2().String() == to && m.Promo() == want {
			return g.game.Move(m)
		}
	}
	return ErrIllegalMove
}

// IsOver reports whether the game has ended (mate, stalemate, or a draw rule).
func (g *Game) IsOver() bool {
	return g.game.Outcome() != chess.NoOutcome
}

// Status describes the position: "playing", "checkmate", "stalemate", or "draw".
func (g *Game) Status() string {
	switch g.game.Method() {
	case chess.Checkmate:
		return "checkmate"
	case chess.Stalemate:
		return "stalemate"
	case chess.NoMethod:
		return "playing"
	default:
		return "draw"
	}
}

// Result returns the outcome string: "1-0", "0-1", "1/2-1/2", or "*" if ongoing.
func (g *Game) Result() string {
	return g.game.Outcome().String()
}

// History returns the moves played so far in algebraic (SAN) notation.
func (g *Game) History() []string {
	moves := g.game.Moves()
	positions := g.game.Positions()
	notation := chess.AlgebraicNotation{}
	out := make([]string, len(moves))
	for i, m := range moves {
		out[i] = notation.Encode(positions[i], m)
	}
	return out
}

func promotionType(p string) chess.PieceType {
	switch p {
	case "q":
		return chess.Queen
	case "r":
		return chess.Rook
	case "b":
		return chess.Bishop
	case "n":
		return chess.Knight
	default:
		return chess.NoPieceType
	}
}
