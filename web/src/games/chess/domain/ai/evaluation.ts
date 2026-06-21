/** Static board evaluation: material + piece-square tables, White-positive (centipawns). */
import type { Chess } from "chess.js";
import { PIECE_SQUARE_TABLES, PIECE_VALUE } from "./pieceSquareTables";
import type { PieceType } from "@/games/chess/domain/chess/types";

export function evaluate(chess: Chess): number {
  let score = 0;
  const board = chess.board(); // board[row][col]; row 0 = rank 8, col 0 = file a

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row][col];
      if (!cell) continue;
      const type = cell.type as PieceType;
      const base = PIECE_VALUE[type];
      if (cell.color === "w") {
        score += base + PIECE_SQUARE_TABLES[type][row * 8 + col];
      } else {
        score -= base + PIECE_SQUARE_TABLES[type][(7 - row) * 8 + col];
      }
    }
  }
  return score;
}
