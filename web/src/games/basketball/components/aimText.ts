import type { AimStage } from "../domain/BasketballGame";

/** Short in-canvas hint for the current shot-meter stage. */
export function stageHint(stage: AimStage): string {
  return stage === "pitch" ? "click to set the arc" : "click on the green sweet spot to shoot";
}

/** One-word label for the current stage (HUD). */
export function stageLabel(stage: AimStage): string {
  return stage === "pitch" ? "Set arc" : "Power!";
}
