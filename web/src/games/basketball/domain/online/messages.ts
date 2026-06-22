/** Relay payloads for online basketball (turn-based; the server forwards these opaquely). */

export type BasketballMessage =
  /** The shooter streams ball position while their shot is in the air. */
  | { kind: "frame"; x: number; y: number; z: number }
  /** The shot resolved: whether it went in. The turn then passes. */
  | { kind: "end"; made: boolean }
  /** Rematch: reset scores and start over (host shoots first again). */
  | { kind: "reset" };
