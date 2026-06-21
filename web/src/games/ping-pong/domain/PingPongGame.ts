/**
 * Headless table-tennis simulation. The ball is a real projectile (gravity +
 * table bounces + net); points follow table-tennis rules (serve, one legal
 * bounce per side, faults into net / off the table / double bounce). Strokes
 * aim to a target with a flight time set by charge — hold to power up, position
 * the paddle to angle the return. No React, no three.js.
 */
import { BALL, PADDLE, PHYSICS, RACKET, RULES, SHOT, TABLE } from "../config";
import { AiController } from "./AiController";
import { clamp, lerp } from "@/shared/math";
import { addScaled, dot, integrate, length, normalize, scale, sub, vec3, type Vec3 } from "@/shared/vec3";
import type { Phase, Score, Side } from "./types";

type Events = {
  onScore?: (score: Score) => void;
  onPhase?: (phase: Phase) => void;
  onServer?: (server: Side) => void;
};

export class PingPongGame {
  pos: Vec3 = vec3(0, PADDLE.hoverY, PADDLE.playerZ);
  vel: Vec3 = vec3();

  playerX = 0;
  aiX = 0;
  playerTargetX = 0;
  playerZ: number = PADDLE.playerZ; // live forward/back depth of the racket
  playerTargetZ: number = PADDLE.playerZ; // where the mouse wants the racket (toward/away from the net)
  playerY: number = PADDLE.hoverY; // live racket height (auto-reaches the ball)
  racketVel: Vec3 = vec3(); // racket velocity this frame — swing power + face yaw
  racketYaw = 0; // face yaw from the swing (steers the return)
  aimDepth = 0; // -1 (short) .. 1 (deep), from the player's pointer

  charge = 0; // 0..1
  charging = false;

  score: Score = { player: 0, ai: 0 };
  phase: Phase = "serving";
  difficulty = 0.6;
  server: Side = "player";

  private lastHitter: Side | null = null;
  private receiver: Side | null = null;
  private mustBounceOn: Side | null = null;
  private bouncesOnReceiver = 0;
  private timer = 0;
  private totalPoints = 0;
  private readonly ai = new AiController();
  private events: Events = {};

  constructor() {
    this.newPoint("player");
  }

  setEvents(events: Events): void {
    this.events = events;
    events.onServer?.(this.server);
  }

  reset(): void {
    this.score = { player: 0, ai: 0 };
    this.totalPoints = 0;
    this.newPoint("player");
    this.events.onScore?.(this.score);
  }

  get isPlayerServing(): boolean {
    return this.phase === "serving" && this.server === "player";
  }

  /** Pointer pressed — start charging a stroke. */
  press(): void {
    if (this.phase === "serving" || this.phase === "rally") this.charging = true;
  }

  /** Pointer released — serve (if it's our serve) or just stop charging. */
  release(): void {
    if (this.phase === "serving" && this.server === "player") {
      this.serve("player");
    } else {
      this.cancelCharge();
    }
  }

  /** Abandon a charge without striking (e.g. the pointer left the canvas). */
  cancelCharge(): void {
    this.charging = false;
    this.charge = 0;
  }

  update(dt: number): void {
    if (this.phase === "gameover") return;
    this.tickCharge(dt);
    this.movePaddles(dt);

    if (this.phase === "serving") this.stepServing(dt);
    else if (this.phase === "rally") this.stepRally(dt);
    else if (this.phase === "point") this.tickPoint(dt);
  }

  private tickCharge(dt: number): void {
    if (this.charging && this.charge < 1) this.charge = clamp(this.charge + dt / SHOT.chargeTime, 0, 1);
  }

  private movePaddles(dt: number): void {
    const limit = TABLE.halfWidth + 0.2;
    const newX = clamp(this.playerTargetX, -limit, limit);
    const newZ = clamp(this.playerTargetZ, PADDLE.playerZ - PADDLE.zTravel, PADDLE.playerZ + PADDLE.zTravel);
    const newY = approach(this.playerY, this.racketTargetY(), 7 * dt);

    // The racket follows the mouse directly (crisp control); its frame velocity
    // is fed into the ball on contact (swing power) and sets the face yaw (aim).
    const inv = dt > 0 ? 1 / dt : 0;
    this.racketVel = vec3(
      clampMag((newX - this.playerX) * inv, RACKET.maxSwing),
      clampMag((newY - this.playerY) * inv, RACKET.maxSwing),
      clampMag((newZ - this.playerZ) * inv, RACKET.maxSwing),
    );
    this.playerX = newX;
    this.playerY = newY;
    this.playerZ = newZ;
    this.racketYaw = clamp(this.racketVel.x * RACKET.yawGain, -RACKET.maxYaw, RACKET.maxYaw);

    const target = this.ai.targetX(this.pos.x, this.vel.z, this.aiX, this.difficulty);
    const speed = lerp(PADDLE.aiSpeedEasy, PADDLE.aiSpeedHard, this.difficulty);
    this.aiX = approach(this.aiX, clamp(target, -limit, limit), speed * dt);
  }

  /** The racket auto-reaches the ball's height while it's incoming, else rests. */
  private racketTargetY(): number {
    const incoming = this.vel.z > 0 && this.pos.z > -0.2;
    return incoming ? clamp(this.pos.y, RACKET.reachYMin, RACKET.reachYMax) : PADDLE.hoverY;
  }

  private stepServing(dt: number): void {
    if (this.server === "player") {
      this.pos = vec3(this.playerX, PADDLE.hoverY + 0.08, this.playerZ - 0.12);
      return;
    }
    this.pos.x = this.aiX;
    this.timer -= dt;
    if (this.timer <= 0) this.serve("ai");
  }

  private tickPoint(dt: number): void {
    this.timer -= dt;
    if (this.timer <= 0) this.newPoint(this.server);
  }

  private stepRally(dt: number): void {
    const step = dt / PHYSICS.substeps;
    for (let i = 0; i < PHYSICS.substeps && this.phase === "rally"; i++) this.substep(step);
  }

  private substep(dt: number): void {
    const prevZ = this.pos.z;
    integrate(this.pos, this.vel, PHYSICS.gravity, dt);
    this.handleNet(prevZ);
    if (this.phase !== "rally") return;
    this.handleBounce();
    if (this.phase !== "rally") return;
    this.playerCollision(); // physical player return
    this.handlePaddlePlanes(prevZ); // AI return
    if (this.phase !== "rally") return;
    this.handleOut();
  }

  private handleNet(prevZ: number): void {
    const crossed = prevZ > 0 !== this.pos.z > 0;
    if (crossed && this.pos.y < TABLE.netHeight + BALL.radius && this.lastHitter) {
      this.awardPoint(opponent(this.lastHitter)); // into the net
    }
  }

  private handleBounce(): void {
    if (this.pos.y - BALL.radius > TABLE.surfaceY || this.vel.y >= 0) return;
    const onTable = Math.abs(this.pos.x) <= TABLE.halfWidth && Math.abs(this.pos.z) <= TABLE.halfLength;
    if (!onTable) return; // missed the table — let it fall (handled as "out")

    this.pos.y = TABLE.surfaceY + BALL.radius;
    this.vel.y = -this.vel.y * BALL.restitution;
    this.vel.x *= 0.985;
    this.vel.z *= 0.985;
    this.onBounce(this.pos.z > 0 ? "player" : "ai");
  }

  private onBounce(side: Side): void {
    if (this.mustBounceOn === null) return;
    if (side === this.mustBounceOn) {
      this.bouncesOnReceiver += 1;
      if (this.bouncesOnReceiver >= 2) this.awardPoint(this.lastHitter!); // receiver let it bounce twice
    } else {
      this.awardPoint(this.receiver!); // landed back on the hitter's own court
    }
  }

  private handlePaddlePlanes(prevZ: number): void {
    // The player's return is physical (playerCollision); the AI returns here.
    if (this.receiver === "ai" && this.vel.z < 0 && prevZ > PADDLE.aiZ && this.pos.z <= PADDLE.aiZ) {
      this.resolveAiReach(PADDLE.reach * lerp(0.85, 1.12, this.difficulty));
    }
  }

  private resolveAiReach(reach: number): void {
    if (this.bouncesOnReceiver === 0) return; // hasn't bounced yet — it's flying long (out comes next)
    if (Math.abs(this.pos.x - this.aiX) <= reach) this.aiStroke();
    else this.awardPoint(this.lastHitter!); // AI missed the return
  }

  /** Physical player return: the ball reflects off the angled racket face. */
  private playerCollision(): void {
    if (this.receiver !== "player" || this.bouncesOnReceiver < 1) return;

    const center = vec3(this.playerX, this.playerY, this.playerZ);
    const n = this.playerNormal();
    const rel = sub(this.pos, center);
    const d = dot(rel, n); // distance from the racket plane along its normal
    if (d < 0 || d > BALL.radius + RACKET.thickness) return; // not against the front face

    const inPlane = sub(rel, scale(n, d));
    if (length(inPlane) > PADDLE.bladeRadius) return; // off the blade

    if (dot(this.vel, n) >= 0) return; // not heading into the face

    // Controlled return: send the ball INTO the AI's court rather than reflecting
    // its (chaotic) incoming angle. Lateral aim comes from the swing (yaw); depth
    // and pace come from charge. This is what keeps returns sensible and aimable.
    const power = this.charge;
    const aimX = clamp((this.racketYaw / RACKET.maxYaw) * TABLE.halfWidth * 0.82, -TABLE.halfWidth * 0.82, TABLE.halfWidth * 0.82);
    const depthT = clamp(0.4 + power * 0.5, 0, 1);
    this.pos = addScaled(center, n, BALL.radius + RACKET.thickness); // sit on the face
    this.launch("player", aimX, depthT, power);
  }

  /** Player racket face normal: toward the net, tilted up, yawed by the swing. */
  private playerNormal(): Vec3 {
    return normalize(vec3(Math.sin(this.racketYaw), RACKET.upBias, -Math.cos(this.racketYaw)));
  }

  private handleOut(): void {
    const out =
      this.pos.y < TABLE.surfaceY - 0.45 ||
      Math.abs(this.pos.z) > TABLE.halfLength + 0.7 ||
      Math.abs(this.pos.x) > TABLE.halfWidth + 1.0;
    if (!out) return;
    // Bounced legally then fell away → receiver missed; never bounced → hitter hit it out.
    this.awardPoint(this.bouncesOnReceiver === 0 ? this.receiver! : this.lastHitter!);
  }

  private serve(side: Side): void {
    const power = side === "player" ? this.charge : lerp(0.3, 0.6, this.difficulty);
    const targetX = side === "player" ? clamp(-this.playerX * 0.5, -TABLE.halfWidth * 0.7, TABLE.halfWidth * 0.7) : (rand() - 0.5) * TABLE.halfWidth;
    const depthT = side === "player" ? (this.aimDepth + 1) / 2 : rand();
    this.launch(side, targetX, depthT, power);
    this.charging = false;
    this.charge = 0;
    this.setPhase("rally");
  }

  /** AI return — aimed at the player's court (target-based; the player is physical). */
  private aiStroke(): void {
    const power = lerp(0.25, 0.85, this.difficulty);
    const targetX = clamp(-this.playerX * 0.5 + (rand() - 0.5) * TABLE.halfWidth * 0.6, -TABLE.halfWidth * 0.8, TABLE.halfWidth * 0.8);
    this.launch("ai", targetX, rand(), power);
    this.pos.z = PADDLE.aiZ + 0.02;
  }

  /** Aim the ball toward the opponent's court, landing at (targetX, targetZ). */
  private launch(side: Side, targetX: number, depthT: number, power: number): void {
    const opp = opponent(side);
    const dir = opp === "ai" ? -1 : 1; // opponent's court is on this side of the net
    const targetZ = dir * lerp(TABLE.halfLength * 0.32, TABLE.halfLength * 0.82, clamp(depthT, 0, 1));
    const T = lerp(SHOT.flightSlow, SHOT.flightFast, clamp(power, 0, 1));

    this.vel = vec3(
      (targetX - this.pos.x) / T,
      (TABLE.surfaceY - this.pos.y + 0.5 * PHYSICS.gravity * T * T) / T,
      (targetZ - this.pos.z) / T,
    );
    this.registerHit(side);
  }

  private registerHit(side: Side): void {
    this.lastHitter = side;
    this.receiver = opponent(side);
    this.mustBounceOn = opponent(side);
    this.bouncesOnReceiver = 0;
  }

  private awardPoint(winner: Side): void {
    this.score = { ...this.score, [winner]: this.score[winner] + 1 };
    this.totalPoints += 1;
    this.vel = vec3();
    this.events.onScore?.(this.score);

    const w = this.score[winner];
    const l = this.score[opponent(winner)];
    if (w >= RULES.winScore && w - l >= RULES.winBy) {
      this.setPhase("gameover");
      return;
    }
    this.server = this.serverForNextPoint();
    this.events.onServer?.(this.server);
    this.timer = RULES.pointDelay;
    this.setPhase("point");
  }

  private serverForNextPoint(): Side {
    // Serve switches every two points (the player starts).
    return Math.floor(this.totalPoints / 2) % 2 === 0 ? "player" : "ai";
  }

  private newPoint(server: Side): void {
    this.server = server;
    this.lastHitter = null;
    this.receiver = null;
    this.mustBounceOn = null;
    this.bouncesOnReceiver = 0;
    this.charge = 0;
    this.charging = false;
    this.vel = vec3();
    if (server === "player") {
      this.pos = vec3(this.playerX, PADDLE.hoverY + 0.08, this.playerZ - 0.12);
    } else {
      this.pos = vec3(this.aiX, PADDLE.hoverY + 0.08, PADDLE.aiZ + 0.12);
      this.timer = RULES.aiServeDelay;
    }
    this.events.onServer?.(server);
    this.setPhase("serving");
  }

  private setPhase(phase: Phase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.events.onPhase?.(phase);
  }
}

function opponent(side: Side): Side {
  return side === "player" ? "ai" : "player";
}

function approach(current: number, target: number, maxDelta: number): number {
  const delta = target - current;
  return Math.abs(delta) <= maxDelta ? target : current + Math.sign(delta) * maxDelta;
}

function rand(): number {
  return Math.random();
}

function clampMag(value: number, max: number): number {
  return Math.max(-max, Math.min(max, value));
}
