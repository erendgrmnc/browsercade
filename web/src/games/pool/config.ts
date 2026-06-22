/** Tunable constants for pool — table, ball, physics, pockets, rack, cue, colours. */

/** Play-surface half extents (XZ). Standard 2:1 table proportions. */
export const TABLE = { halfWidth: 1.2, halfLength: 2.4, surfaceY: 0 } as const;

export const BALL = { radius: 0.105 } as const;

export const PHYSICS = {
  friction: 0.42, // velocity retained per second (rolling resistance)
  cushion: 0.82, // wall restitution
  ballRestitution: 0.95,
  restThreshold: 0.05,
  substeps: 6, // collision sub-stepping per frame (prevents tunnelling)
} as const;

/** Pocket capture radius. Corners swallow a touch wider than the side pockets. */
export const POCKET = { radius: 0.16, mouthCorner: 0.22, mouthSide: 0.2 } as const;

/** Power maps a 0..1 charge to launch speed. */
export const SHOT = { minPower: 1.4, maxPower: 8.2, chargeSeconds: 1.1 } as const;

/** Rack geometry: cue-ball spot (the "kitchen") and the rack apex. */
export const RACK = { cueZ: 1.55, apexZ: -0.75 } as const;

/** Cue-stick visual dimensions. */
export const CUE = { length: 1.5, buttRadius: 0.028, tipRadius: 0.012, gap: 0.04, pullback: 0.5 } as const;

/**
 * Default camera for the solo / online scenes. High + pulled back with a narrow
 * FOV so the whole 4.8×2.4 table fits with margin and the perspective stays flat
 * (less trapezoid distortion).
 */
export const CAMERA = { position: [0, 9.5, 3.4] as [number, number, number], fov: 33, target: [0, 0, 0] as [number, number, number] };

/** AI difficulty knobs (0 = perfect, larger = sloppier). */
export const AI = { aimError: 0.05, powerError: 0.08, thinkMs: 750 } as const;

export const palette = {
  floor: "#0d1016",
  cloth: "#15724a",
  clothLine: "#0f5a39",
  rail: "#5a3a1e",
  railDark: "#3f280f",
  pocket: "#050606",
  pocketRim: "#1a1a1a",
  cue: "#f6f4ec",
  aim: "#eaf3ee",
  cueWood: "#d8b06a",
  cueTip: "#3a6ea5",
} as const;

/**
 * Standard pool ball colours by number. 1–7 solids, 8 black, 9–15 stripes
 * (a stripe reuses its solid sibling's colour: 9↔1, 10↔2, …).
 */
export const BALL_COLORS: Record<number, string> = {
  1: "#e6b400", // yellow
  2: "#1c39bb", // blue
  3: "#d62828", // red
  4: "#6a2c91", // purple
  5: "#e9692c", // orange
  6: "#1f7a3d", // green
  7: "#7c2126", // maroon
  8: "#161616", // black
  9: "#e6b400",
  10: "#1c39bb",
  11: "#d62828",
  12: "#6a2c91",
  13: "#e9692c",
  14: "#1f7a3d",
  15: "#7c2126",
};

/**
 * A legal 8-ball rack, listed in the order buildRack lays them out (apex first,
 * row by row). The 8 sits in the centre of row 3; the two back corners are a
 * solid and a stripe.
 */
export const RACK_NUMBERS = [1, 14, 2, 15, 8, 3, 11, 4, 12, 5, 6, 13, 7, 10, 9] as const;
