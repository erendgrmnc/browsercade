/**
 * Online table tennis: real-time, host-authoritative. The host runs the full
 * simulation with `game.online = true` (the far paddle is driven by the guest
 * instead of the AI) and broadcasts an authoritative snapshot every frame. The
 * guest renders those snapshots and streams its paddle X (plus a serve trigger)
 * back. The server only relays — no physics on the wire.
 */
import { useEffect, useRef, useState } from "react";
import { PingPongGame } from "../domain/PingPongGame";
import { useRelayRoom } from "@/shared/net/useRelayRoom";
import type { Seat } from "@/shared/net/RelayClient";
import type { PingPongMessage } from "../domain/online/messages";
import type { Phase, Score, Side } from "../domain/types";

export function useOnlinePingPong() {
  const gameRef = useRef<PingPongGame | null>(null);
  if (!gameRef.current) {
    gameRef.current = new PingPongGame();
    gameRef.current.online = true;
  }
  const game = gameRef.current;

  const seatRef = useRef<Seat | null>(null);
  const guestInputXRef = useRef(0); // host reads: guest's far-paddle X (world coords)
  const snapshotRef = useRef<PingPongMessage | null>(null); // guest reads: latest state

  const [score, setScore] = useState<Score>({ player: 0, ai: 0 });
  const [phase, setPhase] = useState<Phase>("serving");
  const [server, setServer] = useState<Side>("player");
  const scoreRef = useRef(score);
  const phaseRef = useRef(phase);
  const serverRef = useRef(server);

  const setScoreIfChanged = (sp: number, sa: number) => {
    if (sp !== scoreRef.current.player || sa !== scoreRef.current.ai) {
      scoreRef.current = { player: sp, ai: sa };
      setScore(scoreRef.current);
    }
  };
  const setPhaseIfChanged = (p: Phase) => {
    if (p !== phaseRef.current) {
      phaseRef.current = p;
      setPhase(p);
    }
  };
  const setServerIfChanged = (s: Side) => {
    if (s !== serverRef.current) {
      serverRef.current = s;
      setServer(s);
    }
  };

  const room = useRelayRoom<PingPongMessage>({
    game: "ping-pong",
    onStart: (seat) => {
      seatRef.current = seat;
      if (seat === "host") {
        game.online = true;
        game.reset();
      }
    },
    onPayload: (msg) => {
      if (seatRef.current === "host") {
        if (msg.kind === "input") guestInputXRef.current = msg.x;
        else if (msg.kind === "serve") game.requestAiServe();
      } else if (msg.kind === "state") {
        snapshotRef.current = msg;
        setScoreIfChanged(msg.sp, msg.sa);
        setPhaseIfChanged(msg.ph);
        setServerIfChanged(msg.sv);
      }
    },
  });

  // Host: mirror the live game to the HUD (the guest is driven by snapshots above).
  useEffect(() => {
    game.setEvents({
      onScore: (s) => setScoreIfChanged(s.player, s.ai),
      onPhase: setPhaseIfChanged,
      onServer: setServerIfChanged,
    });
    // setters are stable; bind once per game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const isHost = room.seat === "host";

  const broadcastState = () => {
    room.sendPayload({
      kind: "state",
      bx: game.pos.x,
      by: game.pos.y,
      bz: game.pos.z,
      px: game.playerX,
      pz: game.playerZ,
      roll: game.racketRoll,
      ax: game.aiX,
      sp: game.score.player,
      sa: game.score.ai,
      ph: game.phase,
      sv: game.server,
    });
  };

  const sendInput = (x: number) => room.sendPayload({ kind: "input", x });
  const sendServe = () => room.sendPayload({ kind: "serve" });

  const myScore = isHost ? score.player : score.ai;
  const oppScore = isHost ? score.ai : score.player;
  const isMyServe = phase === "serving" && (isHost ? server === "player" : server === "ai");
  const over = phase === "gameover";
  const iWon = isHost ? score.player > score.ai : score.ai > score.player;

  const restart = () => {
    if (isHost) game.reset(); // host owns the sim; snapshots propagate the reset
  };

  return {
    game,
    room,
    isHost,
    guestInputXRef,
    snapshotRef,
    broadcastState,
    sendInput,
    sendServe,
    myScore,
    oppScore,
    phase,
    isMyServe,
    over,
    iWon,
    restart,
    status: statusText({ phase: room.phase, gamePhase: phase, isMyServe, over, iWon }),
  };
}

function statusText(s: {
  phase: string;
  gamePhase: Phase;
  isMyServe: boolean;
  over: boolean;
  iWon: boolean;
}): string {
  if (s.phase !== "playing" && s.phase !== "ended") return "";
  if (s.over) return s.iWon ? "You win! 🏓" : "You lose.";
  if (s.gamePhase === "serving") return s.isMyServe ? "Your serve — flick forward, then click" : "Opponent's serve…";
  if (s.gamePhase === "point") return "Point!";
  return "Rally!";
}
