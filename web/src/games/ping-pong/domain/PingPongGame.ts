/**
 * Headless table-tennis simulation. The ball is a real projectile (gravity +
 * table bounces + net); points follow table-tennis rules (serve, one legal
 * bounce per side, faults into net / off the table / double bounce).
 *
 * Controls (player): mouse X slides the racket left/right AND, because the racket
 * yaw is bound to that lateral position, aims the return (centre → middle of the
 * AI court, full-left/right → near the side line). Mouse Y slides the racket
 * forward/back at a fixed height; how fast it is pushed toward the net at contact
 * sets the shot's power. Strokes are sent to a target with a flight time from
 * that power, so returns reliably land in court. No React, no three.js.
 */
import { BALL, PADDLE, PHYSICS, RULES, SHOT, SWING, TABLE } from "../config";
import { AiController } from "./AiController";
import { clamp, lerp } from "@/shared/math";
import { integrate, vec3, type Vec3 } from "@/shared/vec3";
import type { Phase, Score, Side } from "./types";

type Events = {
  onScore?: (score: Score) => void;
  onPhase?: (phase: Phase) => void;
  onServer?: (server: Side) => void;
};

export class PingPongGame {
  pos: Vec3 = vec3(0, PADDLE.hoverY, PADDLE.playerBaseZ);
  vel: Vec3 = vec3();

  // Player racket state (driven imperatively by the Scene each frame).
  playerX = 0;
  playerZ: number = PADDLE.playerBaseZ; // depth, set from mouse Y
  readonly playerY: number = PADDLE.hoverY; // fixed height — the hit ignores height
  playerTargetX = 0; // from mouse X
  playerTargetZ: number = PADDLE.playerBaseZ; // from mouse Y
  racketRoll = 0; // visible roll (blade keeps facing the net), bound to lateral position
  forwardSpeed = 0; // smoothed paddle speed toward the net (u/s) — sets power

  aiX = 0;

  score: Score = { player: 0, ai: 0 };
  phase: Phase = "serving";
  difficulty = 0.6;
  server: Side = "player";

  private lastHitter: Side | null = null;
  private receiver: Side | null = null;
  private mustBounceOn: Side | null = null;
  private bouncesOnReceiver = 0;
  private servePeakForward = 0; // best forward flick seen while waiting to serve
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

  /**
   * Where the ball will next hit the table (its bounce point), or null. Used as
   * the on-table cue so the player can slide the racket to the right spot.
   */
  predictBounce(): { x: number; z: number } | null {
    if (this.phase !== "rally") return null;
    const g = PHYSICS.gravity;
    const y0 = this.pos.y - (TABLE.surfaceY + BALL.radius);
    const disc = this.vel.y * this.vel.y + 2 * g * y0;
    if (disc < 0) return null;
    const t = (this.vel.y + Math.sqrt(disc)) / g; // time to the descending crossing
    if (t <= 0) return null;
    const x = this.pos.x + this.vel.x * t;
    const z = this.pos.z + this.vel.z * t;
    if (Math.abs(x) > TABLE.halfWidth || Math.abs(z) > TABLE.halfLength) return null;
    return { x, z };
  }

  /** Pointer pressed — nothing to arm; power comes from the forward swing. */
  press(): void {}

  /** Pointer released — serve (if it's our serve). */
  release(): void {
    if (this.phase === "serving" && this.server === "player") this.serve("player");
  }

  /** Pointer left the canvas — kept for the App wiring; no charge to abandon. */
  cancelCharge(): void {}

  update(dt: number): void {
    if (this.phase === "gameover") return;
    this.movePaddles(dt);

    if (this.phase === "serving") this.stepServing(dt);
    else if (this.phase === "rally") this.stepRally(dt);
    else if (this.phase === "point") this.tickPoint(dt);
  }

  private movePaddles(dt: number): void {
    const newX = clamp(this.playerTargetX, -PADDLE.xRange, PADDLE.xRange);
    const newZ = clamp(this.playerTargetZ, PADDLE.playerBaseZ - PADDLE.zForward, PADDLE.playerBaseZ + PADDLE.zBack);

    // Forward velocity (toward the net = z decreasing). Low-passed so a flick reads
    // as power without single-frame spikes.
    const rawForward = dt > 0 ? (this.playerZ - newZ) / dt : 0;
    this.forwardSpeed = lerp(this.forwardSpeed, Math.max(rawForward, 0), SWING.velSmooth);

    // Roll is bound to lateral POSITION: centre = upright, full left/right rolls
    // the racket ~90° (handle swings to that side). The blade keeps facing the net.
    const posT = newX / PADDLE.xRange; // -1..1
    this.racketRoll = posT * PADDLE.maxRoll;

    this.playerX = newX;
    this.playerZ = newZ;

    if (this.phase === "serving" && this.server === "player") {
      this.servePeakForward = Math.max(this.servePeakForward, this.forwardSpeed);
    }

    const limit = TABLE.halfWidth + 0.2;
    const target = this.ai.targetX(this.pos.x, this.vel.z, this.aiX, this.difficulty);
    const speed = lerp(PADDLE.aiSpeedEasy, PADDLE.aiSpeedHard, this.difficulty);
    this.aiX = approach(this.aiX, clamp(target, -limit, limit), speed * dt);
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
    this.handlePlayerStrike(prevZ); // player return
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
    // The player's return is handled in handlePlayerStrike; the AI returns here.
    if (this.receiver === "ai" && this.vel.z < 0 && prevZ > PADDLE.aiZ && this.pos.z <= PADDLE.aiZ) {
      this.resolveAiReach(PADDLE.aiReach * lerp(0.85, 1.12, this.difficulty));
    }
  }

  private resolveAiReach(reach: number): void {
    if (this.bouncesOnReceiver === 0) return; // hasn't bounced yet — it's flying long (out comes next)
    if (Math.abs(this.pos.x - this.aiX) <= reach) this.aiStroke();
    else this.awardPoint(this.lastHitter!); // AI missed the return
  }

  /**
   * Player return. The ball must have bounced once on our side, be heading toward
   * the player, and genuinely reach the blade — within a tight lateral radius and
   * within a shallow depth band of the racket's actual depth (so a forward push
   * lets the paddle strike the ball). Height is ignored: the racket always covers
   * the ball's height. Aim comes from where the face points (yaw = lateral
   * position); power comes from how fast the racket is moving toward the net.
   */
  private handlePlayerStrike(prevZ: number): void {
    if (this.receiver !== "player" || this.vel.z <= 0) return;
    if (this.bouncesOnReceiver < 1) return; // must bounce on our side first

    const crossed = prevZ < this.playerZ && this.pos.z >= this.playerZ;
    const inDepthBand = Math.abs(this.pos.z - this.playerZ) <= PADDLE.catchDepth;
    if (!crossed && !inDepthBand) return; // ball isn't at the paddle yet
    if (Math.abs(this.pos.x - this.playerX) > PADDLE.catchRadius) return; // lateral miss

    const power = this.powerFromForward(this.forwardSpeed);
    this.launchFromFace(power);
  }

  /** Forward paddle speed → shot power (a still touch still clears the net). */
  private powerFromForward(forward: number): number {
    const t = clamp(forward / SWING.fullForwardSpeed, 0, 1);
    return clamp(SHOT.basePower + (1 - SHOT.basePower) * t, 0, 1);
  }

  /** Send the ball where the racket points: where you stand aims it (left → left). */
  private launchFromFace(power: number): void {
    const posT = this.racketRoll / PADDLE.maxRoll; // -1..1, your lateral position
    const aimX = clamp(posT * TABLE.halfWidth * SHOT.aimSideFrac, -TABLE.halfWidth * SHOT.aimSideFrac, TABLE.halfWidth * SHOT.aimSideFrac);
    const depthT = lerp(SHOT.depthMin, SHOT.depthMax, power);
    this.launch("player", aimX, depthT, power);
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
    let power: number;
    let targetX: number;
    let depthT: number;
    if (side === "player") {
      power = Math.max(SWING.serveMinPower, this.powerFromForward(this.servePeakForward));
      targetX = clamp((this.racketRoll / PADDLE.maxRoll) * TABLE.halfWidth * 0.6, -TABLE.halfWidth * 0.7, TABLE.halfWidth * 0.7);
      depthT = lerp(0.45, 0.85, power);
    } else {
      power = lerp(0.3, 0.6, this.difficulty);
      targetX = (rand() - 0.5) * TABLE.halfWidth;
      depthT = rand();
    }
    this.servePeakForward = 0;
    this.launch(side, targetX, depthT, power);
    this.setPhase("rally");
  }

  /** AI return — aimed at the player's court. */
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
    this.servePeakForward = 0;
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
