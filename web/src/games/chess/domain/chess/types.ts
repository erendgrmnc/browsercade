/** Shared chess domain types. Framework-agnostic — no React, no three.js. */
import type { Square } from "chess.js";

export type { Square };

export type PieceColor = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

/** One board square: a piece, or null when empty. Matches chess.js `board()` cells. */
export type BoardCell = { square: Square; type: PieceType; color: PieceColor } | null;

export type MoveInput = { from: Square; to: Square; promotion?: PieceType };
export type EngineMove = { from: Square; to: Square; promotion?: PieceType };

export type StatusKind = "playing" | "check" | "checkmate" | "stalemate" | "draw";

export type GameStatus = {
  kind: StatusKind;
  text: string;
  /** Set only on checkmate. */
  winner?: PieceColor;
};
