/**
 * Owns chess rules and game state by wrapping chess.js behind a small, intent-
 * revealing API. Holds no UI concerns (selection, highlighting) and no opponent
 * concerns — those live in the React hook and the Opponent layer respectively.
 */
import { Chess } from "chess.js";
import type { BoardCell, GameStatus, MoveInput, PieceColor, Square } from "./types";

export class GameController {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  /** Start a fresh game from the standard opening position. */
  reset(): void {
    this.chess = new Chess();
  }

  get fen(): string {
    return this.chess.fen();
  }

  get turn(): PieceColor {
    return this.chess.turn();
  }

  get isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  /** 8×8 grid; row 0 = rank 8, col 0 = file a. */
  board(): BoardCell[][] {
    return this.chess.board() as BoardCell[][];
  }

  /** SAN move list, in order. */
  history(): string[] {
    return this.chess.history();
  }

  pieceAt(square: Square): { type: string; color: PieceColor } | null {
    return this.chess.get(square) ?? null;
  }

  /** Distinct destination squares for a piece on `square` (promotions deduped). */
  legalTargets(square: Square): Square[] {
    const moves = this.chess.moves({ square, verbose: true });
    return Array.from(new Set(moves.map((m) => m.to as Square)));
  }

  /** Apply a move; returns false if illegal. Promotions default to queen. */
  tryMove(move: MoveInput): boolean {
    try {
      this.chess.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" });
      return true;
    } catch {
      return false;
    }
  }

  /** Take back the last half-move. Returns false if there was nothing to undo. */
  undo(): boolean {
    return this.chess.undo() !== null;
  }

  status(): GameStatus {
    const c = this.chess;
    const side = c.turn();
    const name = side === "w" ? "White" : "Black";

    if (c.isCheckmate()) {
      return { kind: "checkmate", winner: side === "w" ? "b" : "w", text: `Checkmate — ${side === "w" ? "Black" : "White"} wins` };
    }
    if (c.isStalemate()) return { kind: "stalemate", text: "Stalemate — draw" };
    if (c.isInsufficientMaterial()) return { kind: "draw", text: "Draw — insufficient material" };
    if (c.isThreefoldRepetition()) return { kind: "draw", text: "Draw — repetition" };
    if (c.isDraw()) return { kind: "draw", text: "Draw" };
    if (c.isCheck()) return { kind: "check", text: `${name} in check` };
    return { kind: "playing", text: `${name} to move` };
  }
}
