/**
 * Online beer-pong: a two-sided table. Each player owns a rack at their end
 * (host = red, guest = blue) and throws across at the OPPONENT's rack. Turns
 * alternate (host first). The thrower simulates locally and streams the ball +
 * the rack they're hitting; the opponent renders that ball mirrored onto their
 * side and watches their own (near) cups disappear. First to clear the rack they
 * throw at wins. The server only relays.
 */
import { useRef, useState } from "react";
import { BeerPongGame } from "../domain/BeerPongGame";
import { useRelayRoom } from "@/shared/net/useRelayRoom";
import type { Seat } from "@/shared/net/RelayClient";
import type { BeerPongMessage } from "../domain/online/messages";
import { THROW, palette } from "../config";

const RED = palette.cup; // player 1 (host)
const BLUE = "#3b6bff"; // player 2 (guest)

const countActive = (a: boolean[]) => a.filter(Boolean).length;

export function useOnlineBeerPong() {
  const gameRef = useRef<BeerPongGame | null>(null);
  if (!gameRef.current) gameRef.current = new BeerPongGame();
  const game = gameRef.current;

  const seatRef = useRef<Seat | null>(null);
  const throwCountRef = useRef(0);
  const wasFlyingRef = useRef(false);
  const oppBallRef = useRef<{ x: number; y: number; z: number }>({
    x: 0,
    y: THROW.spawnY,
    z: THROW.spawnZ,
  });
  const myCupsActiveRef = useRef<boolean[]>(game.cups.map(() => true));

  const total = game.cups.length;
  const [throwCount, setThrowCount] = useState(0);
  const [watching, setWatching] = useState(false);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [oppCupsLeft, setOppCupsLeft] = useState(total); // the far rack I throw at
  const [myCupsLeft, setMyCupsLeft] = useState(total); // my near rack

  const activeSeat = (count: number): Seat => (count % 2 === 0 ? "host" : "guest");

  const room = useRelayRoom<BeerPongMessage>({
    game: "beer-pong",
    onStart: (seat) => {
      seatRef.current = seat;
      resetMatch();
    },
    onPayload: (msg) => {
      switch (msg.kind) {
        case "frame": {
          oppBallRef.current = { x: msg.bx, y: msg.by, z: msg.bz };
          myCupsActiveRef.current = msg.cups;
          const left = countActive(msg.cups);
          setMyCupsLeft((prev) => (prev === left ? prev : left)); // only re-render on change
          setWatching(true);
          break;
        }
        case "end":
          oppBallRef.current = { x: msg.bx, y: msg.by, z: msg.bz };
          myCupsActiveRef.current = msg.cups;
          setMyCupsLeft(countActive(msg.cups));
          setWatching(false);
          if (msg.over) {
            setOver(true);
            setWon(false); // the opponent cleared my rack → I lose
          }
          bumpThrow();
          break;
        case "reset":
          resetMatch();
          break;
      }
    },
  });

  function bumpThrow() {
    throwCountRef.current += 1;
    setThrowCount(throwCountRef.current);
  }

  function resetMatch() {
    game.reset();
    throwCountRef.current = 0;
    setThrowCount(0);
    myCupsActiveRef.current = game.cups.map(() => true);
    setMyCupsLeft(game.cups.length);
    setOppCupsLeft(game.cups.length);
    wasFlyingRef.current = false;
    setWatching(false);
    setOver(false);
    setWon(false);
    oppBallRef.current = { x: 0, y: THROW.spawnY, z: THROW.spawnZ };
  }

  const seat = room.seat;
  const playing = room.phase === "playing";
  const myTurn = playing && !over && seat !== null && activeSeat(throwCount) === seat;

  const onThrow = () => {
    if (myTurn && game.phase === "aiming") game.shoot();
  };

  // Per-frame (thrower only): stream the ball + target rack, finalise on settle.
  const onFrame = () => {
    if (over || seatRef.current === null) return;
    if (activeSeat(throwCountRef.current) !== seatRef.current) return; // not my throw

    if (game.phase === "inflight") {
      wasFlyingRef.current = true;
      const cups = game.cups.map((c) => c.active);
      room.sendPayload({ kind: "frame", bx: game.pos.x, by: game.pos.y, bz: game.pos.z, cups });
    } else if (wasFlyingRef.current) {
      wasFlyingRef.current = false;
      const cups = game.cups.map((c) => c.active);
      const cleared = cups.every((a) => !a);
      setOppCupsLeft(countActive(cups));
      if (cleared) {
        setOver(true);
        setWon(true);
      }
      room.sendPayload({ kind: "end", bx: game.pos.x, by: game.pos.y, bz: game.pos.z, cups, over: cleared });
      bumpThrow();
    }
  };

  const rematch = () => {
    resetMatch();
    room.sendPayload({ kind: "reset" });
  };

  const myColor = seat === "guest" ? BLUE : RED;
  const oppColor = seat === "guest" ? RED : BLUE;

  return {
    game,
    room,
    seat,
    myColor,
    oppColor,
    myTurn,
    watching,
    over,
    won,
    oppCupsLeft,
    myCupsLeft,
    oppBallRef,
    myCupsActiveRef,
    onThrow,
    onFrame,
    rematch,
    status: statusText({ phase: room.phase, myTurn, over, won }),
  };
}

function statusText(s: { phase: string; myTurn: boolean; over: boolean; won: boolean }): string {
  if (s.phase !== "playing" && s.phase !== "ended") return "";
  if (s.over) return s.won ? "You cleared their rack — you win! 🍺" : "Your rack's gone — you lose.";
  return s.myTurn ? "Your throw" : "Opponent throwing…";
}
