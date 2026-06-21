/** Conversions between algebraic squares, board indices, and 3D positions. */
import type { Square } from "./types";

export const FILES = "abcdefgh";

/** (file 0-7, rank 0-7 where 0 = rank 1) → algebraic square, e.g. "e2". */
export function toSquare(file: number, rank0: number): Square {
  return `${FILES[file]}${rank0 + 1}` as Square;
}

/** Algebraic square → { file, rank0 } (rank0 = 0 for rank 1). */
export function fromSquare(square: Square): { file: number; rank0: number } {
  return { file: FILES.indexOf(square[0]), rank0: Number(square[1]) - 1 };
}

/** Board-space (x, z) for a square. Files run along x; ranks along z (rank 1 toward camera). */
export function squareToXZ(file: number, rank0: number): [number, number] {
  return [file - 3.5, 3.5 - rank0];
}
