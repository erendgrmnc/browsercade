/** Wire messages for the multiplayer protocol (mirrors server/internal/protocol). */
import type { PieceColor, Square } from "@/domain/chess/types";

/** Anything the server sends us. `type` discriminates; other fields are optional. */
export type ServerMessage = {
  type:
    | "joined"
    | "state"
    | "opponentJoined"
    | "opponentLeft"
    | "gameOver"
    | "error";
  room?: string;
  color?: PieceColor;
  fen?: string;
  turn?: PieceColor;
  lastMove?: { from: Square; to: Square };
  status?: string;
  history?: string[];
  result?: string; // "1-0" | "0-1" | "1/2-1/2"
  message?: string;
};
