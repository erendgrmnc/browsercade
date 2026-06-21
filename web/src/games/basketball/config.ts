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

export const RULES = { clockSeconds: 60, resetAfter: 4.5 } as const;

export const palette = {
  floor: "#0d1016",
  court: "#173a55",
  line: "#cfe0ee",
  ball: "#e8732a",
  rim: "#e2483b",
  board: "#eef2f6",
  net: "#cfd6dd",
  target: "#2348ff",
} as const;
