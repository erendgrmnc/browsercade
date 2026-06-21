/**
 * Headless 2D pool. Balls live on the XZ plane; the renderer lifts them to Y.
 * A strike sets the cue ball's velocity; the table is simulated (friction,
 * cushions, pairwise collisions, pockets) until every ball comes to rest.
 */
import { BALL, PHYSICS, POCKET, RACK, SHOT, TABLE, palette } from "../config";
import { collideBalls } from "./physics";
import type { Ball, Pocket, PoolPhase } from "./types";

type Events = { onScore?: (pocketed: number) => void; onPhase?: (phase: PoolPhase) => void };

export class PoolGame {
  balls: Ball[] = buildRack();
  phase: PoolPhase = "aiming";
  aimX = 0;
  aimZ = 0;

  private readonly pockets: Pocket[] = buildPockets();
  private events: Events = {};

  setEvents(events: Events): void {
    this.events = events;
    events.onScore?.(this.pocketedCount());
  }

  reset(): void {
    this.balls = buildRack();
    this.setPhase("aiming");
    this.events.onScore?.(0);
  }

  setAim(x: number, z: number): void {
    this.aimX = x;
    this.aimZ = z;
  }

  get cue(): Ball {
    return this.balls[0];
  }

  strike(): void {
    if (this.phase !== "aiming") return;
    const dx = this.aimX - this.cue.x;
    const dz = this.aimZ - this.cue.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.001) return;

    const power = clamp(dist * SHOT.powerGain, SHOT.minPower, SHOT.maxPower);
    this.cue.vx = (dx / dist) * power;
    this.cue.vz = (dz / dist) * power;
    this.setPhase("shooting");
  }

  update(dt: number): void {
    if (this.phase !== "shooting") return;
    const step = dt / PHYSICS.substeps;
    for (let i = 0; i < PHYSICS.substeps; i++) this.simulate(step);
    if (this.allAtRest()) this.endShot();
  }

  private simulate(dt: number): void {
    for (const ball of this.balls) this.advance(ball, dt);
    this.resolveCollisions();
    for (const ball of this.balls) this.pocketIfCaught(ball);
  }

  private advance(ball: Ball, dt: number): void {
    if (ball.pocketed) return;
    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;

    const decay = Math.pow(PHYSICS.friction, dt);
    ball.vx *= decay;
    ball.vz *= decay;
    this.bounceCushions(ball);
  }

  private bounceCushions(ball: Ball): void {
    const limX = TABLE.halfWidth - ball.radius;
    const limZ = TABLE.halfLength - ball.radius;
    if (ball.x > limX) { ball.x = limX; ball.vx = -Math.abs(ball.vx) * PHYSICS.cushion; }
    else if (ball.x < -limX) { ball.x = -limX; ball.vx = Math.abs(ball.vx) * PHYSICS.cushion; }
    if (ball.z > limZ) { ball.z = limZ; ball.vz = -Math.abs(ball.vz) * PHYSICS.cushion; }
    else if (ball.z < -limZ) { ball.z = -limZ; ball.vz = Math.abs(ball.vz) * PHYSICS.cushion; }
  }

  private resolveCollisions(): void {
    for (let i = 0; i < this.balls.length; i++) {
      if (this.balls[i].pocketed) continue;
      for (let j = i + 1; j < this.balls.length; j++) {
        if (!this.balls[j].pocketed) collideBalls(this.balls[i], this.balls[j]);
      }
    }
  }

  private pocketIfCaught(ball: Ball): void {
    if (ball.pocketed) return;
    const sunk = this.pockets.some((p) => Math.hypot(ball.x - p.x, ball.z - p.z) < POCKET.radius);
    if (!sunk) return;
    ball.pocketed = true;
    ball.vx = 0;
    ball.vz = 0;
  }

  private allAtRest(): boolean {
    return this.balls.every((b) => b.pocketed || Math.hypot(b.vx, b.vz) < PHYSICS.restThreshold);
  }

  private endShot(): void {
    for (const ball of this.balls) {
      ball.vx = 0;
      ball.vz = 0;
    }
    if (this.cue.pocketed) this.respawnCue(); // scratch
    this.events.onScore?.(this.pocketedCount());

    if (this.objectsRemaining() === 0) this.setPhase("won");
    else this.setPhase("aiming");
  }

  private respawnCue(): void {
    this.cue.pocketed = false;
    this.cue.x = 0;
    this.cue.z = RACK.cueZ;
    this.cue.vx = 0;
    this.cue.vz = 0;
  }

  private pocketedCount(): number {
    return this.balls.filter((b) => !b.isCue && b.pocketed).length;
  }

  private objectsRemaining(): number {
    return this.balls.filter((b) => !b.isCue && !b.pocketed).length;
  }

  private setPhase(phase: PoolPhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.events.onPhase?.(phase);
  }
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function buildPockets(): Pocket[] {
  const { halfWidth: w, halfLength: l } = TABLE;
  return [
    { x: -w, z: -l }, { x: w, z: -l },
    { x: -w, z: l }, { x: w, z: l },
    { x: -w, z: 0 }, { x: w, z: 0 },
  ];
}

function buildRack(): Ball[] {
  const cue: Ball = ball(0, RACK.cueZ, palette.cue, true);
  const balls: Ball[] = [cue];

  const gap = BALL.radius * 2 * 1.02;
  const rowDrop = gap * 0.87; // hex packing row height
  let index = 0;
  for (let row = 0; row < 5; row++) {
    const z = RACK.apexZ - row * rowDrop;
    for (let i = 0; i <= row; i++) {
      const x = (i - row / 2) * gap;
      balls.push(ball(x, z, colorFor(index)));
      index += 1;
    }
  }
  return balls;
}

function colorFor(index: number): string {
  if (index === 4) return palette.eight; // an 8-ball in the middle of the rack
  return palette.objects[index % palette.objects.length];
}

function ball(x: number, z: number, color: string, isCue = false): Ball {
  return { x, z, vx: 0, vz: 0, radius: BALL.radius, color, pocketed: false, isCue };
}
