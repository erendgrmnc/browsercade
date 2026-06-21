/** Tunable constants for pool — table, ball, physics, pockets, rack, colours. */
export const TABLE = { halfWidth: 1.2, halfLength: 2.4, surfaceY: 0 } as const;

export const BALL = { radius: 0.11 } as const;

export const PHYSICS = {
  friction: 0.45, // velocity retained per second (rolling resistance)
  cushion: 0.8, // wall restitution
  ballRestitution: 0.96,
  restThreshold: 0.06,
  substeps: 5, // collision sub-stepping per frame (prevents tunnelling)
} as const;

export const POCKET = { radius: 0.17 } as const;

export const SHOT = { powerGain: 2.4, minPower: 0.8, maxPower: 7.5 } as const;

export const RACK = { cueZ: 1.5, apexZ: -0.7 } as const;

export const palette = {
  floor: "#0d1016",
  cloth: "#15724a",
  rail: "#5a3a1e",
  pocket: "#070808",
  cue: "#f4f4ee",
  eight: "#161616",
  aim: "#eaf3ee",
  objects: ["#f2c12e", "#2348ff", "#e2483b", "#7a3bd1", "#e8732a", "#1f9e5a", "#a8324a"],
} as const;
