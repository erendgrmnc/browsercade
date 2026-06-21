/** Minimal 3D vector type + helpers, shared by the games. */
export type Vec3 = { x: number; y: number; z: number };

export const vec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const scale = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });

/** a + b * s — fused scale-and-add, the workhorse for reflections/impulses. */
export const addScaled = (a: Vec3, b: Vec3, s: number): Vec3 => ({
  x: a.x + b.x * s,
  y: a.y + b.y * s,
  z: a.z + b.z * s,
});

export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const length = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);

export function normalize(a: Vec3): Vec3 {
  const len = length(a) || 1;
  return { x: a.x / len, y: a.y / len, z: a.z / len };
}

export const horizontalDist = (a: Vec3, bx: number, bz: number): number =>
  Math.hypot(a.x - bx, a.z - bz);

/** Advance a projectile one step under gravity (mutates pos & vel). */
export function integrate(pos: Vec3, vel: Vec3, gravity: number, dt: number): void {
  vel.y -= gravity * dt;
  pos.x += vel.x * dt;
  pos.y += vel.y * dt;
  pos.z += vel.z * dt;
}
