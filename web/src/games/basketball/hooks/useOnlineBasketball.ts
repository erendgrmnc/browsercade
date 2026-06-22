/**
 * Online basketball: turn-based, first to RULES.winBaskets. Players alternate
 * shots (host shoots first). The shooter runs the three-stage meter locally and
 * streams the ball's flight; the opponent watches (camera follows the streamed
 * ball). When the shot resolves, a made/miss is relayed, the score updates, and
 * the turn passes. Only the shooter simulates — the server stays a thin relay.
 */
import { useEffect, useRef, useState } from "react";
import { BasketballGame, type AimStage } from "../domain/BasketballGame";
import { RULES, SHOT } from "../config";
import { useRelayRoom } from "@/shared/net/useRelayRoom";
import type { Seat } from "@/shared/net/RelayClient";
import type { BasketballMessage } from "../domain/online/messages";
import { vec3 } from "@/shared/vec3";

type Score = { host: number; guest: number };

export function useOnlineBasketball() {
  const gameRef = useRef<BasketballGame | null>(null);
  if (!gameRef.current) {
    gameRef.current = new BasketballGame();
    gameRef.current.clockEnabled = false; // turn-based: no shot clock
  }
  const game = gameRef.current;

  const seatRef = useRef<Seat | null>(null);
  const shotCountRef = useRef(0);
  const scoreRef = useRef<Score>({ host: 0, guest: 0 });
  const wasFlyingRef = useRef(false);

  const [shotCount, setShotCount] = useState(0);
  const [score, setScore] = useState<Score>({ host: 0, guest: 0 });
  const [over, setOver] = useState(false);
  const [stage, setStage] = useState<AimStage>("pitch");
  const [watching, setWatching] = useState(false);

  const activeSeat = (count: number): Seat => (count % 2 === 0 ? "host" : "guest");

  const room = useRelayRoom<BasketballMessage>({
    game: "basketball",
    onStart: (seat) => {
      seatRef.current = seat;
      resetMatch();
    },
    onPayload: (msg) => {
      switch (msg.kind) {
        case "frame":
          game.pos = vec3(msg.x, msg.y, msg.z);
          setWatching(true);
          break;
        case "end": {
          const shooter = activeSeat(shotCountRef.current); // the opponent, pre-advance
          if (msg.made) game.flashMake(); // play the make FX on the watcher's side
          resolveShot(shooter, msg.made);
          park();
          setWatching(false);
          break;
        }
        case "reset":
          resetMatch();
          break;
      }
    },
  });

  // Mirror only the aim stage to React (the Scene reads the rest of the game live).
  useEffect(() => {
    game.setEvents({ onStage: setStage });
  }, [game]);

  function resetMatch() {
    game.reset();
    game.clockEnabled = false;
    shotCountRef.current = 0;
    setShotCount(0);
    scoreRef.current = { host: 0, guest: 0 };
    setScore({ host: 0, guest: 0 });
    wasFlyingRef.current = false;
    setOver(false);
    setWatching(false);
  }

  function resolveShot(shooter: Seat, made: boolean) {
    if (made) {
      scoreRef.current = { ...scoreRef.current, [shooter]: scoreRef.current[shooter] + 1 };
      setScore(scoreRef.current);
      if (scoreRef.current[shooter] >= RULES.winBaskets) setOver(true);
    }
    shotCountRef.current += 1;
    setShotCount(shotCountRef.current);
  }

  function park() {
    game.pos = vec3(SHOT.spawnX, SHOT.spawnY, SHOT.spawnZ);
    game.vel = vec3();
  }

  const seat = room.seat;
  const playing = room.phase === "playing";
  const myTurn = playing && !over && seat !== null && activeSeat(shotCount) === seat;

  const onShoot = () => {
    if (myTurn) game.press();
  };

  // Per-frame (shooter only): stream the ball, then finalise on settle.
  const onFrame = () => {
    if (over || seatRef.current === null) return;
    if (activeSeat(shotCountRef.current) !== seatRef.current) return; // not my shot

    if (game.phase === "inflight") {
      wasFlyingRef.current = true;
      room.sendPayload({ kind: "frame", x: game.pos.x, y: game.pos.y, z: game.pos.z });
    } else if (wasFlyingRef.current) {
      wasFlyingRef.current = false;
      const made = game.lastMade;
      resolveShot(seatRef.current, made);
      room.sendPayload({ kind: "end", made });
    }
  };

  const rematch = () => {
    resetMatch();
    room.sendPayload({ kind: "reset" });
  };

  const myScore = seat ? score[seat] : 0;
  const oppScore = seat ? score[seat === "host" ? "guest" : "host"] : 0;

  return {
    game,
    room,
    seat,
    stage,
    myTurn,
    over,
    myScore,
    oppScore,
    // Scene wiring:
    interactive: myTurn,
    simulate: playing && myTurn,
    followBall: playing && !myTurn && watching,
    onShoot,
    onFrame,
    rematch,
    status: statusText({ phase: room.phase, myTurn, over, myScore, oppScore }),
  };
}

function statusText(s: {
  phase: string;
  myTurn: boolean;
  over: boolean;
  myScore: number;
  oppScore: number;
}): string {
  if (s.phase !== "playing" && s.phase !== "ended") return "";
  if (s.over) {
    return s.myScore > s.oppScore
      ? `You win ${s.myScore}–${s.oppScore}!`
      : `You lose ${s.oppScore}–${s.myScore}.`;
  }
  return s.myTurn ? "Your shot" : "Opponent shooting…";
}
