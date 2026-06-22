/** Relay payloads for online pool (the server forwards these opaquely). */

/** A ball's renderable state: position + whether it's pocketed. */
export type BallSnapshot = { x: number; z: number; p: boolean };

export type PoolMessage =
  /** The active shooter streams ball positions while the shot plays out. */
  | { kind: "frame"; balls: BallSnapshot[] }
  /** The shot settled: authoritative final positions, balls the shooter potted, and whether the rack is cleared. */
  | { kind: "end"; balls: BallSnapshot[]; potted: number; over: boolean }
  /** Start a fresh rack (rematch). Sent by the host. */
  | { kind: "reset" };
