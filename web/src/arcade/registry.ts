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
    blurb: "A table-tennis rally against the AI — or a friend online.",
    tags: ["Arcade", "Physics", "Online"],
    availability: "soon",
  },
  {
    id: "basketball",
    title: "Basketball Hoop",
    blurb: "Flick-to-shoot hoops against the clock.",
    tags: ["Arcade", "Physics"],
    availability: "soon",
  },
  {
    id: "beer-pong",
    title: "Beer Pong",
    blurb: "Arc the ball into the cups. Best of a rack.",
    tags: ["Arcade", "Physics", "Online"],
    availability: "soon",
  },
  {
    id: "pool",
    title: "Pool",
    blurb: "8-ball on a full physics table.",
    tags: ["Arcade", "Physics", "Online"],
    availability: "soon",
  },
];

export function findGame(id: string | undefined): GameDefinition | undefined {
  return GAMES.find((game) => game.id === id);
}
