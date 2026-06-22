/**
 * Headless 2D pool. Balls live on the XZ plane; the renderer lifts them to Y.
 * A strike sets the cue ball's velocity; the table is simulated (friction,
 * cushions, pairwise collisions, pockets) until every ball comes to rest.
 *
 * Two modes share the same simulation:
 *  - legacy (default): "sink all 15" — used by online turn-based play, which
 *    layers its own turn/scoring logic on top.
 *  - rules ({ rules: true }): full 8-ball — suit assignment, fouls, ball-in-hand,
 *    8-ball win/loss. With { vsAI: true } the game can also compute a shot for
 *    the AI seat.
 */
import { AI, BALL, BALL_COLORS, PHYSICS, POCKET, RACK, RACK_NUMBERS, SHOT, TABLE, palette } from "../config";
import { collideBalls } from "./physics";
import type { Ball, BallGroup, Player, Pocket, PoolPhase, RulesState } from "./types";

type Events = {
  onScore?: (pocketed: number) => void;
  onPhase?: (phase: PoolPhase) => void;
  onRules?: (state: RulesState) => void;
};

type Options = { rules?: boolean; vsAI?: boolean };

export type AIShot = { place?: { x: number; z: number }; aimX: number; aimZ: number; power: number };

export class PoolGame {
  balls: Ball[] = buildRack();
  phase: PoolPhase = "aiming";
  aimX = 0;
  aimZ = 0;

  // 8-ball rule state (only meaningful when rulesOn).
  currentPlayer: Player = 0;
  groups: [BallGroup | null, BallGroup | null] = [null, null];
  ballInHand = false;
  winner: Player | null = null;
  message = "Break the rack.";

  readonly rulesOn: boolean;
  readonly vsAI: boolean;

  private readonly pockets: Pocket[] = buildPockets();
  private events: Events = {};

  // Per-shot bookkeeping (rules mode).
  private firstContact: Ball | null = null;
  private pottedThisShot: Ball[] = [];
  private shotTarget: "open" | BallGroup = "open";

  constructor(opts: Options = {}) {
    this.rulesOn = opts.rules ?? false;
    this.vsAI = opts.vsAI ?? false;
  }

  setEvents(events: Events): void {
    this.events = events;
    events.onScore?.(this.pocketedCount());
    if (this.rulesOn) events.onRules?.(this.rulesState());
  }

  reset(): void {
    this.balls = buildRack();
    this.currentPlayer = 0;
    this.groups = [null, null];
    this.ballInHand = false;
    this.winner = null;
    this.message = "Break the rack.";
    this.firstContact = null;
    this.pottedThisShot = [];
    this.setPhase("aiming");
    this.events.onScore?.(0);
    if (this.rulesOn) this.events.onRules?.(this.rulesState());
  }

  setAim(x: number, z: number): void {
    this.aimX = x;
    this.aimZ = z;
  }

  get cue(): Ball {
    return this.balls[0];
  }

  /** Place the cue ball during ball-in-hand. Returns true if the spot was legal. */
  placeCue(x: number, z: number): boolean {
    if (!this.ballInHand || this.phase !== "aiming") return false;
    const r = this.cue.radius;
    const cx = clamp(x, -TABLE.halfWidth + r, TABLE.halfWidth - r);
    const cz = clamp(z, -TABLE.halfLength + r, TABLE.halfLength - r);
    const blocked = this.balls.some(
      (b) => b !== this.cue && !b.pocketed && Math.hypot(b.x - cx, b.z - cz) < b.radius + r,
    );
    if (blocked) return false;
    this.cue.x = cx;
    this.cue.z = cz;
    this.cue.pocketed = false;
    this.ballInHand = false;
    this.message = this.turnLabel() + " to shoot.";
    this.events.onRules?.(this.rulesState());
    return true;
  }

  /**
   * Strike the cue ball toward the aim point. `power` is a 0..1 charge; if
   * omitted, falls back to the legacy distance-based power (online).
   */
  strike(power?: number): void {
    if (this.phase !== "aiming" || this.ballInHand) return;
    const dx = this.aimX - this.cue.x;
    const dz = this.aimZ - this.cue.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.001) return;

    const speed =
      power == null
        ? clamp(dist * 2.4, SHOT.minPower, SHOT.maxPower)
        : SHOT.minPower + clamp01(power) * (SHOT.maxPower - SHOT.minPower);

    this.cue.vx = (dx / dist) * speed;
    this.cue.vz = (dz / dist) * speed;

    this.firstContact = null;
    this.pottedThisShot = [];
    this.shotTarget = this.targetFor(this.currentPlayer);
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

  /** Cushion rebound — but only away from a pocket mouth, so balls fall in. */
  private bounceCushions(ball: Ball): void {
    const limX = TABLE.halfWidth - ball.radius;
    const limZ = TABLE.halfLength - ball.radius;
    const nearPocket = this.pockets.some((p) => Math.hypot(ball.x - p.x, ball.z - p.z) < p.radius + ball.radius);
    if (nearPocket) return;

    if (ball.x > limX) { ball.x = limX; ball.vx = -Math.abs(ball.vx) * PHYSICS.cushion; }
    else if (ball.x < -limX) { ball.x = -limX; ball.vx = Math.abs(ball.vx) * PHYSICS.cushion; }
    if (ball.z > limZ) { ball.z = limZ; ball.vz = -Math.abs(ball.vz) * PHYSICS.cushion; }
    else if (ball.z < -limZ) { ball.z = -limZ; ball.vz = Math.abs(ball.vz) * PHYSICS.cushion; }
  }

  private resolveCollisions(): void {
    for (let i = 0; i < this.balls.length; i++) {
      const a = this.balls[i];
      if (a.pocketed) continue;
      for (let j = i + 1; j < this.balls.length; j++) {
        const b = this.balls[j];
        if (b.pocketed) continue;
        // Record the cue's first object-ball contact (for foul detection).
        if (this.firstContact == null && (a.isCue || b.isCue)) {
          const touching = Math.hypot(b.x - a.x, b.z - a.z) < a.radius + b.radius;
          if (touching) this.firstContact = a.isCue ? b : a;
        }
        collideBalls(a, b);
      }
    }
  }

  private pocketIfCaught(ball: Ball): void {
    if (ball.pocketed) return;
    const sunk = this.pockets.some((p) => Math.hypot(ball.x - p.x, ball.z - p.z) < p.radius);
    if (!sunk) return;
    ball.pocketed = true;
    ball.vx = 0;
    ball.vz = 0;
    this.pottedThisShot.push(ball);
  }

  private allAtRest(): boolean {
    return this.balls.every((b) => b.pocketed || Math.hypot(b.vx, b.vz) < PHYSICS.restThreshold);
  }

  private endShot(): void {
    for (const ball of this.balls) {
      ball.vx = 0;
      ball.vz = 0;
    }
    if (this.rulesOn) this.resolveRules();
    else this.resolveLegacy();
  }

  // ---- legacy "sink all 15" resolution (online) ----------------------------

  private resolveLegacy(): void {
    if (this.cue.pocketed) this.respawnCue();
    this.events.onScore?.(this.pocketedCount());
    if (this.objectsRemaining() === 0) this.setPhase("won");
    else this.setPhase("aiming");
  }

  // ---- full 8-ball resolution ----------------------------------------------

  private resolveRules(): void {
    const me = this.currentPlayer;
    const opp = other(me);
    const scratch = this.cue.pocketed;
    const objects = this.pottedThisShot.filter((b) => !b.isCue);
    const eightPotted = objects.some((b) => b.group === "eight");

    // 8-ball decided the frame.
    if (eightPotted) {
      const legal = this.eightWasLegal(me, scratch);
      this.winner = legal ? me : opp;
      this.message = `${this.nameOf(this.winner)} ${this.winner === 0 ? "win" : "wins"}! ${legal ? "🎱" : "(8-ball foul)"}`;
      this.events.onScore?.(this.pocketedCount());
      this.setPhase("gameover");
      this.events.onRules?.(this.rulesState());
      return;
    }

    // Suit assignment on an open table (never on the break itself remaining open).
    if (this.groups[me] == null && objects.length > 0) {
      const g = objects[0].group; // assign by the first ball legally sent down
      if (g === "solid" || g === "stripe") {
        this.groups[me] = g;
        this.groups[opp] = g === "solid" ? "stripe" : "solid";
      }
    }

    const foul = this.shotWasFoul(scratch);
    const pottedOwn = objects.some((b) => this.isOwnBall(me, b));

    if (scratch) this.respawnCue();

    if (foul) {
      this.currentPlayer = opp;
      this.ballInHand = true;
      this.message = `${this.foulReason(scratch)} — ${this.nameOf(opp)} ${opp === 0 ? "have" : "has"} ball in hand.`;
    } else if (pottedOwn) {
      this.message = `${this.nameOf(me)} potted — shoot again.`;
    } else {
      this.currentPlayer = opp;
      this.message = `${this.nameOf(opp)} to shoot.`;
    }

    this.events.onScore?.(this.pocketedCount());
    this.setPhase("aiming");
    this.events.onRules?.(this.rulesState());
  }

  /** Legal 8-ball: own suit cleared before this shot, hit the 8 first, no scratch. */
  private eightWasLegal(me: Player, scratch: boolean): boolean {
    if (scratch) return false;
    const g = this.groups[me];
    if (!g) return false; // can't legally pot the 8 on an open table
    const suitCleared = this.balls
      .filter((b) => b.group === g)
      .every((b) => b.pocketed && !this.pottedThisShot.includes(b));
    return suitCleared && this.firstContact?.group === "eight";
  }

  private shotWasFoul(scratch: boolean): boolean {
    if (scratch) return true;
    if (!this.firstContact) return true; // no rail contact at all
    if (this.shotTarget === "open") return false; // any ball is fair on an open table
    return this.firstContact.group !== this.shotTarget;
  }

  private foulReason(scratch: boolean): string {
    if (scratch) return "Scratch";
    if (!this.firstContact) return "No ball hit";
    return "Wrong ball first";
  }

  /** What the player must hit first this shot. */
  private targetFor(p: Player): "open" | BallGroup {
    const g = this.groups[p];
    if (!g) return "open";
    const remaining = this.balls.some((b) => b.group === g && !b.pocketed);
    return remaining ? g : "eight";
  }

  private isOwnBall(p: Player, b: Ball): boolean {
    const g = this.groups[p];
    if (!g) return b.group !== "eight"; // open table: any object ball counts
    if (this.targetFor(p) === "eight") return b.group === "eight";
    return b.group === g;
  }

  // ---- AI ------------------------------------------------------------------

  /** Compute a shot for the current (AI) seat. Heuristic: easiest ball→pocket. */
  computeAIShot(): AIShot {
    const target = this.targetFor(this.currentPlayer);
    const candidates = this.balls.filter((b) => {
      if (b.pocketed || b.isCue) return false;
      if (target === "open") return b.group !== "eight";
      if (target === "eight") return b.group === "eight";
      return b.group === target;
    });

    let cueX = this.cue.x;
    let cueZ = this.cue.z;
    let placement: { x: number; z: number } | undefined;

    let best: { aimX: number; aimZ: number; power: number; score: number } | null = null;
    const r = BALL.radius;

    for (const ball of candidates.length ? candidates : this.objectBalls()) {
      for (const p of this.pockets) {
        const toPocket = unit(p.x - ball.x, p.z - ball.z);
        // Ghost-ball spot the cue must arrive at to send the ball to the pocket.
        const ghostX = ball.x - toPocket.x * 2 * r;
        const ghostZ = ball.z - toPocket.z * 2 * r;
        const toGhost = unit(ghostX - cueX, ghostZ - cueZ);

        // Cut too thin to make? skip.
        const cut = toGhost.x * toPocket.x + toGhost.z * toPocket.z;
        if (cut < 0.25) continue;

        const cueDist = Math.hypot(ghostX - cueX, ghostZ - cueZ);
        const pocketDist = Math.hypot(p.x - ball.x, p.z - ball.z);

        const pathBlocked =
          this.segmentBlocked(cueX, cueZ, ghostX, ghostZ, [ball]) ||
          this.segmentBlocked(ball.x, ball.z, p.x, p.z, [ball]);
        if (pathBlocked) continue;

        const score = cueDist + pocketDist * 1.3 - cut * 0.6;
        if (!best || score < best.score) {
          const power = clamp01((cueDist + pocketDist) / 5.5 + 0.25);
          best = { aimX: ghostX, aimZ: ghostZ, power, score };
        }
      }
    }

    // No clean shot: gently nudge the nearest own ball to avoid a scratch.
    if (!best) {
      const targets = candidates.length ? candidates : this.objectBalls();
      const near = targets.reduce(
        (acc, b) => {
          const d = Math.hypot(b.x - cueX, b.z - cueZ);
          return d < acc.d ? { b, d } : acc;
        },
        { b: targets[0], d: Infinity },
      );
      const aim = near.b ?? this.cue;
      best = { aimX: aim.x, aimZ: aim.z, power: 0.45, score: 0 };
    }

    // Ball in hand: line the cue up straight behind the chosen aim point.
    if (this.ballInHand) {
      const dir = unit(best.aimX - cueX, best.aimZ - cueZ);
      placement = {
        x: clamp(best.aimX - dir.x * 0.6, -TABLE.halfWidth + r, TABLE.halfWidth - r),
        z: clamp(best.aimZ - dir.z * 0.6, -TABLE.halfLength + r, TABLE.halfLength - r),
      };
    }

    // Add human-like error.
    const jitter = (m: number) => (Math.random() - 0.5) * 2 * m;
    return {
      place: placement,
      aimX: best.aimX + jitter(AI.aimError),
      aimZ: best.aimZ + jitter(AI.aimError),
      power: clamp01(best.power + jitter(AI.powerError)),
    };
  }

  private segmentBlocked(ax: number, az: number, bx: number, bz: number, ignore: Ball[]): boolean {
    const r = BALL.radius;
    return this.balls.some((c) => {
      if (c.pocketed || c.isCue || ignore.includes(c)) return false;
      return pointSegmentDistance(c.x, c.z, ax, az, bx, bz) < 2 * r;
    });
  }

  private objectBalls(): Ball[] {
    return this.balls.filter((b) => !b.isCue && !b.pocketed);
  }

  // ---- shared helpers ------------------------------------------------------

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

  private turnLabel(): string {
    return this.nameOf(this.currentPlayer);
  }

  private nameOf(p: Player): string {
    if (!this.vsAI) return p === 0 ? "Player 1" : "Player 2";
    return p === 0 ? "You" : "AI";
  }

  private rulesState(): RulesState {
    return {
      currentPlayer: this.currentPlayer,
      groups: [this.groups[0], this.groups[1]],
      ballInHand: this.ballInHand,
      winner: this.winner,
      message: this.message,
    };
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

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function other(p: Player): Player {
  return p === 0 ? 1 : 0;
}

function unit(x: number, z: number): { x: number; z: number } {
  const d = Math.hypot(x, z) || 1;
  return { x: x / d, z: z / d };
}

/** Distance from point P to segment AB (all in the XZ plane). */
function pointSegmentDistance(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const abx = bx - ax;
  const abz = bz - az;
  const len2 = abx * abx + abz * abz || 1;
  let t = ((px - ax) * abx + (pz - az) * abz) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

function buildPockets(): Pocket[] {
  const { halfWidth: w, halfLength: l } = TABLE;
  const c = POCKET.mouthCorner;
  const s = POCKET.mouthSide;
  return [
    { x: -w, z: -l, radius: c }, { x: w, z: -l, radius: c },
    { x: -w, z: l, radius: c }, { x: w, z: l, radius: c },
    { x: -w, z: 0, radius: s }, { x: w, z: 0, radius: s },
  ];
}

function buildRack(): Ball[] {
  const cue: Ball = { x: 0, z: RACK.cueZ, vx: 0, vz: 0, radius: BALL.radius, color: palette.cue, number: 0, group: "cue", pocketed: false, isCue: true };
  const balls: Ball[] = [cue];

  const gap = BALL.radius * 2 * 1.02;
  const rowDrop = gap * 0.87; // hex packing row height
  let index = 0;
  for (let row = 0; row < 5; row++) {
    const z = RACK.apexZ - row * rowDrop;
    for (let i = 0; i <= row; i++) {
      const x = (i - row / 2) * gap;
      const num = RACK_NUMBERS[index];
      balls.push({
        x,
        z,
        vx: 0,
        vz: 0,
        radius: BALL.radius,
        color: BALL_COLORS[num],
        number: num,
        group: num === 8 ? "eight" : num <= 7 ? "solid" : "stripe",
        pocketed: false,
        isCue: false,
      });
      index += 1;
    }
  }
  return balls;
}
