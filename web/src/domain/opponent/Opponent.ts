/**
 * An opponent that supplies moves for the side the human is not playing.
 *
 * This is the dependency-inversion seam of the app: the game hook depends on
 * this interface, not on a concrete implementation. `LocalAIOpponent` runs the
 * engine in a Web Worker today; a future `RemoteOpponent` can satisfy the same
 * contract over a WebSocket without touching the hook or UI.
 */
import type { EngineMove } from "@/domain/chess/types";

export interface Opponent {
  /** Resolve with the opponent's move for the given position. */
  requestMove(fen: string): Promise<EngineMove>;
  /** Adjust strength/skill where supported (e.g. AI search depth). */
  setLevel(level: number): void;
  /** Release any resources (workers, sockets). */
  dispose(): void;
}
