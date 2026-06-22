/**
 * Headless basketball with a two-stage shot meter:
 *   1. "pitch" — the arc arrow swings up/down; press to lock the elevation.
 *   2. "power" — a bar sweeps with a sweet spot; press to lock the speed.
 * The locked (pitch, power) become a real projectile aimed straight at the hoop;
 * the existing flight physics (rim, backboard, floor) decide whether it drops.
 * No React, no three.js.
 */
import { AIM, BACKBOARD, COURT, HOOP, RULES, SHOT } from "../config";
import { clamp, lerp } from "@/shared/math";
import { horizontalDist, integrate, vec3, type Vec3 } from "@/shared/vec3";

export type AimStage = "pitch" | "power";
export type BasketballPhase = "aiming" | "inflight" | "gameover";
export type BasketballStats = { made: number; attempts: number };

type Events = {
  onStats?: (stats: BasketballStats) => void;
  onClock?: (seconds: number) => void;
  onPhase?: (phase: BasketballPhase) => void;
  onStage?: (stage: AimStage) => void;
};

// Horizontal distance and rise from the launch point to the hoop — used to solve
// the "sweet spot" launch speed for a given arc.
const SHOT_DIST = Math.abs(SHOT.spawnZ - HOOP.z);
const SHOT_RISE = HOOP.y - SHOT.spawnY;

export class BasketballGame {
  pos: Vec3 = vec3(SHOT.spawnX, SHOT.spawnY, SHOT.spawnZ);
  vel: Vec3 = vec3();

  // Aim-meter state.
  stage: AimStage = "pitch";
  osc = 0; // 0..1 triangle wave for the active stage
  private oscDir = 1;
  lockedPitch: number = (AIM.pitchMin + AIM.pitchMax) / 2; // radians
  sweetT = 0.5; // sweet-spot centre on the 0..1 power bar (set when pitch locks)
  lastMade = false; // result of the most recent resolved shot
  makePulse = 0; // bumped on every made basket — the renderer watches it for FX

  phase: BasketballPhase = "aiming";
  stats: BasketballStats = { made: 0, attempts: 0 };
  clock: number = RULES.clockSeconds;
  clockEnabled = true; // online turn-based play disables the shot clock

  private started = false;
  private scoredThisShot = false;
  private shotElapsed = 0;
  private prevY: number = SHOT.spawnY;
  private events: Events = {};

  setEvents(events: Events): void {
    this.events = events;
    events.onStage?.(this.stage);
  }

  reset(): void {
    this.stats = { made: 0, attempts: 0 };
    this.clock = RULES.clockSeconds;
    this.started = false;
    this.resetAim();
    this.parkBall();
    this.setPhase("aiming");
    this.events.onStats?.(this.stats);
    this.events.onClock?.(this.clock);
  }

  /** Begin the shot clock immediately (solo uses lazy start on first shot). */
  start(): void {
    this.started = true;
  }

  /** Trigger the make FX without scoring — used by online watchers on a remote make. */
  flashMake(): void {
    this.makePulse += 1;
  }

  // --- live aim readouts (used by the renderer) ---

  /** Current arc/elevation angle (live while sweeping, else locked). */
  get aimPitch(): number {
    return this.stage === "pitch" ? lerp(AIM.pitchMin, AIM.pitchMax, this.osc) : this.lockedPitch;
  }

  /** Live power-bar fill (0..1) during the power stage. */
  get powerT(): number {
    return this.stage === "power" ? this.osc : 0;
  }

  /** Unit launch direction (straight ahead, elevated by the current arc). */
  aimDirection(): Vec3 {
    const pitch = this.aimPitch;
    return vec3(0, Math.sin(pitch), -Math.cos(pitch));
  }

  /** Press: advance the meter — lock the arc, or launch on the power stage. */
  press(): void {
    if (this.phase !== "aiming") return;
    if (this.stage === "pitch") {
      this.lockedPitch = this.aimPitch;
      this.sweetT = this.sweetSpotFor(this.lockedPitch);
      this.toStage("power");
    } else {
      this.launch(this.lockedPitch, this.osc);
    }
  }

  update(dt: number): void {
    if (this.phase === "gameover") return;
    if (this.clockEnabled) this.tickClock(dt);
    if (this.phase === "aiming") {
      this.parkBall();
      this.tickAim(dt);
    } else if (this.phase === "inflight") {
      this.stepShot(dt);
    }
  }

  private tickAim(dt: number): void {
    const speed = this.stage === "pitch" ? AIM.pitchSpeed : AIM.powerSpeed;
    this.osc += this.oscDir * speed * dt;
    if (this.osc >= 1) {
      this.osc = 1;
      this.oscDir = -1;
    } else if (this.osc <= 0) {
      this.osc = 0;
      this.oscDir = 1;
    }
  }

  private toStage(stage: AimStage): void {
    this.stage = stage;
    this.osc = 0;
    this.oscDir = 1;
    this.events.onStage?.(stage);
  }

  private resetAim(): void {
    this.toStage("pitch");
    this.lockedPitch = (AIM.pitchMin + AIM.pitchMax) / 2;
    this.sweetT = 0.5;
  }

  /** The launch speed that sinks the hoop for a given arc, mapped onto the bar. */
  private sweetSpotFor(pitch: number): number {
    const c = Math.cos(pitch);
    const denom = 2 * c * c * (SHOT_DIST * Math.tan(pitch) - SHOT_RISE);
    if (denom <= 0) return 1;
    const ideal = Math.sqrt((SHOT.gravity * SHOT_DIST * SHOT_DIST) / denom);
    return clamp((ideal - AIM.minSpeed) / (AIM.maxSpeed - AIM.minSpeed), 0, 1);
  }

  private launch(pitch: number, powerT: number): void {
    const speed = lerp(AIM.minSpeed, AIM.maxSpeed, clamp(powerT, 0, 1));
    // Straight ahead (no lateral velocity): the ball's X position is the aim.
    this.vel = vec3(0, Math.sin(pitch) * speed, -Math.cos(pitch) * speed);
    this.scoredThisShot = false;
    this.lastMade = false;
    this.shotElapsed = 0;
    this.prevY = this.pos.y;
    this.stats = { ...this.stats, attempts: this.stats.attempts + 1 };
    this.events.onStats?.(this.stats);
    this.started = true;
    this.setPhase("inflight");
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
    this.lastMade = true;
    this.makePulse += 1;
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
    this.resetAim();
    this.parkBall();
    this.setPhase("aiming");
  }

  private setPhase(phase: BasketballPhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.events.onPhase?.(phase);
  }
}
