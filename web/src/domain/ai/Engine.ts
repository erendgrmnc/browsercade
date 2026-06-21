/**
 * Chess search engine. `Engine` is the abstraction the rest of the app depends
 * on; `NegamaxEngine` is a from-scratch negamax search with alpha-beta pruning.
 * Swapping in a stronger engine (e.g. Stockfish WASM) means implementing this
 * one interface — nothing else changes.
 */
import { Chess, type Move } from "chess.js";
import type { EngineMove } from "@/domain/chess/types";
import { evaluate } from "./evaluation";
import { orderMoves } from "./moveOrdering";

export interface Engine {
  /** Best move for the side to move in `fen`, searched to `depth` plies. */
  bestMove(fen: string, depth: number): EngineMove | null;
}

const MATE = 1_000_000;

export class NegamaxEngine implements Engine {
  bestMove(fen: string, depth: number): EngineMove | null {
    const chess = new Chess(fen);
    const moves = orderMoves(chess.moves({ verbose: true }) as Move[]);
    if (moves.length === 0) return null;

    let best = -Infinity;
    let bestMoves: Move[] = [];
    for (const move of moves) {
      chess.move(move);
      const score = -this.search(chess, depth - 1, -Infinity, Infinity, 1);
      chess.undo();
      if (score > best) {
        best = score;
        bestMoves = [move];
      } else if (score === best) {
        bestMoves.push(move);
      }
    }

    // Random tie-break among equal-best moves, for game variety.
    const pick = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    return { from: pick.from, to: pick.to, promotion: pick.promotion };
  }

  /** Negamax with alpha-beta. Returns the score from the side-to-move's view. */
  private search(chess: Chess, depth: number, alpha: number, beta: number, ply: number): number {
    const moves = chess.moves({ verbose: true }) as Move[];

    if (moves.length === 0) {
      // No legal moves: checkmate (bad for side to move) or stalemate (draw).
      return chess.isCheckmate() ? -(MATE - ply) : 0;
    }
    if (chess.isDraw()) return 0;
    if (depth === 0) {
      return chess.turn() === "w" ? evaluate(chess) : -evaluate(chess);
    }

    let best = -Infinity;
    for (const move of orderMoves(moves)) {
      chess.move(move);
      const score = -this.search(chess, depth - 1, -beta, -alpha, ply + 1);
      chess.undo();
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break; // prune
    }
    return best;
  }
}
