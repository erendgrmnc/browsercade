/** Move ordering to improve alpha-beta cutoffs: winning captures and promotions first. */
import type { Move } from "chess.js";
import { PIECE_VALUE } from "./pieceSquareTables";
import type { PieceType } from "@/domain/chess/types";

/** MVV-LVA: value the victim highly, the attacker lightly; reward promotions. */
function moveScore(move: Move): number {
  let score = 0;
  if (move.captured) score += 10 * PIECE_VALUE[move.captured as PieceType] - PIECE_VALUE[move.piece as PieceType];
  if (move.promotion) score += PIECE_VALUE[move.promotion as PieceType];
  return score;
}

export function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => moveScore(b) - moveScore(a));
}
