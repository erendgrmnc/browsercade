/**
 * Headless ping-pong simulation. Deterministic 3D-Pong model: the ball travels
 * at constant speed in the XZ plane, bounces off the side walls, and is returned
 * (or missed) at each paddle's plane. No React, no three.js — the renderer reads
 * this state each frame; React state is only touched on score/phase changes.
 */
import { BALL, PADDLE, RULES, TABLE } from "../config";
import { AiController } from "./AiController";
import { approach, clamp, lerp } from "@/shared/math";
import type { Phase, Score, Side } from "./types";

type Events = { onScore?: (score: Score) => void; onPhase?: (phase: Phase) => void };

export class PingPongGame {
  ballX = 0;
  ballZ = 0;
  ballVX = 0;
  ballVZ = 0;
  speed: number = BALL.baseSpeed;

  playerX = 0;
  aiX = 0;
  playerTargetX = 0;

  score: Score = { player: 0, ai: 0 };
  phase: Phase = "serving";
  difficulty = 0.6;

  private server: Side = "player";
  private timer = 0;
  private readonly ai = new AiController();
  private events: Events = {};

  constructor() {
    this.beginServe("player");
  }

  setEvents(events: Events): void {
    this.events = events;
  }

  reset(): void {
    this.score = { player: 0, ai: 0 };
    this.speed = BALL.baseSpeed;
    this.beginServe("player");
    this.events.onScore?.(this.score);
  }

  /** Ball height: a cosmetic arc that peaks over the net. Collisions ignore Y. */
  get ballY(): number {
    const nearNet = 1 - clamp(Math.abs(this.ballZ) / TABLE.halfLength, 0, 1);
    return TABLE.surfaceY + BALL.radius + BALL.hop * nearNet;
  }

  update(dt: number): void {
    this.movePaddles(dt);
    if (this.phase === "rally") this.stepRally(dt);
    else this.tickTimer(dt);
  }

  private movePaddles(dt: number): void {
    const limit = TABLE.halfWidth;
    this.playerX = approach(this.playerX, clamp(this.playerTargetX, -limit, limit), PADDLE.playerSpeed * dt);

    const target = this.ai.targetX(this.ballX, this.ballVZ, this.aiX, this.difficulty);
    const aiSpeed = lerp(PADDLE.aiSpeedEasy, PADDLE.aiSpeedHard, this.difficulty);
    this.aiX = approach(this.aiX, clamp(target, -limit, limit), aiSpeed * dt);
  }

  private tickTimer(dt: number): void {
    if (this.phase === "serving") this.holdServeBall();
    this.timer -= dt;
    if (this.timer > 0) return;
    if (this.phase === "serving") this.launchServe();
    else if (this.phase === "point") this.beginServe(this.server);
  }

  private beginServe(server: Side): void {
    this.server = server;
    this.ballZ = server === "player" ? PADDLE.playerZ - 0.15 : PADDLE.aiZ + 0.15;
    this.ballX = server === "player" ? this.playerX : this.aiX;
    this.ballVX = 0;
    this.ballVZ = 0;
    this.speed = BALL.baseSpeed;
    this.timer = RULES.serveDelay;
    this.setPhase("serving");
  }

  private holdServeBall(): void {
    this.ballX = this.server === "player" ? this.playerX : this.aiX;
  }

  private launchServe(): void {
    const toward: Side = this.server === "player" ? "ai" : "player";
    this.aimAt(toward, Math.sin(this.ballX * 3) * 0.4); // small, deterministic serve angle
    this.setPhase("rally");
  }

  private stepRally(dt: number): void {
    this.ballX += this.ballVX * dt;
    this.ballZ += this.ballVZ * dt;
    this.bounceWalls();
    this.checkPaddlePlanes();
  }

  private bounceWalls(): void {
    const edge = TABLE.halfWidth - BALL.radius;
    if (this.ballX > edge) {
      this.ballX = edge;
      this.ballVX = -Math.abs(this.ballVX);
    } else if (this.ballX < -edge) {
      this.ballX = -edge;
      this.ballVX = Math.abs(this.ballVX);
    }
  }

  private checkPaddlePlanes(): void {
    if (this.ballVZ > 0 && this.ballZ >= PADDLE.playerZ) this.resolvePaddle("player");
    else if (this.ballVZ < 0 && this.ballZ <= PADDLE.aiZ) this.resolvePaddle("ai");
  }

  private resolvePaddle(side: Side): void {
    const paddleX = side === "player" ? this.playerX : this.aiX;
    if (Math.abs(this.ballX - paddleX) > PADDLE.halfWidth + BALL.radius) {
      this.awardPoint(opponent(side));
      return;
    }
    const english = clamp((this.ballX - paddleX) / PADDLE.halfWidth, -1, 1);
    this.speed = Math.min(BALL.maxSpeed, this.speed + BALL.speedGain);
    this.aimAt(opponent(side), english);
    this.ballZ = side === "player" ? PADDLE.playerZ - 0.002 : PADDLE.aiZ + 0.002;
  }

  /** Aim the ball toward a side; `angle` in [-1, 1] skews it across the table. */
  private aimAt(toward: Side, angle: number): void {
    const dx = clamp(angle, -1, 1) * 0.85;
    const dz = toward === "ai" ? -1 : 1;
    const length = Math.hypot(dx, dz) || 1;
    this.ballVX = (dx / length) * this.speed;
    this.ballVZ = (dz / length) * this.speed;
  }

  private awardPoint(winner: Side): void {
    this.score = { ...this.score, [winner]: this.score[winner] + 1 };
    this.events.onScore?.(this.score);
    if (this.score[winner] >= RULES.winScore) {
      this.setPhase("gameover");
      return;
    }
    this.server = opponent(winner); // loser of the rally serves next
    this.timer = RULES.pointDelay;
    this.setPhase("point");
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
