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
  playerBaseZ: 1.78, // player's resting depth; mouse Y slides forward/back around it
  aiZ: -1.78,
  bladeRadius: 0.17,
  hoverY: 0.34, // fixed racket height — hovers clearly above the table, never clips
  xRange: 1.0, // half-range of lateral travel (mouse x = ±1 → ±xRange)
  zForward: 0.5, // how far toward the net the racket can push from its base
  zBack: 0.5, // how far back it can pull (symmetric, easy forward/back control)
  maxRoll: Math.PI / 2, // racket ROLL at the lateral extremes (90°: handle swings to the side)
  catchRadius: 0.17, // lateral catch radius — ball centre must reach the blade
  catchDepth: 0.13, // depth band around the paddle plane that counts as a strike
  aiReach: 0.3, // AI lateral catch radius
  aiSpeedEasy: 3.4,
  aiSpeedHard: 8.2,
} as const;

export const PHYSICS = { gravity: 7.0, substeps: 4 } as const;

export const SHOT = {
  // Flight time of a stroke from contact to its first bounce. More power → shorter,
  // flatter, faster. Power comes from how fast the paddle is pushed forward at contact.
  flightFast: 0.6,
  flightSlow: 0.95,
  aimSideFrac: 0.82, // at full yaw, land this fraction of halfWidth off-centre (stays in court)
  basePower: 0.18, // a still paddle still clears the net with a soft return
  depthMin: 0.34, // soft shots land short of the AI baseline…
  depthMax: 0.88, // …hard shots land deep
} as const;

export const SWING = {
  fullForwardSpeed: 6.0, // paddle forward speed (u/s) that yields full power
  velSmooth: 0.5, // low-pass on the paddle's velocity (0..1, higher = snappier)
  serveMinPower: 0.28, // a click-serve without a flick still has this much pace
  lateralAimGain: 0.14, // sideways swing speed → extra lateral aim (flick across the ball)
  maxSwingAim: 0.6, // cap on how far the sideways flick alone can steer the shot
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
  handleGrip: "#3a2a18",
  landing: "#ffd23f",
  floor: "#0d1016",
} as const;
