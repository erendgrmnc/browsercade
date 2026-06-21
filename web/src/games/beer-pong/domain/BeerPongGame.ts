/**
 * Headless beer pong: arc a ball into a triangular rack of cups. Aim (yaw +
 * power) is fed in each frame; `shoot()` throws. A descending entry within a
 * cup's mouth removes it. Clear the rack to win. No React, no three.js.
 */
import { CUP, RULES, THROW } from "../config";
import { horizontalDist, integrate, vec3, type Vec3 } from "@/shared/vec3";

export type BeerPongPhase = "aiming" | "inflight" | "won";
export type Cup = { x: number; z: number; active: boolean };
export type BeerPongStats = { hits: number; throws: number; cupsLeft: number };

type Events = {
  onStats?: (stats: BeerPongStats) => void;
  onCups?: (cups: Cup[]) => void;
  onPhase?: (phase: BeerPongPhase) => void;
};

export class BeerPongGame {
  pos: Vec3 = vec3(THROW.spawnX, THROW.spawnY, THROW.spawnZ);
  vel: Vec3 = vec3();

  aimYaw = 0;
  aimPower: number = THROW.basePower;

  phase: BeerPongPhase = "aiming";
  cups: Cup[] = buildRack();
  throws = 0;

  private prevY: number = THROW.spawnY;
  private shotElapsed = 0;
  private events: Events = {};

  setEvents(events: Events): void {
    this.events = events;
    events.onCups?.(this.cups);
    events.onStats?.(this.stats());
  }

  reset(): void {
    this.cups = buildRack();
    this.throws = 0;
    this.parkBall();
    this.setPhase("aiming");
    this.events.onCups?.(this.cups);
    this.events.onStats?.(this.stats());
  }

  predictedLanding(): { x: number; z: number } {
    const range = (this.aimPower * this.aimPower * Math.sin(2 * THROW.pitch)) / THROW.gravity;
    return {
      x: THROW.spawnX + Math.sin(this.aimYaw) * range,
      z: THROW.spawnZ - Math.cos(this.aimYaw) * range,
    };
  }

  shoot(): void {
    if (this.phase !== "aiming") return;
    const cosP = Math.cos(THROW.pitch);
    this.vel = vec3(
      this.aimPower * Math.sin(this.aimYaw) * cosP,
      this.aimPower * Math.sin(THROW.pitch),
      -this.aimPower * Math.cos(this.aimYaw) * cosP,
    );
    this.throws += 1;
    this.shotElapsed = 0;
    this.prevY = this.pos.y;
    this.events.onStats?.(this.stats());
    this.setPhase("inflight");
  }

  update(dt: number): void {
    if (this.phase === "won") return;
    if (this.phase === "aiming") this.parkBall();
    else this.stepThrow(dt);
  }

  private parkBall(): void {
    this.pos = vec3(THROW.spawnX, THROW.spawnY, THROW.spawnZ);
    this.vel = vec3();
  }

  private stepThrow(dt: number): void {
    this.shotElapsed += dt;
    this.prevY = this.pos.y;
    integrate(this.pos, this.vel, THROW.gravity, dt);

    if (this.tryLandInCup()) return;
    this.bounceFloor();
    if (this.shouldReset()) this.endThrow();
  }

  /** True if the ball just dropped into a cup (which ends the throw). */
  private tryLandInCup(): boolean {
    const enteringMouth = this.vel.y < 0 && this.prevY > CUP.height && this.pos.y <= CUP.height;
    if (!enteringMouth) return false;

    const cup = this.cups.find((c) => c.active && horizontalDist(this.pos, c.x, c.z) < CUP.radius);
    if (!cup) return false;

    cup.active = false;
    this.events.onCups?.(this.cups);
    this.events.onStats?.(this.stats());
    if (this.cups.every((c) => !c.active)) this.setPhase("won");
    else this.endThrow();
    return true;
  }

  private bounceFloor(): void {
    if (this.pos.y > THROW.ballRadius || this.vel.y >= 0) return;
    this.pos.y = THROW.ballRadius;
    this.vel.y = -this.vel.y * THROW.restitution;
    this.vel.x *= 0.7;
    this.vel.z *= 0.7;
  }

  private shouldReset(): boolean {
    const settled = this.pos.y <= THROW.ballRadius + 0.01 && Math.hypot(this.vel.x, this.vel.z) < 0.5;
    const out = Math.abs(this.pos.x) > TABLE_LIMIT || this.pos.z < CUP.frontZ - 2 || this.pos.z > THROW.spawnZ + 2;
    return settled || out || this.shotElapsed > RULES.resetAfter;
  }

  private endThrow(): void {
    if (this.phase === "won") return;
    this.parkBall();
    this.setPhase("aiming");
  }

  private stats(): BeerPongStats {
    const left = this.cups.filter((c) => c.active).length;
    return { hits: this.cups.length - left, throws: this.throws, cupsLeft: left };
  }

  private setPhase(phase: BeerPongPhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.events.onPhase?.(phase);
  }
}

const TABLE_LIMIT = 2.2;

function buildRack(): Cup[] {
  const cups: Cup[] = [];
  CUP.rows.forEach((count, row) => {
    const z = CUP.frontZ - row * CUP.rowGap;
    for (let i = 0; i < count; i++) {
      cups.push({ x: (i - (count - 1) / 2) * CUP.gap, z, active: true });
    }
  });
  return cups;
}
