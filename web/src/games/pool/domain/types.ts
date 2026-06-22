/** A ball's group for 8-ball rules and rendering. */
export type BallGroup = "cue" | "solid" | "eight" | "stripe";

export type Ball = {
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  color: string;
  /** 0 for the cue ball, 1–15 for object balls. */
  number: number;
  group: BallGroup;
  pocketed: boolean;
  isCue: boolean;
};

export type Pocket = { x: number; z: number; radius: number };

export type PoolPhase = "aiming" | "shooting" | "won" | "gameover";

/** Which seat is shooting in a solo 8-ball game. */
export type Player = 0 | 1;

/** Snapshot of 8-ball rule state, surfaced to the HUD. */
export type RulesState = {
  currentPlayer: Player;
  /** Assigned suit per player, or null while the table is "open". */
  groups: [BallGroup | null, BallGroup | null];
  /** The opponent must place the cue ball before shooting (after a foul). */
  ballInHand: boolean;
  winner: Player | null;
  /** Human-readable status for the HUD. */
  message: string;
};
