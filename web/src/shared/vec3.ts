/** Minimal 3D vector type + projectile integration, shared by the throwing games. */
export type Vec3 = { x: number; y: number; z: number };

export const vec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const horizontalDist = (a: Vec3, bx: number, bz: number): number =>
  Math.hypot(a.x - bx, a.z - bz);

/** Advance a projectile one step under gravity (mutates pos & vel). */
export function integrate(pos: Vec3, vel: Vec3, gravity: number, dt: number): void {
  vel.y -= gravity * dt;
  pos.x += vel.x * dt;
  pos.y += vel.y * dt;
  pos.z += vel.z * dt;
}
