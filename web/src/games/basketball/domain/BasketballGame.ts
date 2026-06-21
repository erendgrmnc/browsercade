/**
 * Headless basketball: a projectile shot against a hoop, on a shot clock.
 * Aim (yaw + power) is fed in each frame; `shoot()` launches the ball. Scoring
 * detects a descending pass through the rim. No React, no three.js.
 */
import { BACKBOARD, COURT, HOOP, RULES, SHOT } from "../config";
import { horizontalDist, integrate, vec3, type Vec3 } from "@/shared/vec3";

export type BasketballPhase = "aiming" | "inflight" | "gameover";
export type BasketballStats = { made: number; attempts: number };

type Events = {
  onStats?: (stats: BasketballStats) => void;
  onClock?: (seconds: number) => void;
  onPhase?: (phase: BasketballPhase) => void;
};

export class BasketballGame {
  pos: Vec3 = vec3(SHOT.spawnX, SHOT.spawnY, SHOT.spawnZ);
  vel: Vec3 = vec3();

  aimYaw = 0; // -maxYaw..maxYaw
  aimPower: number = SHOT.basePower; // basePower..maxPower

  phase: BasketballPhase = "aiming";
  stats: BasketballStats = { made: 0, attempts: 0 };
  clock: number = RULES.clockSeconds;

  private started = false;
  private scoredThisShot = false;
  private shotElapsed = 0;
  private prevY: number = SHOT.spawnY;
  private events: Events = {};

  setEvents(events: Events): void {
    this.events = events;
  }

  reset(): void {
    this.stats = { made: 0, attempts: 0 };
    this.clock = RULES.clockSeconds;
    this.started = false;
    this.parkBall();
    this.setPhase("aiming");
    this.events.onStats?.(this.stats);
    this.events.onClock?.(this.clock);
  }

  /** Where the shot would land on the floor — a ground aim marker while aiming. */
  predictedLanding(): { x: number; z: number } {
    const range = (this.aimPower * this.aimPower * Math.sin(2 * SHOT.pitch)) / SHOT.gravity;
    return {
      x: SHOT.spawnX + Math.sin(this.aimYaw) * range,
      z: SHOT.spawnZ - Math.cos(this.aimYaw) * range,
    };
  }

  shoot(): void {
    if (this.phase !== "aiming") return;
    const cosP = Math.cos(SHOT.pitch);
    this.vel = vec3(
      this.aimPower * Math.sin(this.aimYaw) * cosP,
      this.aimPower * Math.sin(SHOT.pitch),
      -this.aimPower * Math.cos(this.aimYaw) * cosP,
    );
    this.scoredThisShot = false;
    this.shotElapsed = 0;
    this.prevY = this.pos.y;
    this.stats = { ...this.stats, attempts: this.stats.attempts + 1 };
    this.events.onStats?.(this.stats);
    this.started = true;
    this.setPhase("inflight");
  }

  update(dt: number): void {
    if (this.phase === "gameover") return;
    this.tickClock(dt);
    if (this.phase === "aiming") this.parkBall();
    else if (this.phase === "inflight") this.stepShot(dt);
  }

  private tickClock(dt: number): void {
    if (!this.started) return;
    this.clock = Math.max(0, this.clock - dt);
    this.events.onClock?.(this.clock);
    if (this.clock === 0) this.setPhase("gameover");
  }

  private parkBall(): void {
    this.pos = vec3(SHOT.spawnX, SHOT.spawnY, SHOT.spawnZ);
    this.vel = vec3();
  }

  private stepShot(dt: number): void {
    this.shotElapsed += dt;
    this.prevY = this.pos.y;
    integrate(this.pos, this.vel, SHOT.gravity, dt);

    this.checkScoreAndRim();
    this.bounceBackboard();
    this.bounceFloor();

    if (this.shouldReset()) this.endShot();
  }

  private checkScoreAndRim(): void {
    const descending = this.vel.y < 0 && this.prevY > HOOP.y && this.pos.y <= HOOP.y;
    if (!descending) return;

    const dist = horizontalDist(this.pos, HOOP.x, HOOP.z);
    if (dist < HOOP.rimInner) {
      if (!this.scoredThisShot) this.registerMake();
    } else if (dist < HOOP.rimOuter) {
      this.bounceOffRim();
    }
  }

  private registerMake(): void {
    this.scoredThisShot = true;
    this.stats = { ...this.stats, made: this.stats.made + 1 };
    this.events.onStats?.(this.stats);
  }

  private bounceOffRim(): void {
    const nx = this.pos.x - HOOP.x;
    const nz = this.pos.z - HOOP.z;
    const len = Math.hypot(nx, nz) || 1;
    const kick = 1.5;
    this.vel.x = (nx / len) * kick;
    this.vel.z = (nz / len) * kick;
    this.vel.y = Math.abs(this.vel.y) * 0.3;
  }

  private bounceBackboard(): void {
    const hitsBoard =
      this.vel.z < 0 &&
      this.pos.z <= BACKBOARD.z + HOOP.ballRadius &&
      Math.abs(this.pos.x - HOOP.x) < BACKBOARD.halfWidth &&
      Math.abs(this.pos.y - BACKBOARD.y) < BACKBOARD.halfHeight;
    if (!hitsBoard) return;
    this.pos.z = BACKBOARD.z + HOOP.ballRadius;
    this.vel.z = Math.abs(this.vel.z) * 0.5;
  }

  private bounceFloor(): void {
    if (this.pos.y > HOOP.ballRadius || this.vel.y >= 0) return;
    this.pos.y = HOOP.ballRadius;
    this.vel.y = -this.vel.y * SHOT.restitution;
    this.vel.x *= 0.7;
    this.vel.z *= 0.7;
  }

  private shouldReset(): boolean {
    const settled = this.pos.y <= HOOP.ballRadius + 0.01 && Math.hypot(this.vel.x, this.vel.z) < 0.6;
    const out = Math.abs(this.pos.x) > COURT.halfWidth || this.pos.z > COURT.frontZ + 2 || this.pos.z < COURT.backZ;
    return settled || out || this.shotElapsed > RULES.resetAfter;
  }

  private endShot(): void {
    if (this.phase === "gameover") return;
    this.parkBall();
    this.setPhase("aiming");
  }

  private setPhase(phase: BasketballPhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.events.onPhase?.(phase);
  }
}
