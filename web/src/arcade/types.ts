import type { ComponentType } from "react";

export type GameAvailability = "ready" | "soon";

/**
 * A game in the arcade. Each game is a self-contained module that default-exports
 * a React component; `load` lazy-imports it so a game's (often heavy, 3D) bundle
 * only loads when that game is opened.
 */
export type GameDefinition = {
  id: string; // url slug, e.g. "ping-pong"
  title: string;
  blurb: string;
  tags: string[];
  availability: GameAvailability;
  load?: () => Promise<{ default: ComponentType }>;
};
