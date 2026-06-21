/** Tunable constants for table tennis — dimensions, physics, paddle, serve/shot, rules, colours. */
export const TABLE = {
  halfWidth: 1.05,
  halfLength: 1.9,
  surfaceY: 0,
  thickness: 0.08,
  netHeight: 0.16,
} as const;

export const BALL = {
  radius: 0.05,
  restitution: 0.82, // bounce energy kept off the table
} as const;

export const PADDLE = {
  playerZ: 1.78,
  aiZ: -1.78,
  bladeRadius: 0.17,
  reach: 0.3, // lateral catch radius around the paddle
  hoverY: 0.2,
  playerSpeed: 8.0,
  aiSpeedEasy: 3.4,
  aiSpeedHard: 8.2,
} as const;

export const PHYSICS = { gravity: 7.0, substeps: 4 } as const;

export const SHOT = {
  // Flight time of a stroke from contact to its first bounce. More power → shorter,
  // flatter, faster. Power comes from the charge meter (hold to charge).
  flightFast: 0.62,
  flightSlow: 0.96,
  aimLateral: 0.95, // how strongly the contact offset steers the ball sideways
  chargeTime: 0.7, // seconds of holding to reach full power
} as const;

export const RULES = {
  winScore: 11,
  winBy: 2,
  pointDelay: 1.2,
  aiServeDelay: 1.0,
} as const;

export const palette = {
  table: "#15639e",
  tableLine: "#eef4fa",
  net: "#dfe7ef",
  netTape: "#ffffff",
  post: "#c4ccd4",
  leg: "#222730",
  ball: "#fdfdf4",
  playerBlade: "#e2483b",
  aiBlade: "#23272f",
  rubberBack: "#16181d",
  handle: "#9a6a3a",
  charge: "#2348ff",
  floor: "#0d1016",
} as const;
