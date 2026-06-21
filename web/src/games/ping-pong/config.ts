/** Tunable constants for ping-pong — dimensions, ball/paddle dynamics, rules, colours. */
export const TABLE = {
  halfWidth: 1.1,
  halfLength: 2.0,
  surfaceY: 0,
  thickness: 0.08,
  netHeight: 0.16,
} as const;

export const BALL = {
  radius: 0.06,
  hop: 0.3, // visual arc height at the net (cosmetic; collisions are in the XZ plane)
  baseSpeed: 3.0,
  speedGain: 0.18, // added each successful return
  maxSpeed: 6.8,
} as const;

export const PADDLE = {
  playerZ: 1.85,
  aiZ: -1.85,
  halfWidth: 0.36,
  thickness: 0.05,
  height: 0.28,
  playerSpeed: 7.5,
  aiSpeedEasy: 3.0,
  aiSpeedHard: 7.8,
} as const;

export const RULES = {
  winScore: 11,
  serveDelay: 0.9,
  pointDelay: 1.1,
} as const;

export const palette = {
  table: "#1763a6",
  tableLine: "#eaf2f8",
  net: "#dfe6ec",
  ball: "#f7f7f2",
  playerPaddle: "#2348ff",
  aiPaddle: "#e2483b",
  floor: "#0d1016",
} as const;
