/** Relay payloads for online beer-pong (two-sided; the server forwards these opaquely). */

export type BeerPongMessage =
  /** The thrower streams ball position + the rack they're hitting (the opponent's near rack). */
  | { kind: "frame"; bx: number; by: number; bz: number; cups: boolean[] }
  /** The throw resolved: final ball + rack state, and whether the thrower cleared it (win). */
  | { kind: "end"; bx: number; by: number; bz: number; cups: boolean[]; over: boolean }
  /** Rematch: reset both racks (host throws first again). */
  | { kind: "reset" };
