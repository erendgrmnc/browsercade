/** Pairwise 2D elastic collision between equal-mass balls (mutates both). */
import { PHYSICS } from "../config";
import type { Ball } from "./types";

export function collideBalls(a: Ball, b: Ball): void {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const dist = Math.hypot(dx, dz);
  const minDist = a.radius + b.radius;
  if (dist === 0 || dist >= minDist) return;

  const nx = dx / dist;
  const nz = dz / dist;

  // Push the pair apart so they no longer overlap.
  const overlap = (minDist - dist) / 2;
  a.x -= nx * overlap;
  a.z -= nz * overlap;
  b.x += nx * overlap;
  b.z += nz * overlap;

  // Exchange momentum along the contact normal (equal masses).
  const relVel = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
  if (relVel > 0) return; // already separating

  const impulse = (-(1 + PHYSICS.ballRestitution) * relVel) / 2;
  a.vx -= impulse * nx;
  a.vz -= impulse * nz;
  b.vx += impulse * nx;
  b.vz += impulse * nz;
}
