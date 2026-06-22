/** Tunable constants for basketball — court, hoop, shot dynamics, rules, colours. */
export const COURT = { halfWidth: 4, frontZ: 3.5, backZ: -7.5 } as const;

export const HOOP = { x: 0, y: 3.05, z: -6, rimInner: 0.34, rimOuter: 0.52, ballRadius: 0.24 } as const;

export const BACKBOARD = { z: -6.5, y: 3.6, halfWidth: 0.9, halfHeight: 0.55 } as const;

export const SHOT = {
  spawnX: 0,
  spawnY: 1.5,
  spawnZ: 2.5,
  pitch: 0.95, // launch angle in radians (~54°), fixed; power sets distance
  basePower: 6.5,
  maxPower: 9.6,
  maxYaw: 0.5, // left/right aim range in radians
  gravity: 9.0,
  restitution: 0.55,
} as const;

/**
 * The three-stage shot meter. The player presses once per stage:
 *   1. yaw   — a left/right sweep; lock the horizontal aim (centre = straight on)
 *   2. pitch — the arc arrow swings up/down; lock the launch elevation
 *   3. power — a bar sweeps 0..1 with a "sweet spot"; lock the launch speed
 * The sweet spot is the speed that sinks the locked arc (solved from physics),
 * so nailing all three swishes; the real projectile decides made/missed.
 */
export const AIM = {
  // Stage 1 — the arc arrow swings up/down; press to lock the elevation.
  pitchMin: 0.74, // lowest arc (radians)
  pitchMax: 1.16, // highest arc (radians)
  pitchSpeed: 0.9, // full sweeps per second (triangle wave)
  // Stage 2 — the power bar sweeps with a sweet spot.
  powerSpeed: 1.4,
  minSpeed: 7.5, // launch speed at power = 0
  maxSpeed: 13.0, // launch speed at power = 1
  sweetHalf: 0.055, // sweet-spot half-width on the 0..1 power bar
  barHeight: 1.7, // world height of the on-court power bar
} as const;

export const RULES = { clockSeconds: 60, resetAfter: 4.5, winBaskets: 7 } as const;

export const palette = {
  floor: "#0b0e14",
  court: "#14324a",
  paint: "#1c4f72",
  line: "#dce8f2",
  ball: "#e8732a",
  ballLine: "#7a2f12",
  rim: "#ef6a2e",
  board: "#eef2f6",
  net: "#e6ebf0",
  target: "#3b6bff",
  arrow: "#56e0ff",
  sweet: "#3ad17a",
  power: "#ff9d36",
} as const;
