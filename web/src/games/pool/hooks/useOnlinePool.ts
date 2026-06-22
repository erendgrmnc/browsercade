/**
 * Online pool: turn-based, shot-authoritative relay. Whoever's turn it is owns
 * the simulation — they aim, strike, and stream the resulting ball positions to
 * the opponent, who just renders them. When the shot settles, the shooter sends
 * the authoritative final state and the turn passes. This avoids any cross-client
 * physics-determinism assumptions while keeping the server a thin relay.
 */
import { useRef, useState } from "react";
import { PoolGame } from "../domain/PoolGame";
import { useRelayRoom } from "@/shared/net/useRelayRoom";
import type { Seat } from "@/shared/net/RelayClient";
import type { BallSnapshot, PoolMessage } from "../domain/online/messages";

type Tally = { host: number; guest: number };

export function useOnlinePool() {
  const gameRef = useRef<PoolGame | null>(null);
  if (!gameRef.current) gameRef.current = new PoolGame();
  const game = gameRef.current;

  // Source-of-truth refs (read by the per-frame loop) mirrored to state for render.
  const seatRef = useRef<Seat | null>(null);
  const shotCountRef = useRef(0); // total shots in the match (host shoots even counts)
  const pottedBeforeRef = useRef(0); // my potted-count snapshot at strike time
  const wasShootingRef = useRef(false);
  const tallyRef = useRef<Tally>({ host: 0, guest: 0 });

  const [shotCount, setShotCount] = useState(0);
  const [tally, setTally] = useState<Tally>({ host: 0, guest: 0 });
  const [over, setOver] = useState(false);

  const activeSeat = (count: number): Seat => (count % 2 === 0 ? "host" : "guest");

  const room = useRelayRoom<PoolMessage>({
    game: "pool",
    onStart: (seat) => {
      seatRef.current = seat;
      resetMatch();
    },
    onPayload: (msg) => {
      switch (msg.kind) {
        case "frame":
          applySnapshot(game, msg.balls);
          break;
        case "end": {
          applySnapshot(game, msg.balls);
          const shooter = activeSeat(shotCountRef.current); // the opponent, pre-increment
          creditShot(shooter, msg.potted, msg.over);
          bumpShot();
          break;
        }
        case "reset":
          resetMatch();
          break;
      }
    },
  });

  function bumpShot() {
    shotCountRef.current += 1;
    setShotCount(shotCountRef.current);
  }

  function creditShot(shooter: Seat, potted: number, cleared: boolean) {
    tallyRef.current = { ...tallyRef.current, [shooter]: tallyRef.current[shooter] + potted };
    setTally(tallyRef.current);
    if (cleared) setOver(true);
  }

  function resetMatch() {
    game.reset();
    shotCountRef.current = 0;
    setShotCount(0);
    tallyRef.current = { host: 0, guest: 0 };
    setTally({ host: 0, guest: 0 });
    wasShootingRef.current = false;
    setOver(false);
  }

  const seat = room.seat;
  const playing = room.phase === "playing";
  const myTurn = playing && seat !== null && activeSeat(shotCount) === seat;

  // Called instead of game.strike(power): record my potted baseline, then strike.
  const onStrike = (power: number) => {
    if (!myTurn || over || game.phase !== "aiming") return;
    pottedBeforeRef.current = currentPotted(game);
    game.strike(power);
  };

  // Called every frame: while I'm the shooter, stream positions; on settle, finalise.
  const onFrame = () => {
    if (over || seatRef.current === null) return;
    if (activeSeat(shotCountRef.current) !== seatRef.current) return; // not my shot

    if (game.phase === "shooting") {
      wasShootingRef.current = true;
      room.sendPayload({ kind: "frame", balls: snapshot(game) });
    } else if (wasShootingRef.current) {
      // The shot just came to rest.
      wasShootingRef.current = false;
      const potted = currentPotted(game) - pottedBeforeRef.current;
      const cleared = objectsRemaining(game) === 0;
      creditShot(seatRef.current, potted, cleared);
      room.sendPayload({ kind: "end", balls: snapshot(game), potted, over: cleared });
      bumpShot();
    }
  };

  const rematch = () => {
    resetMatch();
    room.sendPayload({ kind: "reset" });
  };

  return {
    game,
    room,
    seat,
    myTurn,
    over,
    tally,
    // Scene wiring:
    simulate: playing && myTurn,
    aimable: playing && myTurn && !over,
    onStrike,
    onFrame,
    rematch,
    status: statusText({ phase: room.phase, myTurn, over, seat, tally }),
  };
}

function statusText(s: {
  phase: string;
  myTurn: boolean;
  over: boolean;
  seat: Seat | null;
  tally: Tally;
}): string {
  if (s.phase !== "playing" && s.phase !== "ended") return "";
  if (s.over && s.seat) {
    const mine = s.tally[s.seat];
    const theirs = s.seat === "host" ? s.tally.guest : s.tally.host;
    if (mine === theirs) return `Rack cleared — tied ${mine}–${theirs}.`;
    return mine > theirs ? `You win ${mine}–${theirs}!` : `You lose ${theirs}–${mine}.`;
  }
  return s.myTurn ? "Your shot" : "Opponent's shot";
}

function snapshot(g: PoolGame): BallSnapshot[] {
  return g.balls.map((b) => ({ x: b.x, z: b.z, p: b.pocketed }));
}

function applySnapshot(g: PoolGame, snap: BallSnapshot[]): void {
  snap.forEach((s, i) => {
    const b = g.balls[i];
    if (!b) return;
    b.x = s.x;
    b.z = s.z;
    b.pocketed = s.p;
    b.vx = 0;
    b.vz = 0;
  });
}

function currentPotted(g: PoolGame): number {
  return g.balls.filter((b) => !b.isCue && b.pocketed).length;
}

function objectsRemaining(g: PoolGame): number {
  return g.balls.filter((b) => !b.isCue && !b.pocketed).length;
}
