export type Ball = {
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  color: string;
  pocketed: boolean;
  isCue: boolean;
};

export type Pocket = { x: number; z: number };

export type PoolPhase = "aiming" | "shooting" | "won";
