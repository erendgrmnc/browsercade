import type { GameDefinition } from "./types";

/**
 * The arcade's game catalogue. Adding a game = appending an entry here and
 * pointing `load` at its module's default export. Nothing else needs to change.
 */
export const GAMES: GameDefinition[] = [
  {
    id: "chess",
    title: "3D Chess",
    blurb: "Server-authoritative chess against a hand-written engine, or a friend online.",
    tags: ["Board", "AI", "Online"],
    availability: "ready",
    load: () => import("@/games/chess/ChessApp"),
  },
  {
    id: "ping-pong",
    title: "Ping Pong",
    blurb: "A table-tennis rally against the AI, or a real-time 1v1 against a friend online.",
    tags: ["Arcade", "Physics", "Online"],
    availability: "ready",
    load: () => import("@/games/ping-pong/PingPongApp"),
  },
  {
    id: "basketball",
    title: "Basketball Hoop",
    blurb: "Set your arc, then stop the power bar on the sweet spot to swish it. Beat the clock solo, or go turn-based against a friend.",
    tags: ["Arcade", "Physics", "Online"],
    availability: "ready",
    load: () => import("@/games/basketball/BasketballApp"),
  },
  {
    id: "beer-pong",
    title: "Beer Pong",
    blurb: "Arc the ball into the cups. Clear the rack solo, or take turns against a friend online.",
    tags: ["Arcade", "Physics", "Online"],
    availability: "ready",
    load: () => import("@/games/beer-pong/BeerPongApp"),
  },
  {
    id: "pool",
    title: "Pool",
    blurb: "Break the rack and sink all 15 on a full physics table — solo or turn-based against a friend online.",
    tags: ["Arcade", "Physics", "Online"],
    availability: "ready",
    load: () => import("@/games/pool/PoolApp"),
  },
];

export function findGame(id: string | undefined): GameDefinition | undefined {
  return GAMES.find((game) => game.id === id);
}
