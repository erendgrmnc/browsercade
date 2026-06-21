/** Tunable constants for beer pong — table, cup rack, throw dynamics, colours. */
export const TABLE = { halfWidth: 1.4, frontZ: 2.6, backZ: -4.8, topY: 0 } as const;

export const CUP = {
  radius: 0.12,
  height: 0.26,
  rows: [4, 3, 2, 1],
  frontZ: -2.8,
  rowGap: 0.28,
  gap: 0.27,
} as const;

export const THROW = {
  spawnX: 0,
  spawnY: 1.2,
  spawnZ: 2.0,
  pitch: 0.92,
  basePower: 5.0,
  maxPower: 7.8,
  maxYaw: 0.45,
  gravity: 9.0,
  restitution: 0.5,
  ballRadius: 0.05,
} as const;

export const RULES = { resetAfter: 4 } as const;

export const palette = {
  floor: "#0d1016",
  table: "#8a5a2b",
  tableEdge: "#6c451f",
  ball: "#f2f2ee",
  cup: "#e23b3b",
  cupRim: "#ff7a7a",
  target: "#2348ff",
} as const;
